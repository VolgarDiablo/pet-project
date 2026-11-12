# Шпаргалка агента (не ТЗ)

Снимок **12 Nov 2026**. Файл для продолжения чата, не публичная документация.  
Продуктовое ТЗ: [docs/TZ.md](docs/TZ.md) (оплата онлайн: аккаунт и гость без аккаунта).

Prisma/схему не менять без просьбы. GraphQL **User не создавать**.

---

## 0. Жёсткие правила

- Auth = **REST**. GraphQL User нет.
- Cart/Order в GQL: только `userId`, без вложенного User; `sessionId` не светить.
- Родитель → дети через `@ResolveField`; имя метода ≠ имя поля → `{ name: '…' }`.
- Не отдавать: `password`, `metaData`, `sessionId`, (будущий) `isAdmin`.
- `sendEmail` по `type`. `.env` не коммитить.
- Не мержить `prisma/` и `src/prisma/`.

---

## 1. Стек / старт

Nest 12 + Prisma 7 + GraphQL 14 / Apollo 5, code-first `src/schema.gql`, GraphiQL.  
Пакеты subscription: `graphql-subscriptions`, `graphql-ws` (в graphql.module уже `subscriptions: { 'graphql-ws': true }`, context `req/res`).  
Cookie: `cookie-parser` в [main.ts](src/main.ts).

```bash
npm install && docker compose up -d
npx prisma generate && npx prisma migrate dev
npm run seed && npm run start:dev
```

GraphQL: `/graphql`. REST: `/auth`, `/categories`, `/product`.

---

## 2. Архитектура services

Один `*.service.ts` на модуль; **`*.data.service.ts` нет** — Prisma через `PrismaService` прямо в service.

| Модуль | Service |
|--------|---------|
| places | [places.service.ts](src/places/places.service.ts) |
| brands | [brands.service.ts](src/brands/brands.service.ts) |
| menus | [menus.service.ts](src/menus/menus.service.ts) |
| categories | [categories.service.ts](src/categories/categories.service.ts) |
| products | [products.service.ts](src/products/products.service.ts) |
| carts | [carts.service.ts](src/carts/carts.service.ts) |
| orders | [orders.service.ts](src/orders/orders.service.ts) |
| auth | [auth.service.ts](src/auth/auth.service.ts) |

Паттерн: тонкий resolver → `return this.xxxService.method(...)`.  
REST и GQL делят один service где нужно (Product: REST `findBySlug` → throw 404; GQL `findProductBySlug` → `null`).

---

## 3. GraphQL покрытие (done)

| Сущность | Resolver | Service |
|----------|----------|---------|
| Place | 2 query + 4 field | PlacesService |
| Menu | field `category` | MenusService |
| Category | field `product` | `findProductsByCategoryId` |
| Product | query + brand/image | `findProductBySlug` / images / brand |
| Brand | field image | BrandsService |
| Cart | query + 3 mut + field `item` | CartsService |
| CartItem | field `product` | CartsService |
| Order | 2 query + 2 mut + `orderUpdated` + field `item` | OrdersService |
| OrderItem | field `product` | OrdersService |

Корневая схема:
- queries: `health, place, places, product, cart, orders, order`
- mutations: `addCartItem, updateCartItem, clearCart, createOrder, cancelOrder`
- subscription: `orderUpdated(id)` — publish: `pubSub.publish('orderUpdated', { orderUpdated: order })`

**Cart:** cookie `cart_sid` (guest) или JWT → `userId`; при логине merge guest→user, `sessionId` очищается.  
**Order:** `orders` / `order` / `cancelOrder` требуют JWT; `createOrder` допускает guest (`userId` null) **без** guestEmail/token.  
PubSub: [pubsub.provider.ts](src/graphql/pubsub.provider.ts) в `OrdersModule`.

---

## 4. Auth / роли

- **Было:** enum `Role` (`CUSTOMER` \| `MANAGER` \| `ADMIN`) + `User.role` → снято миграцией `20260805120000_remove_roles`.
- **Сейчас:** только [JwtAuthGuard](src/auth/guards/jwt-auth.guard.ts) на REST write (product/category). В коде нет `Role` / `RolesGuard` / `isAdmin`.
- **По TZ дальше:** флаг `User.isAdmin` (не полный RBAC manager/cook). Seed `admin@` / `manager@` — только email, не роли.

---

## 5. Prisma кратко

Place → WorkingHour, PlaceSocial, Menu → Category → Product → Brand; Image XOR place/product/brand.  
Cart: `userId?` + `sessionId?` (якорь один). Order на текущих полях (без guestToken/LiqPay).

Миграции в git: `init`, `add_catalog_and_roles`, `remove_roles`. Schema может опережать SQL в репо → при рассинхроне `migrate dev` / sync.

---

## 6. Дыры / next vs TZ

1. Нет `User.isAdmin` → write каталога открыт любому JWT.
2. Нет `guestEmail` / `guestPhone` / `guestAccessToken`, Payment, LiqPay, webhook.
3. Нет `/admin/*` CMS (places, menus, order status, users).
4. Нет писем оплаты / гостевого статуса заказа по token.
5. Seed не выставляет админ-флаг (поля ещё нет).

---
