"""Run the whole BUCKL API with no Supabase and no Twilio, for presentations on one machine.

    uvicorn backend.app.standalone:app --port 8000

What it does
- Accounts: sign-up, sign-in, refresh and sign-out are answered inside this process, so a driver can go
  through the full onboarding. Data lives in memory and is lost when the server stops.
- A ready-made account is created at start-up: demo@buckl.test with password "buckl-demo", filled with
  a car, a contact and six weeks of trips (see demo_seed.py).
- Emergency and test texts are SIMULATED: they are printed in the terminal and reported as "sent", and
  nothing leaves the machine. Maps still use the real OpenStreetMap services when online.
- Car checks use the scripted, labelled demo results (DEMO_MODE behaviour is always on).

It is for demonstrations only. It is never used by the normal app, which still refuses to run without
Supabase configured, and it must not be deployed for real drivers.
"""
import json
import secrets
import time
from datetime import datetime, timezone
from urllib.parse import parse_qs
from uuid import UUID, uuid4

import httpx

from .config import Settings
from .demo_seed import seed
from .main import create_app
from .repository import MemoryRepository

HOST = 'standalone.invalid'
DEMO_EMAIL = 'demo@buckl.test'
DEMO_PASSWORD = 'buckl-demo'
DEMO_NAME = 'Aaron'
DEMO_USER_ID = str(UUID('5d0b1d9e-0c1e-4b8e-9a53-1f0a9f2f0b01'))


class StandaloneServices(httpx.BaseTransport):
    """Stands in for Supabase Auth and Twilio. Every other request goes to the real network."""

    def __init__(self, announce=print):
        self.users = {}      # email -> {id, password, name}
        self.tokens = {}     # access or refresh token -> user id
        self.messages = []   # simulated texts: (to, body)
        self.announce = announce
        self.real = httpx.HTTPTransport()

    # -- helpers -----------------------------------------------------------------------------
    def add_user(self, email, password, name, user_id=None):
        user = {'id': user_id or str(uuid4()), 'email': email, 'password': password, 'name': name}
        self.users[email.lower()] = user
        return user

    def session(self, user):
        access, refresh = secrets.token_urlsafe(24), secrets.token_urlsafe(24)
        self.tokens[access] = self.tokens[refresh] = user['id']
        return {'access_token': access, 'refresh_token': refresh, 'token_type': 'bearer', 'expires_in': 3600,
                'expires_at': int(time.time()) + 3600,
                'user': {'id': user['id'], 'email': user['email'], 'user_metadata': {'name': user['name']}}}

    def user_for(self, token):
        user_id = self.tokens.get(token)
        return next((u for u in self.users.values() if u['id'] == user_id), None)

    @staticmethod
    def reply(status, body=None):
        return httpx.Response(status, json=body) if body is not None else httpx.Response(status)

    # -- routing -----------------------------------------------------------------------------
    def handle_request(self, request):
        host, path = request.url.host, request.url.path
        if host == HOST:
            return self.auth(request, path)
        if host == 'api.twilio.com':
            fields = {key: values[0] for key, values in parse_qs(request.content.decode()).items()}
            self.messages.append((fields.get('To'), fields.get('Body')))
            self.announce(f"[simulated SMS to {fields.get('To')}] {fields.get('Body')}")
            return self.reply(201, {'sid': f'SMDEMO{len(self.messages):06d}', 'status': 'queued'})
        return self.real.handle_request(request)

    def auth(self, request, path):
        data = json.loads(request.content) if request.content else {}
        bearer = request.headers.get('authorization', '').removeprefix('Bearer ').strip()
        if path == '/auth/v1/user':
            user = self.user_for(bearer)
            return self.reply(200, {'id': user['id']}) if user else self.reply(401, {'msg': 'Invalid token'})
        if path == '/auth/v1/signup':
            email = data['email'].lower()
            if email in self.users:
                return self.reply(422, {'msg': 'User already registered'})
            name = (data.get('data') or {}).get('name') or email.split('@')[0]
            return self.reply(200, self.session(self.add_user(email, data['password'], name)))
        if path == '/auth/v1/token':
            if request.url.params.get('grant_type') == 'refresh_token':
                user = self.user_for(data.get('refresh_token', ''))
                return self.reply(200, self.session(user)) if user else self.reply(400, {'error_description': 'Invalid refresh token'})
            user = self.users.get((data.get('email') or '').lower())
            if not user or user['password'] != data.get('password'):
                return self.reply(400, {'error_description': 'Invalid login credentials'})
            return self.reply(200, self.session(user))
        if path == '/auth/v1/logout':
            self.tokens.pop(bearer, None)
            return self.reply(204)
        return self.reply(404, {'msg': 'Not found'})


def create_standalone_app(announce=print, clock=None):
    services = StandaloneServices(announce)
    services.add_user(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME, DEMO_USER_ID)
    store = MemoryRepository()
    now = (clock or (lambda: datetime.now(timezone.utc)))()
    seed(store, DEMO_USER_ID, now, DEMO_NAME)
    settings = Settings(supabase_url=f'http://{HOST}', supabase_key='standalone-demo', demo_mode=True,
                        twilio_account_sid='ACstandalone', twilio_auth_token='standalone', twilio_from='+15005550006')
    app = create_app(settings=settings, store=store, http=httpx.Client(transport=services, timeout=10), clock=clock)
    app.state.standalone = services
    return app


app = create_standalone_app()
print(f'BUCKL standalone demo: sign in as {DEMO_EMAIL} / {DEMO_PASSWORD}, or sign up as anyone new. Nothing is stored or sent outside this machine.')
