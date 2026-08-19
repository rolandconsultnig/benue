# CEWERS — Conflict Early Warning & Early Response System

**Benue South Senatorial District (Zone C), Nigeria**

A full-stack platform for early detection, intelligence fusion, and coordinated multi-agency response to farmer–herder violence, banditry, kidnapping, and inter-communal conflict across the nine LGAs of Benue South: **Ado, Agatu, Apa, Obi, Ogbadibo, Ohimini, Oju, Okpokwu, Otukpo.**

This repository is the working software implementation of the CEWERS proposal. See `CEWERS_Benue_South_Proposal.docx` for the full design document.

---

## Architecture at a glance

| Tier | Package | Stack |
|---|---|---|
| **Shared domain** | `packages/shared` | TypeScript types, enums, RBAC, seed data |
| **Backend API** | `packages/api` | NestJS + Prisma + PostgreSQL/PostGIS + Redis + Socket.IO |
| **C2 Console** | `packages/console` | React + Vite + Leaflet + TanStack Query (the Situation Room) |
| **Mobile App** | `packages/mobile` | React Native (Expo) + WatermelonDB (offline-first reporting) |
| **USSD/SMS Gateway** | `packages/ussd` | Africa's Talking sandbox + local mock |

**Three-tier hub–spoke–edge**: one State Situation Room (API + console) → nine LGA Mini Command Centres (scoped data + operators) → citizen/CFP/technical sensors at the edge (mobile, USSD, SMS, voice, panic).

---

## Quick start (Windows)

### Prerequisites
- **Node.js 20+** — https://nodejs.org
- **Docker Desktop** — for PostgreSQL+PostGIS, Redis, MinIO
- **Git** (for `pnpm` via corepack)

### One-time setup
Double-click **`setup.bat`** (or run in PowerShell):
```powershell
.\setup.bat
```
This installs pnpm, all dependencies, starts Docker infrastructure, runs database migrations, and seeds the database with **9 LGAs, ~92 wards, 15 SOPs, 6 demo users, and 40 sample incidents**.

### Daily development
Double-click **`dev.bat`** (or):
```powershell
.\dev.bat
```
Starts the API (`http://localhost:4000`) and Console (`http://localhost:5163`) in separate windows.

### Manual (any OS)
```bash
corepack enable
pnpm install
pnpm db:up           # start Postgres, Redis, MinIO
pnpm db:migrate      # create schema
pnpm db:seed         # load Benue South data
pnpm dev             # start all services
```

---

## Demo accounts

All passwords: `cewers123`. ⚠️ **Demo only — never deploy with these.**

| Phone | Role | Scope |
|---|---|---|
| `+2348000000001` | CITIZEN | — |
| `+2348000000002` | CFP (Community Focal Point) | Agatu |
| `+2348000000003` | OPERATOR | Agatu |
| `+2348000000004` | ANALYST | All LGAs |
| `+2348000000005` | COMMANDER | All LGAs |
| `+2348000000006` | ADMIN | All LGAs |

---

## Project structure

```
cewers/
├── packages/
│   ├── shared/          # Types, enums, RBAC, seed data (single source of truth)
│   ├── api/             # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Full data model
│   │   │   ├── migrations/         # SQL incl. PostGIS setup
│   │   │   └── seed.ts             # Database seeder
│   │   └── src/
│   │       ├── modules/            # auth, incidents, lgas, alerts, responders, ...
│   │       └── common/             # decorators, guards, interceptors
│   ├── console/         # React Situation Room web app
│   ├── mobile/          # Expo citizen reporting app
│   └── ussd/            # USSD/SMS webhook service
├── docker-compose.yml   # Postgres+PostGIS, Redis, MinIO
├── setup.bat            # Windows first-time setup
├── dev.bat              # Windows dev launcher
└── .env.example         # Copy to .env
```

---

## Database notes

The schema uses **PostGIS** for all geographic columns (`geography(Point, 4326)`). Because Prisma does not natively manage PostGIS columns, they are declared as `Unsupported("...")` in `schema.prisma` and created via raw SQL in `migrations/0_init/migration.sql`. All geo writes and spatial queries (radius, within-bbox, nearest) go through `prisma.$queryRaw` / `$executeRaw` using `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.

---

## Development status

- ✅ **Phase 0** — Foundation: monorepo, Docker stack, Prisma schema, seed data
- 🚧 **Phase 1** — Backend core: auth, incidents, lgas, alerts, realtime, media
- ⬜ **Phase 2** — C2 Console: live map, triage queue, dispatch, analytics
- ⬜ **Phase 3** — Mobile app: offline-first reporting, panic SOS
- ⬜ **Phase 4** — USSD/SMS + Voice (Africa's Talking)
- ⬜ **Phase 5** — Hardening: e2e tests, runbook, production Docker build

---

## License

UNLICENSED — proprietary. Prepared as a security consulting engagement for the Benue State Government.
