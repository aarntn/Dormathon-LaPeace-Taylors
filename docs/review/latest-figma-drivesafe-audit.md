# Latest Figma UI audit — DriveSafe branch

Target: `codex/drivesafe-foundation` at `24ca4459c671b426c8216857235d375e01b437fe`. Source: [current BUCKL Figma](https://www.figma.com/design/YQotwkLvWP68ht9GzTbpf0/Dormathon?node-id=0-1), read live through the Figma MCP on 10 October 2026.

The requested update is for `apps/web`. The unrelated `drivesafe-app` Expo app and prototype `server.py` are outside this UI update. Preserve this branch’s FastAPI/Render packaging and useful car integration; do not merge the entire branch into main. Preserve the uncommitted Home fixes in the main workspace and port their reviewed behaviour to the selected branch.

## Approval checkpoint

Fresh visual evidence is now available in [the rendered branch comparison](drivesafe-visual-findings.md). Seven representative current Figma frames were compared side by side with the selected branch's production build, including signed-in fixtures to distinguish missing data from layout differences. All seven need changes. The table below remains a complete source/inventory audit, not a claim that all frames have been pixel checked.

The project’s AGENTS.md states: **“Prompt 4b requires approval of the audit before app code changes.”** This completes that audit for the requested full UI update. No new app-code edits have been made for this request. Existing local Home/report fixes predate this audit. Implementation starts only after the user approves this table.

| Status | Frames |
| --- | ---: |
| New | 9 |
| Changed | 45 |
| Same | 5 |
| Removed / excluded | 6 |
| Total | 65 |

“New” means the required UI/state is missing from the selected branch, including one hidden message demo. “Changed” means existing UI requires current-frame fidelity or flow changes. “Same” means preserve the implementation’s source structure and copy, then verify it with shared-component changes; it is not a fresh pixel approval. Six removed/excluded entries include four Parked legacy screens and two map variants the guide skips. The active sections contain 61 frames, of which two are excluded and one is a hidden demo.

API-fed user names, vehicles, trip values, results, permissions and delivery status remain live values. Figma sample values are allowed in a confirmed unconfigured local preview or explicit hidden demo only. Pending configuration, failed requests and empty authenticated accounts must not silently show successful sample results.

## 1 · Onboarding

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| O1 Splash · 32:273 | /onboarding/splash | same | Retain exported logo, BUCKL wordmark and tagline; confirm shared safe-area layout. |
| O2 Loading · 32:293 | /onboarding/loading | changed | Retain real 2.2 s progress; compare mark/wordmark placement and bar geometry with the current frame. |
| O3 Welcome · 32:315 | /onboarding/welcome | changed | Restore current co-pilot paragraph and exact welcome actions; preserve real authentication behaviour. |
| O4 Sign up · 32:361 | /onboarding/sign-up | changed | Restore default field labels, explanatory copy and footer spacing; keep sign-in/confirmation/error states functional. |
| O5 What’s your car · 33:351 | /onboarding/whats-your-car | same | Retain search and model list; recheck shared input/option bounds. |
| O6 Perodua Myvi sheet · 33:444 | /onboarding/perodua-myvi-sheet | changed | Align sheet height, car/spec layout and footer to the current frame; preserve dismiss/back behaviour. |
| O7 Car details · 33:566 | /onboarding/car-details | same | Retain car details and fields; recheck shared input sizing. |
| O8 Service and condition · 47:1054 | /onboarding/service-and-condition | changed | Match battery-age option layout, wording and fields; retain new battery data. |
| O9 How you drive · 34:424 | /onboarding/how-you-drive | same | Retain habit options and toggling; recheck shared option sizing. |
| O10 Which maps app · 40:932 | /onboarding/which-maps-app | changed | Match maps options and tip card; retain Emergency contact next step. |
| O11 Emergency contact · 144:1466 | /onboarding/emergency-contact | changed | Replace generic notice card with exact contact layout and copy; retain country-code validation. |
| O12 Allow access · 154:1504 | /onboarding/allow-access | changed | Use compact icon permission rows and trailing actions from Figma; retain actual supported permission states. |
| O13 Face scan intro · 34:477 | /onboarding/face-scan-intro | changed | Restore exact illustration, tips and copy around the real face-calibration entry. |
| O14 Face scan · 34:547 | /onboarding/face-scan | changed | Match dark scan layout and checks; bind progress to valid local observations, never a completion timer. |
| O15 All set · 34:608 | /onboarding/all-set | changed | Restore summary card copy/spacing and calibrated blink value; keep save errors and duplicate-safe setup. |

## 2 · Drive watch

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| 01 Home · 28:2 | /drive/home | changed | Carry over verified local Home layout/assets/copy; preserve this branch’s car API integration and account isolation. |
| 01a Before you drive · 140:1323 | /drive/before-you-drive | changed | Match all four question groups and exact labels, note card and footer while retaining typed answers. |
| 01a2 Face reading · 175:1703 | /drive/face-reading | changed | Match camera/ring/check rows and 15 s copy; keep face observations local and progress valid. |
| 01b Tap test · 140:1370 | /drive/tap-test | changed | Match dot area, timer, feedback and statistics; retain real reaction timing and early/missed-tap handling. |
| 01b2 Working out your result · 185:2235 | /drive/working-out-your-result | changed | Render loading card over the tap screen rather than a standalone generic page; keep minimum 1 s/error recovery. |
| 01c Check result · 140:1405 | /drive/check-result?level=caution | changed | Restore caution evidence rows and plan card, both actions and disclaimer; values come from the result. |
| 01c Good to go · 153:1455 | /drive/check-result?level=safe | changed | Match Safe to drive variant rows, plan and disclaimer; retain actual result values. |
| 01c Please don’t drive yet · 153:1500 | /drive/check-result?level=high | changed | Match High risk variant, Get a ride instead, reminder and quiet Drive anyway; retain safety disclosure. |
| 01d Pick your route · 163:1620 | /drive/pick-your-route | changed | Match route cards, map/route explanation and footer; bind route choice to API and saved map preference. |
| 02 Mount your phone · 38:837 | /drive/mount-your-phone | changed | Match passenger link, mounting callouts and footer; preserve camera-start/privacy logic. |
| 02p Passenger mode · 163:1665 | /drive/passenger-mode | changed | Restore passenger illustration/status/stat layout; no face watching or alarms in passenger mode. |
| 03 Line up your face · 38:906 | /drive/line-up-your-face | changed | Match manual seatbelt row and face guide; retain real seatbelt/camera continuation gate. |
| 04 Quick eye check · 39:849 | /drive/quick-eye-check | changed | Match countdown copy/layout while maintaining valid eye-calibration gates; distinguish a longer observation from a fake success. |
| 05 Driving · 28:176 | /drive/driving | changed | Move live Speed into the three-column stats card; restore lock row, navigation copy and exact spacing. |
| 05a Waze open · still watching · 51:1160 | /drive/waze-open-still-watching | changed | Compare exported Android map preview, BUCKL return action and watching overlay; keep real/demo state separation. |
| 05b Tired while Waze is open · 51:1218 | /drive/tired-while-waze-is-open | changed | Match map warning card, break action and overlay; preserve actual acknowledgement behaviour. |
| 05c Split screen · Waze + Dormathon · 51:1279 | — | removed | Excluded by the build guide; do not implement split-screen view. |
| 05d On iPhone · Maps open · 51:1362 | — | removed | Excluded by the build guide; do not implement this additional map view. |
| 06 Can’t see your eyes · 39:917 | /drive/cant-see-your-eyes | same | Retain camera recovery layout/copy; confirm actual alarm recovery and responsive dimensions. |
| 07 Getting tired · 39:961 | /drive/getting-tired | changed | Match current break advice/card/footer; retain the user-approved warning content even where source layers are hidden. |
| 08 Microsleep alarm · 29:116 | /drive/microsleep-alarm | changed | Match alarm layout, flash and acknowledgement wording; preserve alarm latch and safe escalation. |
| 08b No response · 140:1458 | /drive/no-response | changed | Match alarm/countdown/contact disclosure; keep cancellation and pending/unconfirmed states truthful. |
| 08c Contact alerted · 140:1483 | /drive/contact-alerted | changed | Match confirmed-sent layout/location card; preserve honest pending/failure state and OK resolution. |
| 08d What Mum receives · 153:1555 | Hidden demo panel only | new | Add message-receipt preview only inside the triple-tap demo panel; it must not send an SMS. |
| 09 Trip summary · 29:153 | /drive/trip-summary | changed | Restore route/stat/safety/event card presentation around actual trip data; keep score labelled a demo rule. |

## 3 · Car check

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| C1 Car check · 29:245 | /car/car-check (alias /car) | changed | Add Brake check and current report summary; remove damage/belt copy and fake empty-account findings. |
| C2 Scan a warning light · 142:1423 | /car/scan-a-warning-light | new | Replace walk-around UI with the current dashboard camera sheet and exported viewfinder/ScanLine. |
| C2b Reading the light · 185:2024 | /car/reading-the-light | new | Add loading card over the captured dashboard camera; wait at least 1 s and then use actual result/failure. |
| C3 Warning light result · 142:1483 | /car/warning-light-result | new | Add urgency/result card, explanation and action layout bound to the captured dashboard result. |
| C3b Couldn’t read the light · 155:1517 | /car/couldnt-read-the-light | new | Add unreadable-photo recovery with exact retry and workshop controls. |
| C4 Start-up battery check · 30:280 | /car/engine-sound-check | changed | Match start-up-only recording screen; use existing Waveform with the actual microphone stream, honest time and errors. |
| C4a Checking the sound · 185:2098 | /car/checking-the-sound | new | Add loading card over battery recording; wait at least 1 s and then use actual report/failure. |
| C4b Didn’t hear the engine · 155:1567 | /car/didnt-hear-the-engine | new | Add quiet/failed start-up recovery with exact retry controls; never present a result without usable audio. |
| C5 Car report · 30:368 | /car/car-report | changed | Carry over corrected local battery/brake/dashboard preview; integrate actual report/share data without sample fallbacks. |
| C6 Brake check · 142:1531 | /car/brake-check | new | Add dedicated Brake check screen with recorded hard-stop trend, service advice and workshop action. |
| C7 Workshops near you · 142:1588 | /car/workshops-near-you | new | Add workshop list, service filter, call/directions and user-initiated WhatsApp report sharing. |

## 4 · Profile

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| P1 Profile · 44:934 | /profile/profile (alias /profile) | changed | Restore This month, three statistics, alert summary and complete settings rows while retaining own-account data. |
| P2 Driving stats · 44:1084 | /profile/driving-stats | changed | Restore designed stats cards/charts and copy around actual aggregates; display missing data honestly. |
| P3 My cars · 45:986 | /profile/my-cars | changed | Restore car-card presentation, plate/details/status and footer; use only the signed-in account’s cars. |
| P4 Add a car · 45:1066 | /profile/add-a-car | changed | Match search/popular list/manual-add flow; retain API creation and validation. |
| P5 Privacy and legal · 45:1152 | /profile/privacy-and-legal | changed | Restore exact privacy/safety groups and spacing; maintain truthful local-face/audio/location disclosures. |
| P6 Emergency contact · 155:1692 | /profile/emergency-contact | changed | Match contact fields, preference toggles and test action; retain explicitly initiated test API semantics. |

## Parked · not in MVP

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| Old First check · 49:1089 | /car/first-check | removed | Remove obsolete First check route/UI once dashboard capture replaces it. |
| Old Photo walk-around · 30:201 | /car/photo-walk-around | removed | Remove photo-damage route and eight-photo workflow; reuse camera lifecycle for warning-light capture. |
| Old Scratch detail · 49:1165 | /car/scratch-detail | removed | Remove scratch-detail route and damage-specific links/state from active UI. |
| Old Belt squeal trend · 49:1232 | /car/belt-squeal-trend | removed | Remove belt-trend route and links; replace the active entry with Brake check. |

## 5 · Trips

| Current frame / node | Existing or proposed route | Status | Update |
| --- | --- | --- | --- |
| T1 Trips · 105:1366 | /trips/trips (alias /trips) | changed | Restore month summary, pattern card, weekly grouping, trip status badges and arrows using actual trips. |
| T2 When you get tired · 105:1479 | /trips/when-you-get-tired | changed | Restore chart and advice layout; populate supported data without claiming observations that were not recorded. |
| T3 Late drive heads-up · 105:1545 | /trips/late-drive-heads-up | changed | Match warning layout/copy and buttons; route into the current readiness flow. |
| T1b Trips · no drives yet · 155:1613 | /trips/trips (empty state) | changed | Match empty-state illustration/copy/Start action; keep actual empty accounts free of example trips. |

## Shared components and motion

Retain tokens, font utilities, AppFrame safe areas, 430 px maximum width, 34 px footer clearance, button pressed states and shared transition easing. Recheck Components (27:2) and Motion (185:1715) before adjusting shared geometry. Download changed vector assets from Figma; do not redraw them. Use the existing microphone-driven Waveform, ScanRing, Countdown, LoadingDots, ScanLine and TapDot in the actual screen slots rather than leaving gallery-only motion. Render loading cards over their underlying screen and retain reduced-motion behaviour.

## Execution and verification

Work in an isolated checkout of the selected branch so the main workspace and its local corrections stay intact. Capture fresh design context and screenshot for each changed/new frame before editing. Implement Drive watch, Onboarding, Car check, Trips, then Profile, as the guide specifies. Save current Figma/browser side-by-side evidence for every frame, including each result/loading/failure state, and check mobile widths 430, 390 and 360. Review section checkpoints before moving on.

Run the web unit tests, TypeScript/production build, scoped browser fidelity checks and fake HTTP integration checks. Test camera/microphone cleanup and denied permissions, zero findings and empty trips, account switching during async work, emergency cancellation, reduced motion and stale/missing API data. Supabase configuration/migration and real SMS remain deferred under the user’s existing instructions. No new dependency is planned.

## Evidence

Live page metadata supplied all 65 frame IDs, names, child text and geometry. Current bounded design contexts for Allow access (154:1504), Driving (28:176) and Profile (44:934) confirm concrete layout drift. Branch route tables and source establish the missing car states and legacy routes. The previous audit at docs/review/catch-up-audit.md is historical; this table uses current implementation progress rather than its earlier pre-backend baseline. Full pixel claims require the per-frame browser comparisons during implementation.
