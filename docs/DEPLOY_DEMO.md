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

## Demo boundaries

- The dashboard and start-up models are explicitly labelled demo indications until trained models are connected.
- Do not configure Twilio or send real emergency messages during the presentation unless you have an explicit test recipient.

## After deploying

- Open `<service url>/health`. It should report `supabase_configured: true`.
- Open `<service url>/docs` for the live API reference.
- Run through the four moments in order: onboarding, pre-drive check, a short drive with the eye watch, and a car check. The hidden demo panel (triple-tap the logo) has shortcuts for states that are hard to trigger on stage, such as the alarm and the late-drive heads-up.
- The face model and voice files are cached after the first load, so a second visit works offline.
