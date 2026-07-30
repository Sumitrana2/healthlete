# HealthLete Backend API

> Athlete health media & decision intelligence platform — Node.js + TypeScript + PostgreSQL

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | NestJS 11 |
| API Docs | @nestjs/swagger |
| Rate Limiting | @nestjs/throttler (Redis-backed) |
| ORM | Drizzle ORM |
| Database | PostgreSQL 15+ |
| Validation | Zod |
| Auth | JWT (coming: Phase 1) |
| Caching | Redis (coming: Phase 2) |

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT secrets
```

### 3. Start PostgreSQL
```bash
# Via Docker:
docker run -d \
  --name healthlete-pg \
  -e POSTGRES_DB=healthlete_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

### 4. Run migrations
```bash
npm run db:generate   # Generate migration files from schema
npm run db:migrate    # Apply migrations to DB
```

### 5. Start dev server
```bash
npm run dev           # Hot-reload via NestJS CLI
```

Server starts on `http://localhost:4041`

---

## Folder Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── constants/       # App-wide constants
│   ├── decorators/      # @Brand, @Admin, @ThrottleAuth, Swagger helpers
│   ├── dto/             # Shared DTOs
│   ├── enums/           # Shared enums (incl. DB enums)
│   ├── exceptions/      # AppError
│   ├── filters/         # Global exception filter
│   ├── guards/          # (domain guards live in modules)
│   ├── interceptors/    # Sanitize, logging
│   ├── middleware/      # Request logger, upload
│   ├── pipes/           # Zod validation pipe
│   ├── types/           # Shared types
│   └── utils/           # Cache, slug, etc.
├── config/
│   ├── env.ts
│   └── swagger.setup.ts
├── database/
│   ├── drizzle/         # Drizzle ORM (schema + client)
│   ├── migrations/      # SQL migrations
│   ├── seeds/           # Seed scripts
│   └── prisma/          # Reserved for future Prisma migration
├── modules/
│   ├── auth/            # JWT, cookies, OTP services
│   ├── admin/           # Admin auth + guards
│   ├── brand/           # Brand auth + profile
│   ├── company/         # Brand company search
│   ├── lookup/          # Taxonomy + shared lookup data
│   ├── health/          # Health check
│   ├── athlete/         # (placeholder)
│   ├── agency/          # (placeholder)
│   ├── campaign/        # (placeholder)
│   ├── onboarding/      # (placeholder)
│   ├── notification/    # (placeholder)
│   ├── upload/          # (placeholder)
│   ├── dashboard/       # (placeholder)
│   └── analytics/       # (placeholder)
└── shared/
    ├── mail/            # Email service
    ├── sms/             # (placeholder)
    ├── storage/         # File upload service
    ├── logger/          # Pino logger
    └── queue/           # Redis client + module
```

---

## API Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/athletes` | List athletes (filterable) |
| GET | `/api/v1/athletes/:slug` | Athlete profile |
| GET | `/api/v1/scores/:athleteId` | Latest HealthLete scores |

---

## Scripts

```bash
npm run dev          # Development with hot-reload
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled production build
npm run test          # Unit tests
npm run test:e2e      # E2E tests (no DB/Redis required)
npm run test:e2e:integration  # Full integration tests (needs PostgreSQL + Redis)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio (DB browser)
```

---

## Environment Variables

See `.env.example` for the full reference. Required for startup:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — min 32 chars
- `REFRESH_TOKEN_SECRET` — min 32 chars
