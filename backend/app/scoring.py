from collections import Counter
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from statistics import median

from . import readiness

MODEL = readiness.load()

LABELS = {'safe': 'Safe to drive', 'caution': 'Caution', 'high': 'High risk'}
URGENCY = {'monitor': 'Monitor', 'soon': 'Book service soon', 'stop': 'Stop safely now'}
DISCLAIMER = 'A safety indication, not a medical diagnosis.'


def timestamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')) if isinstance(value, str) else value


def distance(a, b):
    lat1, lat2 = radians(a['lat']), radians(b['lat'])
    h = sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin(radians(b['lng']-a['lng'])/2)**2
    return 6371 * 2 * asin(min(1, sqrt(h)))


def predrive_score(data, history=0, personal_median=270):
    # Trained readiness model (ml/readiness/train_readiness.py): probability of a
    # fatigue episode on this trip. The component flags below only pick the reasons.
    reaction = max(0, min(1, (median(data.taps_ms)-personal_median)/100))
    face = 1 if data.face_perclos > .15 or data.face_mean_blink_ms > 400 else .5 if data.face_perclos > .075 or data.face_mean_blink_ms > 200 else 0
    face = min(1, face + (.5 if data.face_yawns else 0))
    sleep = 1 if data.slept < 5 else .6 if data.slept < 6 else .3 if data.slept < 7 else 0
    awake = 1 if data.awake >= 16 else .6 if data.awake >= 12 else .2 if data.awake >= 8 else 0
    alert = {'very_alert': 0, 'ok': .2, 'bit_tired': .6, 'very_tired': 1}[data.alert_self]
    trip = {'under_30': 0, '30_60': .3, '1_2h': .6, 'over_2h': 1}[data.trip_length]
    night = int(data.hour >= 22 or data.hour < 5)
    score, _ = readiness.predict(MODEL, readiness.features(data, history, personal_median))
    cuts = MODEL['thresholds']
    level = 'high' if score >= cuts['high'] else 'caution' if score >= cuts['caution'] else 'safe'
    reasons = []
    for condition, reason in [(reaction > .3, 'Your taps were slower than your usual pace.'),
        (face > 0, 'Your face reading showed possible tiredness.'), (sleep > 0, 'You reported less than seven hours of sleep.'),
        (awake >= .6, 'You have been awake for at least twelve hours.'), (alert >= .6, 'You said you feel tired.'),
        (trip >= .6, 'You are planning a longer trip.'), (night, 'This is a late-night or early-morning drive.')]:
        if condition:
            reasons.append(reason)
    if not reasons:
        reasons.append('Your check did not flag a tiredness warning.')
    return {'level': level, 'label': LABELS[level], 'reasons': reasons,
        'plan': {'safe': 'Stay alert and take breaks on your journey.', 'caution': 'Take a 15-minute break before you drive.',
                 'high': 'Get a ride instead. Rest before driving.'}[level],
        'disclaimer': DISCLAIMER, 'score': round(score, 4), 'score_source': 'trained_model', 'model': MODEL['name'], 'stub': False}


def trip_summary(trip, points, events, predrive, now):
    points = sorted(points, key=lambda p: timestamp(p['at']))
    events = sorted(events, key=lambda e: timestamp(e['at']))
    km = sum(distance(a, b) for a, b in zip(points, points[1:]))
    end = timestamp(trip['ended_at']) if trip.get('ended_at') else now
    seconds = max(0, (end-timestamp(trip['started_at'])).total_seconds())
    counts = Counter(e['kind'] for e in events)
    # Simple demo rule, NOT a learned model or a prediction of safety.
    high = bool(predrive and predrive['risk'] == 'high' and not trip['passenger_mode'])
    score = max(0, 100 - 15*counts['microsleep'] - 5*counts['tired'] - 4*counts['hard_brake'] - 10*high)
    lines = [f"{counts['microsleep']} microsleep alarms", f"{counts['tired']} tiredness alerts", f"{counts['hard_brake']} hard brakes"]
    if high:
        lines.append('You drove after a High risk pre-drive check.')
    return {'trip_id': trip['id'], 'passenger_mode': trip['passenger_mode'], 'distance_km': round(km, 3),
        'duration_seconds': round(seconds), 'avg_speed_kmh': round(km*3600/seconds, 2) if seconds else 0,
        'route_polyline': [[p['lat'], p['lng']] for p in points], 'events': events,
        'hard_brake_count': counts['hard_brake'], 'safety_score': score, 'score_source': 'demo_rule',
        'trip_risk_lines': lines, 'score_explanation': 'A simple rule based on recorded events, not a model or a guarantee of safety.'}
