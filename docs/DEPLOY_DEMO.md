# Deploy BUCKL for the hackathon

BUCKL deploys as **one Render web service**. Render builds the Vite web app and serves it through the FastAPI service, so the app and `/api` share one HTTPS address.

There are two ways to deploy it:

| | Standalone demo (`render.yaml`, the default) | Real deployment (`render.supabase.yaml`) |
|---|---|---|
| Accounts | Built in. The app signs itself in as a demo driver | Supabase |
| Data | In memory. Resets when the service restarts or sleeps | Saved in Supabase |
| Emergency texts | Simulated (printed in the log) | Twilio |
| Setup | Nothing to configure | Supabase project, keys, optional Twilio |
| Use for | A presentation | Real use |

## Quick start: the standalone demo on Render

1. Push the branch to GitHub (it is already on `codex/drivesafe-foundation`).
2. In Render choose **New**, then **Blueprint**, connect the repository and pick the branch `codex/drivesafe-foundation`. Render finds `render.yaml` and proposes a free web service called `buckl-demo`.
3. Click **Apply**. The first build takes several minutes because it builds the web app and the API image.
4. Open the service address when the deploy is live. Check `<address>/health`: it should say `"standalone": true` and `"demo_mode": true`.
5. Open the address on the demo phone. **The app signs itself in**, so you land on Home with a car, a contact and six weeks of trips already there.

Things to know:

- **Free services sleep** after a quiet period and take a minute to wake. Open the address a few minutes before you present, and again just before, and keep it open.
- **Data resets** whenever the service restarts or wakes. The demo account is rebuilt each time. Anything you sign up as in the app disappears.
- **Texts are simulated.** In the Render **Logs** tab you will see lines like `[simulated SMS to +60123456789] ...`. Nothing is sent.
- **Do not add Supabase or Twilio settings** to this service. The standalone server refuses to start if they are present.
- **Anyone with the address can use the demo account.** There is nothing real behind it, but keep real data out, and **suspend or delete the service** after the presentation.
- The service needs camera, microphone and location in the phone's browser. Render serves HTTPS, which browsers require for those.

To change something later, push to the branch. Render rebuilds automatically.

## Real deployment with Supabase

Use this only if you want real accounts. In Render choose **New**, then **Blueprint**, and set the Blueprint file to `render.supabase.yaml`.

## Before deploying

1. Create a Supabase project.
2. In its SQL Editor, run `backend/schema.sql`, then `backend/migrations/002_update.sql`.
3. Obtain the project URL and its **publishable** key. Do not use a secret or service-role key.

## Render

1. Push the branch containing `render.supabase.yaml` (in the repository root) to GitHub.
2. In Render, choose **New** then **Blueprint** and select the repository.
3. Render reads `render.supabase.yaml`; create the `buckl` service.
4. Enter these values when prompted:
   - `SUPABASE_URL`: your `https://<project-ref>.supabase.co` URL.
   - `SUPABASE_PUBLISHABLE_KEY`: your `sb_publishable_...` key.
5. Deploy. `/health` should return `{"status":"ok","supabase_configured":true}`.

The live app is the service URL. Sign up, add a car and emergency contact, then demonstrate the pre-drive check, drive watch and car checks.

## Demo mode and demo data

- The standalone demo always runs in demo mode, and `render.supabase.yaml` sets **`DEMO_MODE=1`** for the real deployment. With it, the hidden demo panel (triple-tap the logo) can choose what the next dashboard scan and start-up check return, and every such result is labelled a demo. Remove it, or set it to `0`, for anything that is not a presentation: a dashboard photo then finds nothing.
- To fill a demo account with a car, a contact and six weeks of trips, run `python -m backend.scripts.seed_demo --email ... --password ...` after signing up in the app. See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the full run-of-show and checklist.

## Demo boundaries

- The dashboard result is an explicitly labelled demo indication until a trained model is connected. The start-up battery check times the engine crank on the phone and is not a demo result, though its 2-second threshold is untested on real cars.
- Do not configure Twilio or send real emergency messages during the presentation unless you have an explicit test recipient.

## After deploying

- Open `<service url>/health`. It should report `supabase_configured: true`.
- Open `<service url>/docs` for the live API reference.
- Run through the four moments in order: onboarding, pre-drive check, a short drive with the eye watch, and a car check. The hidden demo panel (triple-tap the logo) has shortcuts for states that are hard to trigger on stage, such as the alarm and the late-drive heads-up.
- The face model and voice files are cached after the first load, so a second visit works offline.
