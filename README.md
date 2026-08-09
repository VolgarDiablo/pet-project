# pet-project

NestJS REST API with **PostgreSQL** (Prisma), **JWT** auth, and **SendGrid** email.

## Stack

- [NestJS](https://nestjs.com/) 11
- [Prisma](https://www.prisma.io/) 7 + `@prisma/adapter-pg`
- PostgreSQL 16 (Docker Compose)
- bcrypt, jsonwebtoken, class-validator

## Prerequisites

- Node.js 22+ (see `package.json` engines if added)
- npm
- Docker (optional, for local Postgres)

## Environment variables

Create a `.env` file in the project root (committed in this repo; also `.env.test` for tests):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string, e.g. `postgresql://myuser:mypassword@localhost:5432/mydb` |
| `JWT_SECRET` | yes | Secret for signing and verifying JWTs |
| `SENDGRID_API_KEY` | yes for email | SendGrid API key (app fails to bootstrap `SendGridClient` if missing) |
| `PORT` | no | HTTP port (default `3000`) |

Example matching `docker-compose.yml` defaults (same as root `.env`):

```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
JWT_SECRET="change-me-in-production"
SENDGRID_API_KEY="SG.xxx"
```

## Setup

```bash
npm install
```

Start Postgres (from project root):

```bash
docker compose up -d
```

Apply migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
# or during development:
npx prisma migrate dev
```

Run the app:

```bash
npm run start:dev
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health-style hello |
| `POST` | `/auth/signup` | Register (sends verification email) |
| `GET` | `/auth/verify?token=...` | Confirm email |
| `POST` | `/auth/login` | Login, returns JWT (`{ id }` in payload) |
| `GET` | `/auth/me` | Current user from JWT (`Authorization: Bearer <token>`) |

## Auth guards (local `UseGuards`)

Guards live under `src/auth/guards/` and are **exported from `AuthModule`**. Тип запроса с пользователем: `RequestWithUser` в `src/auth/types/session-user.types.ts` (JWT в заголовке `Authorization: Bearer`).

```typescript
import { Get, Req, UseGuards } from '@nestjs/common';
import type { RequestWithUser } from './auth/types/session-user.types';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Req() req: RequestWithUser) {
  return { userId: req.user!.id };
}
```

| Guard | Роль |
|--------|------|
| **`JwtAuthGuard`** | Достаёт `Authorization: Bearer`, проверяет JWT, пишет в **`req.user`** `{ id }`. |

Access JWT (login): TTL **10080m** (7 days), payload `{ id }`.  
Verify JWT (email): TTL **15m**, payload `{ id }`.

### JWT (этот проект) vs cookie-сессия (прошлый проект)

| | Сейчас (pet-project) | Прошлый проект |
|--|----------------------|----------------|
| Идентификация | `Authorization: Bearer` + JWT | `session_id` cookie + `SessionService` |
| «Кто положил `req.user`» | `JwtAuthGuard` | `SessionAuthGuard` |

Оба варианта нормальны: сессии удобнее для отзыва и HttpOnly-cookie; JWT — проще для SPA/API и мобильных клиентов без cookie.

### Global guards (optional)

This project does **not** register guards globally, so `/auth/signup`, `/auth/login`, and `/` stay public without extra decorators. To go global, you could register `APP_GUARD` with `JwtAuthGuard` and add a `@Public()` decorator (custom metadata) to skip JWT on selected routes.

## Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Config: `prisma.config.ts`

`PrismaService` is provided once via **`PrismaModule`** (`@Global()`), so feature modules only import `PrismaModule` (or rely on global availability after `AppModule` imports it).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run start:prod` | Run `dist/main` |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | ESLint |

## License

UNLICENSED (see `package.json`).
