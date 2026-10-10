# BUCKL catch-up audit — Prompt 4b, step 1

Audited 10 October 2026 against the live Figma file [BUCKL](https://www.figma.com/design/YQotwkLvWP68ht9GzTbpf0), the existing `apps/web/src/screens`, route tables, components, CSS, eye-watch hooks, saved Figma source and previous visual reviews. Baseline commit: `39bd1b2`.

Prompt 4a is complete: `AGENTS.md` now contains the revised Prompt 0 brief, with the existing Codex adaptation. There was no Team notes heading to preserve. No app or backend code has been changed for this catch-up.

## Approval checkpoint

The guide explicitly says **“Wait for my OK before changing code.”** This document completes the audit only. Approval starts **4b step 2: Components and motion**, followed by its own stop-and-show checkpoint. It does not skip the later screen, navigation or driving-logic checkpoints.

| Classification | Count |
| --- | ---: |
| New | 24 |
| Changed | 28 |
| Same | 7 |
| Removed / excluded | 6 |
| Total frames inventoried | 65 |

The five active sections contain 61 frames. Four further frames are in Parked. Two of the active frames, 05c and 05d, remain excluded by the guide. “Removed” for those two means excluded from the MVP, not an existing route to delete.

Routes for existing screens are actual paths. Routes for new screens are **proposed**, not yet implemented. Risk variants share a result screen selected by `level`; the frame labels remain exact. “Same” means preserve the screen-specific implementation; shared pressed-state improvements still apply. This is a source, copy and layout audit; new screenshots of the running app against every revised frame belong to 4b step 3.

## Onboarding — 42:957

| Figma frame / node | Route | Status | Difference or action |
| --- | --- | --- | --- |
| O1 Splash · 32:273 | /onboarding/splash | same | Existing BUCKL wordmark, logo and tagline already match. Keep. |
| O2 Loading · 32:293 | /onboarding/loading | changed | Replace the static 65% bar and independent 1.5 s timer with the real 2.2 s ProgressBar. |
| O3 Welcome · 32:315 | /onboarding/welcome | changed | Replace the old Dormathon paragraph with the current co-pilot description; retain the hero artwork. |
| O4 Sign up · 32:361 | /onboarding/sign-up | same | Existing fields, account copy and Continue control match. |
| O5 What’s your car · 33:351 | /onboarding/whats-your-car | same | Existing search, model list, manual-add row and sheet entry match. Hidden sheet layers are not visible screen content. |
| O6 Perodua Myvi sheet · 33:444 | /onboarding/perodua-myvi-sheet | changed | Retain the sheet; recheck current 612.65 px sheet bounds against the earlier 615 px review and shared button sizing. |
| O7 Car details · 33:566 | /onboarding/car-details | same | Existing plate, year, colour, mileage and specification fields match. |
| O8 Service and condition · 47:1054 | /onboarding/service-and-condition | changed | Replace modifications/scratches questions with battery age and the three current options. |
| O9 How you drive · 34:424 | /onboarding/how-you-drive | same | Existing multi-select habits and descriptions match. |
| O10 Which maps app · 40:932 | /onboarding/which-maps-app | changed | BUCKL copy; Continue now opens Emergency contact rather than Face scan intro. |
| O11 Emergency contact · 144:1466 | /onboarding/emergency-contact | new | Name, phone, cancellation/location explanation; Continue to Allow access. |
| O12 Allow access · 154:1504 | /onboarding/allow-access | new | Camera, location, motion, microphone and Do Not Disturb rows, with real permission states where supported. |
| O13 Face scan intro · 34:477 | /onboarding/face-scan-intro | changed | Existing former O11 retained; BUCKL copy and Back to Allow access. |
| O14 Face scan · 34:547 | /onboarding/face-scan | changed | Existing former O12 retained; replace static progress and timer-only completion with reusable ScanRing and honest progress. |
| O15 All set · 34:608 | /onboarding/all-set | changed | Existing former O13 retained; BUCKL copy and current scan/draft state. |

Renumbering O11–O13 to O13–O15 does not require renaming the existing semantic routes.

## Drive watch — 42:958

| Figma frame / node | Route | Status | Difference or action |
| --- | --- | --- | --- |
| 01 Home · 28:2 | /drive/home | changed | BUCKL copy, two things to check, car-attention card; Start goes to Before you drive. |
| 01a Before you drive · 140:1323 | /drive/before-you-drive | new | Four inputs: sleep, awake, alertness and trip length. |
| 01a2 Face reading · 175:1703 | /drive/face-reading | new | 15 s local face reading, ScanRing and eye/yawn feedback before the tap test. |
| 01b Tap test · 140:1370 | /drive/tap-test | new | Real reaction timing, early-tap/miss handling and TapDot. Demo outcomes hidden. |
| 01b2 Working out your result · 185:2235 | /drive/working-out-your-result | new | Loading card over the tap screen; stay visible at least 1 s. |
| 01c Check result · 140:1405 | /drive/check-result?level=caution | new | Caution chip, eyes/self-report/trip rows, adjusted plan and exact disclaimer. |
| 01c Good to go · 153:1455 | /drive/check-result?level=safe | new | Safe to drive chip, current evidence rows, plan and disclaimer. |
| 01c Please don’t drive yet · 153:1500 | /drive/check-result?level=high | new | High risk chip, Get a ride instead, quiet Drive anyway, reminder and disclaimer. |
| 01d Pick your route · 163:1620 | /drive/pick-your-route | new | Safer/fastest options, rest-stop explanation and maps hand-off. |
| 02 Mount your phone · 38:837 | /drive/mount-your-phone | changed | Add I’m a passenger link; retain camera-start and mounting guidance. |
| 02p Passenger mode · 163:1665 | /drive/passenger-mode | new | Disable face watch and every alarm, retain GPS/braking and driver-mode switch. |
| 03 Line up your face · 38:906 | /drive/line-up-your-face | changed | Add manual seatbelt tick and continuation gate; retain real fit detection. |
| 04 Quick eye check · 39:849 | /drive/quick-eye-check | changed | Static preview matches, but live mode currently says 5 seconds while Figma says 3. Reconcile displayed timing with the calibration requirement rather than changing the engine silently. |
| 05 Driving · 28:176 | /drive/driving | changed | Controls locked/lock icon, live Speed column and LiveDot; movement-dependent controls. |
| 05a Waze open · still watching · 51:1160 | /drive/waze-open-still-watching | changed | Return-to-BUCKL copy/accessible label; preserve the exported map preview. |
| 05b Tired while Waze is open · 51:1218 | /drive/tired-while-waze-is-open | changed | Preserve the warning layout; update shared return label and real acknowledgement/navigation wiring. |
| 05c Split screen · Waze + Dormathon · 51:1279 | — | removed | Guide explicitly skips this view; no corresponding route exists. |
| 05d On iPhone · Maps open · 51:1362 | — | removed | Guide explicitly skips this view; no corresponding route exists. |
| 06 Can’t see your eyes · 39:917 | /drive/cant-see-your-eyes | same | Existing copy, camera recovery and spoken prompt match. Retain. |
| 07 Getting tired · 39:961 | /drive/getting-tired | changed | Take a 15-minute break and current spoken prompt; preserve the user-approved warning content. |
| 08 Microsleep alarm · 29:116 | /drive/microsleep-alarm | changed | AlarmFlash, spoken acknowledgement, no-response escalation; retain the latched alarm. |
| 08b No response · 140:1458 | /drive/no-response | new | Cancellable 10 s countdown, voice/tap I’m OK, contact disclosure. |
| 08c Contact alerted · 140:1483 | /drive/contact-alerted | new | Real sent/pending state, live-location updates, Call 999 and resolve action. |
| 08d What Mum receives · 153:1555 | Hidden demo panel only | new | Demo message preview only; do not expose as a normal screen or a successful real send. |
| 09 Trip summary · 29:153 | /drive/trip-summary | changed | Route map, distance/duration/average speed, safety score/risk card and hard-braking events. Scrolling content; Done pinned. |

## Car check — 42:959

| Figma frame / node | Route | Status | Difference or action |
| --- | --- | --- | --- |
| C1 Car check · 29:245 | /car/car-check (alias /car) | changed | Replace photo-walk-around/belt entries with warning-light scan, start-up battery and brake check; current report summary. |
| C2 Scan a warning light · 142:1423 | /car/scan-a-warning-light | new | Dashboard capture in full-screen camera sheet; ScanLine; capture only on user action. |
| C2b Reading the light · 185:2024 | /car/reading-the-light | new | Loading card over dashboard camera, at least 1 s before results. |
| C3 Warning light result · 142:1483 | /car/warning-light-result | new | Stop safely now urgency, exact overheating explanation/actions and workshop entry. |
| C3b Couldn’t read the light · 155:1517 | /car/couldnt-read-the-light | new | Blurry/glare recovery, Try again and workshop action. |
| C4 Start-up battery check · 30:280 | /car/engine-sound-check | changed | Retain semantic route; start-up-only recording, actual microphone Waveform, LiveDot and corrected copy. Old screen is titled Engine sound check. |
| C4a Checking the sound · 185:2098 | /car/checking-the-sound | new | Loading card over battery check, at least 1 s before result. |
| C4b Didn’t hear the engine · 155:1567 | /car/didnt-hear-the-engine | new | Real recording-failure/quiet-engine recovery and Try again. |
| C5 Car report · 30:368 | /car/car-report | changed | Battery/brake/dashboard findings and Monitor / Book service soon / Stop safely now urgencies; remove damage/belt report. |
| C6 Brake check · 142:1531 | /car/brake-check | new | Hard-stop trend, service advice, reminder and workshop action. |
| C7 Workshops near you · 142:1588 | /car/workshops-near-you | new | Service filter, phone/directions, opening information and WhatsApp report. |

## Profile — 46:1056

| Figma frame / node | Route | Status | Difference or action |
| --- | --- | --- | --- |
| P1 Profile · 44:934 | /profile/profile (alias /profile) | changed | Emergency contact row; scroll longer content above the tab bar. |
| P2 Driving stats · 44:1084 | /profile/driving-stats | changed | Preserve content/charts; revised 40 px Back control shifts heading from reviewed y119.28 to y122. Adjust dependent spacing. |
| P3 My cars · 45:986 | /profile/my-cars | changed | BUCKL copy and corrected top spacing; retain cars/cards. |
| P4 Add a car · 45:1066 | /profile/add-a-car | changed | Preserve search/popular list; heading y122 and search y206 replace reviewed y119.28/y203.28. |
| P5 Privacy and legal · 45:1152 | /profile/privacy-and-legal | changed | BUCKL notice, Safety features group and emergency/location/motion explanation; scroll. |
| P6 Emergency contact · 155:1692 | /profile/emergency-contact | new | Contact editing, sharing/OK preferences and explicitly labelled test message. |

## Trips — 105:1365

| Figma frame / node | Route | Status | Difference or action |
| --- | --- | --- | --- |
| T1 Trips · 105:1366 | /trips/trips (alias /trips) | same | Existing populated layout/copy matches; retain it. Empty history selects T1b. |
| T1b Trips · no drives yet · 155:1613 | /trips/trips (empty state) | new | No drives yet illustration and Start a drive; no invented sample trips for an empty account. |
| T2 When you get tired · 105:1479 | /trips/when-you-get-tired | changed | Preserve copy/chart; current heading y118 replaces reviewed y115.28 because Back size was corrected. |
| T3 Late drive heads-up · 105:1545 | /trips/late-drive-heads-up | changed | Do the 1-minute check → Before you drive; replace Start with the plan → Mount. Correct shared top spacing. |

## Parked — 142:1388

| Figma frame / node | Existing route | Status | Removal after approval |
| --- | --- | --- | --- |
| Old First check · 49:1089 | /car/first-check | removed | Remove route and obsolete first-check UI. |
| Old Photo walk-around · 30:201 | /car/photo-walk-around | removed | Remove route, old eight-photo camera workflow and sheet dispatch. Reuse camera lifecycle work for dashboard capture where appropriate. |
| Old Scratch detail · 49:1165 | /car/scratch-detail | removed | Remove route and damage-specific state/navigation. |
| Old Belt squeal trend · 49:1232 | /car/belt-squeal-trend | removed | Remove route, belt chart and related report links. |

Remove obsolete route metadata and demo shortcuts too. Retain source/reference exports as historical evidence unless later cleanup is requested.

## Components and motion — next checkpoint

Live Components frame: [27:2](https://www.figma.com/design/YQotwkLvWP68ht9GzTbpf0?node-id=27-2). Motion frame: [185:1715](https://www.figma.com/design/YQotwkLvWP68ht9GzTbpf0?node-id=185-1715). See [Motion screenshot](catch-up-motion-figma.png).

| Component | Existing implementation | Required change |
| --- | --- | --- |
| Button | 390 × 56 maximum, five styles; ordinary HTML button | Add State=Pressed; Framer Motion whileTap darkened fill and scale 0.98 over 120 ms. Gallery shows both states. |
| TabBar | 260 × 66, four tabs | Size already matches. Recheck assets and in-screen placement; preserve component. |
| IconButton | 40 × 40, Back/Close/Share, Light/Dark | Size already matches. Correct legacy per-screen offsets rather than replacing the component. |
| Input / Option | Existing states and toggling | Recheck current source text/geometry; reuse. |
| BrandMark / illustrations | Original exported local SVG assets | Reuse matching assets. Any revised asset must be downloaded from Figma, not redrawn. |
| PageTransition / AppFrame | Shared easing, route metadata, safe areas, 34 px pinned actions | Preserve; extend route metadata for new states/sheets/loading cards. |
| LoadingDots | No reusable component | Three dots, 0.28 s per step, Light/Dark. |
| ProgressBar | Static onboarding bar | Fill over 2.2 s. |
| LiveDot | Static dots | Green/red halo, 1.1 s cycle. |
| ScanRing | Static masks/arcs | Progress-driven reusable ring. |
| Countdown | None | Seconds-driven ring and number, 1 s steps. |
| AlarmFlash | Static red alarm | White overlay opacity 0–18%. |
| Waveform | Static engine artwork | Actual AnalyserNode microphone level during start-up recording; Figma loop fallback. |
| ScanLine | None | Viewfinder sweep over 1.6 s. |
| TapDot | None | Tap-test-driven appearance, hold and fade. |

All motion follows the shared easing. Reduced motion replaces movement with simple fades without changing countdowns, tap timing or sensor collection.

Pressed fills read from Figma, in style order: Primary `#101C38`, Secondary `#F2F3F5`, Light `#E9ECF2`, Outline `#F2F3F5`, Drive `#0C1424`. Retrieve their component design context again for implementation; do not substitute guessed colours.

## Navigation and behaviour that need updating

- Home → Before you drive → Face reading → Tap test → loading → result variant → Pick your route → Mount → Line up → Quick eye check → Driving.
- The live prototype confirms result buttons labelled **Mount my phone** navigate to **Pick your route**, whose **Use this route** action navigates to **Mount**. Preserve that setup sequence while arranging the requested maps hand-off; do not launch maps in a way that skips setup.
- O10 → Emergency contact → Allow access → Face scan intro. Back follows that sequence.
- T3’s main action → Before you drive.
- C2 capture → C2b → success/failure; C4 report action → C4a → report/failure. Loading cards remain at least 1 s.
- Component press/variant links in Figma are component state changes, not app routes. Motion loops likewise are not navigation.
- 08 → 08b → 08c is driven by driver response and countdown logic. Never send an emergency request before countdown completion; cancellation stops escalation; retries must not duplicate texts.
- 08d is demo-only even though P6’s prototype test button points there. The real P6 test calls the test-message endpoint; its preview belongs in the hidden demo panel.
- Reuse the tested eye-watch worker, alarm latch, calibration, camera cleanup, offline assets, voice prompts and wake lock. Add readiness aggregation, passenger mode, live speed and braking rather than rebuilding the engine.
- Current GPS only supplies movement gating/debug speed. Add numeric speed and trip positions, 10 s trip-point batches and 30 s active-emergency location uploads.
- Current worker has one-face blendshapes and fit flags, but no head-drop signal. The revised core brief requires head-drop watch; assess the necessary local signal during the driving-logic step.
- Voice acknowledgement is listening, distinct from current speech-synthesis prompts. Enable only during 08/08b when supported; keep tap acknowledgement available. Verify permission/privacy wording against actual browser behaviour before claiming audio stays on-device.
- Passenger mode stops camera/face processing and all alarms, including escalation; location/braking can continue.
- New contact, battery-age, readiness and route-choice fields require typed state and API contracts.

## Backend dependency before 4c

The repository currently contains **only `backend/README.md` and `ml/README.md`**. There is no FastAPI app, `schema.sql`, initial migrations, backend tests, or `apps/web/src/api.ts`. Thus **Prompt 4 has not been implemented**, and 4c cannot truthfully be an in-place migration of an existing backend.

After the 4b checkpoints, establish the Prompt 4 backend/schema baseline before applying 4c’s `002_update.sql`. Keep the initial schema and migration separate. This gap does not prevent components/motion work or Figma-default screen previews.

4c must use mocked Twilio, OSRM and Overpass in tests and run the complete fake trip. No real emergency texts are authorised by a fake-trip run.

The trip safety score is explicitly a **demo rule, not a model**:

```text
max(0, 100 - 15 × microsleeps - 5 × tired alerts
           - 4 × hard brakes - 10 × high-risk-check-and-drove-anyway)
```

Document that distinction in the backend calculation comment and user-facing explanations where a score is described. “Safer” routes refer to nearby rest areas, fuel and workshops; do not claim a lower predicted risk.

## Evidence and limits

[Machine-readable live inventory](catch-up-figma-inventory.json) records all 65 screen IDs, current text, top-level layout and prototype reactions. The five section inventories and the Parked/Motion inventories were retrieved with Figma get_metadata; bounded read-only Plugin API calls supplied the copy/reactions. No Figma design was changed.

Existing source and visual-review evidence live under `apps/web/design`, `docs/review` and `apps/web/public/review`. Prior screenshots are a baseline, not proof that revised screens match. Every new/changed screen still needs current get_design_context and get_screenshot, then browser comparison during implementation.

No dependency installation, app-code edits, backend changes, route deletions, commits or staging were performed during this audit.
