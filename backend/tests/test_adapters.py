from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from threading import Event

import httpx

from backend.app.config import Settings
from backend.app.maps import route_distance, route_options, workshops
from backend.app.messaging import deliver
from backend.app.repository import MemoryRepository, SupabaseRepository


def test_supabase_forwards_user_jwt_paginates_and_atomic_claims():
    calls = []
    def upstream(request):
        calls.append(request)
        if request.method == 'GET':
            return httpx.Response(200, json=[{'id': str(i)} for i in range(1000)] if request.url.params['offset'] == '0' else [{'id': 'last'}])
        return httpx.Response(200, json=[{'id': 'claimed'}])
    with httpx.Client(transport=httpx.MockTransport(upstream)) as http:
        repo = SupabaseRepository(Settings(supabase_url='https://test.supabase.co', supabase_key='public'), http, 'user-jwt')
        assert len(repo.select('trip_points', trip_id='trip')) == 1001
        assert calls[0].headers['Authorization'] == 'Bearer user-jwt'
        assert calls[0].url.params['trip_id'] == 'eq.trip'
        repo.update('sms_deliveries', {'id': 'delivery', 'status': 'pending'}, {'status': 'sending'})
        assert calls[-1].url.params['status'] == 'eq.pending'


def test_no_duplicate_sms_under_concurrent_requests():
    repo, entered, released = MemoryRepository(), Event(), Event()
    sent = []
    def upstream(request):
        entered.set(); assert released.wait(5)
        sent.append(request)
        return httpx.Response(201, json={'sid': 'SM1'})
    settings = Settings(twilio_account_sid='ACtest', twilio_auth_token='test', twilio_from='+15005550006')
    with httpx.Client(transport=httpx.MockTransport(upstream)) as http, ThreadPoolExecutor(2) as pool:
        args = (repo, 'owner', {'id': 'contact', 'phone': '+60123456789'}, None, 'test:stable', 'TEST', settings, http, datetime.now(timezone.utc))
        first = pool.submit(deliver, *args)
        assert entered.wait(5)
        assert deliver(*args)['status'] == 'sending'
        released.set(); assert first.result()['status'] == 'sent'
        assert deliver(*args)['status'] == 'sent' and len(sent) == 1


def test_ambiguous_sms_timeout_is_not_blindly_resent():
    calls = []
    def upstream(request):
        calls.append(request)
        raise httpx.ReadTimeout('Response lost', request=request)
    settings = Settings(twilio_account_sid='ACtest', twilio_auth_token='test', twilio_from='+15005550006')
    with httpx.Client(transport=httpx.MockTransport(upstream)) as http:
        args = (MemoryRepository(), 'owner', {'id': 'contact', 'phone': '+60123456789'}, None, 'test:stable', 'TEST', settings, http, datetime.now(timezone.utc))
        assert deliver(*args)['status'] == 'unknown'
        assert deliver(*args)['status'] == 'unknown' and len(calls) == 1


def test_route_segment_proximity_and_unavailable_services():
    assert route_distance({'lat': 3.005, 'lng': 101.65}, [[3, 101.6], [3, 101.7]]) < 1
    def upstream(request):
        return httpx.Response(503)
    with httpx.Client(transport=httpx.MockTransport(upstream)) as http:
        result = route_options(http, {'lat': 3, 'lng': 101}, {'lat': 4, 'lng': 102})
        assert result['stub'] and result['safer']['support_count'] == 0
        assert 'straight-line' in result['fastest']['message']
        assert workshops(http, 3, 101, 'battery')['workshops'] == []


def test_workshop_explicitly_unsupported_service_is_excluded():
    def upstream(request):
        return httpx.Response(200,json={'elements':[
            {'type':'node','id':1,'lat':3,'lon':101,'tags':{'shop':'car_repair','name':'No brakes','service:vehicle:brakes':'no'}},
            {'type':'node','id':2,'lat':3,'lon':101,'tags':{'shop':'car_repair','name':'Brakes supported','service:vehicle:brakes':'yes'}},
        ]})
    with httpx.Client(transport=httpx.MockTransport(upstream)) as http:
        assert [s['name'] for s in workshops(http,3,101,'brakes')['workshops']] == ['Brakes supported']
