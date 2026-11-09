# Шпаргалка агента (не ТЗ)

Снимок **20 Oct 2026**. Файл для продолжения чата, не публичная документация.  
Продуктовое ТЗ: [docs/TZ.md](docs/TZ.md) (оплата онлайн: аккаунт и гость без аккаунта).

Пользователь сам пишет **services**; resolver — тонкий скелет `return this.xxxService.method(...)`.  
Prisma/схему не менять без просьбы. GraphQL **User не создавать**.

---

## 0. Жёсткие правила

- Auth = **REST**. GraphQL User нет.
- Cart/Order в GQL: только `userId`, без вложенного User; `sessionId` не светить.
- Родитель → дети через `@ResolveField`; имя метода ≠ имя поля → `{ name: '…' }`.
- Не класть: `password`, `metaData`, `sessionId`.
- `sendEmail` по `type`. `.env` не коммитить.
- Не мержить `prisma/` и `src/prisma/`.

---

## 1. Стек / старт

Nest 12 + Prisma 7 + GraphQL 14 / Apollo 5, code-first `src/schema.gql`, GraphiQL.  
Пакеты subscription: `graphql-subscriptions`, `graphql-ws` (в graphql.module уже `subscriptions: { 'graphql-ws': true }`, context `req/res`).

```bash
npm install && docker compose up -d
npx prisma generate && npx prisma migrate dev
npm run seed && npm run start:dev
```

GraphQL: `/graphql`. REST: `/auth`, `/categories`, `/product`.

---

## 2. GraphQL resolvers (скелет → service)

Паттерн как Place:

```ts
@Mutation(() => CartModel, { name: 'addCartItem' })
async addCartItem(...) {
  return this.cartsService.addCartItem(req, productId, quantity);
}
```

| Сущность | Resolver | Service (логика) | Статус |
|----------|----------|------------------|--------|
| Place | 2 query + 4 field | [places.service.ts](src/places/places.service.ts) | done |
| Menu | field `category` | [menus.service.ts](src/menus/menus.service.ts) | done |
| Category | field `product` | `findProductsByCategoryId` | done |
| Product | query + brand/image | `findProductBySlug` / images / brand | done |
| Brand | field image | [brands.service.ts](src/brands/brands.service.ts) | done |
| Cart | query + 3 mut + field `item` | [carts.service.ts](src/carts/carts.service.ts) | done |
| CartItem | field `product` | CartsService | done |
| Order | 2 query + 2 mut + `orderUpdated` + field `item` | [orders.service.ts](src/orders/orders.service.ts) | done |
| OrderItem | field `product` | OrdersService | done |

Корневая схема (цель):  
queries `health, place, places, product, cart, orders, order`  
mutations `addCartItem, updateCartItem, clearCart, createOrder, cancelOrder`  
subscription `orderUpdated(id)` — publish в сервисе: `pubSub.publish('orderUpdated', { orderUpdated: order })`.

PubSub: [pubsub.provider.ts](src/graphql/pubsub.provider.ts), подключён в `OrdersModule`.

---

## 3. Известные ошибки / дыры

1. ~~Places/Brands/Menus/Categories/Products GQL methods~~ — fixed.
2. ~~Carts/Orders stubs~~ — fixed (`cart_sid`, JWT optional, PubSub on create/cancel).
3. ~~cookie-parser~~ — fixed.
4. **Миграции:** на диске могут отставать → `npx prisma migrate dev` при необходимости.
5. Эта итерация без `guestEmail` / `guestAccessToken` / LiqPay; `orders`/`order`/`cancelOrder` требуют JWT.

---

## 4. Prisma кратко

Place → WorkingHour, PlaceSocial, Menu → Category → Product → Brand; Image XOR place/product/brand.  
Cart: userId? + sessionId?; Order на текущих полях (без guestToken/LiqPay в этой итерации).

---

_Снимок обновлён после реализации services._
