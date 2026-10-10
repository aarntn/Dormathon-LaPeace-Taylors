from datetime import datetime, timezone
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.main import create_app
from backend.app.repository import MemoryRepository

JPEG = b'\xff\xd8\xff\xd9'
WAV = ('start.wav', b'RIFF\x00\x00\x00\x00WAVE', 'audio/wav')


def make_client(demo_mode):
    owner = str(uuid4())

    def upstream(request):
        if request.url.path == '/auth/v1/user':
            ok = request.headers.get('authorization') == 'Bearer valid'
            return httpx.Response(200 if ok else 401, json={'id': owner} if ok else {})
        raise AssertionError(f'Unexpected external request: {request.url}')

    settings = Settings(supabase_url='https://test.supabase.co', supabase_key='public-test-key', demo_mode=demo_mode)
    app = create_app(settings=settings, store=MemoryRepository(), http=httpx.Client(transport=httpx.MockTransport(upstream)),
                     clock=lambda: datetime(2026, 10, 10, 4, 0, tzinfo=timezone.utc))
    client = TestClient(app)
    client.headers['Authorization'] = 'Bearer valid'
    client.put('/profile', json={'name': 'Aaron'})
    car = client.post('/cars', json={'make': 'Perodua', 'model': 'Myvi', 'year': 2022}).json()
    return client, car['id']


def scan(client, car, scenario=None):
    data = {'car_id': car} | ({'demo_scenario': scenario} if scenario else {})
    return client.post('/car-checks/dashboard', data=data, files={'photo': ('d.jpg', JPEG, 'image/jpeg')})


def test_health_reports_demo_mode():
    assert make_client(True)[0].get('/health').json()['demo_mode'] is True
    assert make_client(False)[0].get('/health').json()['demo_mode'] is False


def test_without_demo_mode_a_dashboard_photo_finds_nothing_and_saves_nothing():
    client, car = make_client(False)
    result = scan(client, car, 'overheating').json()  # a scenario is ignored outside demo mode
    assert result['findings'] == [] and result['stub'] is True
    assert client.get(f'/cars/{car}/report').json()['dashboard'] is None


def test_demo_mode_defaults_to_overheating_and_saves_the_finding():
    client, car = make_client(True)
    result = scan(client, car).json()
    assert result['stub'] is True and result['findings'][0]['urgency'] == 'stop'
    assert 'overheating' in result['findings'][0]['label'].lower()
    assert client.get(f'/cars/{car}/report').json()['dashboard']['findings'][0]['urgency'] == 'stop'


@pytest.mark.parametrize('scenario,urgency', [('battery', 'soon'), ('oil', 'stop')])
def test_demo_scenarios_change_the_finding(scenario, urgency):
    client, car = make_client(True)
    finding = scan(client, car, scenario).json()['findings'][0]
    assert finding['urgency'] == urgency
    assert finding['advice'] and 'demo finding' not in finding['advice']  # the app labels the result a demo itself


def test_unreadable_scenario_returns_no_findings_and_is_not_saved():
    client, car = make_client(True)
    assert scan(client, car, 'unreadable').json()['findings'] == []
    assert client.get(f'/cars/{car}/report').json()['dashboard'] is None


def test_unknown_scenario_is_rejected_in_demo_mode():
    client, car = make_client(True)
    assert scan(client, car, 'made-up').status_code == 422


def start(client, car, **extra):
    return client.post('/car-checks/startup-audio', data={'car_id': car} | extra, files={'audio': WAV})


def test_startup_scenarios_override_the_phone_timing_only_in_demo_mode():
    client, car = make_client(True)
    slow = start(client, car, demo_scenario='slow', crank_seconds='0.5').json()
    assert slow['crank_seconds'] == 2.8 and slow['urgency'] == 'soon' and slow['stub'] is True
    normal = start(client, car, demo_scenario='normal').json()
    assert normal['crank_seconds'] == 1.2 and normal['urgency'] == 'monitor' and normal['stub'] is True
    assert start(client, car, demo_scenario='quiet').status_code == 422
    assert start(client, car, demo_scenario='nope').status_code == 422
    real = make_client(False)
    result = start(real[0], real[1], demo_scenario='slow', crank_seconds='0.9').json()
    assert result['crank_seconds'] == 0.9 and result['stub'] is False
