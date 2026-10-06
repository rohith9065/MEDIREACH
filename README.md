# MediReach

**Find. Decide. Book. Track. Reach.**

MediReach is a real-time hospital assistance platform that helps patients find the most
suitable nearby hospital based on location, required medical services, doctor availability,
bed availability, emergency readiness and travel time — while connecting hospitals with
patients through a real-time operational dashboard.

This is an internship/college project, built incrementally in phases so each stage is
runnable and testable before the next begins. **Phases 1–4 are done:** monorepo skeleton,
backend, database, authentication, role-based access control, the Hospital Web Portal
(login, dashboard, doctors, departments, beds, facilities, emergency status), the
Patient App (login, GPS, map with real OpenStreetMap tiles, nearby-hospital search,
hospital details, emergency screen), and smart-recommendation match scoring.

## Important limitations (read this)

- Hospital availability is only as fresh as what participating hospital staff enter — it
  is not a guarantee of real-time truth.
- The platform never guarantees hospital admission, and travel-time estimates are estimates.
- The "smart recommendation" match score (Phase 4) is a convenience ranking (distance, bed
  availability, emergency status, data freshness, and optionally specialist/facility match),
  not medical advice — shown as such in the app.
- In a real emergency, use your local emergency services — this is a demo/college project,
  not a certified emergency-response system.
- **Seed data uses real hospital names with synthetic availability numbers.** The 53
  district-hospital records added in `database/seeds/004_seed_real_hospitals.ts` (36 Tamil
  Nadu, 14 Kerala, 3 Bangalore) use real, publicly known hospital names and approximate
  district-town coordinates (not geocoded addresses), but every bed count, emergency
  status, and facility entry attached to them is fabricated demo data — it says nothing
  about that hospital's actual real-world capacity. Never treat this app's numbers as real
  information about a real hospital.

## Architecture

```
                 MEDIREACH
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
 Patient App   Hospital Web   Ambulance App      (Hospital Web is built — Phase 2;
       │       (apps/hospital-web)   │             the other two are not — see Roadmap)
       └────────────┼────────────┘
                    │
                    ▼
             Node.js Backend        (server/ — Express + TypeScript)
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
 PostgreSQL     Socket.IO    Notification
                              Service (later)
       │
       ▼
 Super Admin Web    (apps/admin-web, not built yet)
```

**Backend data flow (Phase 1):**

```
Client
  ↓ POST /api/auth/register | /login   (Zod-validated)
Express route → controller → service → model (raw SQL via `pg`)
  ↓
PostgreSQL `users` table
  ↓
JWT issued (jsonwebtoken) → returned to client
```

### Design system (hospital-web, and future MediReach frontends)

Deliberately not the generic "AI-generated SaaS dashboard" look (soft shadows, rounded
cards, indigo gradients, shadcn defaults). Instead: **Editorial** — warm paper background
(`#FAF7F2`), near-black ink text, hairline rules instead of card shadows, muted status
colors (forest green / burnt amber / brick red, not stock Tailwind), status always shown as
a colored dot *plus* a text label. Typography is self-hosted via `@fontsource` — **Source
Serif 4** for headings, **IBM Plex Sans** for body/UI, **IBM Plex Mono** for IDs/numbers —
deliberately not Inter/Geist. No shadcn/ui; a small hand-built component set lives in
`apps/hospital-web/src/components`. Full token values are in
`apps/hospital-web/tailwind.config.ts`.

### Why no PostGIS / Prisma / Docker

- **PostGIS**: the local PostgreSQL 18 install doesn't have the PostGIS extension, and
  Docker isn't available in this environment. Geo columns (`latitude`, `longitude`) are
  plain `DOUBLE PRECISION` for now; nearby-hospital search uses a Haversine-formula SQL
  query instead of `ST_DWithin` (built in Phase 3). See
  [`database/schema/README.md`](database/schema/README.md) for the swap-in path if PostGIS
  becomes available later.
- **Raw SQL + node-pg-migrate** instead of an ORM: keeps every query visible and matches the
  `database/migrations` / `database/seeds` layout, which is easier to explain and debug in a
  demo/viva setting.
- **bcryptjs** instead of native `bcrypt`: pure-JS, so it installs reliably on Windows
  without needing native build tools.

## Repository layout

```
MAD/
├── apps/
│   ├── hospital-web/       Vite + React + TS + Tailwind hospital portal (Phase 2)
│   ├── patient-mobile/     placeholder — Phase 3
│   ├── ambulance-mobile/   placeholder — Phase 8
│   └── admin-web/          placeholder — Phase 9
├── server/                 Express + TypeScript API (auth + /api/hospital/*)
├── database/
│   ├── migrations/         node-pg-migrate TypeScript migrations
│   ├── seeds/               seed scripts
│   └── schema/README.md     full target ER model for every future phase
├── shared/                  types, constants, Zod schemas shared across apps + server
├── .env.example
└── README.md                you are here
```

## Prerequisites

- Node.js ≥ 18 (tested with v22) and npm
- A local PostgreSQL server (tested with PostgreSQL 18, Windows service
  `postgresql-x64-18`). `psql` is not required on PATH — the setup below uses `createdb.exe`
  directly, e.g. `"C:\Program Files\PostgreSQL\18\bin\createdb.exe"`.

## Installation & setup

1. **Install dependencies** (npm workspaces installs `server` and `shared` together):

   ```bash
   npm install
   ```

2. **Create the two local databases** (dev + test), adjusting the Postgres bin path/user for
   your machine:

   ```bash
   "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres medireach
   "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres medireach_test
   ```

3. **Configure environment variables**:

   ```bash
   copy .env.example server\.env
   ```

   Edit `server/.env` — in particular set `DATABASE_URL` / `TEST_DATABASE_URL` to match your
   local Postgres user/password/port, and set `JWT_SECRET` to a long random string.

4. **Run migrations** against the dev database:

   ```bash
   npm run migrate
   ```

5. **Seed demo accounts** (one per role, so RBAC is testable immediately without building the
   real hospital-invite / super-admin-approval flows yet):

   ```bash
   npm run seed
   ```

   This creates, all with the password from `SEED_DEMO_PASSWORD` in your `.env`
   (default `Passw0rd!`):

   | Role | Email |
   |---|---|
   | PATIENT | patient@demo.medireach.dev |
   | HOSPITAL_ADMIN | hospitaladmin@demo.medireach.dev |
   | DOCTOR | doctor@demo.medireach.dev |
   | AMBULANCE_DRIVER | driver@demo.medireach.dev |
   | SUPER_ADMIN | superadmin@demo.medireach.dev |

   `npm run seed` also runs three hospital seed scripts: City Care Hospital (with a full
   department/doctor/bed/facility set, linked to `hospitaladmin@demo.medireach.dev`), 3 more
   fictional Bengaluru hospitals, and 53 real-named district hospitals across Tamil Nadu,
   Kerala, and Bangalore (`004_seed_real_hospitals.ts` — real names, synthetic availability
   data, see the limitations note above).

## Running the backend

```bash
npm run dev
```

Starts the API on `http://localhost:4000` (or `PORT` from `.env`). `GET /health` returns
`{"status":"ok"}` once it's up.

### API reference (Phase 1)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | none | `{ name, email, phone?, password }` | Creates a **PATIENT** account only |
| POST | `/api/auth/login` | none | `{ email, password }` | Returns `{ user, token }` |
| GET  | `/api/auth/me` | Bearer JWT | — | Returns the current user |
| POST | `/api/auth/logout` | Bearer JWT | — | Stateless — client discards the token |

Example:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"patient@demo.medireach.dev\",\"password\":\"Passw0rd!\"}"
```

### API reference (Phase 2 — `/api/hospital/*`)

All routes below require a `HOSPITAL_ADMIN` bearer token **and** that user being linked to a
hospital via `hospital_staff` (403 otherwise — seeded automatically for
`hospitaladmin@demo.medireach.dev`).

| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/api/hospital/me` | Hospital profile |
| PUT | `/api/hospital/me/emergency-status` | `{ emergencyStatus: AVAILABLE\|LIMITED\|UNAVAILABLE }` |
| GET | `/api/hospital/dashboard` | Aggregate counts for the overview page |
| GET / POST | `/api/hospital/departments` | | 
| PUT | `/api/hospital/departments/:id` | |
| GET / POST | `/api/hospital/doctors` | |
| PUT | `/api/hospital/doctors/:id` | |
| PATCH | `/api/hospital/doctors/:id/status` | `{ status: AVAILABLE\|UNAVAILABLE }` |
| GET | `/api/hospital/beds` | |
| PUT | `/api/hospital/beds/:bedType` | `{ totalBeds, occupiedBeds }` — rejects `occupiedBeds > totalBeds` |
| GET | `/api/hospital/facilities` | |
| PUT | `/api/hospital/facilities/:facilityName` | Upsert — `{ status, quantity? }` |

## Testing

```bash
npm test
```

Runs Jest + Supertest integration tests against the real `medireach_test` database (the
`pretest` script migrates it automatically first). Covers auth/RBAC, hospital CRUD, bed/facility
upserts, nearby-search + smart-recommendation scoring (standard and emergency-triage modes),
appointments/scheduling/digital queue, Socket.IO real-time events, hospital self-registration
and super-admin verification/user-management/audit-logs, and ambulance dispatch (nearest-driver
selection, decline-then-retry reassignment, status transitions, RBAC per route group). 76 tests
total across 7 suites.

## Running the hospital web portal

With the backend already running (`npm run dev` at the repo root):

```bash
npm run dev --workspace=apps/hospital-web
```

Opens on `http://localhost:5173`, talking to the API at `VITE_API_URL`
(`apps/hospital-web/.env`, defaults to `http://localhost:4000/api`). Log in with
`hospitaladmin@demo.medireach.dev` / `Passw0rd!` (or whatever `SEED_DEMO_PASSWORD` is set to).

## Running the patient app

Expo + React Native + TypeScript, in the **Vivid & Energetic** design direction (coral-orange
on deep navy/white — deliberately different from the hospital portal's Editorial look).
Map screen uses MapLibre GL JS in a WebView (not Google Maps), rendering real OpenStreetMap
tiles — see `src/components/mapHtml.ts`. Built on **Expo SDK 54** (downgraded from the
initial SDK 57 scaffold to match what the current published Expo Go app supports).

With the backend already running:

```bash
cd apps/patient-mobile
npx expo start
```

Set `apps/patient-mobile/.env` (`EXPO_PUBLIC_API_URL`) to match how you're connecting:
- **Android emulator**: `http://10.0.2.2:4000/api`
- **Physical phone over Wi-Fi**: `http://<this-PC's-LAN-IP>:4000/api` — also requires
  allowing inbound TCP port 4000 through Windows Firewall, and the phone on the same Wi-Fi.
- **Web preview** (`npx expo start --web`, for quick checks in a browser): `http://localhost:4000/api`
  — note `react-native-webview` (and therefore the map) doesn't render on the web target;
  everything else works there.

Scan the QR code Expo CLI prints with the Expo Go app (or enter the `exp://` URL manually
under "Enter URL manually"). Demo login: `patient@demo.medireach.dev` / `Passw0rd!`.

Note: on a laptop switching networks (e.g. mobile hotspot), the Wi-Fi IP changes and
`EXPO_PUBLIC_API_URL` needs updating to match — find the current one with
`Get-NetIPAddress -AddressFamily IPv4` in PowerShell.

### API reference (Phases 3–4 — `/api/hospitals/*`, public, no auth)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/hospitals/nearby` | Query params: `lat`, `lng` (required), `radiusKm` (default 15), `q` (name search), `specialization`/`facility` (optional — feed the match score, no UI picks these yet), `emergencyMode` (`true`/`false`, Phase 7 — switches to the emergency-triage weight table and excludes `UNAVAILABLE` hospitals; used by the Emergency screen). Returns hospitals sorted by `matchScore` (distance/beds/emergency/freshness, +specialist/facility when requested, or the emergency-weighted formula under `emergencyMode`), each with `matchReasons: string[]`. |
| GET | `/api/hospitals/:id` | Full public detail: beds, facilities, doctors, emergency status. 404s for unverified/nonexistent hospitals. |

## Running the other apps

- **Super admin console** (`apps/admin-web`, Phase 9) — Vite + React, same setup as
  hospital-web: `npm run dev --workspace=apps/admin-web`, opens on `http://localhost:5174`.
  Log in with `superadmin@demo.medireach.dev` / `Passw0rd!`. "Console" design direction —
  graphite/slate + indigo, distinct from hospital-web's "Editorial" look.
- **Ambulance driver app** (`apps/ambulance-mobile`, Phase 8) — Expo + React Native, same
  setup as patient-mobile (standalone npm project, own `.env`): `cd apps/ambulance-mobile && npx expo start`.
  Log in with `driver@demo.medireach.dev` / `Passw0rd!`. "Roadside" design direction —
  safety-amber on near-black, built for glanceable status while driving.

## Deployment

Nothing is deployed publicly yet — this section is the exact path to get there. Target stack:
web frontends on Vercel, backend on Render/Railway, PostgreSQL on Supabase (architecture kept
AWS-compatible for later). Every step below needs your own account on that provider — none of
this can be done on your behalf, only prepared for.

1. **Database**: create a Postgres instance on Supabase/Render/Railway, copy its connection
   string. Run `DATABASE_URL=<that string> npm run migrate` and `npm run seed` (optional, for
   demo data) against it from your machine once.
2. **Backend**: deploy `server/` to Render or Railway. Copy `server/.env.production.example`
   to that service's environment variable settings — in particular set a real `JWT_SECRET`
   (`openssl rand -base64 48`; the server refuses to boot in production with the placeholder
   value), the production `DATABASE_URL`, and `CORS_ORIGINS` once you know your frontend
   domains. Build command `npm run build`, start command `npm run start`.
3. **Hospital web / Super admin console**: deploy `apps/hospital-web` and `apps/admin-web` to
   Vercel as static sites (build command `npm run build --workspace=apps/<name>`, output
   directory `apps/<name>/dist`). Set each one's `VITE_API_URL` (see its
   `.env.production.example`) to your deployed backend's URL, then go back and add both
   resulting Vercel domains to the backend's `CORS_ORIGINS`.
4. **Patient app / Ambulance driver app**: set `EXPO_PUBLIC_API_URL` in each app's `.env` to
   the deployed backend URL, then build a real installable app with
   [EAS Build](https://docs.expo.dev/build/introduction/) (`eas.json` is already set up in
   both apps — needs your own free Expo account): `eas build -p android --profile preview`
   gives a directly-installable `.apk`; `--profile production` is the Play Store–ready build.

### Security notes for going live

- `server/src/config/db.ts` enables SSL automatically once `NODE_ENV=production` — required by
  every managed Postgres host above.
- `server/src/config/env.ts` rejects the placeholder `JWT_SECRET` and requires ≥32 characters
  once `NODE_ENV=production`.
- CORS is wide-open by default (local dev) and locks to `CORS_ORIGINS` once that's set — see
  `server/.env.production.example`.
- `/api/hospitals/*` (unauthenticated search/detail) now has its own rate limit
  (`publicRateLimit.middleware.ts`, 100 req/15 min/IP) separate from `/api/auth/*`'s existing
  one, since it previously had none.
- `npm audit` is clean on the backend and both web apps. The two Expo mobile apps still show
  toolchain-only advisories (`@expo/config-plugins` and friends) — these are dev-time
  config-processing packages, not code shipped in the built app, and forcing a fix would bump
  major Expo SDK versions, risking the exact Expo-Go/SDK-version mismatch this project already
  had to work around once. Left as an accepted risk rather than force-upgraded.

## Future hospital system integration

Phase 1's data model is intentionally hospital-portal-first:

```
Hospital Staff → MediReach Hospital Portal → Backend API → PostgreSQL → Patient App
```

A later integration layer is meant to let a real Hospital Management System push updates
directly:

```
Hospital HMS → Secure Hospital API → MediReach Integration Layer → PostgreSQL
```

Only verified hospital accounts should ever be able to publish availability, and no such
integration exists yet — this section documents intent, not a shipped feature.

## Development roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Monorepo, backend, database, auth, roles | ✅ Done |
| 2 | Hospital web portal (login, beds, doctors, facilities, emergency) | ✅ Done |
| 3 | Patient app (login, GPS, map, nearby hospitals, hospital details) | ✅ Done |
| 4 | Smart recommendation scoring (weighted match score + reasons) | ✅ Done |
| 5 | Socket.IO real-time bed/doctor/facility updates | ✅ Done |
| 6 | Appointments, doctor schedules, digital queue/tokens | ✅ Done |
| 7 | Emergency mode, emergency hospital ranking, call/navigate | ✅ Done |
| 8 | Ambulance app / driver connection — nearest-driver dispatch, live tracking, driver app | ✅ Done |
| 9 | Super admin: hospital verification, user mgmt, audit logs | ✅ Done |
| 10 | Security hardening, deployment readiness, docs polish | ✅ Done |

Ambulance (Phase 8) was intentionally built out of its original numeric order — it was pushed
past Phases 5–7 and 9 by request, then completed after them.

Each phase got its own implementation plan, verified working (tests + a live manual pass)
before the next began. All ten are now done.
