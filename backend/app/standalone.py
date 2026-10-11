"""Run the whole BUCKL API with no Supabase and no Twilio, for presentations on one machine.

    uvicorn backend.app.standalone:app --port 8000

What it does
- The app signs itself in as a ready-made demo driver (demo@buckl.test), so a presenter never types an
  email or password. Signing out, and signing up as someone new, still work.
- Accounts are answered inside this process. Data lives in memory and is lost when the server stops.
- The demo account is filled with a car, a contact and six weeks of trips (see demo_seed.py).
- Emergency and test texts are SIMULATED: they are printed in the terminal and reported as submitted, and
  nothing leaves the machine. Maps still use the real OpenStreetMap services when online.
- Car checks use the scripted, labelled demo results.

Safety rails
- It is for demonstrations only. The normal app is untouched and still refuses to run without Supabase.
- It REFUSES TO START if real Supabase or Twilio credentials are in the environment, so it can never sit
  in front of a real database or send a real text.
- Anyone who can reach this server can use the demo account: there is nothing real behind it. Do not put
  real data in it and do not leave it running on the public internet.
- Passwords are stored hashed, sessions expire (access one hour, refresh one day), signing out revokes both
  tokens, and the number of accounts is capped.
"""
import hashlib
import json
import os
import secrets
import time
from datetime import datetime, timezone
from urllib.parse import parse_qs
from uuid import UUID, uuid4

import httpx
from fastapi import Response

from .config import Settings
from .demo_seed import seed
from .main import create_app
from .repository import MemoryRepository

HOST = 'standalone.invalid'
DEMO_EMAIL = 'demo@buckl.test'
DEMO_NAME = 'Aaron'
DEMO_USER_ID = str(UUID('5d0b1d9e-0c1e-4b8e-9a53-1f0a9f2f0b01'))
ACCESS_SECONDS, REFRESH_SECONDS, MAX_USERS = 3600, 86400, 50
REAL_CREDENTIALS = ('SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER')


def hash_password(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 60_000)


class StandaloneServices(httpx.BaseTransport):
    """Stands in for Supabase Auth and Twilio. Every other request goes to the real network."""

    def __init__(self, announce=print, now=time.time):
        self.users = {}      # email -> {id, email, name, salt, hash}
        self.tokens = {}     # token -> (user id, expiry, partner token)
        self.messages = []   # simulated texts: (to, body)
        self.announce, self.now = announce, now
        self.real = httpx.HTTPTransport()

    # -- helpers -----------------------------------------------------------------------------
    def add_user(self, email, password, name, user_id=None):
        salt = secrets.token_bytes(16)
        user = {'id': user_id or str(uuid4()), 'email': email, 'name': name, 'salt': salt, 'hash': hash_password(password, salt)}
        self.users[email.lower()] = user
        return user

    def session(self, user):
        access, refresh = secrets.token_urlsafe(24), secrets.token_urlsafe(24)
        now = self.now()
        self.tokens[access] = (user['id'], now + ACCESS_SECONDS, refresh)
        self.tokens[refresh] = (user['id'], now + REFRESH_SECONDS, access)
        return {'access_token': access, 'refresh_token': refresh, 'token_type': 'bearer', 'expires_in': ACCESS_SECONDS,
                'expires_at': int(now) + ACCESS_SECONDS,
                'user': {'id': user['id'], 'email': user['email'], 'user_metadata': {'name': user['name']}}}

    def user_for(self, token):
        entry = self.tokens.get(token)
        if not entry:
            return None
        if entry[1] <= self.now():
            self.tokens.pop(token, None)
            return None
        return next((u for u in self.users.values() if u['id'] == entry[0]), None)

    def revoke(self, token):
        entry = self.tokens.pop(token, None)
        if entry:
            self.tokens.pop(entry[2], None)

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
            if len(self.users) >= MAX_USERS:
                return self.reply(429, {'msg': 'The demo is full. Restart the server to clear it.'})
            name = (data.get('data') or {}).get('name') or email.split('@')[0]
            return self.reply(200, self.session(self.add_user(email, data['password'], name)))
        if path == '/auth/v1/token':
            if request.url.params.get('grant_type') == 'refresh_token':
                token = data.get('refresh_token', '')
                user = self.user_for(token)
                if not user:
                    return self.reply(400, {'error_description': 'Invalid refresh token'})
                self.revoke(token)
                return self.reply(200, self.session(user))
            user = self.users.get((data.get('email') or '').lower())
            good = user and secrets.compare_digest(user['hash'], hash_password(data.get('password') or '', user['salt']))
            return self.reply(200, self.session(user)) if good else self.reply(400, {'error_description': 'Invalid login credentials'})
        if path == '/auth/v1/logout':
            self.revoke(bearer)
            return self.reply(204)
        return self.reply(404, {'msg': 'Not found'})


def refuse_real_credentials(environment):
    present = [name for name in REAL_CREDENTIALS if environment.get(name)]
    if present:
        raise RuntimeError('The standalone demo will not start while real credentials are set (' + ', '.join(present) +
                           '). It must never sit in front of a real database or send a real text.')


def create_standalone_app(announce=print, clock=None, environment=None):
    refuse_real_credentials(os.environ if environment is None else environment)
    services = StandaloneServices(announce)
    services.demo_password = (os.environ if environment is None else environment).get('BUCKL_DEMO_PASSWORD') or secrets.token_urlsafe(9)
    demo_user = services.add_user(DEMO_EMAIL, services.demo_password, DEMO_NAME, DEMO_USER_ID)
    store = MemoryRepository()
    seed(store, DEMO_USER_ID, (clock or (lambda: datetime.now(timezone.utc)))(), DEMO_NAME)
    settings = Settings(supabase_url=f'http://{HOST}', supabase_key='standalone-demo', demo_mode=True, standalone=True,
                        twilio_account_sid='ACstandalone', twilio_auth_token='standalone', twilio_from='+15005550006')
    app = create_app(settings=settings, store=store, http=httpx.Client(transport=services, timeout=10), clock=clock)
    app.state.standalone = services

    @app.post('/auth/demo', tags=['Account'], include_in_schema=False)
    def demo_session(response: Response):
        """Signs the app in as the demo driver, so a presenter never types a login. Exists only in this server."""
        response.headers['Cache-Control'] = 'no-store'
        return {'session': services.session(demo_user)}

    return app


app = create_standalone_app()
print(f'BUCKL standalone demo: the app signs itself in as {DEMO_EMAIL}. '
      f'To type a login instead, the password is {app.state.standalone.demo_password}. '
      'Nothing is stored or sent outside this machine.')
