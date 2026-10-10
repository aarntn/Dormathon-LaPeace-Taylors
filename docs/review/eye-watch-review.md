# Prompt 3 eye watch

Entry: `/test-eyes`, or Home → Start drive watch → My phone is mounted.

Implementation: plain TypeScript engine/session, local MediaPipe worker, `useEyeWatch`, shared provider outside route transitions, front camera preview, five-second open-eye calibration and two completed blinks. The saved open/closed midpoint is a number in local storage. A new Drive setup repeats calibration for current lighting.

Tired/lost warnings cross-fade to their existing screens. A microsleep alarm requires confirmed speed above 2.8 m/s across five seconds, or the hidden pretend-moving switch. Null, denied, stale and invalid speed cannot enable it. The alarm remains latched through eye reopening or model/camera failure, until acknowledgement or explicit session stop. Remind me suppresses tired warnings for ten minutes, preserving lost and alarm responses.

Debug and threshold tuning are in the triple-tap logo panel; `/test-eyes` intentionally shows debug. Static Figma routes remain available for design review; `?preview=1` on Mount skips starting the live session. No backend has been added.

Validation covers time-weighted PERCLOS and window expiry, long blinks, yawns, continuous closure, loss/gaps, motion, calibration, numeric features, frozen rAF fallback, measurement-age GPS expiry, overlapping/late wake acquisition, late camera permission, and failure during alarm. Browser review uses a fake camera and then synthetic worker signals. A separate pass boots the actual local GPU model and runs inference on generated blank video, including an offline reload with the production service worker.

Offline: production builds generate a cache manifest for the app, worker, model, module WASM, fonts and recorded voice. The first load needs a connection and must finish caching. Existing sessions use local assets and synthesised Web Audio; offline voice has local WAV fallback. Vite development deliberately does not register the production service worker.

Independent review identified frozen-frame, GPS age, wake acquisition and restart-recovery issues. Each is fixed; ownership regressions demonstrated four failures with the earlier implementation and pass with fixes.

Limitations: generated video and signals do not establish real eye accuracy, phone FPS, sound loudness, vibration support, GPS quality or low-light performance. Browsers may suspend camera/audio when backgrounded; the page must stay visible. Night/car checks require a physical device while parked.


Verification commands: `npm test` (20 passing checks), `npm run build`, `node scripts/browser-review.mjs --drive`, `node scripts/browser-review.mjs --eyes`, and `node scripts/browser-review.mjs --eyes --eyes-cpu`. The CPU pass injects an initialisation failure only in the isolated test server response, then runs the actual CPU model; production worker code contains no test hooks. Run the browser reviews sequentially to avoid contention between headless GPU/camera sessions.

The final review follow-up also caught stale face/movement flags after acknowledging an alarm that experienced a model failure. A regression first failed for `faceVisible=true`, then passed after acknowledgement preserved the failed-session flags. Live Driving shows Watch paused with Restart eye watch, and retains a tired gauge during a reminder rather than reporting Alert.


Final browser pass: all eye-watch checks passed, including repeated alarm activation, failure recovery, denied permission and late camera cleanup. Acknowledgement now distinguishes already-open eyes from an ongoing/unknown closure, covered by a red-to-green regression. The HTTPS development page and local model return 200 with the local certificate trusted. Phone URL: `https://172.20.10.4:5173/test-eyes`. Prompt 3 stops at this checkpoint; Prompt 4 backend work has not begun.
