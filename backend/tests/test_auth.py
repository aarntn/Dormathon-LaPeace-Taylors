import json

import httpx
from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.main import create_app


def auth_app(handler, **settings):
    return TestClient(create_app(settings=Settings(supabase_url='https://auth.test',
        supabase_key='publishable', **settings), http=httpx.Client(transport=httpx.MockTransport(handler))))


def test_signup_confirmation_has_no_invented_session():
    def upstream(request):
        assert request.url.path == '/auth/v1/signup'
        assert request.headers['apikey'] == 'publishable'
        assert json.loads(request.content)['data'] == {'name': 'Aaron'}
        return httpx.Response(200, json={'id': 'user', 'email': 'aaron@example.com'})
    with auth_app(upstream) as client:
        response = client.post('/auth/signup', json={'name': 'Aaron', 'email': 'aaron@example.com', 'password': 'strong-pass'})
        assert response.status_code == 200
        assert response.json() == {'session': None, 'confirmation_required': True}
        assert response.headers['cache-control'] == 'no-store'


def test_password_and_refresh_proxy_never_use_privileged_key():
    def upstream(request):
        assert request.url.path == '/auth/v1/token'
        assert request.url.params['grant_type'] in ('password', 'refresh_token')
        assert 'Authorization' not in request.headers
        return httpx.Response(200, json={'access_token': 'jwt', 'refresh_token': 'refresh',
            'expires_in': 3600, 'user': {'id': 'user', 'email': 'aaron@example.com', 'user_metadata': {'name': 'Aaron'}}})
    with auth_app(upstream) as client:
        for body in [{'grant_type': 'password', 'email': 'aaron@example.com', 'password': 'strong-pass'},
                     {'grant_type': 'refresh_token', 'refresh_token': 'refresh'}]:
            response = client.post('/auth/token', json=body)
            assert response.status_code == 200
            assert response.json()['session']['access_token'] == 'jwt'
            assert response.headers['cache-control'] == 'no-store'


def test_auth_failure_and_missing_configuration_are_honest():
    with auth_app(lambda r: httpx.Response(400, json={'msg': 'Invalid login credentials'})) as client:
        response = client.post('/auth/token', json={'grant_type': 'password', 'email': 'aaron@example.com', 'password': 'bad-pass'})
        assert response.status_code == 400 and response.json()['detail'] == 'Invalid login credentials'
    with TestClient(create_app(settings=Settings(supabase_url='', supabase_key=''))) as client:
        assert client.get('/auth/config').json() == {'configured': False}
        assert client.post('/auth/signup', json={'name': 'Aaron', 'email': 'aaron@example.com', 'password': 'strong-pass'}).status_code == 503


def test_logout_is_local_session_only_and_requires_bearer():
    def upstream(request):
        assert request.url.path == '/auth/v1/logout'
        assert request.url.params['scope'] == 'local'
        assert request.headers['authorization'] == 'Bearer jwt'
        return httpx.Response(204)
    with auth_app(upstream) as client:
        assert client.post('/auth/logout').status_code == 401
        assert client.post('/auth/logout', headers={'Authorization': 'Bearer jwt'}).status_code == 204
