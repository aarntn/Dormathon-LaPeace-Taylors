from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from statistics import median
from typing import Literal
from uuid import UUID, uuid4

import httpx
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.openapi.docs import get_swagger_ui_html
from pathlib import Path

from . import maps
from .auth import install_auth
from .geocode import Geocoder
from .config import Settings
from .demo import DASHBOARD_SCENARIOS, STARTUP_SCENARIOS, dashboard_finding
from .messaging import deliver
from .models import Car, Contact, ContactUpdate, Event, Features, PointBatch, Position, PreDrive, Profile, TimedPosition, TripInput
from .repository import SupabaseRepository
from .scoring import URGENCY, predrive_score, timestamp, trip_summary


@dataclass
class Context:
    user_id: str
    repo: object
    token: str


def create_app(*, settings=None, store=None, http=None, clock=None):
    settings = settings or Settings()
    owned_http = http is None
    http = http or httpx.Client(timeout=10)
    clock = clock or (lambda: datetime.now(timezone.utc))

    @asynccontextmanager
    async def lifespan(app):
        yield
        if owned_http:
            http.close()

    app = FastAPI(title='BUCKL API', version='0.4c', lifespan=lifespan, docs_url=None,
        servers=[{'url': '.', 'description': 'Current API location'}],
        description='Authenticated trip, readiness, emergency and car APIs. Missing ML models return explicitly marked stubs. Safety scores are demo rules.')
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False,
                       allow_methods=['GET', 'POST', 'PUT', 'PATCH'], allow_headers=['Authorization', 'Content-Type', 'Idempotency-Key'])

    @app.middleware('http')
    async def browser_api_prefix(request, call_next):
        # Vite uses /api locally and production uses this same FastAPI service.
        # Strip the prefix before routing so the web bundle never needs a separate
        # API hostname or a browser-visible backend secret.
        path = request.scope['path']
        if path == '/api' or path.startswith('/api/'):
            request.scope['path'] = path[4:] or '/'
        return await call_next(request)
    bearer = HTTPBearer(auto_error=False)
    install_auth(app, settings, http)
    geocoder = Geocoder(http, settings.geocode_url)

    @app.get('/docs', include_in_schema=False)
    def docs():
        # Relative URLs work both at localhost:8000/docs and Vite's /api/docs proxy.
        return get_swagger_ui_html(openapi_url='openapi.json', title='BUCKL API — Swagger UI')

    def authenticated(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if not credentials or credentials.scheme.lower() != 'bearer':
            raise HTTPException(401, 'A Supabase access token is required', headers={'WWW-Authenticate': 'Bearer'})
        if not settings.supabase_ready:
            raise HTTPException(503, 'Configure Supabase before using authenticated endpoints')
        token = credentials.credentials
        try:
            response = http.get(settings.supabase_url + '/auth/v1/user',
                headers={'apikey': settings.supabase_key, 'Authorization': f'Bearer {token}'})
            if response.status_code in (401, 403):
                raise HTTPException(401, 'Invalid or expired access token')
            response.raise_for_status()
            user_id = str(UUID(response.json()['id']))
        except (httpx.HTTPError, ValueError, KeyError) as error:
            raise HTTPException(503, 'Authentication service unavailable') from error
        return Context(user_id, store if store is not None else SupabaseRepository(settings, http, token), token)

    def one(ctx, table, record_id):
        rows = ctx.repo.select(table, id=str(record_id))
        if not rows:
            raise HTTPException(404, 'Record not found')
        return rows[0]

    def owned(ctx, table, record_id):
        row = one(ctx, table, record_id)
        if row['user_id'] != ctx.user_id:
            raise HTTPException(404, 'Record not found')
        return row

    def active_trip(ctx, trip_id):
        t = owned(ctx, 'trips', trip_id)
        if t.get('ended_at'):
            raise HTTPException(409, 'Trip has ended')
        return t

    def alert_context(ctx, alert_id):
        alert = one(ctx, 'emergency_alerts', alert_id)
        t = owned(ctx, 'trips', alert['trip_id'])
        contact = owned(ctx, 'emergency_contacts', alert['contact_id'])
        return alert, t, contact

    def valid_time(value, start=None):
        value = timestamp(value)
        if value > clock() + timedelta(seconds=5) or (start and value < timestamp(start)):
            raise HTTPException(422, 'Timestamp is outside this trip or in the future')

    def summary(ctx, t):
        check = owned(ctx, 'predrive_checks', t['predrive_id']) if t.get('predrive_id') else None
        return trip_summary(t, ctx.repo.select('trip_points', trip_id=t['id']),
                            ctx.repo.select('trip_events', trip_id=t['id']), check, clock())

    @app.get('/health', tags=['Operations'])
    def health():
        return {'status': 'ok', 'supabase_configured': settings.supabase_ready, 'demo_mode': settings.demo_mode,
                'standalone': settings.standalone}

    @app.put('/profile', tags=['Setup'])
    def profile(body: Profile, ctx=Depends(authenticated)):
        ctx.repo.unique('profiles', {'id': ctx.user_id, **body.model_dump()}, ['id'])
        return ctx.repo.update('profiles', {'id': ctx.user_id}, body.model_dump())[0]

    @app.get('/emergency-contacts', tags=['Setup'])
    def contacts(ctx=Depends(authenticated)):
        return ctx.repo.select('emergency_contacts', user_id=ctx.user_id)

    @app.post('/emergency-contacts', status_code=201, tags=['Setup'])
    def add_contact(body: Contact, ctx=Depends(authenticated)):
        return ctx.repo.insert('emergency_contacts', {'user_id': ctx.user_id, **body.model_dump()})

    @app.patch('/emergency-contacts/{contact_id}', tags=['Setup'])
    def update_contact(contact_id: UUID, body: ContactUpdate, ctx=Depends(authenticated)):
        owned(ctx, 'emergency_contacts', contact_id)
        return ctx.repo.update('emergency_contacts', {'id': str(contact_id)}, body.model_dump(exclude_none=True))[0]

    @app.post('/cars', status_code=201, tags=['Setup'])
    def add_car(body: Car, ctx=Depends(authenticated)):
        return ctx.repo.insert('cars', {'user_id': ctx.user_id, **body.model_dump()})

    @app.get('/cars', tags=['Setup'])
    def cars(ctx=Depends(authenticated)):
        return ctx.repo.select('cars', user_id=ctx.user_id)

    @app.post('/predrive', status_code=201, tags=['Readiness'])
    def predrive(body: PreDrive, ctx=Depends(authenticated)):
        previous = sorted(ctx.repo.select('predrive_checks', user_id=ctx.user_id), key=lambda p: timestamp(p['at']))[-20:]
        personal = median(p['median_ms'] for p in previous) if previous else 270
        history_trips = [t for t in ctx.repo.select('trips', user_id=ctx.user_id)
                         if timestamp(t['started_at']).astimezone(timezone(timedelta(hours=8))).hour == body.hour and not t.get('passenger_mode')]
        history = sum(any(e['kind'] == 'tired' for e in ctx.repo.select('trip_events', trip_id=t['id'])) for t in history_trips)/len(history_trips) if history_trips else 0
        result = predrive_score(body, history, personal)
        fields = body.model_dump(exclude={'taps_ms'})
        saved = ctx.repo.insert('predrive_checks', fields | {'user_id': ctx.user_id, 'at': clock().isoformat(),
            'median_ms': median(body.taps_ms), 'risk': result['level']})
        return {'id': saved['id'], **result}

    @app.post('/trips', status_code=201, tags=['Trips'])
    def start_trip(body: TripInput, ctx=Depends(authenticated)):
        owned(ctx, 'cars', body.car_id)
        if body.predrive_id:
            owned(ctx, 'predrive_checks', body.predrive_id)
        return ctx.repo.insert('trips', {'user_id': ctx.user_id, 'started_at': clock().isoformat(), 'ended_at': None,
            **body.model_dump(mode='json')})

    @app.get('/trips', tags=['Trips'])
    def list_trips(ctx=Depends(authenticated)):
        return sorted(ctx.repo.select('trips', user_id=ctx.user_id), key=lambda t: timestamp(t['started_at']), reverse=True)

    @app.post('/trips/{trip_id}/points', tags=['Trips'])
    def points(trip_id: UUID, body: PointBatch, ctx=Depends(authenticated)):
        t = active_trip(ctx, trip_id)
        for p in body.points:
            valid_time(p.at, t['started_at'])
        rows = [{'trip_id': t['id'], **p.model_dump(mode='json')} for p in body.points]
        return {'accepted': len(ctx.repo.batch_points(rows))}

    @app.post('/trips/{trip_id}/events', status_code=201, tags=['Trips'])
    def events(trip_id: UUID, body: Event, ctx=Depends(authenticated)):
        t = active_trip(ctx, trip_id)
        valid_time(body.at, t['started_at'])
        if t['passenger_mode'] and body.kind != 'hard_brake':
            return {'ignored': True, 'reason': 'Passenger mode'}
        if (body.lat is None) != (body.lng is None):
            raise HTTPException(422, 'Supply both latitude and longitude, or neither')
        row, _ = ctx.repo.unique('trip_events', {'trip_id': t['id'], **body.model_dump(mode='json'),
            'event_key': body.at.astimezone(timezone.utc).isoformat()+':'+body.kind}, ['trip_id', 'event_key'])
        return row

    @app.post('/trips/{trip_id}/features', tags=['Trips'])
    def features(trip_id: UUID, body: Features, ctx=Depends(authenticated)):
        t = active_trip(ctx, trip_id)
        if t['passenger_mode']:
            return {'ignored': True, 'risk': None, 'level': None, 'stub': False}
        # Explicit demo fallback until Prompt 5 supplies the learned model.
        risk = min(1, body.perclos*2 + body.mean_blink_ms/2000 + min(body.yawns, 3)*.1)
        row = ctx.repo.insert('trip_features', {'trip_id': t['id'], 'at': clock().isoformat(), **body.model_dump(), 'risk': risk})
        return {'id': row['id'], 'risk': round(risk, 3), 'level': 'high' if risk >= .6 else 'caution' if risk >= .3 else 'safe', 'stub': True}

    @app.get('/trips/{trip_id}/summary', tags=['Trips'])
    def get_summary(trip_id: UUID, ctx=Depends(authenticated)):
        return summary(ctx, owned(ctx, 'trips', trip_id))

    @app.patch('/trips/{trip_id}/end', tags=['Trips'])
    def end_trip(trip_id: UUID, ctx=Depends(authenticated)):
        t = owned(ctx, 'trips', trip_id)
        if not t.get('ended_at'):
            t = ctx.repo.update('trips', {'id': t['id']}, {'ended_at': clock().isoformat()})[0]
        result = summary(ctx, t)
        ctx.repo.update('trips', {'id': t['id']}, {k: result[k] for k in ['distance_km', 'avg_speed_kmh', 'safety_score']})
        return result

    def driver_name(ctx):
        return one(ctx, 'profiles', ctx.user_id)['name'].strip()

    @app.get('/trips/{trip_id}/emergency', tags=['Emergency'])
    def emergency_episode(trip_id: UUID, episode_key: str = Query(min_length=1, max_length=120), ctx=Depends(authenticated)):
        # Read-only reconciliation of a response lost after a possible SMS send.
        t = owned(ctx, 'trips', trip_id)
        return {'alerts': ctx.repo.select('emergency_alerts', trip_id=t['id'], request_key=episode_key)}

    @app.post('/trips/{trip_id}/emergency/cancel', tags=['Emergency'])
    def cancel_episode(trip_id: UUID, body: Position, idempotency_key: str = Header(min_length=1, max_length=120), ctx=Depends(authenticated)):
        t = owned(ctx, 'trips', trip_id)
        alerts = []
        for contact in ctx.repo.select('emergency_contacts', user_id=ctx.user_id):
            # A resolved placeholder prevents a delayed retry from opening an
            # episode whose initial request never reached the server.
            alert, created = ctx.repo.unique('emergency_alerts', {'trip_id': t['id'], 'contact_id': contact['id'],
                'at': clock().isoformat(), **body.model_dump(), 'status': 'cancelled',
                'resolved_at': clock().isoformat(), 'request_key': idempotency_key}, ['trip_id', 'contact_id', 'request_key'])
            if not created and alert['status'] != 'cancelled':
                alert = resolve(UUID(alert['id']), ctx)
            alerts.append(alert)
        return {'alerts': alerts}

    @app.post('/trips/{trip_id}/emergency', tags=['Emergency'],
              description="Call only AFTER the cancellable app countdown ends. Repeated calls reuse each contact's alert; passenger mode rejects escalation.")
    def emergency(trip_id: UUID, body: Position, idempotency_key: str = Header(min_length=1, max_length=120), ctx=Depends(authenticated)):
        t = active_trip(ctx, trip_id)
        if t['passenger_mode']:
            raise HTTPException(409, 'Passenger mode cannot trigger an emergency')
        contacts = ctx.repo.select('emergency_contacts', user_id=ctx.user_id)
        if not contacts:
            raise HTTPException(409, 'Choose an emergency contact first')
        alerts = []
        for contact in contacts:
            alert, _ = ctx.repo.unique('emergency_alerts', {'trip_id': t['id'], 'contact_id': contact['id'],
                'at': clock().isoformat(), **body.model_dump(), 'status': 'pending', 'resolved_at': None,
                'request_key': idempotency_key}, ['trip_id', 'contact_id', 'request_key'])
            if not alert.get('resolved_at'):
                at = timestamp(alert['at']).astimezone(timezone(timedelta(hours=8))).strftime('%d %b %Y, %H:%M MYT')
                text = f"{driver_name(ctx)} isn't responding to their BUCKL alarm while driving. Last location at {at}: https://maps.google.com/?q={alert['lat']},{alert['lng']}. If you can't reach them, call 999."
                delivery = deliver(ctx.repo, ctx.user_id, contact, alert['id'], 'alarm:'+alert['id'], text, settings, http, clock)
                if delivery['status'] == 'sending':
                    # The claiming request owns this transition. A slower retry
                    # must never overwrite its completed sent status with pending.
                    alert = one(ctx, 'emergency_alerts', alert['id'])
                else:
                    filters = {'id': alert['id']}
                    if delivery['status'] != 'sent':
                        filters['status'] = alert['status']
                    updated = ctx.repo.update('emergency_alerts', filters, {'status': delivery['status']})
                    alert = updated[0] if updated else one(ctx, 'emergency_alerts', alert['id'])
            alerts.append(alert)
        return {'alerts': alerts}

    @app.post('/emergency/{alert_id}/location', tags=['Emergency'])
    def location(alert_id: UUID, body: TimedPosition, ctx=Depends(authenticated)):
        alert, t, contact = alert_context(ctx, alert_id)
        if alert.get('resolved_at') or alert['status'] == 'cancelled' or t['passenger_mode']:
            raise HTTPException(409, 'Emergency is not active')
        valid_time(body.at, alert['at'])
        ctx.repo.unique('emergency_locations', {'alert_id': alert['id'], **body.model_dump(mode='json')}, ['alert_id', 'at'])
        all_locations = ctx.repo.select('emergency_locations', alert_id=alert['id'])
        latest = max(all_locations, key=lambda p: timestamp(p['at']))
        previous_deliveries = [d for d in ctx.repo.select('sms_deliveries', alert_id=alert['id'])
                               if d['status'] in ('sent', 'sending', 'unknown') and
                                  (d['delivery_key'].startswith('location:') or d['delivery_key'].startswith('alarm:'))]
        successful = [d for d in previous_deliveries if d['status'] == 'sent']
        predecessor = max(successful, key=lambda d: timestamp(d.get('sent_at') or d['at']), default=None)
        last_at = timestamp(predecessor.get('sent_at') or predecessor['at']) if predecessor else timestamp(alert['at'])
        pending = any(d['status'] in ('sending','unknown') for d in previous_deliveries)
        delivery = None
        if alert['status'] == 'sent' and not pending and contact['share_live_location'] and (clock()-last_at).total_seconds() >= 120:
            at = timestamp(latest['at']).astimezone(timezone(timedelta(hours=8))).strftime('%H:%M MYT')
            text = f"BUCKL location update: {driver_name(ctx)} still hasn't responded. Last location at {at}: https://maps.google.com/?q={latest['lat']},{latest['lng']}. If you can't reach them, call 999."
            # Concurrent updates share the same predecessor key, even across a
            # wall-clock boundary. A successful delivery becomes the next predecessor.
            delivery = deliver(ctx.repo, ctx.user_id, contact, alert['id'],
                f"location:{alert['id']}:after:{predecessor['id'] if predecessor else 'initial'}", text, settings, http, clock)
        return {'saved': True, 'delivery_status': delivery['status'] if delivery else None}

    @app.post('/emergency/{alert_id}/resolve', tags=['Emergency'])
    def resolve(alert_id: UUID, ctx=Depends(authenticated)):
        alert, _, contact = alert_context(ctx, alert_id)
        # Resolve before attempting the optional text, so location updates stop even if SMS fails.
        if not alert.get('resolved_at'):
            alert = ctx.repo.update('emergency_alerts', {'id': alert['id']}, {'resolved_at': clock().isoformat()})[0]
        delivery = None
        if contact['text_when_ok']:
            delivery = deliver(ctx.repo, ctx.user_id, contact, alert['id'], 'ok:'+alert['id'],
                f"{driver_name(ctx)} says they're OK.", settings, http, clock)
        return alert | {'ok_text_status': delivery['status'] if delivery else None}

    @app.post('/emergency-contacts/{contact_id}/test', tags=['Emergency'])
    def test_contact(contact_id: UUID, idempotency_key: str = Header(min_length=1, max_length=120), ctx=Depends(authenticated)):
        contact = owned(ctx, 'emergency_contacts', contact_id)
        delivery = deliver(ctx.repo, ctx.user_id, contact, None, f'test:{contact_id}:{idempotency_key}',
            f"BUCKL TEST ONLY: {driver_name(ctx)} is testing their emergency contact. This is not an emergency. No action is needed.", settings, http, clock)
        return {'id': delivery['id'], 'status': delivery['status'], 'test': True}

    @app.get('/patterns', tags=['Trips'])
    def patterns(ctx=Depends(authenticated)):
        slots = [0]*8
        for t in ctx.repo.select('trips', user_id=ctx.user_id):
            for e in ctx.repo.select('trip_events', trip_id=t['id']):
                if e['kind'] == 'tired':
                    hour = timestamp(e['at']).astimezone(timezone(timedelta(hours=8))).hour
                    slots[hour//3] += 1
        total = sum(slots)
        return {'slots': [{'from_hour': i*3, 'tired_alerts': count} for i, count in enumerate(slots)],
                'late_night_share': (slots[0]+slots[7])/total if total else 0}

    def brake_report(ctx, car_id):
        owned(ctx, 'cars', car_id)
        weeks = [0]*6
        for t in ctx.repo.select('trips', car_id=str(car_id)):
            if t['user_id'] != ctx.user_id:
                continue
            for e in ctx.repo.select('trip_events', trip_id=t['id']):
                age = (clock()-timestamp(e['at'])).total_seconds()/604800
                if e['kind'] == 'hard_brake' and 0 <= age < 6:
                    weeks[5-int(age)] += 1
        slope = sum((i-2.5)*(v-sum(weeks)/6) for i, v in enumerate(weeks))/17.5
        urgency = 'soon' if weeks[-1] >= 3 or slope > .5 else 'monitor'
        return {'hard_stops_per_week': weeks, 'trend_per_week': round(slope, 3), 'urgency': urgency,
                'urgency_label': URGENCY[urgency], 'verdict': 'More hard stops recently; consider a brake check.' if urgency == 'soon' else 'Keep an eye on hard braking.', 'score_source': 'demo_rule'}

    @app.get('/brakes/{car_id}', tags=['Car checks'])
    def brakes(car_id: UUID, ctx=Depends(authenticated)):
        return brake_report(ctx, car_id)

    def checked_upload(upload, allowed, maximum):
        if upload.content_type not in allowed:
            raise HTTPException(415, 'Unsupported upload type')
        content = upload.file.read(maximum+1)
        if not content or len(content) > maximum:
            raise HTTPException(413, 'Upload is empty or too large')
        return content

    @app.post('/car-checks/dashboard', tags=['Car checks'])
    def dashboard(car_id: UUID = Form(), photo: UploadFile = File(), demo_scenario: str | None = Form(default=None, max_length=20),
                  ctx=Depends(authenticated)):
        owned(ctx, 'cars', car_id)
        content = checked_upload(photo, {'image/jpeg', 'image/png', 'image/webp'}, 10*1024*1024)
        if not (content.startswith(b'\xff\xd8\xff') or content.startswith(b'\x89PNG\r\n\x1a\n') or (content[:4] == b'RIFF' and content[8:12] == b'WEBP')):
            raise HTTPException(415, 'The upload is not a supported image')
        scripted = None
        if settings.demo_mode:
            scenario = demo_scenario or 'overheating'
            if scenario not in DASHBOARD_SCENARIOS:
                raise HTTPException(422, 'Unknown demo scenario')
            scripted = dashboard_finding(scenario)
        if scripted is None:
            # No dashboard model is connected, so outside demo mode nothing can be read.
            # Nothing is saved, and the photo is not kept.
            return {'id': str(uuid4()), 'findings': [], 'stub': True}
        photo_path = None
        if store is None:
            photo_path = f"{ctx.user_id}/{uuid4()}.{ {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[photo.content_type]}"
            try:
                response = http.post(settings.supabase_url+'/storage/v1/object/dashboard-photos/'+photo_path, content=content,
                    headers={'apikey': settings.supabase_key, 'Authorization': f'Bearer {ctx.token}', 'Content-Type': photo.content_type})
                response.raise_for_status()
            except httpx.HTTPError as error:
                raise HTTPException(503, 'Photo upload failed') from error
        finding = {'label': scripted['label'], 'urgency': scripted['urgency'], 'urgency_label': URGENCY[scripted['urgency']],
                   'advice': scripted['advice'], 'confidence': None, 'photo_url': photo_path}
        check = ctx.repo.insert('car_checks', {'car_id': str(car_id), 'at': clock().isoformat(), 'kind': 'dashboard', 'result': {'stub': True}})
        ctx.repo.insert('findings', {'check_id': check['id'], **{k: v for k, v in finding.items() if k != 'urgency_label'}})
        return {'id': check['id'], 'findings': [finding], 'stub': True}

    @app.post('/car-checks/startup-audio', tags=['Car checks'])
    def startup(car_id: UUID = Form(), audio: UploadFile = File(), crank_seconds: float | None = Form(default=None, ge=.2, le=6),
                demo_scenario: str | None = Form(default=None, max_length=20), ctx=Depends(authenticated)):
        owned(ctx, 'cars', car_id)
        checked_upload(audio, {'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/ogg'}, 10*1024*1024)
        # Audio is consumed only for this request; never retained or uploaded to Storage.
        scripted = False
        if settings.demo_mode and demo_scenario:
            if demo_scenario not in STARTUP_SCENARIOS:
                raise HTTPException(422, 'Unknown demo scenario')
            if STARTUP_SCENARIOS[demo_scenario] is None:
                raise HTTPException(422, 'We could not hear an engine in that recording.')
            crank_seconds, scripted = STARTUP_SCENARIOS[demo_scenario], True
        if crank_seconds is None:
            # Older clients send no timing: keep the clearly marked demo result.
            result = {'crank_seconds': 2.4, 'verdict': 'A slow crank may indicate a weak battery. Demo result until the model is available.',
                      'urgency': 'soon', 'urgency_label': URGENCY['soon'], 'stub': True}
        else:
            # The phone times the crank from the loudness pattern (apps/web/src/screens/car/crank.ts).
            # A healthy engine usually catches within about 2 seconds.
            crank = round(crank_seconds, 1)
            slow = crank > 2
            result = {'crank_seconds': crank, 'urgency': 'soon' if slow else 'monitor', 'urgency_label': URGENCY['soon' if slow else 'monitor'],
                      'verdict': f'Slow start: {crank} s. This may mean a weak battery. Get it tested at your next service.' if slow
                                 else f'Normal start: {crank} s. The battery sounds fine.', 'stub': scripted}
        check = ctx.repo.insert('car_checks', {'car_id': str(car_id), 'at': clock().isoformat(), 'kind': 'startup', 'result': result})
        return {'id': check['id'], **result}

    @app.get('/cars/{car_id}/report', tags=['Car checks'])
    def car_report(car_id: UUID, ctx=Depends(authenticated)):
        owned(ctx, 'cars', car_id)
        checks = sorted(ctx.repo.select('car_checks', car_id=str(car_id)), key=lambda c: timestamp(c['at']), reverse=True)
        dashboard_result = startup_result = None
        for check in checks:
            if check['kind'] == 'dashboard' and dashboard_result is None:
                findings = ctx.repo.select('findings', check_id=check['id'])
                urgency = max((f['urgency'] for f in findings), key=lambda u: ['monitor', 'soon', 'stop'].index(u), default='monitor')
                dashboard_result = {'id': check['id'], 'at': check['at'], 'findings': findings,
                    'urgency': urgency, 'urgency_label': URGENCY[urgency], 'stub': False, **check.get('result', {})}
            if check['kind'] == 'startup' and startup_result is None:
                startup_result = {'id': check['id'], 'at': check['at'], 'crank_seconds': None,
                    'verdict': 'No start-up reading was saved for this older check.', 'stub': False, **check.get('result', {})}
                if not startup_result.get('urgency'):
                    startup_result |= {'urgency': 'monitor', 'urgency_label': URGENCY['monitor']}
        return {'car_id': str(car_id), 'dashboard': dashboard_result, 'startup': startup_result, 'brakes': brake_report(ctx, car_id)}

    @app.get('/workshops', tags=['Maps'])
    def workshops(lat: float = Query(ge=-90, le=90), lng: float = Query(ge=-180, le=180),
                  service: Literal['cooling', 'battery', 'brakes', 'tyres', 'fuel'] = 'cooling', ctx=Depends(authenticated)):
        return maps.workshops(http, lat, lng, service)

    @app.get('/rest-stops', tags=['Maps'])
    def rest_stops(lat: float = Query(ge=-90, le=90), lng: float = Query(ge=-180, le=180), ctx=Depends(authenticated)):
        return maps.rest_stops(http, lat, lng)

    @app.get('/route-options', tags=['Maps'])
    def route_options(from_: str = Query(alias='from'), to: str = Query(), ctx=Depends(authenticated)):
        return maps.route_options(http, maps.coordinate(from_), maps.coordinate(to))

    @app.get('/geocode', tags=['Maps'])
    def geocode(q: str = Query(min_length=3, max_length=150), ctx=Depends(authenticated)):
        return geocoder.search(q)

    # Render's Docker image places the compiled Vite bundle here. API routes are
    # registered first, so this SPA fallback never intercepts /health, /auth, etc.
    web_root = Path('/app/web')
    if web_root.is_dir():
        @app.get('/', include_in_schema=False)
        def web_home():
            return FileResponse(web_root / 'index.html')

        @app.get('/{client_path:path}', include_in_schema=False)
        def web_app(client_path: str):
            candidate = (web_root / client_path).resolve()
            if candidate.is_relative_to(web_root) and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(web_root / 'index.html')

    return app


app = create_app()
