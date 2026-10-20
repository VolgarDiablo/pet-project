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
| Place | 2 query + 4 field | `PlacesService` — **файла нет**, только вызовы | resolver ok, service missing |
| Menu | field `category` | `MenusService` из `./menus.services` — **файла нет**, typo имени | broken DI |
| Category | field `product` | `CategoriesService.findProductsByCategoryId` — **метода нет** | broken |
| Product | query + brand/image | методов `findProductBySlug` и т.д. **нет** | broken |
| Brand | field image | `BrandsService` — **файла нет** | broken |
| Cart | query + 3 mut + field `item` | stub [carts.service.ts](src/carts/carts.service.ts) | skeleton done |
| CartItem | field `product` | stub в CartsService | skeleton done |
| Order | 2 query + 2 mut + `orderUpdated` + field `item` | stub [orders.service.ts](src/orders/orders.service.ts) | skeleton done |
| OrderItem | field `product` | stub в OrdersService | skeleton done |

Корневая схема (цель):  
queries `health, place, places, product, cart, orders, order`  
mutations `addCartItem, updateCartItem, clearCart, createOrder, cancelOrder`  
subscription `orderUpdated(id)` — publish в сервисе: `pubSub.publish('orderUpdated', { orderUpdated: order })`.

PubSub: [pubsub.provider.ts](src/graphql/pubsub.provider.ts), подключён в `OrdersModule`.

---

## 3. Известные ошибки / дыры (починить тебе)

1. **Нет файлов сервисов:** `places.service.ts`, `brands.service.ts`. Resolvers уже их импортируют → TS2307 / Nest DI fail.
2. ~~Menus: `menus.services` + не в module~~ — fixed (`menus.service.ts` stub + providers).
3. **PlacesModule / BrandsModule:** в `providers` только Resolver, без Service.
4. **CategoriesService:** нет `findProductsByCategoryId` (data-service метод для product list по categoryId уже был раньше — пробросить).
5. **ProductsService:** нет `findProductBySlug`, `findImagesByProductId`, `findBrandByProductId`.
6. ~~ProductsModule / Controller: `ProductService` / `product.service`~~ — fixed → `ProductsService`.
7. ~~Имена полей Product/Brand `images`→`image`, brand `[BrandModel]`→`BrandModel`~~ — fixed.
8. ~~cookie-parser~~ — fixed.
9. **Миграции:** на диске только 3 старых; Place/Menu/WorkingHour/guest cart в SQL могут отсутствовать → `migrate dev`.
10. Prisma Place: `images` / `workingHours`; GQL Place: `image` / `workingHours` — маппинг в service/resolver уже через `name`.

---

## 4. Prisma кратко

Place → WorkingHour, PlaceSocial, Menu → Category → Product → Brand; Image XOR place/product/brand.  
Cart: userId? + sessionId?; Order на текущих полях (без guestToken/LiqPay в этой итерации).

---

## 5. Stub-методы дописать в services

**CartsService:** `findCart(req)`, `addCartItem`, `updateCartItem`, `clearCart`, `findItemsByCartId`, `findProductById`  
**OrdersService:** `findOrders`, `findOrderById`, `createOrder`, `cancelOrder` (+ publish), `findItemsByOrderId`, `findProductById`

Cookie `cart_sid` / JWT из `req` — внутри service, не в resolver.

---

_После реализации services и migrate — обновить этот файл._
