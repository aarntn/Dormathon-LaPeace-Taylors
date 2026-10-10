"""DriveSafe MVP backend API.

This server intentionally uses only Python's standard library so the prototype
can be run on a new machine without installing packages. It persists demo data
to data/db.json. Replace this storage layer with Firebase or PostgreSQL before
production.
"""

from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import json
import math
import os
import uuid
from datetime import datetime, timezone


ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data" / "db.json"


def now():
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def load_db():
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        return {"users": {}, "contacts": {}, "trips": {}, "events": {}, "scans": {}}
    with DATA_FILE.open(encoding="utf-8") as file:
        return json.load(file)


def save_db(db):
    temporary = DATA_FILE.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as file:
        json.dump(db, file, indent=2)
    os.replace(temporary, DATA_FILE)


def distance_km(lat1, lng1, lat2, lng2):
    radius = 6371
    d_lat, d_lng = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


class DriveSafeHandler(BaseHTTPRequestHandler):
    server_version = "DriveSafeAPI/0.1"

    def log_message(self, format, *args):
        print(f"[{now()}] {format % args}")

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
            return json.loads(self.rfile.read(size) or "{}")
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "Request body must be valid JSON."}, HTTPStatus.BAD_REQUEST)
            return None

    def not_found(self):
        self.send_json({"error": "Route not found."}, HTTPStatus.NOT_FOUND)

    def do_OPTIONS(self):
        self.send_json({}, HTTPStatus.NO_CONTENT)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        db = load_db()

        if path == "/health":
            return self.send_json({"status": "ok", "service": "drivesafe-api", "time": now()})

        parts = path.split("/")
        if len(parts) == 4 and parts[:3] == ["", "api", "trips"]:
            trip = db["trips"].get(parts[3])
            return self.send_json(trip) if trip else self.not_found()

        if len(parts) == 5 and parts[:3] == ["", "api", "trips"] and parts[4] == "report":
            trip = db["trips"].get(parts[3])
            if not trip:
                return self.not_found()
            events = [event for event in db["events"].values() if event["tripId"] == trip["id"]]
            counts = {}
            for event in events:
                counts[event["type"]] = counts.get(event["type"], 0) + 1
            safety_score = max(0, 100 - 8 * counts.get("harsh_braking", 0) - 15 * counts.get("possible_microsleep", 0) - 25 * counts.get("unresponsive", 0))
            return self.send_json({"trip": trip, "eventCounts": counts, "safetyScore": safety_score, "recommendation": "Take a break before your next trip." if counts.get("possible_microsleep") else "Good trip. Keep a safe following distance."})

        if path == "/api/workshops":
            query = parse_qs(parsed.query)
            try:
                lat, lng = float(query["lat"][0]), float(query["lng"][0])
            except (KeyError, ValueError, IndexError):
                return self.send_json({"error": "lat and lng query parameters are required."}, HTTPStatus.BAD_REQUEST)
            workshops = [
                {"name": "DriveSafe Auto Care", "type": "General repair", "latitude": lat + 0.006, "longitude": lng + 0.004, "phone": "+60 3-5555 0101"},
                {"name": "Battery Express", "type": "Battery service", "latitude": lat - 0.009, "longitude": lng + 0.003, "phone": "+60 3-5555 0102"},
                {"name": "Brake & Tyre Centre", "type": "Brake and tyre service", "latitude": lat + 0.012, "longitude": lng - 0.007, "phone": "+60 3-5555 0103"},
            ]
            for workshop in workshops:
                workshop["distanceKm"] = round(distance_km(lat, lng, workshop["latitude"], workshop["longitude"]), 1)
            workshops.sort(key=lambda item: item["distanceKm"])
            return self.send_json({"workshops": workshops, "note": "Demo results. Connect Google Maps Places before release."})

        self.not_found()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = self.read_json()
        if body is None:
            return
        db = load_db()
        parts = path.split("/")

        if path == "/api/users":
            if not body.get("name"):
                return self.send_json({"error": "name is required."}, HTTPStatus.BAD_REQUEST)
            user_id = new_id("usr")
            user = {"id": user_id, "name": body["name"], "email": body.get("email"), "vehicle": body.get("vehicle"), "createdAt": now()}
            db["users"][user_id] = user
            save_db(db)
            return self.send_json(user, HTTPStatus.CREATED)

        if len(parts) == 5 and parts[:3] == ["", "api", "users"] and parts[4] == "emergency-contacts":
            user_id = parts[3]
            if user_id not in db["users"] or not body.get("name") or not body.get("phone"):
                return self.send_json({"error": "Existing user, contact name, and phone are required."}, HTTPStatus.BAD_REQUEST)
            contact_id = new_id("contact")
            contact = {"id": contact_id, "userId": user_id, "name": body["name"], "phone": body["phone"], "relationship": body.get("relationship", "Emergency contact"), "createdAt": now()}
            db["contacts"][contact_id] = contact
            save_db(db)
            return self.send_json(contact, HTTPStatus.CREATED)

        if path == "/api/trips":
            if not body.get("userId"):
                return self.send_json({"error": "userId is required."}, HTTPStatus.BAD_REQUEST)
            trip_id = new_id("trip")
            trip = {"id": trip_id, "userId": body["userId"], "status": "active", "startedAt": now(), "startLocation": body.get("location"), "lastSpeedKph": 0, "harshBrakingCount": 0, "events": []}
            db["trips"][trip_id] = trip
            save_db(db)
            return self.send_json(trip, HTTPStatus.CREATED)

        if len(parts) == 5 and parts[:3] == ["", "api", "trips"] and parts[4] == "telemetry":
            trip = db["trips"].get(parts[3])
            if not trip or trip["status"] != "active":
                return self.send_json({"error": "An active trip is required."}, HTTPStatus.BAD_REQUEST)
            speed = float(body.get("speedKph", 0))
            acceleration = abs(float(body.get("accelerationMps2", 0)))
            speed_drop = max(0, trip.get("lastSpeedKph", 0) - speed)
            event = None
            if speed_drop >= 15 and acceleration >= 2.5:
                event = self.create_event(db, trip, "harsh_braking", "medium", body.get("location"), {"speedDropKph": speed_drop, "accelerationMps2": acceleration})
                trip["harshBrakingCount"] += 1
            trip["lastSpeedKph"] = speed
            trip["lastLocation"] = body.get("location", trip.get("lastLocation"))
            trip["screenControlsLocked"] = speed > 10
            save_db(db)
            return self.send_json({"speedKph": speed, "screenControlsLocked": speed > 10, "event": event})

        if len(parts) == 5 and parts[:3] == ["", "api", "trips"] and parts[4] == "events":
            trip = db["trips"].get(parts[3])
            if not trip or not body.get("type"):
                return self.send_json({"error": "Existing trip and event type are required."}, HTTPStatus.BAD_REQUEST)
            event = self.create_event(db, trip, body["type"], body.get("severity", "medium"), body.get("location", trip.get("lastLocation")), body.get("metadata", {}))
            save_db(db)
            return self.send_json(event, HTTPStatus.CREATED)

        if len(parts) == 5 and parts[:3] == ["", "api", "trips"] and parts[4] == "emergency-alert":
            trip = db["trips"].get(parts[3])
            if not trip:
                return self.not_found()
            event = self.create_event(db, trip, "unresponsive", "high", body.get("location", trip.get("lastLocation")), {"responseWindowSeconds": body.get("responseWindowSeconds", 20)})
            contacts = [contact for contact in db["contacts"].values() if contact["userId"] == trip["userId"]]
            event["alertStatus"] = "awaiting_driver_response"
            event["contactsToNotify"] = contacts
            save_db(db)
            return self.send_json({"event": event, "message": "Start alarm and countdown on the phone. Notify contacts only if the driver does not respond."}, HTTPStatus.CREATED)

        if len(parts) == 5 and parts[:3] == ["", "api", "events"] and parts[4] == "acknowledge":
            event = db["events"].get(parts[3])
            if not event:
                return self.not_found()
            event["alertStatus"] = "driver_confirmed_safe"
            event["acknowledgedAt"] = now()
            save_db(db)
            return self.send_json(event)

        if path == "/api/vehicle-scans":
            warning = body.get("warningType", "unknown")
            guidance = {
                "engine_overheating": ("high", "Possible engine overheating. Stop safely, let the engine cool, and seek professional help."),
                "battery": ("medium", "Possible battery or charging-system issue. Arrange a battery inspection soon."),
                "brakes": ("high", "Possible brake warning. Stop safely and have the brakes inspected urgently."),
                "oil": ("high", "Possible low oil pressure. Stop safely and arrange urgent inspection."),
            }.get(warning, ("low", "We could not identify this warning. Refer to the vehicle manual or consult a workshop."))
            scan_id = new_id("scan")
            scan = {"id": scan_id, "userId": body.get("userId"), "warningType": warning, "urgency": guidance[0], "message": guidance[1], "imageUrl": body.get("imageUrl"), "createdAt": now()}
            db["scans"][scan_id] = scan
            save_db(db)
            return self.send_json(scan, HTTPStatus.CREATED)

        self.not_found()

    def create_event(self, db, trip, event_type, severity, location, metadata):
        event_id = new_id("event")
        event = {"id": event_id, "tripId": trip["id"], "type": event_type, "severity": severity, "location": location, "metadata": metadata, "createdAt": now()}
        db["events"][event_id] = event
        trip["events"].append(event_id)
        return event


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"DriveSafe API running at http://localhost:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), DriveSafeHandler).serve_forever()
