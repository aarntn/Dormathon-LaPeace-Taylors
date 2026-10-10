# BUCKL live integration implementation plan

**Goal:** Finish the approved 4b screens and connect them to the 4c API, configure the intended Supabase project, migrate it and verify real database and explicitly addressed test SMS operations.

**Spec:** `AGENTS.md`, `docs/review/catch-up-audit.md`, revised build guide Prompts 4b and 4c. The user explicitly requested finishing the outstanding integration. The audit/design already supplies the screen and navigation decisions.

**Architecture:** Keep shared tokens/components and the tested eye-watch engine. A root `AppDataProvider` owns authenticated API access and account resources; drive runtime owns sensor queues/countdown episodes; screen domains consume those interfaces. No new runtime dependencies or unrelated project changes.

## Constraints and interfaces

- Root owns `App.tsx`, auth/backend configuration, `api.ts`, `integration/AppData.tsx`, `integration/auth.ts`, route metadata and final browser verification.
- `useAppData()` exposes `api: BucklApi`, `session: AuthSession|null`, `configured: boolean`, `loading: boolean`, `error: string`, `cars: Car[]`, `contacts: Contact[]`, `trips: Trip[]`, `selectedCar: Car|undefined`, `refresh(): Promise<void>`, `signUp(name,email,password): Promise<AuthSession|null>`, `signIn(email,password): Promise<AuthSession>`, `signOut(): Promise<void>`, `ensureSetup(car:CarInput,contact?:ContactInput): Promise<Car>`.
- Drive task owns `screens/drive`, `styles/drive.css`, `eyewatch`, drive sensor/runtime tests. Export `DriveProvider` from `screens/drive/session.tsx`; root mounts it inside EyeWatchProvider and AppDataProvider. Domain must not edit root-owned files.
- Car task owns `screens/car`, `styles/car.css`, new `styles/car-catch-up.css` if useful, car tests. Export `DashboardCamera` for root sheet dispatch. Other car screens register via `carRoutes`.
- Account task owns `screens/onboarding`, `screens/profile`, `screens/trips`, their styles and tests. Route arrays retain existing names and add new screens. Root mounts existing providers.
- Each new/changed screen must retrieve Figma design context + screenshot and reuse/download actual assets. Preserve user-approved Getting tired warning content. Real states must not report success from timers/mocks.
- No new dependencies. The user's later instruction explicitly requests committing and pushing progress before database setup. All fake/demo inputs remain hidden behind triple-tap logo.
- No SQL mutation until intended project identified. No real SMS until recipient identified. Credentials remain in ignored local env files.

## Execution tasks

1. Root: test-first REST auth/session refresh and public auth proxy; implement AppDataProvider. Test refresh races, rejected auth, account switching clears resources, and no fake authentication fallback. Configure ignored environment only when real project identified.
2. Drive domain: implement readiness inputs, 15-second valid face reading, real tap test/loading/result/route selection; passenger, seatbelt, speed/locked controls; countdown/cancellation/voice acknowledgement/location retries; GPS 10-second batches, features/events, brake detection, summary. Tests prove no SMS before countdown, cancellation, stable episode keys, passenger suppression and queue flush before ending.
3. Car domain: replace removed routes with dashboard capture/loading/result/failure, start-up microphone recording/loading/failure, latest report, brakes and service workshops. Test lifecycle cleanup and actual uploads/results; no timer-based successful inference.
4. Account domain: real signup/signin, revised battery/contact/access onboarding, contact preferences/test message, empty/data trips and patterns. Use AppData and real API; test failure handling and navigation. Do not store passwords or invent populated history.
5. Root: wire providers/routes/sheets, finish safe local config, inspect/apply/verify migration and RLS for the identified Supabase project. If unrelated/absent project, continue independent code and retain precise external blocker.
6. Root: run backend/web suite, production build, complete fake HTTP flow and browser screen comparisons at 430/390/360 px. Run live auth/database test and explicitly marked SMS only with supplied target/credentials. Save evidence and report remaining verified limits accurately.

## Progress

- Supabase configuration deferred by the user; leave all existing projects untouched.
- Real SMS testing deferred by the user.
- Current progress and verification: `docs/review/live-integration-progress.md`. Car UI wiring, maps handoff and full visual/device review remain pending.
