"""Pre-drive readiness model: feature builder and scorer.

The model is a logistic regression trained in ml/readiness/train_readiness.py.
Its weights live in readiness_model.json, so the API needs no ML libraries.
Training and serving both call `features()` below, so they cannot drift apart.
"""
import json
from math import cos, exp, pi, sin
from pathlib import Path
from statistics import median

ALERT = {'very_alert': 0, 'ok': 1, 'bit_tired': 2, 'very_tired': 3}
TRIP_HOURS = {'under_30': .4, '30_60': .75, '1_2h': 1.5, 'over_2h': 3}
FEATURES = ['slept', 'awake', 'hour_sin', 'hour_cos', 'night', 'alert_self', 'trip_hours', 'reaction_slowing_ms',
            'misses', 'face_perclos', 'face_mean_blink_ms', 'face_yawns', 'history']
MODEL_PATH = Path(__file__).with_name('readiness_model.json')


def features(data, history=0.0, personal_median=270.0):
    """Turn a pre-drive check (object or dict) into the model's feature row."""
    get = data.get if isinstance(data, dict) else (lambda key: getattr(data, key))
    hour = get('hour')
    return {
        'slept': float(get('slept')),
        'awake': float(get('awake')),
        'hour_sin': sin(2*pi*hour/24),
        'hour_cos': cos(2*pi*hour/24),
        'night': float(hour >= 22 or hour < 5),
        'alert_self': float(ALERT[get('alert_self')]),
        'trip_hours': TRIP_HOURS[get('trip_length')],
        'reaction_slowing_ms': float(median(get('taps_ms'))-personal_median),
        'misses': float(min(get('misses'), 3)),
        'face_perclos': float(get('face_perclos')),
        'face_mean_blink_ms': float(min(get('face_mean_blink_ms'), 2000)),
        'face_yawns': float(min(get('face_yawns'), 5)),
        'history': float(history),
    }


def load(path=MODEL_PATH):
    with open(path) as file:
        return json.load(file)


def predict(model, row):
    """Probability of a fatigue episode on this trip, plus each feature's push (in log-odds)."""
    pushes = {name: model['coef'][name]*(row[name]-model['mean'][name])/model['scale'][name] for name in FEATURES}
    logit = model['intercept']+sum(pushes.values())
    return 1/(1+exp(-logit)), pushes
