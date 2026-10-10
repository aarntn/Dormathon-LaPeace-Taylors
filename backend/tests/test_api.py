from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app
from backend.app.config import Settings
from backend.app.repository import MemoryRepository


class Clock:
    def __init__(self):
        self.value = datetime(2026, 10, 10, 4, 0, tzinfo=timezone.utc)

    def __call__(self):
        return self.value

    def advance(self, seconds):
        self.value += timedelta(seconds=seconds)


@pytest.fixture
def rig():
    owner, stranger = str(uuid4()), str(uuid4())
    clock, store, messages = Clock(), MemoryRepository(), []
    failures = []

    def upstream(request):
        if request.url.path == '/auth/v1/user':
            token = request.headers.get('authorization')
            user = {'Bearer valid': owner, 'Bearer other': stranger}.get(token)
            return httpx.Response(200 if user else 401, json={'id': user} if user else {})
        if 'twilio.com' in request.url.host:
            if failures:
                return httpx.Response(failures.pop(0), json={'message': 'Rate limited'})
            from urllib.parse import parse_qs
            messages.append(parse_qs(request.content.decode()))
            return httpx.Response(201, json={'sid': f'SM{len(messages)}', 'status': 'queued'})
        if 'router.project-osrm.org' in request.url.host:
            return httpx.Response(200, json={'code': 'Ok', 'routes': [
                {'distance': 10000, 'duration': 600, 'geometry': {'coordinates': [[101.6, 3.0], [101.7, 3.0]]}},
                {'distance': 12000, 'duration': 750, 'geometry': {'coordinates': [[101.6, 3.0], [101.6, 3.05], [101.7, 3.0]]}},
            ]})
        if 'overpass' in request.url.host:
            return httpx.Response(200, json={'elements': [
                {'type': 'node', 'id': 1, 'lat': 3.05, 'lon': 101.6, 'tags': {'shop': 'car_repair', 'service:vehicle:brakes': 'yes', 'name': 'Brake shop', 'phone': '+60312345678', 'opening_hours': 'Mo-Su 09:00-18:00'}},
                {'type': 'node', 'id': 2, 'lat': 3.0, 'lon': 101.62, 'tags': {'amenity': 'fuel', 'name': 'Fuel station'}},
                {'type': 'node', 'id': 3, 'lat': 3.05, 'lon': 101.6005, 'tags': {'highway': 'rest_area'}},
            ]})
        raise AssertionError(f'Unexpected external request: {request.url}')

    settings = Settings(supabase_url='https://test.supabase.co', supabase_key='public-test-key',
                        twilio_account_sid='ACtest', twilio_auth_token='test', twilio_from='+15005550006')
    upstream_client = httpx.Client(transport=httpx.MockTransport(upstream))
    app = create_app(settings=settings, store=store, http=upstream_client, clock=clock)
    with TestClient(app) as client:
        client.headers['Authorization'] = 'Bearer valid'
        client.headers['Idempotency-Key'] = 'test-countdown-episode'
        profile = client.put('/profile', json={'name': 'Aaron'}).json()
        car = client.post('/cars', json={'make': 'Perodua', 'model': 'Myvi', 'year': 2022}).json()
        contact = client.post('/emergency-contacts', json={'name': 'Mum', 'phone': '+60123456789'}).json()
        yield {'client': client, 'clock': clock, 'store': store, 'messages': messages,
               'failures': failures, 'car': car, 'contact': contact, 'profile': profile}
    upstream_client.close()


def predrive(client, **overrides):
    body = dict(slept=8, awake=4, taps_ms=[250, 260, 270], misses=0, hour=12,
                alert_self='very_alert', trip_length='under_30', face_perclos=.05,
                face_mean_blink_ms=100, face_yawns=0)
    return client.post('/predrive', json=body | overrides)


def trip(rig, **overrides):
    check = predrive(rig['client']).json()
    return rig['client'].post('/trips', json={'car_id': rig['car']['id'], 'predrive_id': check['id'],
        'origin': {'lat': 3, 'lng': 101.6}, 'destination': {'lat': 3, 'lng': 101.7}} | overrides).json()


def test_full_fake_trip(rig):
    c, clock = rig['client'], rig['clock']
    check = predrive(c).json()
    assert check['level'] == 'safe' and check['label'] == 'Safe to drive'
    assert check['disclaimer'] == 'A safety indication, not a medical diagnosis.'
    t = trip(rig, route_choice='safer')
    clock.advance(600)
    points = [{'at': (clock.value - timedelta(seconds=600-i*300)).isoformat(), 'lat': 3, 'lng': 101.6+i*.01, 'speed_kmh': 30} for i in range(3)]
    assert c.post(f"/trips/{t['id']}/points", json={'points': points}).json()['accepted'] == 3
    assert c.post(f"/trips/{t['id']}/points", json={'points': points}).json()['accepted'] == 0
    for offset in [10, 20]:
        assert c.post(f"/trips/{t['id']}/events", json={'at': (clock.value-timedelta(seconds=offset)).isoformat(), 'kind': 'hard_brake', 'lat': 3, 'lng': 101.61}).status_code == 201
    emergency = c.post(f"/trips/{t['id']}/emergency", json={'lat': 3, 'lng': 101.62}).json()
    alert = emergency['alerts'][0]
    assert alert['status'] == 'sent'
    assert "BUCKL alarm" in rig['messages'][0]['Body'][0] and 'call 999' in rig['messages'][0]['Body'][0]
    assert c.post(f"/trips/{t['id']}/emergency", json={'lat': 3, 'lng': 101.62}).status_code == 200
    assert len(rig['messages']) == 1
    assert c.post(f"/emergency/{alert['id']}/resolve").json()['resolved_at']
    assert c.post(f"/emergency-contacts/{rig['contact']['id']}/test", headers={'Idempotency-Key': 'test-trip-1'}).json()['status'] == 'sent'
    assert 'TEST' in rig['messages'][-1]['Body'][0]
    assert c.patch(f"/trips/{t['id']}/end").status_code == 200
    summary = c.get(f"/trips/{t['id']}/summary").json()
    assert summary['hard_brake_count'] == 2 and summary['safety_score'] == 92
    assert summary['duration_seconds'] == 600 and summary['avg_speed_kmh'] > 0
    assert len(summary['route_polyline']) == 3 and len(summary['events']) == 2
    assert summary['score_source'] == 'demo_rule'


@pytest.mark.parametrize('fields,level', [({}, 'safe'),
    ({'slept': 5.5, 'awake': 14, 'alert_self': 'bit_tired', 'trip_length': 'over_2h'}, 'caution'),
    ({'slept': 3, 'awake': 20, 'alert_self': 'very_tired', 'trip_length': 'over_2h', 'hour': 23,
      'taps_ms': [450, 460, 470], 'misses': 3, 'face_perclos': .4, 'face_mean_blink_ms': 600, 'face_yawns': 2}, 'high')])
def test_predrive_levels(rig, fields, level):
    result = predrive(rig['client'], **fields)
    assert result.status_code == 201 and result.json()['level'] == level
    assert result.json()['score_source'] == 'trained_model' and result.json()['stub'] is False


def test_predrive_uses_trained_model(rig):
    # Slower taps alone raise the learned risk without leaving the Safe band.
    fast = predrive(rig['client']).json()
    slow = predrive(rig['client'], taps_ms=[370, 380, 390]).json()
    assert 0 <= fast['score'] < slow['score'] <= 1 and fast['level'] == 'safe'
    assert slow['model'] == 'buckl-readiness-logistic'


def test_safety_score_high_risk_penalty_and_floor(rig):
    c = rig['client']
    check = predrive(c, slept=3, awake=20, alert_self='very_tired', trip_length='over_2h', hour=23,
                     taps_ms=[470], misses=3, face_perclos=.4, face_mean_blink_ms=600, face_yawns=2).json()
    t = trip(rig, predrive_id=check['id'])
    assert c.get(f"/trips/{t['id']}/summary").json()['safety_score'] == 90
    for i in range(8):
        rig['clock'].advance(1)
        c.post(f"/trips/{t['id']}/events", json={'at': rig['clock'].value.isoformat(), 'kind': 'microsleep'})
    assert c.get(f"/trips/{t['id']}/summary").json()['safety_score'] == 0


def test_auth_ownership_and_validation(rig):
    c = rig['client']; t = trip(rig)
    for token, status in [('bad', 401), ('other', 404)]:
        assert c.get(f"/trips/{t['id']}/summary", headers={'Authorization': f'Bearer {token}'}).status_code == status
    assert c.get('/trips', headers={'Authorization': ''}).status_code == 401
    assert predrive(c, face_perclos=2).status_code == 422
    assert c.post(f"/trips/{t['id']}/points", json={'points': [{'at': '2026-10-11T00:00:00Z', 'lat': 99, 'lng': 0, 'speed_kmh': -1}]}).status_code == 422
    assert c.post('/trips', headers={'Authorization': 'Bearer other'}, json={'car_id': rig['car']['id']}).status_code == 404


def test_passenger_blocks_monitoring_and_emergency(rig):
    c = rig['client']; t = trip(rig, passenger_mode=True)
    assert c.post(f"/trips/{t['id']}/features", json={'perclos': .9, 'blink_rate': 2, 'mean_blink_ms': 700, 'yawns': 3, 'minutes_driving': 1, 'hour_of_day': 12}).json()['ignored']
    assert c.post(f"/trips/{t['id']}/emergency", json={'lat': 3, 'lng': 101}).status_code == 409
    assert rig['messages'] == []


def test_live_location_throttle_preferences_and_resolution(rig):
    c, clock = rig['client'], rig['clock']; t = trip(rig)
    alert = c.post(f"/trips/{t['id']}/emergency", json={'lat': 3, 'lng': 101}).json()['alerts'][0]
    for i in range(1, 6):
        clock.advance(30)
        assert c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 101+i*.01}).status_code == 200
    assert len(rig['messages']) == 2
    c.patch(f"/emergency-contacts/{rig['contact']['id']}", json={'share_live_location': False, 'text_when_ok': False})
    clock.advance(120)
    c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 102})
    c.post(f"/emergency/{alert['id']}/resolve")
    assert len(rig['messages']) == 2
    assert c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 102}).status_code == 409


def test_retry_and_test_text_idempotency(rig):
    c = rig['client']; rig['failures'].extend([429, 429])
    url = f"/emergency-contacts/{rig['contact']['id']}/test"
    assert c.post(url, headers={'Idempotency-Key': 'one'}).json()['status'] == 'sent'
    assert c.post(url, headers={'Idempotency-Key': 'one'}).json()['status'] == 'sent'
    assert len(rig['messages']) == 1


def test_location_updates_are_at_least_two_minutes_apart(rig):
    c, clock = rig['client'], rig['clock']; t = trip(rig)
    alert = c.post(f"/trips/{t['id']}/emergency", json={'lat': 3, 'lng': 101}).json()['alerts'][0]
    clock.advance(150)
    c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 101})
    clock.advance(90)
    c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 102})
    assert len(rig['messages']) == 2
    clock.advance(30)
    c.post(f"/emergency/{alert['id']}/location", json={'at': clock.value.isoformat(), 'lat': 3, 'lng': 103})
    assert len(rig['messages']) == 3


def test_location_retry_throttles_from_success_and_uses_latest_fix(rig):
    c, clock = rig['client'], rig['clock']; t = trip(rig)
    alert = c.post(f"/trips/{t['id']}/emergency", json={'lat':3,'lng':101}).json()['alerts'][0]
    clock.advance(120); rig['failures'].extend([429,429,429])
    assert c.post(f"/emergency/{alert['id']}/location", json={'at':clock.value.isoformat(),'lat':3,'lng':102}).json()['delivery_status'] == 'failed'
    clock.advance(110)
    assert c.post(f"/emergency/{alert['id']}/location", json={'at':clock.value.isoformat(),'lat':3,'lng':103}).json()['delivery_status'] == 'sent'
    assert '103' in rig['messages'][-1]['Body'][0]
    clock.advance(10)
    c.post(f"/emergency/{alert['id']}/location", json={'at':clock.value.isoformat(),'lat':3,'lng':104})
    assert len(rig['messages']) == 2


def test_workshops_routes_reports_and_baseline_endpoints(rig):
    c = rig['client']; t = trip(rig)
    shops = c.get('/workshops', params={'lat': 3.05, 'lng': 101.6, 'service': 'brakes'}).json()
    assert shops['workshops'][0]['name'] == 'Brake shop'
    assert shops['workshops'][0]['phone'] == '+60312345678'
    assert 'waze.com' in shops['workshops'][0]['waze_url']
    routes = c.get('/route-options', params={'from': '3,101.6', 'to': '3,101.7'}).json()
    assert routes['fastest']['duration_seconds'] == 600
    assert routes['safer']['support_count'] > routes['fastest']['support_count']
    assert 'lower risk' not in routes['explanation'].lower()
    assert c.get('/rest-stops', params={'lat': 3.05, 'lng': 101.6}).status_code == 200
    assert c.post(f"/trips/{t['id']}/features", json={'perclos': .2, 'blink_rate': 10, 'mean_blink_ms': 300, 'yawns': 1, 'minutes_driving': 5, 'hour_of_day': 12}).json()['stub']
    assert c.post('/car-checks/dashboard', data={'car_id': rig['car']['id']}, files={'photo': ('dashboard.jpg', b'\xff\xd8\xff\xd9', 'image/jpeg')}).json()['stub']
    assert c.post('/car-checks/startup-audio', data={'car_id': rig['car']['id']}, files={'audio': ('start.wav', b'RIFF\x00\x00\x00\x00WAVE', 'audio/wav')}).json()['stub']
    report = c.get(f"/cars/{rig['car']['id']}/report").json()
    assert report['dashboard']['urgency'] in ['monitor', 'soon', 'stop']
    assert report['startup']['urgency_label'] == 'Book service soon'
    assert c.get(f"/brakes/{rig['car']['id']}").status_code == 200
    assert c.get('/patterns').status_code == 200 and c.get('/trips').status_code == 200
    assert c.get('/docs').status_code == 200


def test_events_are_idempotent_and_ended_trips_reject_updates(rig):
    c = rig['client']; t = trip(rig); rig['clock'].advance(1)
    event = {'at': rig['clock'].value.isoformat(), 'kind': 'hard_brake'}
    first = c.post(f"/trips/{t['id']}/events", json=event).json()
    assert c.post(f"/trips/{t['id']}/events", json=event).json()['id'] == first['id']
    assert c.get(f"/trips/{t['id']}/summary").json()['hard_brake_count'] == 1
    assert c.post(f"/trips/{t['id']}/events", json=event | {'at':'2026-10-10T04:00:00'}).status_code == 422
    c.patch(f"/trips/{t['id']}/end")
    assert c.post(f"/trips/{t['id']}/events", json=event).status_code == 409
    assert c.post(f"/trips/{t['id']}/emergency", json={'lat':3,'lng':101}).status_code == 409


def test_preferences_allow_ok_without_location_and_resolve_is_idempotent(rig):
    c = rig['client']; t = trip(rig)
    c.patch(f"/emergency-contacts/{rig['contact']['id']}", json={'share_live_location':False})
    alert = c.post(f"/trips/{t['id']}/emergency", json={'lat':3,'lng':101}).json()['alerts'][0]
    rig['clock'].advance(150)
    c.post(f"/emergency/{alert['id']}/location", json={'at':rig['clock'].value.isoformat(),'lat':3,'lng':102})
    c.post(f"/emergency/{alert['id']}/resolve")
    c.post(f"/emergency/{alert['id']}/resolve")
    assert len(rig['messages']) == 2
    assert rig['messages'][-1]['Body'][0] == "Aaron says they're OK."


def test_later_emergency_episode_has_its_own_stable_key(rig):
    c = rig['client']; t = trip(rig)
    url = f"/trips/{t['id']}/emergency"
    first = c.post(url, json={'lat':3,'lng':101}).json()['alerts'][0]
    c.post(f"/emergency/{first['id']}/resolve")
    rig['clock'].advance(600)
    second = c.post(url, headers={'Idempotency-Key':'second-countdown'}, json={'lat':3,'lng':102}).json()['alerts'][0]
    assert second['id'] != first['id'] and second['resolved_at'] is None
    c.post(url, headers={'Idempotency-Key':'second-countdown'}, json={'lat':3,'lng':102})
    assert len(rig['messages']) == 3


def test_concurrent_emergency_retry_cannot_downgrade_sent_alert(rig, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event as ThreadEvent
    import backend.app.main as main_module
    c = rig['client']; t = trip(rig)
    entered, release, first_done = ThreadEvent(), ThreadEvent(), ThreadEvent()
    original_post, original_deliver = httpx.Client.post, main_module.deliver
    def blocked_post(self, url, *args, **kwargs):
        if str(url).startswith('https://api.twilio.com'):
            entered.set(); assert release.wait(5)
        return original_post(self, url, *args, **kwargs)
    def delayed_retry(*args, **kwargs):
        result = original_deliver(*args, **kwargs)
        if result['status'] == 'sending':
            release.set(); assert first_done.wait(5)
        return result
    monkeypatch.setattr(httpx.Client, 'post', blocked_post)
    monkeypatch.setattr(main_module, 'deliver', delayed_retry)
    url = f"/trips/{t['id']}/emergency"
    def first_request():
        result = c.post(url, json={'lat':3,'lng':101})
        first_done.set(); return result
    with ThreadPoolExecutor(1) as pool:
        first = pool.submit(first_request); assert entered.wait(5)
        assert c.post(url, json={'lat':3,'lng':101}).status_code == 200
        assert first.result().status_code == 200
    alert = rig['store'].select('emergency_alerts', trip_id=t['id'])[0]
    assert alert['status'] == 'sent'
    rig['clock'].advance(150)
    c.post(f"/emergency/{alert['id']}/location", json={'at':rig['clock'].value.isoformat(),'lat':3,'lng':102})
    assert len(rig['messages']) == 2


def test_contact_and_car_access_and_upload_validation(rig):
    c = rig['client']; other = {'Authorization':'Bearer other'}
    assert c.get('/emergency-contacts', headers=other).json() == []
    assert c.get('/cars', headers=other).json() == []
    assert c.get(f"/cars/{rig['car']['id']}/report", headers=other).status_code == 404
    assert c.post(f"/emergency-contacts/{rig['contact']['id']}/test", headers=other | {'Idempotency-Key':'one'}).status_code == 404
    assert c.post('/car-checks/dashboard', data={'car_id':rig['car']['id']}, files={'photo':('bad.jpg',b'not an image','image/jpeg')}).status_code == 415
    assert c.post('/car-checks/dashboard', data={'car_id':rig['car']['id']}, files={'photo':('big.jpg',b'\xff\xd8\xff'+b'x'*(10*1024*1024),'image/jpeg')}).status_code == 413


def test_legacy_car_checks_have_complete_report_contracts(rig):
    for kind in ['dashboard','startup']:
        rig['store'].insert('car_checks', {'car_id':rig['car']['id'],'at':rig['clock'].value.isoformat(),'kind':kind,'result':{}})
    report = rig['client'].get(f"/cars/{rig['car']['id']}/report").json()
    assert report['dashboard']['stub'] is False
    assert report['startup']['crank_seconds'] is None
    assert report['startup']['verdict'] and report['startup']['stub'] is False

def test_emergency_episode_lookup_never_sends_and_enforces_owner(rig):
    c, t = rig['client'], trip(rig)
    path = f"/trips/{t['id']}/emergency"
    assert c.get(path, params={'episode_key': 'never-submitted'}).json() == {'alerts': []}
    assert len(rig['messages']) == 0
    alert = c.post(path, json={'lat': 3, 'lng': 101.62}).json()['alerts'][0]
    count = len(rig['messages'])
    assert c.get(path, params={'episode_key': 'test-countdown-episode'}).json()['alerts'][0]['id'] == alert['id']
    assert len(rig['messages']) == count
    assert c.get(path, params={'episode_key': 'test-countdown-episode'}, headers={'Authorization': 'Bearer other'}).status_code == 404

def test_cancelled_unsubmitted_episode_cannot_later_send_an_alarm(rig):
    c, t = rig['client'], trip(rig)
    path = f"/trips/{t['id']}/emergency"
    cancelled = c.post(path+'/cancel', json={'lat': 3, 'lng': 101.62})
    assert cancelled.status_code == 200
    assert all(a['status'] == 'cancelled' and a['resolved_at'] for a in cancelled.json()['alerts'])
    assert c.post(path, json={'lat': 3, 'lng': 101.62}).status_code == 200
    assert len(rig['messages']) == 0
    assert c.post(path+'/cancel', json={'lat': 3, 'lng': 101.62}, headers={'Authorization': 'Bearer other'}).status_code == 404


def test_startup_uses_phone_crank_timing(rig):
    c, car = rig['client'], rig['car']['id']
    wav = ('start.wav', b'RIFF\x00\x00\x00\x00WAVE', 'audio/wav')
    normal = c.post('/car-checks/startup-audio', data={'car_id': car, 'crank_seconds': '0.9'}, files={'audio': wav}).json()
    assert normal['stub'] is False and normal['urgency'] == 'monitor' and normal['crank_seconds'] == .9
    slow = c.post('/car-checks/startup-audio', data={'car_id': car, 'crank_seconds': '3.2'}, files={'audio': wav}).json()
    assert slow['urgency'] == 'soon' and 'weak battery' in slow['verdict']
    assert c.post('/car-checks/startup-audio', data={'car_id': car, 'crank_seconds': '30'}, files={'audio': wav}).status_code == 422


def test_predrive_safety_floors_and_missing_face(rig):
    # Late night after 16+ hours awake is never "Safe", even with quick taps and no face reading.
    late = predrive(rig['client'], slept=5.5, awake=18, hour=2, alert_self='bit_tired', trip_length='1_2h',
                    taps_ms=[250], face_perclos=0, face_mean_blink_ms=0).json()
    assert late['level'] in ('caution', 'high')
    assert predrive(rig['client'], slept=4, awake=18).json()['level'] == 'high'
