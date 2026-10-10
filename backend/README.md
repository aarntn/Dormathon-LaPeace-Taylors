# BUCKL API

FastAPI service for readiness scoring, trips, emergency texts, maps and car reports. The web app calls it through typed functions in `apps/web/src/api.ts`. For how it fits with the rest of the system, see [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

**Readiness model.** `POST /predrive` scores the check with a logistic regression whose weights are in `app/readiness_model.json`. It was trained in [`ml/readiness`](../ml/readiness/README.md) on simulated drivers, and training and serving share the feature builder in `app/readiness.py`.

[schema.sql](schema.sql) is the baseline schema (readiness `low/raised/high` and finding `severity`). [002_update.sql](migrations/002_update.sql) brings it to the current model. The SQL has **not been applied to a live Supabase project** by the build scripts here, so run [verify_002.sql](migrations/verify_002.sql) after you apply it.

## Database setup

For a **new, empty** Supabase project, run `schema.sql` once in its SQL editor, then `migrations/002_update.sql`. For an existing Prompt 4 database, run only the migration after checking the column types and constraint names match the baseline. Never rerun the baseline over existing tables.

The migration maps `low → safe`, `raised → caution`, and `info → monitor`; adds readiness, passenger, route, GPS, emergency-location and preference fields; and preserves repeated historical alerts/events using distinct legacy keys. It adds an SMS delivery ledger and private dashboard-photo bucket.

RLS covers all application tables. Child policies check parent ownership and linked cars/checks/contacts; insert/update policies include `WITH CHECK`. Anonymous privileges are revoked and authenticated grants are explicit. The backend forwards the verified user's JWT to PostgREST, preserving RLS without a service-role key. See [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

After applying SQL, run [verify_002.sql](migrations/verify_002.sql). Local tests use memory storage and mocked HTTP services; they do not execute SQL against PostgreSQL.

## Run locally

From the repository root, with Python 3.11+:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.txt
Copy-Item backend/.env.example backend/.env
# Fill backend/.env with project configuration.
backend/.venv/Scripts/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --env-file backend/.env
```

Docs: http://127.0.0.1:8000/docs. With Vite running, the same docs are at `https://<your-LAN-address>:5173/api/docs`. Vite proxies `/api` to the loopback backend, and phone requests remain HTTPS. Relative Swagger URLs support either location.

Business endpoints require `Authorization: Bearer <Supabase access token>`. `/docs`, `/openapi.json`, `/redoc` and `/health` are public. Tokens are verified through Supabase `/auth/v1/user`; locally decoded JWT claims are never trusted. See [Supabase token validation](https://supabase.com/docs/reference/python/auth-getuser).

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or legacy anon key), Twilio account/from-number credentials and exact `CORS_ORIGINS`. No service-role key is needed. Missing Supabase configuration returns 503 rather than silently enabling test users/storage. Secrets are excluded from Git and Docker contexts.

Production frontend deployment needs a same-origin `/api` reverse proxy or an explicit HTTPS `baseUrl` for `createApi`; Vite's development proxy does not apply to deployed static files. `Dockerfile` targets Python 3.11; `render.yaml` provides an alternative deployment configuration. Neither deployment has been run. Local verification used Python 3.12.5.

## Routes and contracts

- Setup: `PUT /profile`, `GET/POST /cars`, `GET/POST /emergency-contacts`, `PATCH /emergency-contacts/{id}`.
- Readiness: `POST /predrive` returns `level`, `label`, `reasons`, `plan`, `disclaimer` and the saved ID.
- Trips: `POST/GET /trips`, `PATCH /trips/{id}/end`, `POST /trips/{id}/points`, `/events`, `/features`, `GET /trips/{id}/summary`, `GET /patterns`.
- Emergency: `POST /trips/{id}/emergency`, `POST /emergency/{id}/location`, `/resolve`, `POST /emergency-contacts/{id}/test`.
- Car: multipart `POST /car-checks/dashboard` (`car_id`, `photo`) and `/startup-audio` (`car_id`, `audio`, optional `crank_seconds` between 0.2 and 6, timed on the phone; without it the result is the marked demo result), `GET /brakes/{car_id}`, `/cars/{id}/report`.
- Maps: `GET /workshops?lat=&lng=&service=`, `/rest-stops?lat=&lng=`, `/route-options?from=LAT,LNG&to=LAT,LNG`.

`api.ts` covers every route, retrieves the current token per request and preserves structured errors. Account, readiness, drive and trip screens now consume the API. Car checks, workshops and the report are wired to the API as well. Live verification against real services is still to do.

Public account endpoints are `GET /auth/config`, `POST /auth/signup`, `/auth/token` (password or refresh grant) and `/auth/logout` (requires Bearer). They proxy Supabase Auth using the publishable key and return no-store responses. Email confirmation never invents a session; accounts without a saved car return to onboarding after sign-in.

`GET /geocode?q=` performs an explicit Malaysia destination search, not autocomplete. `GEOCODE_URL` defaults to Nominatim. The public endpoint uses an identified user agent, a five-minute cache and a single-worker limit of one request per second. Configure a different provider before horizontal scaling; follow [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/). Map data © OpenStreetMap contributors.

GPS batches accept up to 500 points with timezone-aware timestamps and speeds in km/h. Duplicate point/event requests are ignored. Flush pending GPS batches before ending a trip; ended trips reject updates. Polylines use `[latitude, longitude]`, sorted by timestamp. Distance sums GPS segments; average speed divides distance by total elapsed time, including stops. GPS accuracy/filtering belongs to the phone hooks. Passenger mode ignores face features/monitoring events, rejects escalation and continues recording GPS/hard brakes.

## Demo rules and model stubs

Pre-drive scoring follows Prompt 5's weights: reaction `.22`, face `.18`, sleep `.14`, self `.10`, awake `.10`, night `.10`, trip `.08`, history `.05`, misses `.03`. The last 20 saved median reactions provide personal pace; first-time pace is 270 ms. Same-hour history uses Malaysia time. Below `.35` is Safe to drive, `.35` through `.60` Caution, above `.60` High risk. The required disclaimer is returned.

Trip safety score is explicitly a **simple demo rule, not a model**:

```text
max(0, 100 - 15 × microsleeps - 5 × tired alerts
           - 4 × hard brakes - 10 × high-risk-check-and-drove-anyway)
```

The summary returns `score_source: "demo_rule"` and an explanation. Passengers do not receive the high-risk driver penalty. Missing pre-drive/drowsy/dashboard/start-up models return marked stubs. Dashboard findings are illustrative until the model exists. Audio bytes are discarded after the request. There is no face-video upload endpoint. Dashboard photos upload only when explicitly supplied; `photo_url` is a private Storage object path requiring an authenticated Storage request to view.

Workshops rank matching service tags before distance and include available phones, opening hours and Waze/Google Maps links. OSRM supplies routes; Overpass counts unique rest areas, fuel stations and repair shops within 1 km of route segments. “Safer” means more roadside support, not a lower predicted risk. Failures return marked stubs/empty results without inventing real workshops. See [OSRM routing](https://project-osrm.org/docs/v5.24.0/api/) and [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL).

## Emergency behaviour

The phone must call `/emergency` **only after its cancellable countdown finishes**; the backend cannot observe that timer. Feature ingestion never triggers texts. Initial texts include driver name, Malaysia-time observation, last-location link and the required 999 wording. Both emergency and contact-test submissions require `Idempotency-Key`. Create and persist one key per countdown episode, reuse it for retries, and use a new key for a later genuine emergency on the same trip. A resolved episode will not reopen on a retry of its original key.

Location texts are at least two minutes apart and obey `share_live_location`. Resolution stops updates before attempting the optional acknowledgement and obeys `text_when_ok`. Successful acknowledgements are idempotent. Contact tests require a stable `Idempotency-Key`, are clearly marked TEST and contain no location.

After a lost initial response, `GET /trips/{id}/emergency?episode_key=` reads known alerts without sending again. If none exist, `POST /trips/{id}/emergency/cancel` with the same `Idempotency-Key` and last position creates resolved cancelled placeholders; a delayed retry of that key cannot create a new alarm. Existing alerts are resolved using the normal acknowledgement flow. Location updates use the GPS observation timestamp and skip stale fixes.

`sent` means Twilio accepted a submission and returned a SID, not proof of handset delivery. Atomic ledger claims prevent concurrent/retried calls sending twice. Definite connection failures/rate limits retry up to three times. Definite failures remain `failed`; the phone can retry the same operation after a delay. There is no autonomous background SMS worker here. Ambiguous timeouts/provider 5xx and interrupted `sending` claims need provider-side reconciliation before resubmission, since blind retries may duplicate an accepted SMS. Inspect Twilio logs/SIDs and repair the ledger status after reconciliation. See [Twilio messages](https://www.twilio.com/docs/messaging/api/message-resource).

## Verification

```powershell
python -m pytest backend/tests -q
python -m backend.scripts.fake_trip
cd apps/web
npm test
npm run build
```

The fake runner requires development dependencies. It starts a temporary loopback server and runs the real `api.ts` HTTP client through readiness, route choices, GPS, two hard brakes, features, a simulated completed countdown, mocked emergency/location/OK texts, a marked contact test, trip summary and workshops. Supabase Auth, Twilio, OSRM and Overpass are mocked; no real SMS is sent. It saves `docs/review/catch-up-4c-fake-trip.json`.

Tests cover every route plus ownership, passenger mode, retry/idempotency, concurrent SMS claims, authentication denial, upload validation, score floors, legacy car checks, location timing, unavailable maps, route proximity and PostgREST pagination/JWT forwarding. SQL still needs a real Supabase migration/RLS check before deployment.
