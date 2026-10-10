# Latest BUCKL UI on DriveSafe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the BUCKL web app on codex/drivesafe-foundation into alignment with the latest approved Figma audit without replacing its working API integration.

**Architecture:** Reuse the existing components, tokens, route metadata, providers and API client. Separate Figma presentation from real sensor/account/request state; bind exported assets and motion to the actual screen slots. Keep main’s local work intact in an isolated checkout and port the reviewed Home corrections selectively.

**Tech Stack:** React, Vite, TypeScript, Tailwind, React Router, Framer Motion, existing MediaPipe worker and FastAPI API.

**Spec:** [Latest frame-by-frame audit](../../review/latest-figma-drivesafe-audit.md), [AGENTS.md](../../../AGENTS.md), Figma YQotwkLvWP68ht9GzTbpf0.

## Global Constraints

- Ask before adding a new dependency. None is planned.
- Exact Figma copy and tokens; 430 × 932 reference; 430 px column; safe areas; 34 px pinned footer clearance.
- No imitation iOS status bar. Preserve all five Button styles and pressed states.
- Download vector assets from Figma. Never redraw or substitute a whole-screen screenshot.
- cubic-bezier(0.32, 0.72, 0, 1), push 0.45 s, sheet 0.5 s, drive fade 0.3 s, tab fade 0.2 s.
- Face video processed locally and never stored. Audio only recorded during a user-started engine check. Photos uploaded only after capture.
- Demo shortcuts only in triple-tap panel. Sample records never replace missing real-account data.
- Preserve cancellable emergency countdown, idempotent retry and truthful delivery state.
- Database setup and real SMS remain deferred. No account/project or external-message mutation during UI verification.
- Exclude Parked damage/belt screens and guide-excluded 05c/05d.
- Stop at guide section checkpoints. Audit approval precedes app-code changes.

## Review Focus

1. Loading or failed account configuration must not masquerade as confirmed unconfigured preview; test configuration pending/failure and account switch.
2. Ending a camera/microphone screen or denying permission must release streams and preserve a retry; test active tracks after navigation.
3. Empty trips, zero findings and missing measurements must remain truthful while preserving the designed card hierarchy.
4. Cancelling or acknowledging an emergency during an in-flight retry must not send an extra alert; retain runtime regressions and mock all messages.
5. Narrow screens, long real values and reduced motion must not clip text or alter countdown/reaction timing.

## Task 1: Isolate the target and preserve reviewed work

**Files:** selected branch checkout; main workspace’s uncommitted Home/AppData/AccountNotice/CarReport changes and assets; audit and review artifacts.

- [ ] Set up an isolated checkout tracking codex/drivesafe-foundation at the audited commit; do not switch or reset the dirty main checkout.
- [ ] Run existing tests and build in that checkout before edits. Use existing declared dependencies, without adding packages.
- [ ] Capture main’s exact modified files/assets as a transfer patch and manifest. Apply Home/configuration/error fixes selectively; reconcile CarReport with the target branch’s CarProvider additions rather than overwriting its session/API work.
- [ ] Copy audit and plan into the target checkout. Keep its Expo/prototype backend and deployment packaging outside this UI change.
- [ ] Verify target history and main worktree status before continuing.

Commands in apps/web:
```powershell
npm ci
npm test
npm run build
```

## Task 2: Shared shell, tokens and Drive watch

**Files:** apps/web/src/components/*; components/motion/*; styles/app.css, drive.css, catch-up.css; screens/drive/Home.tsx, PreDrive.tsx, Emergency.tsx, Driving.tsx, TripSummary.tsx, shared.tsx, DemoPanel.tsx; routing/routeMetadata.ts; scripts/browser-review.mjs.

**Consumes:** useAppData(), useDrive(), useEyeWatch(), existing motion components, typed API contracts.
**Produces:** Current Drive watch presentation and hidden demo entry for every required result/emergency variant.

- [ ] Fetch current Components/Motion design context and screenshots. Compare existing tokens/assets; adjust only confirmed differences.
- [ ] Fetch context and screenshot for each Drive frame listed in the audit. Reuse prior Home evidence only if fresh source still matches.
- [ ] Port HomeView presentation and explicit configState handling. Render own-account trips/reports without sample fallbacks.
- [ ] Bind the four question groups, face reading and real tap timing to the designed layout. Place result-loading card over TapTest; preserve one-second minimum and request-error recovery.
- [ ] Restore each safe/caution/high variant, plan/action/disclaimer layout without deriving unsupported alertness claims from a score.
- [ ] Put Speed inside the three-column stats card; preserve movement locking and alarm states. Restore passenger and emergency card/ring/location layout while preserving runtime cancellation.
- [ ] Add 08d receipt preview to DemoPanel only; never invoke an SMS endpoint for the preview.
- [ ] Restore trip-summary route/stat/event/safety presentation around actual data; retain explicit demo-rule wording.
- [ ] Add bounded browser checks per frame and variant, then save Figma/browser comparison evidence. Review this section checkpoint before moving on.

Extend the existing browser geometry helper with exact reference bounds from each fresh frame. Existing Home regression remains:
```javascript
assert.ok(text.includes('Stay awake on the road'));
assert.ok(!text.includes('database configuration'));
assert.ok(Math.abs(geometry['.tab-bar'].y - 832) <= 2);
```

Run:
```powershell
npm test
npm run build
node scripts/browser-review.mjs --home
node scripts/browser-review.mjs --integration
```

## Task 3: Onboarding

**Files:** apps/web/src/screens/onboarding/*.tsx, shared.tsx, draft.tsx; styles/onboarding.css; public/assets/onboarding; scripts/browser-review.mjs.

**Consumes:** draft fields, actual sign-up/sign-in/ensureSetup, permission APIs, local calibration.
**Produces:** Current O1–O15 layouts and navigation.

- [ ] Capture context/screenshots for all changed onboarding frames; preserve source-compatible O1/O5/O7/O9 while verifying shared sizing.
- [ ] Restore welcome paragraph/actions, sign-up fields/footer, car sheet bounds, battery options and maps tip.
- [ ] Build compact contact/access rows with exported icons and trailing actions; represent unsupported/denied permission honestly.
- [ ] Restore face intro/scan/all-set assets and layout. Show valid observation-driven calibration; preserve backend save validation/errors.
- [ ] Compare all frames at 430 × 932 and narrower widths. Verify back/sheet dismissal, password clearing, duplicate-safe setup and stream cleanup.
- [ ] Save section evidence and stop at the onboarding checkpoint.

Use the existing controlled-input/browser helpers to exercise fields and assert actual auth navigation; do not restore prototype-only Continue bypasses.

## Task 4: Current car flows

**Files:** apps/web/src/screens/car/CarCheck.tsx, CarReport.tsx, EngineSoundCheck.tsx, session.tsx, shared.tsx, routes.tsx, useRearCamera.ts; new DashboardScan.tsx, DashboardResult.tsx, CarLoading.tsx, CarRecovery.tsx, BrakeCheck.tsx, Workshops.tsx; styles/car.css; App.tsx sheet dispatch; routing/routeMetadata.ts; scripts/browser-review.mjs.

**Consumes:** api.dashboardCheck(carId, photo), api.startupCheck(carId, audio), api.carReport(carId), api.workshops(position, service), selectedCar, existing microphone Waveform and rear-camera lifecycle.
**Produces:** C1–C7 and all four loading/recovery variants, with typed per-car state and correct navigation.

- [ ] Capture context/screenshots for every Car frame and exact vector assets before editing.
- [ ] Replace active walk-around entry with DashboardScan. Capture → loading overlay → actual urgency/result or unreadable recovery. Keep retry and manual workshop action.
- [ ] Update start-up-only recorder and microphone Waveform. Stop/release streams when leaving; recording → loading overlay → report or quiet-engine recovery.
- [ ] Clear dashboard/start-up requests and results on account/car changes; ignore late completions for the previous identity.
- [ ] Reconcile report preview and actual results; eliminate scratch/belt/estimated-price fallbacks for real accounts.
- [ ] Build BrakeCheck from recorded brake trends, with missing-data state and advice.
- [ ] Build workshop list using the selected problem, phone/directions links and user-initiated report sharing; no automatic message.
- [ ] Remove Parked legacy routes/state and links from active navigation; preserve historical design references.
- [ ] Mock dashboard success/unreadable, start-up success/quiet, workshops empty/failure and car switching in browser integration checks. Save every Figma/browser comparison and stop at the Car checkpoint.

Request identity pattern:
```typescript
const requestUser = session.user.id;
const requestCar = selectedCar.id;
const result = await api.carReport(requestCar);
// Commit only if the current user and car still match this request.
```

The identity check belongs in the shared async owner rather than relying on a completed page timer.

## Task 5: Trips

**Files:** apps/web/src/screens/trips/Trips.tsx, WhenYouGetTired.tsx, LateDriveHeadsUp.tsx, shared.tsx; styles/trips.css; scripts/browser-review.mjs.

**Consumes:** actual completed trips and api.patterns(); retains night-reminder preference.
**Produces:** T1/T1b/T2/T3 current layouts.

- [ ] Capture fresh context/screenshots. Restore month header, pattern card, week groups, trip status badges/arrow, chart and advice.
- [ ] Use actual trip aggregates; missing observations stay empty. Restore T1b Start action without example history.
- [ ] Keep T3 navigation into current readiness and mount sequence.
- [ ] Verify signed-out, empty, populated and pattern-error cases; compare all four frames and stop at the Trips checkpoint.

## Task 6: Profile and final verification

**Files:** apps/web/src/screens/profile/*.tsx, shared.tsx; styles/profile.css; scripts/browser-review.mjs; docs/review section evidence.

**Consumes:** account/cars/contacts/trips, patterns, contact preferences and explicit test-message action.
**Produces:** P1–P6 current layouts and completed UI review evidence.

- [ ] Capture fresh frame context/screenshots. Restore three statistics, alert summary, charts, car cards, full settings/privacy groups and contact controls.
- [ ] Keep account loading/error/retry visible without replacing authentic records with Figma samples.
- [ ] Test account switching and sign-out, own-car actions, contact validation/toggles and mocked explicit test text.
- [ ] Compare each frame at reference and narrow widths; verify reduced motion, pinned footer and no broken static assets.
- [ ] Run final tests/build/fake HTTP browser integration, obtain independent code review and fix important findings.
- [ ] Show the corrected section/app with comparison artifacts. Commit/push only the reviewed UI work to the user-selected branch under the session’s push authorisation; do not force-push or merge into main.

Final commands:
```powershell
npm test
npm run build
node scripts/browser-review.mjs --integration
git diff --check
```
