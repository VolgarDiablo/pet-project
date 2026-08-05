# Шпаргалка: pet-project (снимок на рефакторинг)

> Монолит NestJS REST API (каталог + auth). Cart/Order — только в схеме БД.  
> **Роли (RBAC) убраны** — авторизация позже другим способом; сейчас только JWT `{ id }`.

---

## 1. Что это

| | |
|--|--|
| Тип | Один репозиторий, один Nest-процесс (не monorepo) |
| Цель | E-commerce API: пользователи, категории, товары |
| Валюта по умолчанию | `UAH` (в `Order`) |
| Порт | `PORT` или `3000` |
| Remote | `github.com/VolgarDiablo/pet-project` (`master`) |

**Нет:** фронтенда, Redis, очередей, Dockerfile приложения, CI/CD, K8s, метрик, **ролей/RBAC**.

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
- `admin@example.com` / `Admin123!`
- `manager@example.com` / `Manager123!`

---

## 3. Карта модулей

```
AppModule
├── PrismaModule (@Global)     → PrismaService
├── AuthModule                 → AuthService, JwtAuthGuard (exports)
│   └── EmailModule
├── EmailModule                ← ещё раз в AppModule (дубль импорта)
├── CategoriesModule           → imports AuthModule (для JwtAuthGuard)
└── ProductsModule             → imports AuthModule
```

| Папка | Назначение |
|-------|------------|
| `src/auth/` | signup/login/verify, JWT |
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
| `User` | `email` unique, `password` hash, `emailVerified`, `metaData` Json? |
| `Category` | `name` + `slug` unique |
| `Product` | `slug` unique, `Decimal` price/discount, `stock`, **`isActive` soft-delete** |
| `Cart` / `CartItem` | схема есть, **API нет**; unique `(cartId, productId)` |
| `Order` / `OrderItem` | схема есть, **API нет**; `OrderStatus`, snapshot `unitPrice`/`totalPrice` |

**Enums:**
- `OrderStatus`: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` \| `CANCELLED`

**Миграции:**
1. `…_init` — User
2. `…_add_catalog_and_roles` — catalog, cart, orders (+ Role, later removed)
3. `…_remove_roles` — drop `User.role` + enum `Role`

---

## 6. Auth — как устроено

### Потоки

| Endpoint | Auth | Поведение |
|----------|------|-----------|
| `POST /auth/signup` | public | create user → JWT verify-token `{id}` → **console.log URL** |
| `GET /auth/verify?token=` | public | verify JWT → `emailVerified=true` |
| `POST /auth/login` | public | bcrypt compare → JWT `{id}` TTL **10080m** → `metaData: { token }` |
| `GET /auth/me` | JWT | `{ id }` из `req.user` |

**Header:** `Authorization: Bearer <jwt>`

### Гарды (НЕ глобальные)

| Guard | Делает |
|-------|--------|
| `JwtAuthGuard` | Bearer → `verifyToken` → `req.user = { id }` |

Экспорт из `AuthModule`; Products/Categories импортируют `AuthModule` для write-роутов.

### Важно для auth

- Access payload: `{ id }`, TTL **10080m** (7 days).
- Verify payload: `{ id }`, TTL **15m**.
- Неверифицированный юзер **всё равно логинится** (verify URL в console).
- `metaData.token` сохраняется, но **гард его не сверяет**.
- Origin для verify URL: `req.headers.origin ?? 'https://localhost:3000'`.
- Login response: `{ token: string }`.

### DTO

- Signup: name≥3, email, strong password + confirmPassword
- Login: email + strong password

---

## 7. API каталога

### Categories `/categories`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | public | pagination; **include все products** |
| GET | `/:id` | public | продукты пагинированы; sort `price_asc`/`price_desc` |
| POST | `/` | JWT | name → auto slug |
| PATCH | `/:id` | JWT | rename → новый slug |
| DELETE | `/:id` | JWT | **hard delete** |

### Products `/products`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | public | только `isActive: true` |
| GET | `/:slug` | public | по slug, active only |
| POST | `/` | JWT | auto slug from title |
| PATCH | `/:id` | JWT | title → regenerate slug |
| DELETE | `/:id` | JWT | **soft** → `isActive=false` |

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

1. ~~Двойная обёртка login~~ — исправлено.
2. ~~TTL access~~ — access **10080m**, verify **15m**.
3. ~~RBAC / Role~~ — **удалено** (будет иначе).
4. **Email verify не блокирует login**; SendGrid ключ обязателен при boot.
5. **`metaData.token`** пишется, не читается гардом.
6. **Categories list** тянет все products; detail без фильтра `isActive`.
7. **Hard delete category** vs soft delete product.
8. **Дублирование `EmailModule`** в AppModule и AuthModule.
9. **Нет `@nestjs/config`**.
10. Имена `encryptPassword` / `decryptPassword` = hash / compare.
11. **Cart/Order** schema-only.
12. Нет CORS/helmet/rate-limit; нет refresh tokens.
13. Seed-пароли в репо; `.env` / `.env.test` коммитятся.

---

## 11. Доступ (без ролей)

| Действие | Кто |
|----------|-----|
| Читать каталог | все |
| Писать products/categories | любой с валидным JWT |
| signup / verify / login / `GET /` | public |

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

## 13. Мини-чеклист

- [ ] Login `{ token: string }`; JWT payload только `{ id }`
- [ ] Write-роуты: только `JwtAuthGuard`
- [ ] Prisma Decimal / soft-delete `isActive` на Product
- [ ] Slug через `generateUniqueSlug`
- [ ] Pagination limits 10/25/50/100
- [ ] Cart/Order schema-only
- [ ] SendGrid обязателен при boot

---

*После крупных рефакторов — обновить этот снимок.*
