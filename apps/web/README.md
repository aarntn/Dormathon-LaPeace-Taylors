# Dormathon web

React + Vite + TypeScript mobile-first app. See [AGENTS.md](../../AGENTS.md) for the shared brief.

From this folder:

```powershell
npm ci
npm run dev
```

Vite serves HTTPS on port 5173 and listens on the LAN. Open the printed network URL followed by `/components` on a phone connected to the same Wi-Fi or hotspot. The development certificate is self-signed; accept the development certificate in your browser. Camera testing in later prompts requires the phone browser to treat this connection as a secure context; some phones require explicitly trusting the certificate. Camera features are not part of Prompt 1.

- `/components`: interactive, phone-width component gallery, all colours and Inter text styles.
- `/components/canvas`: source Components frame at its original 1600 × 1000 dimensions, for desktop comparison. The fake status bars are intentionally omitted.
- `/components/preview/push`, `/fade`, `/tab`, `/sheet`: transition and pinned-footer checks. Open the sheet from the gallery to test its retained background.

```powershell
npm run tokens
npm test
npm run build
node scripts/browser-review.mjs
```

The browser review uses installed Chrome or Edge, a temporary profile and a loopback preview of `dist`. It adds no package dependency. Set `DORMATHON_CHROME` to a Chromium executable if it is installed elsewhere. Screenshots and verification results go to `docs/review`.

Tailwind 4 uses the Vite integration and `tailwind.config.mjs` to expose all Dormathon colour names (`bg-bg-screen`, `text-brand-navy`) and text styles (`text-heading-large`, `text-body-small-strong`). `design/figma-tokens.json` is the checked-in Figma MCP export; `npm run tokens` regenerates `src/styles/tokens.css` from it. Refresh the source metadata through Figma MCP before regenerating when the design changes.

The Figma component props are preserved: Button `style`/`label`, IconButton `icon`/`theme`, TabBar `active`, Input `state`/`text`, Option `state`/`title`/`description`, BrandMark `theme` or `version`. Option works uncontrolled by default; supply `state` plus `onChange` to control it. TabBar delegates navigation through `onChange`.

SVGs are original local Figma exports. Inter is served locally under the included SIL Open Font Licence.

Drive watch is the first implemented section of Prompt 2. Open `/drive/home` (also the default `/`) and follow setup to Driving. Triple-tap the Home logo, or activate it three times with Enter, to open the hidden demo panel. The maps logo also supports this gesture. Camera, spoken prompts and alarm audio are now live through the eye-watch session. Real maps hand-off is a subsequent build step; idle design previews still use typed props with Figma sample values.

All eleven routes are declared in `src/screens/drive/routes.ts`. Maps views 05c and 05d are intentionally skipped. Trips and Profile destinations are implemented. The user approved showing the existing hidden warning content in Getting tired (Figma node 39:973).

To regenerate section review artifacts:

```powershell
npm run build
node scripts/browser-review.mjs --drive
node scripts/drive-comparison.mjs
```

The side-by-side review is at `/review/drive-watch.html`, with a live iframe toggle, and at `docs/review/drive-comparison.html` for local screenshot review. `design/drive-prototype-links.json` preserves the inspected prototype reactions. Shared unbound frame values are documented as CSS tokens in `src/styles/drive.css`; the screens otherwise reuse the Dormathon variable collection and text utilities.

Onboarding has 13 routes in `src/screens/onboarding/routes.ts`, starting at `/onboarding/splash`. Form choices last for the current session. Its source/app comparison is at `/review/onboarding.html`; `?preview=1` pauses prototype timers.

Car check has seven screens in `src/screens/car/routes.tsx`, starting at `/car/car-check` or the Car tab's `/car` shortcut. The first-check guide opens C3 as a full-screen sheet. Normal entry requests the rear camera; captured JPEGs remain in browser memory and streams stop on exit. `?preview=1` shows original Figma camera artwork without requesting the camera. Engine readings and reports use typed props with Figma defaults; recording and analysis come later. Scratch marking lasts for the current session. Reminder downloads a calendar event, Share uses native sharing or clipboard, and workshop lookup opens Google Maps.

```powershell
npm run build
node scripts/browser-review.mjs --car
node scripts/browser-review.mjs --car-camera
node scripts/car-comparison.mjs
node scripts/browser-review.mjs --car-comparison
```

`--car-camera` uses generated canvas video in an isolated browser, with native permission gating and fake-device input; it never accesses a physical camera. `/review/car-check.html` contains all seven Figma/app pairs and a live preview toggle. Review notes and camera limitations are in `docs/review/car-visual-review.md`. Trips and Profile have also been built.


Prompt 3 is implemented. Open `/test-eyes` on the phone HTTPS URL, tap Start eye watch, allow the front camera and location, then run Calibrate eyes (five seconds looking ahead and two completed blinks). Use Drive screens after calibration, or start through Home ? Start drive watch. Triple-tap the logo to open the hidden moving override, detector debug and threshold controls. A parked eye closure never sounds the moving alarm.

```powershell
npm test
npm run build
node scripts/browser-review.mjs --eyes
node scripts/browser-review.mjs --eyes --eyes-cpu
```

The eye-watch browser review uses generated video and controlled worker signals, plus actual local GPU model inference. It verifies offline reload, calibration, moving gate, warning navigation, alarm acknowledgement and cleanup without accessing a physical camera. Source, asset provenance and device limitations are in `docs/review/eye-watch-review.md` and `public/eyewatch/NOTICE.md`. Production builds cache the app and model for subsequent offline launches; finish an initial online load first. Keep the page visible because mobile browsers may suspend background camera/audio. Low-light car testing remains a physical-phone checkpoint.
