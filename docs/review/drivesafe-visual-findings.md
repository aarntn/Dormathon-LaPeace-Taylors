# Current Figma versus codex/drivesafe-foundation

The selected branch does **not** match the latest Figma yet. This is a visual check of `apps/web`, built from commit `24ca4459c671b426c8216857235d375e01b437fe`; the remote branch still points to that commit. The separate Expo application was not used for this comparison.

Fresh Figma MCP screenshots were compared with the branch's actual Chromium rendering at 430 × 932 on 10 October 2026. Eleven browser captures cover seven Figma frames, with both unconfigured and signed-in fixture states. These seven frames have all been visually inspected; this is not a claim that every screen has passed a pixel comparison.

[Open the seven side-by-side comparisons](drivesafe-visual-check.html). The left image is current Figma and the right image is the branch build. Select a screen using the links above the images.

| Screen | Confirmed difference | Evidence |
| --- | --- | --- |
| Home · 28:2 | The standalone rounded logo replaces the small BUCKL wordmark. The readiness/check badges and attention card are missing. Heading and button copy are older. Unconfigured account notices also push the car and main action down; signing in removes the notice but does not restore the missing design elements. | [Comparison](drivesafe-compare-home.png), [signed-in Home](drivesafe-current-home-authenticated.png) |
| Driving · 28:176 | The controls status occupies an extra row, moving the gauge and subsequent cards down by about 45 px. Speed is a separate card beneath Waze instead of the third column alongside driving duration and next break. | [Comparison](drivesafe-compare-driving.png) |
| Allow access · 154:1504 | Figma puts five compact icon rows inside one card with trailing actions. The app uses separate large cards and full-width buttons, making microphone and Do Not Disturb require scrolling. The explanatory copy differs. | [Comparison](drivesafe-compare-allow-access.png) |
| Car check · 29:245 | Brake check is absent. The first two checks use different labels, durations and icons. The latest-report section is positioned much higher because the third check is missing. The vehicle illustration is also smaller. | [Comparison](drivesafe-compare-car-check.png) |
| Start-up battery check · 30:280 | The old sound-check wording, 15-second duration and squeal finding remain. The idle screen displays 0:09 and example findings before recording. Source inspection confirms the waveform is a static SVG, although MediaRecorder itself is wired. The Figma screenshot depicts a listening state; its specific elapsed time should not be copied into live data. | [Comparison](drivesafe-compare-engine-sound.png) |
| Trips · 105:1366 | The monthly overview, pattern chart, grouped week cards and alert-status badges are missing. Signed-in trips render as generic date/distance/score cards. | [Comparison](drivesafe-compare-trips.png) |
| Profile · 44:934 | The monthly card has two statistics instead of three, and lacks the alert summary and See stats label. Edit profile, Add a car, Alarm and alerts, and Help and support controls are absent. Car condition metadata is absent. Settings spacing/order differs. | [Comparison](drivesafe-compare-profile.png) |

Names, registration numbers, dates, trip counts, speed and permission states differ legitimately with the active account and device. Those differences were not counted as layout failures. The Figma status bar is a reference device decoration and should not be drawn into the app. Figma's visible Demo links belong in the hidden demo panel, as required by AGENTS.md.

Eight proposed current car routes were also checked against the running router. Scan a warning light, Reading the light, Warning light result, Couldn't read the light, Checking the sound, Didn't hear the engine, Brake check and Workshops near you all fall back to `/components`. Existing source routes provide only parts of the camera/start-up flow; these current screens and states are not implemented as the proposed routes. The hidden emergency message receipt remains an inventory finding rather than a visual route check.

The branch production build passed. Captured pages had no broken image assets, no horizontal overflow at 430 px and no runtime exceptions. These checks used isolated HTTP fixtures through the real sign-in form and did not contact Supabase, Twilio or other external services. No application source was changed, committed or pushed for this check. Existing uncommitted Home/report fixes on main were preserved and were not used as the selected branch's screenshots.

[Machine-readable capture details](drivesafe-visual-verification.json) · [Full screen inventory and source audit](latest-figma-drivesafe-audit.md)
