"""Believable demo data for one account, written through the same repository the API uses.

Run it with backend/scripts/seed_demo.py. It creates a car, an emergency contact, twelve completed
trips over six weeks (a rising number of hard stops, late-night tired alerts and one microsleep),
and two car checks, so Trips, Profile, Brake check and the car report all have a story to tell.

The rows are inserted with chosen timestamps, which the public API deliberately does not allow.
Nothing here sends a message or calls an outside service.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

MALAYSIA = timezone(timedelta(hours=8))
# KL to Seremban for the long late drives, a short loop for commutes.
LONG_ROUTE = ((3.1390, 101.6869), (2.7258, 101.9378))
SHORT_ROUTE = ((3.1209, 101.6538), (3.1073, 101.6067))
HARD_STOPS_BY_WEEK_AGE = [6, 5, 4, 3, 3, 2]  # age 0 is this week, so the chart climbs toward today


@dataclass
class TripPlan:
    age: int                # whole weeks ago
    day: int                # days ago at the start of the trip
    start: tuple            # (hour, minute) in Malaysia time
    minutes: int
    km: float
    long: bool = False
    tired: list = field(default_factory=list)       # minutes after the start
    microsleep: list = field(default_factory=list)  # minutes after the start


PLANS = [
    TripPlan(0, 1, (22, 50), 70, 62.0, True, tired=[25, 50], microsleep=[62]),
    TripPlan(0, 3, (8, 5), 25, 14.5),
    TripPlan(1, 8, (0, 20), 60, 58.0, True, tired=[20, 45]),
    TripPlan(1, 10, (17, 50), 30, 12.0, tired=[25]),
    TripPlan(2, 15, (2, 15), 60, 60.0, True, tired=[15, 40]),
    TripPlan(2, 17, (13, 0), 40, 18.0, tired=[20]),
    TripPlan(3, 22, (3, 20), 50, 52.0, True, tired=[10, 35]),
    TripPlan(3, 24, (8, 10), 22, 13.5),
    TripPlan(4, 29, (23, 10), 80, 70.0, True, tired=[30]),
    TripPlan(4, 31, (8, 0), 24, 14.0),
    TripPlan(5, 36, (22, 30), 75, 66.0, True),
    TripPlan(5, 38, (8, 15), 26, 15.0),
]


def start_time(now, plan):
    """The trip's start as a UTC time, on the Malaysian calendar day that was `plan.day` days ago."""
    local_now = now.astimezone(MALAYSIA)
    day = (local_now - timedelta(days=plan.day)).date()
    return datetime(day.year, day.month, day.day, *plan.start, tzinfo=MALAYSIA).astimezone(timezone.utc)


def position(plan, fraction):
    (lat1, lng1), (lat2, lng2) = LONG_ROUTE if plan.long else SHORT_ROUTE
    return round(lat1 + (lat2 - lat1) * fraction, 5), round(lng1 + (lng2 - lng1) * fraction, 5)


def hard_stop_split():
    """How many hard stops each plan gets, so every week adds up to HARD_STOPS_BY_WEEK_AGE."""
    result = {}
    for age, total in enumerate(HARD_STOPS_BY_WEEK_AGE):
        trips = [i for i, plan in enumerate(PLANS) if plan.age == age]
        for n, index in enumerate(trips):
            result[index] = total // len(trips) + (1 if n < total % len(trips) else 0)
    return result


def seed(repo, user_id, now, name='Aaron', force=False):
    """Insert the demo data. Returns counts. Refuses to add to an account that already has trips."""
    if repo.select('trips', user_id=user_id) and not force:
        raise RuntimeError('This account already has trips. Use a fresh account, or pass force to add more.')
    repo.unique('profiles', {'id': user_id, 'name': name}, ['id'])
    car = repo.insert('cars', {'user_id': user_id, 'make': 'Perodua', 'model': 'Myvi', 'year': 2021, 'plate': 'WXY 4821',
                               'colour': 'Granite Grey', 'gearbox': 'Automatic', 'mileage_km': 48200,
                               'last_service_month': 'Mar 2026', 'last_service_km': 45000, 'battery_changed': '1_2y'})
    repo.insert('emergency_contacts', {'user_id': user_id, 'name': 'Mum', 'phone': '+60123456789',
                                       'share_live_location': True, 'text_when_ok': True})
    brakes, counts = hard_stop_split(), {'trips': 0, 'events': 0, 'points': 0}
    for index, plan in enumerate(PLANS):
        started = start_time(now, plan)
        ended = started + timedelta(minutes=plan.minutes)
        events = [(m, 'tired') for m in plan.tired] + [(m, 'microsleep') for m in plan.microsleep]
        stops = brakes[index]
        events += [(round(plan.minutes * (n + 1) / (stops + 1)), 'hard_brake') for n in range(stops)]
        score = max(0, 100 - 15 * len(plan.microsleep) - 5 * len(plan.tired) - 4 * stops)
        trip = repo.insert('trips', {
            'user_id': user_id, 'car_id': car['id'], 'started_at': started.isoformat(), 'ended_at': ended.isoformat(),
            'origin': dict(zip(('lat', 'lng'), position(plan, 0))), 'destination': dict(zip(('lat', 'lng'), position(plan, 1))),
            'distance_km': plan.km, 'avg_speed_kmh': round(plan.km / (plan.minutes / 60), 1), 'safety_score': score,
            'passenger_mode': False, 'route_choice': 'safer' if plan.long else 'fastest'})
        for minutes, kind in events:
            at = started + timedelta(minutes=minutes)
            lat, lng = position(plan, minutes / plan.minutes)
            repo.insert('trip_events', {'trip_id': trip['id'], 'at': at.isoformat(), 'kind': kind, 'lat': lat, 'lng': lng,
                                        'details': {}, 'event_key': at.astimezone(timezone.utc).isoformat() + ':' + kind})
        steps = 18
        average = plan.km / (plan.minutes / 60)
        rows = []
        for n in range(steps + 1):
            lat, lng = position(plan, n / steps)
            rows.append({'trip_id': trip['id'], 'at': (started + timedelta(minutes=plan.minutes * n / steps)).isoformat(),
                         'lat': lat, 'lng': lng, 'speed_kmh': round(average * (0.85 + 0.3 * ((n * 7) % 5) / 4), 1)})
        repo.batch_points(rows)
        counts['trips'] += 1
        counts['events'] += len(events)
        counts['points'] += len(rows)
    # One start-up check that may mean a weak battery, and a dashboard scan with no lights on.
    repo.insert('car_checks', {'car_id': car['id'], 'at': (now - timedelta(days=3)).isoformat(), 'kind': 'startup', 'result': {
        'crank_seconds': 2.8, 'urgency': 'soon', 'urgency_label': 'Book service soon', 'stub': True,
        'verdict': 'Slow start: 2.8 s. This may mean a weak battery. Get it tested at your next service.'}})
    repo.insert('car_checks', {'car_id': car['id'], 'at': (now - timedelta(days=1)).isoformat(), 'kind': 'dashboard', 'result': {'stub': True}})
    return counts | {'car': car['id']}
