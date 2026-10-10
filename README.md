# DriveSafe MVP Backend

This is the first backend layer for the DriveSafe app. It stores users, emergency contacts, active trips, driving-safety events, and dashboard scan results. It uses Python's standard library so it can be demoed without installing packages.

## Run it

```bash
cd /Users/rajakhadeejah/Documents/ChatGPT/Dormathon
python3 server.py
```

The API runs at `http://localhost:8000`. Check it with `GET /health`.

## Core UI-to-API mapping

| UI screen | API |
| --- | --- |
| Onboarding | `POST /api/users`, then `POST /api/users/:userId/emergency-contacts` |
| Drive Watch — Start Drive | `POST /api/trips` |
| Drive Watch — live sensors | `POST /api/trips/:tripId/telemetry` |
| Microsleep/head-drop warning | `POST /api/trips/:tripId/events` with `type: possible_microsleep` |
| Driver does not respond | `POST /api/trips/:tripId/emergency-alert` |
| Driver selects “I’m OK” | `POST /api/events/:eventId/acknowledge` |
| Car Check — dashboard scan | `POST /api/vehicle-scans` |
| Find workshop | `GET /api/workshops?lat=3.139&lng=101.687` |
| Trips / report screen | `GET /api/trips/:tripId/report` |

## Example: create a user

```bash
curl -X POST http://localhost:8000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Aina","email":"aina@example.com"}'
```

## What comes next

This is a local prototype backend. The next production step is to replace `data/db.json` with Firebase Firestore, add Firebase Authentication, use Firebase Cloud Messaging for notifications, and run the emergency-contact message through a verified SMS provider.
