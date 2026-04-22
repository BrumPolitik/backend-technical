# Titanbay Technical — Private Markets API

A RESTful backend service for managing private market funds, investors, and their investments.

Built with **TypeScript**, **Express**, and **PostgreSQL** (containerised with Docker).

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) with the Compose plugin (`docker compose`)
- `npm`

---

## Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd titanbay-technical

# 2. Copy environment config
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start everything (Docker + migrations + dev server)
npm run dev
```

`npm run dev` does three things automatically via the `predev` hook:

1. **`docker compose up -d`** — starts the PostgreSQL container
2. **`scripts/wait-for-db.js`** — polls until the container is healthy, then runs migrations
3. **`ts-node-dev`** — starts the API with hot-reload

The API will be available at `http://localhost:3000`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (spins up Docker automatically) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run migrate` | Run database migrations manually |

---

## Environment Variables

Copy `.env.example` to `.env`. The defaults work out of the box with the provided Docker config.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the API listens on |
| `DATABASE_URL` | See `.env.example` | Full PostgreSQL connection string |
| `POSTGRES_USER` | `titanbay` | DB username (used by Docker) |
| `POSTGRES_PASSWORD` | `titanbay_secret` | DB password (used by Docker) |
| `POSTGRES_DB` | `titanbay_db` | Database name |

---

## API Reference

Full spec: https://storage.googleapis.com/interview-api-doc-funds.wearebusy.engineering/index.html

### Funds

| Method | Path | Description |
|---|---|---|
| `GET` | `/funds` | List all funds |
| `GET` | `/funds/:id` | Get a specific fund |
| `POST` | `/funds` | Create a new fund |
| `PUT` | `/funds` | Update an existing fund |

### Investors

| Method | Path | Description |
|---|---|---|
| `GET` | `/investors` | List all investors |
| `POST` | `/investors` | Create a new investor |

### Investments

| Method | Path | Description |
|---|---|---|
| `GET` | `/funds/:fund_id/investments` | List investments for a fund |
| `POST` | `/funds/:fund_id/investments` | Create an investment in a fund |

### Health

```
GET /health
```

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

## Project Structure

```
titanbay-technical/
├── docker-compose.yml           # PostgreSQL container
├── .env.example                 # Environment template
├── scripts/
│   └── wait-for-db.js           # Polls DB health before migrations
└── src/
    ├── index.ts                 # Express app + routing
    ├── db/
    │   ├── index.ts             # pg connection pool
    │   ├── migrate.ts           # Migration runner
    │   └── migrations/
    │       └── 001_init.sql     # Schema
    ├── middleware/
    │   └── errorHandler.ts      # Centralised error handling
    ├── routers/
    │   ├── funds.ts             # GET /funds, POST /funds, PUT /funds, GET /funds/:id
    │   ├── investors.ts         # GET /investors, POST /investors
    │   └── investments.ts       # GET/POST /funds/:fund_id/investments
    └── types/
        └── index.ts             # Shared TypeScript interfaces
```

---

## Error Handling

| HTTP Status | Cause |
|---|---|
| `400` | Validation failure (Zod) or malformed UUID |
| `404` | Resource not found |
| `409` | Unique constraint violation (e.g. duplicate email) |
| `422` | Foreign key violation (e.g. referencing a non-existent fund) |
| `500` | Unexpected server error |

---

## Design Decisions

- **`UNIQUE (investor_id, fund_id)` on investments** — prevents an investor committing to the same fund twice. Remove this constraint if multiple tranches per investor per fund are required.
- **`PUT /funds` takes `id` in the body** — as specified in the API spec, rather than in the path. This is an intentional design decision in the spec, not an oversight.
- **`mergeParams: true` on the investments router** — required so the nested router can read `fund_id` from the parent route.
- **Migrations are run automatically** on `npm run dev` via the `predev` hook, so there's no manual setup step beyond `npm install`.
