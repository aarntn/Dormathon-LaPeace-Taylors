# BUCKL web app

The mobile-first React app that drivers open in their phone browser. React 19, Vite 7, TypeScript, Tailwind CSS 4, React Router 7, Framer Motion.

Start with the [root README](../../README.md) for the product, and [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for how the pieces fit. This page is the working guide for this folder.

## Run it

You need Node 22.

```powershell
cd apps/web
npm ci
npm run dev
```

Vite serves **HTTPS** on port 5173 and listens on the LAN, because browsers only give a page camera, microphone and motion access on a secure origin. Open the printed network address on a phone on the same Wi-Fi and accept the self-signed certificate. `/api` is proxied to `http://127.0.0.1:8000`, so start the API too (see [`backend/README.md`](../../backend/README.md)) for sign-in and saved data.

| Script | Does |
|---|---|
| `npm run dev` | Dev server with hot reload (HTTPS, port 5173) |
| `npm run build` | Type check (`tsc -b`), production build, then the **offline cache manifest** (`postbuild`) |
| `npm run preview` | Serve the built `dist` (HTTPS) |
| `npm run tokens` | Regenerate `src/styles/tokens.css` from `design/figma-tokens.json` |
| `npm test` | 50 unit tests with `node --test` (no browser, no extra dependency) |

## Folder map

```text
src/
  main.tsx, App.tsx       providers, route table, page transitions, service worker
  api.ts                  typed client: one function per backend route
  routing/                route metadata (transition kind) and transition variants
  components/             Figma components (Button, IconButton, TabBar, Input, Option, BrandMark, AppFrame)
    motion/               animated pieces (dots, rings, scan line, tap dot, waveform) and microphone meter
  eyewatch/               the drowsiness engine, MediaPipe worker, alarm and voice, the session that ties them to the camera
  integration/            account and data layer: auth.ts, AppData, useResource, useTripSummaries, RouteTrace
  screens/
    onboarding/           15 screens, /onboarding/*
    drive/                Home, readiness check, route, mounting, driving states, emergency, trip summary
    car/                  Car check, scan a warning light, battery check, brake check, report, workshops
    trips/                Trips, When you get tired, Late-drive heads-up
    profile/              Profile, stats, cars, add a car, privacy, emergency contact, help and legal pages
  styles/                 tokens.css (generated), app.css, and one stylesheet per section
design/                   Figma exports: tokens, prototype links, frame source text
public/                   fonts, eye-watch model and WASM, section assets (original Figma SVGs)
scripts/                  token generator, offline cache builder, browser checks, comparison pages
tests/                    unit tests
```

## How a screen is built

1. **Read the Figma frame** with the Figma MCP (design context and screenshot). The frame name is the screen name (`C3 Warning light result`).
2. **Reuse** a Figma component or an existing section helper before writing markup. Use token classes (`text-body-small`, `bg-bg-card`) and CSS variables, never raw colours or sizes.
3. **Use exported SVGs** from `public/assets/<section>` in the same slot and at the same size. Do not redraw them.
4. **Keep screens thin.** Read from a provider, render, and call a function. Timers, fetches and sensor handling live in services or providers.
5. **Check it** at 430, 390 and 360 px for horizontal overflow, then run the section's browser check.

### Rules that apply everywhere

- Face video stays on the phone. Audio is recorded only during the start-up check. A dashboard photo is uploaded only when the user takes it.
- Location goes to the emergency contact only after the countdown ends.
- The emergency countdown can always be cancelled. Never claim a medical or vehicle diagnosis. Say "possible" or "may".
- Demo shortcuts live in the hidden panel (**triple-tap the logo**), never on the real UI.
- Sample values from Figma appear only in a `?preview` URL or the hidden demo. A real account shows real data or an honest empty state.
- Ask before adding a dependency.

## Routes

| Section | Entry | Notes |
|---|---|---|
| Onboarding | `/onboarding/splash` | `?preview` pauses the timers and shows sample content |
| Drive | `/drive/home` (also `/`) | Start from Home. The readiness check comes before the route and mount screens |
| Car | `/car` or `/car/car-check` | `scan-a-warning-light` and `reading-the-light` open as a camera sheet |
| Trips | `/trips` or `/trips/trips` | `late-drive-heads-up` is reached from a late start, or from the demo panel |
| Profile | `/profile` or `/profile/profile` | |
| Gallery | `/components`, `/components/canvas`, `/components/preview/{push,fade,tab,sheet}` | Components and transitions, for design review |

Removed on purpose: `first-check`, `photo-walk-around`, `scratch-detail` and `belt-squeal-trend` (not in the MVP). Opening them goes to the gallery.

## Eye watch

`src/eyewatch` is the heart of the drive. It runs in the browser with no network.

- `model.worker.ts` loads the MediaPipe Face Landmarker (GPU, with a CPU fallback) and returns eye-closed and jaw-open blendshapes at about 15 fps.
- `engine.ts` turns frames into `alert`, `tired`, `microsleep` or `lost`, from PERCLOS, blink length, yawns and closure time. All thresholds are in `eyeConfig`.
- `session.ts` joins camera, GPS, the engine and the alarm, and latches the alarm until it is acknowledged.
- `alarm.ts` makes the tone, vibration and spoken prompts. Audio must be unlocked by a tap, so the Start button does that.
- `/test-eyes` is a developer page for watching the engine's values live.

The numbers and the reasoning are in [ARCHITECTURE.md, section 5](../../docs/ARCHITECTURE.md#5-eye-watch-pipeline).

## Offline

`npm run build` writes `dist/sw.js` with every built file (including the face model) and names the cache after a hash of the build. The service worker registers only in production builds. To test offline, run `npm run build` and `npm run preview`, open it once online, then turn the network off.

## Tests

```powershell
npm test                                       # unit tests
node scripts/browser-review.mjs --car          # Car check, 11 screens at 430, 390 and 360 px
node scripts/browser-review.mjs --trips        # Trips, signed in
node scripts/browser-review.mjs --profile      # Profile, signed in, including rename and downloads
node scripts/browser-review.mjs --onboarding   # 15 screens and the sign-up to all-set flow
node scripts/browser-review.mjs --integration  # sign-in, account isolation, failure and empty states
node scripts/browser-review.mjs --home         # Home against the Figma frame
node scripts/browser-review.mjs --current-drive  # captures the current Drive states
```

Run `npm run build` first, because the checks serve `dist`. The browser checks use installed Chrome or Edge with a temporary profile and a **fake API on loopback**, so no database, SMS or map service is touched. Set `DORMATHON_CHROME` if the browser is somewhere unusual. Evidence is written to `docs/review`, so discard those file changes unless you mean to update them.

`--drive` is an older script written before the readiness check was added to the flow, and it currently fails at the first step. Use `--current-drive`.

What the unit tests cover: the typed client and token refresh, the eye engine and calibration, the microphone meter, the drive runtime (hard-brake detection, countdown and retries), spoken prompts, design tokens, page transitions, the car report and the trip-pattern chart logic.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Couldn't load account settings" on Home | The API is not running. Start it, then reload. |
| Camera or microphone prompt never appears | You are on `http`, or the certificate was not accepted. Use the HTTPS address. |
| Alarm is silent | Browsers keep audio suspended until a tap. Use the Start or Enable sound button. |
| Face scan never completes | Light the face from the front, and take off sunglasses. The scan advances only on valid eye measurements. |
| The browser check cannot find a browser | Set `DORMATHON_CHROME` to your Chrome or Edge executable. |
