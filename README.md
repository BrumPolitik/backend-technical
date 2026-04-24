# Technical — Private Markets API

A RESTful backend service for managing private market funds, investors, and their investments.

Built with **TypeScript**, **Express**, and **PostgreSQL** (containerised with Docker).

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) with `docker-compose` (standalone v1)
- `npm`

---

## Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd backend-technical

# 2. Copy environment config
cp .env.example .env
# If using windows OS replace nested variables with the expected text instead

# 3. Install dependencies
npm install

# 4. Initialise database and carry out migration
npm run predev

# 5. Seed database with data if needed
npm run db:seed

# 6. Start dev server
npm run dev
```
`npm run predev` does two things
1. `docker-compose up -d` — starts the PostgreSQL container
2. `scripts/wait-for-db.js` — polls `localhost:5432` via TCP until Postgres accepts connections, then runs migrations automatically

`npm run db:seed` seeds the database with premade data
1. 6 Funds
2. 10 Investors
3. 24 Investments

`npm run dev` runs the start command:
3. `ts-node-dev` — starts the API on `http://localhost:3000` with hot-reload

---

## All Available Scripts

| Command                            | Description                                                               |
|------------------------------------|---------------------------------------------------------------------------|
| `npm run predev`                   | Spins up Docker then runs migrations                                      |
| `npm run dev`                      | Start dev server — starts with hot-reload                                 |
| `npm run build`                    | Compile TypeScript to `dist/`                                             |
| `npm start`                        | Run the compiled build (no Docker management)                             |
| `npm run migrate`                  | Run database migrations manually against the dev database                 |
| `npm test`                         | Run unit tests with summary output only                                   |
| `npm run test:verbose`             | Run unit tests (verbose) — no Docker required                             |
| `npm run test:integration`         | Run integration tests with summary output only                            |
| `npm run test:integration:verbose` | Run integration tests against a real database (verbose) — requires Docker |
| `npm run test:all`                 | Run unit tests then integration tests sequentially                        |
| `npm run db:clean`                 | Truncate all tables in the dev database (useful during manual testing)    |
| `npm run db:seed`                  | Seed database with premade data (useful during manual testing)            |

---

## Testing

### Unit tests

Unit tests mock the database entirely and require no running services.

```bash
npm test
```

Tests live in `src/__tests__/unit/`. Each router has its own test file covering success cases, validation failures, 404s, 409s, and unexpected database errors.

### Integration tests

Integration tests run against a real PostgreSQL database (`titanbay_test`) and test the full request/response cycle including middleware, routing, and actual SQL.

**Docker must be running before you run integration tests.**

```bash
npm run test:integration
```

The integration test suite automatically:
1. Creates a fresh `titanbay_test` database
2. Runs all migrations against it
3. Truncates all tables between each test
4. Destroys the database when the suite finishes

If you need to inspect the database state after a test failure, temporarily comment out the `teardown` function in `src/__tests__/integration/global-setup.ts`.

---

## Environment Variables

### `.env` (development)

Copy `.env.example` to `.env`. The defaults work out of the box on Linux, `DATABASE_URL` needs to be changed to the literal string on Windows.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the API listens on |
| `NODE_ENV` | `development` | Environment name |
| `LOG_LEVEL` | `debug` | Pino log level (`debug`, `info`, `warn`, `error`) |
| `DATABASE_URL` | See `.env.example` | Full PostgreSQL connection string |
| `POSTGRES_USER` | `titanbay` | DB username (used by Docker and the app) |
| `POSTGRES_PASSWORD` | `titanbay_secret` | DB password |
| `POSTGRES_DB` | `titanbay_db` | Database name |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |

### `.env.test` (integration tests)

Used automatically by `npm run test:integration` via `dotenv-cli`. Points at `titanbay_test` on port `3001` so tests never touch the dev database.

| Variable | Value |
|---|---|
| `PORT` | `3001` |
| `NODE_ENV` | `test` |
| `LOG_LEVEL` | `warn` |
| `POSTGRES_DB` | `titanbay_test` |
| `DATABASE_URL` | `postgresql://titanbay:titanbay_secret@localhost:5432/titanbay_test` |

---

## Config Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Defines the PostgreSQL container with a health check and named volume |
| `tsconfig.json` | TypeScript compiler config — targets ES2020, outputs to `dist/` |
| `vitest.config.ts` | Vitest config for unit tests — scopes to `src/__tests__/unit/`, verbose reporter |
| `vitest.integration.config.ts` | Vitest config for integration tests — scopes to `src/__tests__/integration/`, runs `globalSetup` and `setupFiles`, disables file parallelism |

---

## API Reference

### Funds

| Method | Path | Description |
|---|---|---|
| `GET` | `/funds` | List all funds |
| `GET` | `/funds/:id` | Get a specific fund by UUID |
| `POST` | `/funds` | Create a new fund |
| `PUT` | `/funds` | Update an existing fund (id in request body per spec) |

### Investors

| Method | Path | Description |
|---|---|---|
| `GET` | `/investors` | List all investors |
| `POST` | `/investors` | Create a new investor |

### Investments

| Method | Path | Description |
|---|---|---|
| `GET` | `/funds/:fund_id/investments` | List all investments for a fund |
| `POST` | `/funds/:fund_id/investments` | Create an investment in a fund |

### Health

```
GET /health
```

Returns `{ "status": "ok", "timestamp": "..." }`.

---

## Database Schema

### `funds`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `name` | `TEXT` | NOT NULL |
| `vintage_year` | `INTEGER` | 1900–2200 |
| `target_size_usd` | `NUMERIC(20,2)` | > 0 |
| `status` | `TEXT` | `Fundraising`, `Investing`, `Closed` |
| `created_at` | `TIMESTAMPTZ` | auto-set |

### `investors`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `name` | `TEXT` | NOT NULL |
| `investor_type` | `TEXT` | `Individual`, `Institution`, `Family Office` |
| `email` | `TEXT` | NOT NULL, UNIQUE |
| `created_at` | `TIMESTAMPTZ` | auto-set |

### `investments`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `investor_id` | `UUID` | FK → investors |
| `fund_id` | `UUID` | FK → funds |
| `amount_usd` | `NUMERIC(20,2)` | > 0 |
| `investment_date` | `DATE` | NOT NULL |

---

## Error Handling

| HTTP Status | Cause |
|---|---|
| `400` | Validation failure (Zod) — wrong type, missing field, bad format |
| `404` | Resource not found |
| `409` | Unique constraint violation (e.g. duplicate investor email) |
| `422` | Semantically invalid data (e.g. `investment_date` of Feb 31st, or referencing a non-existent fund/investor) |
| `500` | Unexpected server error |

---

## Project Structure

```
titanbay-technical/
├── docker-compose.yml
├── .enfv.example
├── .env.test                          # Test environment config
├── vitest.config.ts                   # Unit test config
├── vitest.integration.config.ts       # Integration test conig
├── scripts/
│   ├── wait-for-db.js                 # TCP poll — waits for Postgres then runs migrations
│   └── clean-db.js                    # Truncates all tables in dev DB
└── src/
    ├── server.ts                      # Entry point — starts the HTTP server
    ├── index.ts                       # Express app setup and routing
    ├── __tests__/
    │   ├── unit/
    │   │   ├── funds.test.ts
    │   │   ├── investors.test.ts
    │   │   └── investments.test.ts
    │   └── integration/
    │       ├── global-setup.ts        # Creates/migrates/destroys titanbay_test
    │       ├── per-test-setup.ts      # Truncates tables between each test
    │       ├── funds.integration.test.ts
    │       ├── investors.integration.test.ts
    │       └── investments.integration.test.ts
    ├── db/
    │   ├── index.ts                   # pg connection pool + DATE type parser override
    │   ├── migrate.ts                 # Migration runner (reads SQL files in order)
    │   └── migrations/
    │       └── 001_init.sql           # Schema — funds, investors, investments
    ├── middleware/
    │   └── errorHandler.ts            # Maps Zod errors, AppError, and pg codes to HTTP responses
    ├── routers/
    │   ├── funds.ts
    │   ├── investors.ts
    │   └── investments.ts             # Nested under /funds/:fund_id (mergeParams: true)
    └── types/
        └── index.ts                   # Shared TypeScript interfaces
```

---

## Design Decisions

**`PUT /funds` takes `id` in the request body** — as specif!ied in the API spec rather than in the URL path.

**`investment_date` validation splits 400 and 422** — a wrong format (e.g. `"31-03-2024"`) returns 400 (malformed request). A correct format but impossible date (e.g. `"2024-02-31"`) returns 422 (unprocessable entity). `Date.parse` is not used for this check as it silently rolls over invalid dates.

**DATE columns returned as strings** — the `pg` driver converts `DATE` columns to JS `Date` objects by default, which adds an unwanted timestamp. This is overridden globally using `types.setTypeParser(1082, val => val)` in `src/db/index.ts`.

**Single EXISTS query for investment validation** — when creating an investment, both the fund and investor are checked in a single query using `EXISTS(SELECT 1 FROM ...)` subqueries. This costs one round trip instead of two, and PostgreSQL can execute both subqueries in parallel.

**Integration tests run sequentially with `fileParallelism: false`** — parallel test files share the same database and can produce cross-file interference (e.g. duplicate email conflicts). Sequential execution eliminates this.

**`investment_date` validation checks if the date is before the vintage year of the fund** — Returns a 422 Unprocessable if so based on the assumption a fund cannot be invested into before creation

**Investors can invest multiple times into the same fund** — Based on the assumption that investing multiple times in the same fund by the same investor is possible for tactics like Dollar-Cost Averaging
