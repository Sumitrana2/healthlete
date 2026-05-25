# HealthLete Backend API

> Athlete health media & decision intelligence platform — Node.js + TypeScript + PostgreSQL

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
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
npm run dev           # Hot-reload via nodemon + tsx
```

Server starts on `http://localhost:4000`

---

## Folder Structure

```
src/
├── config/
│   └── env.ts               # Zod-validated environment config
├── db/
│   ├── index.ts             # Pool + Drizzle instance + health check
│   ├── migrations/          # Auto-generated SQL migrations
│   └── schema/
│       └── index.ts         # All table definitions + relations
├── middleware/
│   ├── errorHandler.ts      # AppError class + global handler
│   └── requestLogger.ts     # Morgan request logging
├── modules/
│   ├── athletes/            # Athlete discovery + profiles
│   ├── brands/              # Brand accounts
│   ├── campaigns/           # Campaign management
│   ├── scores/              # HealthLete Score engine
│   ├── users/               # Auth + user management
│   └── admin/               # Admin dashboard APIs
├── services/
│   └── ai/                  # AI Analyst + LLM orchestration
├── types/                   # Shared TypeScript types
├── utils/                   # Shared utilities
├── app.ts                   # Express app factory
└── server.ts                # Entry point + graceful shutdown
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
npm run typecheck    # Type-check without emitting
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
