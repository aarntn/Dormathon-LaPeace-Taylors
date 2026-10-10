from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.demo_seed import HARD_STOPS_BY_WEEK_AGE, PLANS, seed
from backend.app.main import create_app
from backend.app.repository import MemoryRepository
from backend.scripts import seed_demo

NOW = datetime(2026, 10, 11, 5, 30, tzinfo=timezone.utc)  # 1:30 pm in Malaysia


def seeded():
    owner, store = str(uuid4()), MemoryRepository()
    counts = seed(store, owner, NOW, 'Aaron')

    def upstream(request):
        ok = request.url.path == '/auth/v1/user'
        return httpx.Response(200, json={'id': owner}) if ok else httpx.Response(404)

    app = create_app(settings=Settings(supabase_url='https://t.supabase.co', supabase_key='k'), store=store,
                     http=httpx.Client(transport=httpx.MockTransport(upstream)), clock=lambda: NOW)
    client = TestClient(app)
    client.headers['Authorization'] = 'Bearer any'
    return client, store, counts, owner


def test_every_trip_is_finished_in_the_past_and_belongs_to_the_account():
    client, store, counts, owner = seeded()
    trips = client.get('/trips').json()
    assert len(trips) == counts['trips'] == len(PLANS)
    assert all(t['ended_at'] and datetime.fromisoformat(t['ended_at']) < NOW and t['user_id'] == owner for t in trips)


def test_hard_stops_climb_week_by_week_into_the_brake_check():
    client, store, counts, owner = seeded()
    car = client.get('/cars').json()[0]['id']
    brakes = client.get(f'/brakes/{car}').json()
    assert brakes['hard_stops_per_week'] == list(reversed(HARD_STOPS_BY_WEEK_AGE))
    assert brakes['urgency'] == 'soon'


def test_the_tired_pattern_is_mostly_late_at_night():
    client, *_ = seeded()
    patterns = client.get('/patterns').json()
    total = sum(slot['tired_alerts'] for slot in patterns['slots'])
    assert total == 11
    assert round(patterns['late_night_share'] * total) == 7


def test_the_car_report_has_a_weak_battery_brakes_and_a_clear_dashboard():
    client, *_ = seeded()
    car = client.get('/cars').json()[0]['id']
    report = client.get(f'/cars/{car}/report').json()
    assert report['startup']['urgency'] == 'soon' and report['startup']['crank_seconds'] == 2.8
    assert report['dashboard']['findings'] == [] and report['dashboard']['urgency'] == 'monitor'
    assert report['brakes']['urgency'] == 'soon'


def test_a_trip_summary_has_a_route_events_and_a_score():
    client, *_ = seeded()
    latest = client.get('/trips').json()[0]
    summary = client.get(f"/trips/{latest['id']}/summary").json()
    assert len(summary['route_polyline']) > 10
    assert any(e['kind'] == 'microsleep' for e in summary['events'])
    assert 0 <= summary['safety_score'] <= 100


def test_it_refuses_an_account_that_already_has_trips_unless_forced():
    store = MemoryRepository()
    seed(store, 'u1', NOW)
    with pytest.raises(RuntimeError):
        seed(store, 'u1', NOW)
    assert seed(store, 'u1', NOW, force=True)['trips'] == len(PLANS)


def test_the_dry_run_writes_nothing_and_needs_no_account(capsys):
    assert seed_demo.main(['--dry-run']) == 0
    assert 'Dry run only' in capsys.readouterr().out
