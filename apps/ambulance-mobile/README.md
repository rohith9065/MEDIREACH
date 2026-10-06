# ambulance-mobile

**Phase 8** — the ambulance driver app: on-shift toggle, incoming request accept/decline, live
trip tracking with status transitions and location broadcasting.

Expo + React Native + TypeScript, same tech stack as `apps/patient-mobile` (standalone npm
project outside the root workspaces for Metro-bundler reasons, linked to `shared/` via
`metro.config.js`). Design direction: **"Roadside"** — high-visibility, on-shift-while-driving
palette (safety-amber on near-black), distinct from patient-mobile's "Vivid & Energetic",
hospital-web's "Editorial", and admin-web's "Console".

Drivers are provisioned by a hospital admin via hospital-web's Ambulances page — no
self-registration. Demo account: `driver@demo.medireach.dev` / `Passw0rd!`.

With the backend already running:

```bash
cd apps/ambulance-mobile
npx expo start
```

Set `apps/ambulance-mobile/.env` (`EXPO_PUBLIC_API_URL`) the same way as patient-mobile
(Android emulator: `http://10.0.2.2:4000/api`; physical phone: `http://<LAN-IP>:4000/api`).
