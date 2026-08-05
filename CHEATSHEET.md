# Шпаргалка: pet-project (снимок на рефакторинг)

> Актуально на момент начала рефакторинга. Монолит NestJS REST API (каталог + auth). Cart/Order — только в схеме БД.

---

## 1. Что это

| | |
|--|--|
| Тип | Один репозиторий, один Nest-процесс (не monorepo) |
| Цель | E-commerce API: пользователи, категории, товары |
| Валюта по умолчанию | `UAH` (в `Order`) |
| Порт | `PORT` или `3000` |
| Remote | `github.com/VolgarDiablo/pet-project` (`master`) |

**Нет:** фронтенда, Redis, очередей, Dockerfile приложения, CI/CD, K8s, метрик.

---

## 2. Быстрый старт

```bash
npm install
docker compose up -d
# .env: DATABASE_URL, JWT_SECRET, SENDGRID_API_KEY, PORT?
npx prisma migrate deploy   # или migrate dev
npm run seed                # опционально
npm run start:dev
```

**Docker Postgres:** `myuser` / `mypassword` / `mydb` → `localhost:5432`  
**DATABASE_URL:** `postgresql://myuser:mypassword@localhost:5432/mydb`

**Seed-юзеры (emailVerified=true):**
- `admin@example.com` / `Admin123!` → `ADMIN`
- `manager@example.com` / `Manager123!` → `MANAGER`

---

## 3. Карта модулей

```
AppModule
├── PrismaModule (@Global)     → PrismaService
├── AuthModule                 → AuthService, JwtAuthGuard, RolesGuard (exports)
│   └── EmailModule
├── EmailModule                ← ещё раз в AppModule (дубль импорта)
├── CategoriesModule           → imports AuthModule (для гардов)
└── ProductsModule             → imports AuthModule
```

| Папка | Назначение |
|-------|------------|
| `src/auth/` | signup/login/verify, JWT, RBAC |
| `src/email/` | SendGrid обёртка |
| `src/categories/` | CRUD категорий |
| `src/products/` | каталог + soft-delete |
| `src/prisma/` | глобальный Prisma + pg adapter |
| `src/common/` | pagination DTO/util, slug util |
| `prisma/` | schema, migrations, seed |

**Паттерн фичи:** `*.module.ts` → `*.controller.ts` → `*.service.ts` → `dto/` + `interfaces/`

---

## 4. Стек и конфиг

| Слой | Чем |
|------|-----|
| NestJS 11 | Express |
| Prisma 7 | `@prisma/adapter-pg` + `pg` |
| Auth | `jsonwebtoken` + `bcrypt` (не Passport) |
| Validation | global `ValidationPipe` (`whitelist`, `transform`) |
| Config | `dotenv` вручную (нет `@nestjs/config`) |
| Email | `@sendgrid/mail` |

**Env:**
| Var | Нужен |
|-----|--------|
| `DATABASE_URL` | да (Prisma + seed) |
| `JWT_SECRET` | да (sign/verify) |
| `SENDGRID_API_KEY` | да при бутстрапе `SendGridClient` (даже если send закомментирован) |
| `PORT` | нет |

Файлы: `.env` (dev) и `.env.test` (тесты) — **в git**. Override'ы `*.local` — игнорируются.

**Prisma client import:** `.prisma/client` (output в `node_modules/.prisma/client`)  
**Prisma config:** `prisma.config.ts` (url из env)

---

## 5. Модель данных (Prisma)

```
User 1──1 Cart 1──* CartItem *──1 Product
User 1──* Order 1──* OrderItem *──1 Product
Category 1──* Product
```

| Model | Ключевое |
|-------|----------|
| `User` | `email` unique, `password` hash, `emailVerified`, `role`, `metaData` Json? |
| `Category` | `name` + `slug` unique |
| `Product` | `slug` unique, `Decimal` price/discount, `stock`, **`isActive` soft-delete** |
| `Cart` / `CartItem` | схема есть, **API нет**; unique `(cartId, productId)` |
| `Order` / `OrderItem` | схема есть, **API нет**; `OrderStatus`, snapshot `unitPrice`/`totalPrice` |

**Enums:**
- `Role`: `CUSTOMER` \| `MANAGER` \| `ADMIN` (default CUSTOMER)
- `OrderStatus`: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` \| `CANCELLED`

**Миграции:**
1. `…_init` — User
2. `…_add_catalog_and_roles` — roles, catalog, cart, orders

---

## 6. Auth — как устроено

### Потоки

| Endpoint | Auth | Поведение |
|----------|------|-----------|
| `POST /auth/signup` | public | create user → JWT verify-token `{id}` → **console.log URL** (SendGrid send закомментирован) |
| `GET /auth/verify?token=` | public | verify JWT → `emailVerified=true` |
| `POST /auth/login` | public | bcrypt compare → JWT `{id, role}` TTL **15m** → пишет `metaData: { token }` |
| `GET /auth/me` | JWT | `{ id, role }` из `req.user` |
| `GET /auth/admin/ping` | JWT + ADMIN | пример RBAC |

**Header:** `Authorization: Bearer <jwt>`

### Гарды (НЕ глобальные)

Порядок всегда: **`JwtAuthGuard` → `RolesGuard` → `@Roles(...)`**

| Guard | Делает |
|-------|--------|
| `JwtAuthGuard` | Bearer → `verifyToken` → `req.user = { id, role? }` |
| `RolesGuard` | нет `@Roles` → ok; иначе `required.includes(user.role)` |

Экспорт гардов из `AuthModule`; Products/Categories импортируют `AuthModule`.

### Важно для auth

- Login payload: `{ id, role }`, TTL **10080m** (7 days).
- Verify payload: только `{ id }`, TTL **15m** → **нельзя** на `@Roles` routes.
- Неверифицированный юзер **всё равно логинится** (throw закомментирован; шлётся/логируется verify URL).
- `metaData.token` сохраняется, но **гард его не сверяет** (не revoke-лист).
- Origin для verify URL: `req.headers.origin ?? 'https://localhost:3000'`.
- Login response: `{ token: string }` (без двойной обёртки).

### DTO

- Signup: name≥3, email, strong password + confirmPassword
- Login: email + strong password (те же правила силы, что signup)

---

## 7. API каталога

### Categories `/categories`

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/` | public | pagination; **include все products** (без `isActive` фильтра) |
| GET | `/:id` | public | продукты пагинированы; sort `price_asc`/`price_desc`; **без фильтра isActive** |
| POST | `/` | ADMIN | name → auto slug |
| PATCH | `/:id` | ADMIN | rename → новый slug |
| DELETE | `/:id` | ADMIN | **hard delete** |

### Products `/products`

| Method | Path | Roles | Notes |
|--------|------|-------|-------|
| GET | `/` | public | только `isActive: true`; фильтры ниже |
| GET | `/:slug` | public | по slug, active only |
| POST | `/` | ADMIN, MANAGER | auto slug from title |
| PATCH | `/:id` | ADMIN, MANAGER | title → regenerate slug |
| DELETE | `/:id` | ADMIN | **soft** → `isActive=false` |

**Query filters (`ProductQueryDto`):**
- pagination: `page` (default 1), `limit` ∈ `{10,25,50,100}` (default 10)
- `categoryId` **или** `categorySlug` (оба сразу → 400)
- `brand` (contains, insensitive)
- `q` → title contains
- `minPrice` / `maxPrice`
- `sort`: `price_asc` \| `price_desc` \| `newest`

**Paginated shape:**
```ts
{ data, total, page, limit, totalPages }
```

---

## 8. Common utilities

| Файл | API |
|------|-----|
| `common/utils/slug.util.ts` | `slugify` (кириллица→latin), `generateUniqueSlug(source, exists)` → `-2`, `-3`… |
| `common/utils/pagination.util.ts` | `getSkip`, `buildPaginatedResult` |
| `common/dto/pagination.dto.ts` | `PaginationDto`, `ALLOWED_LIMITS` |

Два похожих enum сортировки:
- `products/dto`: `ProductListSort` (+ `newest`)
- `categories/dto`: `ProductSort` (только price)

---

## 9. Email

- `EmailModule` → `EmailService` + `SendGridClient`
- `from` захардкожен: `anton.didkovskiy@gmail.com`
- subject всегда `'Test email'`
- При старте без `SENDGRID_API_KEY` — **throw в конструкторе** SendGridClient
- Реальная отправка verify **выключена** (`console.log` URL)

---

## 10. Известные странности / кандидаты на рефактор

Зафиксировано как есть — удобные точки для правок:

1. ~~Двойная обёртка login response~~ — **исправлено**: `{ token: string }`.
2. ~~TTL 15m на access~~ — **исправлено**: access **10080m**, verify **15m**.
3. **Email verify не блокирует login**; send закомментирован, но ключ SendGrid обязателен.
4. **`metaData.token`** пишется, никем не читается при auth.
5. **Categories list** тянет все products; **category detail** не фильтрует `isActive`.
6. **Hard delete category** vs soft delete product — несогласованность; FK на products.
7. **Дублирование `EmailModule`** в AppModule и AuthModule.
8. **Нет `@nestjs/config`** — dotenv в prisma/seed/service разрозненно.
9. Имена `encryptPassword` / `decryptPassword` = hash / compare.
10. **Cart/Order** в схеме без модулей — либо реализовать, либо не трогать до фичи.
11. Нет CORS/helmet/rate-limit; нет refresh tokens.
12. Seed-пароли в репо; `.env` и `.env.test` **коммитятся** (pet-project).
13. Unit/e2e тесты почти boilerplate (`app.controller.spec`, тонкий e2e).

---

## 11. Права по ролям (сводка)

| Действие | CUSTOMER | MANAGER | ADMIN |
|----------|:--------:|:-------:|:-----:|
| Читать каталог | ✓ | ✓ | ✓ |
| CRUD products (кроме delete) | | ✓ | ✓ |
| Soft-delete product | | | ✓ |
| CRUD categories | | | ✓ |
| `/auth/admin/ping` | | | ✓ |

Публично: signup, verify, login, GET products/categories, `GET /`.

---

## 12. Команды

| Script | Что |
|--------|-----|
| `start:dev` | watch |
| `build` / `start:prod` | dist |
| `seed` | `ts-node prisma/seed.ts` |
| `test` / `test:e2e` | Jest |
| `lint` | ESLint |

Prisma: `npx prisma migrate dev` \| `deploy` \| `studio`

---

## 13. Мини-чеклист перед рефактором

- [ ] Не ломать контракт API без договорённости (особенно login `{ token }`)
- [ ] Гарды: порядок Jwt → Roles; Products/Categories зависят от export AuthModule
- [ ] Prisma Decimal / soft-delete `isActive` на Product
- [ ] Slug уникальность через `generateUniqueSlug`
- [ ] Pagination limits только 10/25/50/100
- [ ] Cart/Order пока schema-only — миграции трогать осознанно
- [ ] SendGrid обязателен при boot, пока конструктор кидает без ключа

---

*Файл для совместной работы. После крупных рефакторов — обновить этот снимок.*
