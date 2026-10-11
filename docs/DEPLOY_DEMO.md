# Deploy BUCKL for the hackathon

This project deploys as one Render web service. Render builds the Vite UI and serves it through the FastAPI service, so the UI and `/api` share one HTTPS URL.

## Before deploying

1. Create a Supabase project.
2. In its SQL Editor, run `backend/schema.sql`, then `backend/migrations/002_update.sql`.
3. Obtain the project URL and its **publishable** key. Do not use a secret or service-role key.

## Render

1. Push the branch containing `render.yaml` (in the repository root) to GitHub.
2. In Render, choose **New** then **Blueprint** and select the repository.
3. Render detects `render.yaml`; create the `buckl-demo` service.
4. Enter these values when prompted:
   - `SUPABASE_URL`: your `https://<project-ref>.supabase.co` URL.
   - `SUPABASE_PUBLISHABLE_KEY`: your `sb_publishable_...` key.
5. Deploy. `/health` should return `{"status":"ok","supabase_configured":true}`.

The live app is the service URL. Sign up, add a car and emergency contact, then demonstrate the pre-drive check, drive watch and car checks.

## No accounts needed: standalone demo

For a stage demo you do not need Supabase or Twilio at all. Set the environment variable `BUCKL_MODE=standalone` on the Render service, with the Supabase and Twilio variables **empty** (it refuses to start otherwise). The server then answers sign-in itself, keeps data in memory, rebuilds a ready-made demo account on every start, **signs the app in as that account automatically**, and **simulates** emergency texts (printed in the log, never sent). Anyone who can open the address gets that demo account, so it is for demonstrations only: keep real data out and shut it down afterwards. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Demo mode and demo data

- `render.yaml` sets **`DEMO_MODE=1`**. With it, the hidden demo panel (triple-tap the logo) can choose what the next dashboard scan and start-up check return, and every such result is labelled a demo. Remove it, or set it to `0`, for anything that is not a presentation: a dashboard photo then finds nothing.
- To fill a demo account with a car, a contact and six weeks of trips, run `python -m backend.scripts.seed_demo --email ... --password ...` after signing up in the app. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the full run-of-show and checklist.

## Demo boundaries

- The dashboard result is an explicitly labelled demo indication until a trained model is connected. The start-up battery check times the engine crank on the phone and is not a demo result, though its 2-second threshold is untested on real cars.
- Do not configure Twilio or send real emergency messages during the presentation unless you have an explicit test recipient.

## After deploying

- Open `<service url>/health`. It should report `supabase_configured: true`.
- Open `<service url>/docs` for the live API reference.
- Run through the four moments in order: onboarding, pre-drive check, a short drive with the eye watch, and a car check. The hidden demo panel (triple-tap the logo) has shortcuts for states that are hard to trigger on stage, such as the alarm and the late-drive heads-up.
- The face model and voice files are cached after the first load, so a second visit works offline.
