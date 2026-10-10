# Dormathon

A phone-on-the-dashboard co-pilot for drivers in Malaysia. The front camera watches the driver's eyes and warns before and during microsleep. When parked, the phone checks the car through a photo walk-around and short engine recordings. Hackathon: Track 1, "Predict Early, Decide Better". 24 hours, 4 people.

This is the shared project brief for Codex. In later build-guide prompts, read references to `CLAUDE.md` as `AGENTS.md` and references to Claude Code as Codex. Run each prompt from this repository root in a fresh Codex session. Implement only the requested step; when a prompt says to stop and show the result, stop at that checkpoint.

## MVP features (build these)

1. Live eye watch: MediaPipe Face Landmarker in the browser. States: alert, getting tired, microsleep alarm, can't see your eyes.
2. Drowsy-soon prediction: every 30 s the phone sends eye features (never video) to the backend, which returns a risk score. Late-drive warning before a trip (screen T3).
3. Lock while moving: above 10 km/h the screen shows only big controls and voice prompts.
4. Maps hand-off: open Waze or Google Maps with a rest stop as the destination.
5. Car check: photo damage detection (YOLOv8), start-up battery check (cranking time), engine sound trend.
6. Trips history with the time-of-day pattern.

## Not in the MVP (do not build)

Group or convoy features, tailgating detection, engine temperature, seizure detection, native iOS or Android builds.

## Stack

- apps/web: React + Vite + TypeScript, Tailwind CSS, React Router, Framer Motion. Mobile-first web app opened in the phone browser.
- backend: FastAPI (Python 3.11), deployed to Render or Google Cloud Run.
- Database, auth, photo storage: Supabase.
- ml: Jupyter or Colab notebooks plus saved models (joblib, YOLO .pt).

## Design

- Figma file key: YQotwkLvWP68ht9GzTbpf0. Always read designs through the Figma MCP. The design is the source of truth.
- Screens are 430 x 932. Font: Inter. Brand navy #1B2A4E. Light screens use #FCFCFE backgrounds and white cards with a #E8EAED border. Drive screens are dark (#0B1220 background, #141E30 cards, #3BC48D accent).
- States: success #239A6C, warning #B86E00 with dot #E8A317, danger #EF4F44.
- Transitions are iOS-style: push left/right for forward/back, bottom sheets slide up, drive states cross-fade. One easing everywhere: cubic-bezier(0.32, 0.72, 0, 1). No bounce.

## Rules

- Camera frames never leave the phone. Only numbers (eye features, events) go to the backend.
- Everything safety-related works offline: alarm, voice prompts, eye watch.
- Every demo shortcut sits behind a hidden demo panel (triple-tap the logo), never on the real UI.
- Keep components small and named after the Figma components.
- Plain, short UI copy in British English, matching the Figma text exactly.
- Ask before adding a new dependency.

## Folders

- apps/web: browser app.
- backend: API, database schema and server-side model inference.
- ml: training notebooks and saved models.
- docs: shared project documentation.
