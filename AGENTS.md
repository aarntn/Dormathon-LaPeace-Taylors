# BUCKL
A co-pilot that checks you're safe to drive, watches for danger on the trip, and helps you act when you or your car show warning signs. The phone sits on the dashboard facing the driver. Built for drivers in Malaysia. Hackathon: Track 1, "Predict Early, Decide Better". 24 hours, 4 people.

## Core moments (the pitch)
1. Readiness check before the drive
2. Live fatigue monitoring during the drive
3. Emergency escalation when the driver stops responding
4. Dashboard scan to the right workshop

## MVP features (build these)
Before the drive
1. Pre-drive check (01a to 01c, T3): four questions (hours slept, hours awake, how alert, trip length), a 15-second face reading (blinks, yawns), a 30-second tap test (reaction time), plus time of day and past trips. Result: Safe to drive, Caution, or High risk, with reasons, a plan and the line "A safety indication, not a medical diagnosis." High risk offers "Get a ride instead".
2. Route choice (01d): safer route (passes rest stops, fuel and workshops) or fastest; opens Waze or Google Maps.
3. Passenger mode (02p): no face watching, no alarms.

During the drive
4. Microsleep and head-drop watch with MediaPipe Face Landmarker in the browser. States: alert, getting tired, microsleep alarm, can't see your eyes. Every alert says what to do, e.g. "Take a 15-minute break at the next safe stop."
5. Driver not responding (08, 08b, 08c): alarm and vibration, then "I'm OK" by tap or voice, then a 10-second countdown, then the backend texts the chosen emergency contact with name, time and live location, updating until resolved.
6. Harsh braking from GPS speed plus the motion sensor; brake check reminder (C6).
7. Locked controls and big buttons above 10 km/h, live speed, Do Not Disturb prompt, seatbelt tick on 03.

After the drive and when parked
8. Trip summary (09): route map, distance, duration, average speed, safety score, trip-risk lines. Trips history and time-of-day pattern (T1, T2).
9. Dashboard scan (C2, C3): photo of a warning light or the temperature gauge, explained in plain words with an urgency: Monitor, Book service soon, or Stop safely now.
10. Start-up battery check (C4): records only while the engine starts; a slow crank may mean a weak battery.
11. Workshops (C7): filtered by the problem (cooling, battery, brakes, tyres, fuel), with Call and Directions, and the car report sent on WhatsApp.

## Not in the MVP (do not build)
Group or convoy features, tailgating, reading engine temperature from sensors, seizure detection or any medical diagnosis, photo damage walk-around, belt squeal trend, speeding and cornering scores, native iOS or Android builds.

## Stack
- apps/web: React + Vite + TypeScript, Tailwind CSS, React Router, Framer Motion. Mobile-first web app opened in the phone browser.
- backend: FastAPI (Python 3.11), deployed to Render or Google Cloud Run.
- Database, auth, photo storage: Supabase. Emergency texts: Twilio SMS. Maps data: OpenStreetMap (Overpass) and OSRM.
- ml: Jupyter or Colab notebooks plus saved models (joblib, YOLO .pt).

## Design
- Figma file key: YQotwkLvWP68ht9GzTbpf0. Always read designs through the Figma MCP. The design is the source of truth. Animated parts live in the "Motion" frame under Components.
- Screens are 430 x 932. Font: Inter. Brand navy #1B2A4E. Light screens use #FCFCFE backgrounds and white cards with a #E8EAED border. Drive screens are dark (#0B1220 background, #141E30 cards, #3BC48D accent).
- States: success #239A6C, warning #B86E00 with dot #E8A317, danger #EF4F44.
- Transitions are iOS-style: push left/right for forward/back, bottom sheets and the camera slide up, drive states and loading cards cross-fade, tabs fade in 0.2 s. One easing everywhere: cubic-bezier(0.32, 0.72, 0, 1). No bounce. Buttons darken while pressed.

## Rules
- Face video is processed on the phone and never stored. Audio is recorded only during the start-up check. A dashboard photo is uploaded only when the user takes it.
- Location goes to the emergency contact only after the countdown ends; it is used for speed and trip summaries otherwise.
- Everything safety-related works offline: alarm, voice prompts, eye watch. The emergency text is the one exception and must retry until sent.
- The emergency countdown can always be cancelled. Never claim to diagnose a medical or vehicle problem; say "possible" or "may".
- Every demo shortcut sits behind a hidden demo panel (triple-tap the logo), never on the real UI.
- Keep components small and named after the Figma components.
- Plain, short UI copy in British English, matching the Figma text exactly. The app is called BUCKL.
- Ask before adding a new dependency.

## Folders
apps/web, backend, ml, docs

## Codex workflow

This is the shared project brief for Codex. In build-guide prompts, read `CLAUDE.md` as `AGENTS.md` and Claude Code as Codex. Run prompts in order from the repository root. Stop at every requested checkpoint; Prompt 4b requires approval of the audit before app code changes.
