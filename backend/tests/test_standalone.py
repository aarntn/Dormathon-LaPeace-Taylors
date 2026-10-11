import pytest
from fastapi.testclient import TestClient

from backend.app import standalone
from backend.app.standalone import DEMO_EMAIL, create_standalone_app


def make(environment=None):
    lines = []
    app = create_standalone_app(announce=lines.append, environment={} if environment is None else environment)
    return TestClient(app), lines, app.state.standalone


def sign_in(client, body):
    response = client.post('/auth/token', json=body)
    assert response.status_code == 200, response.text
    client.headers['Authorization'] = 'Bearer ' + response.json()['session']['access_token']
    return response.json()['session']


def password_login(services):
    return {'grant_type': 'password', 'email': DEMO_EMAIL, 'password': services.demo_password}


def demo_session(client):
    session = client.post('/auth/demo').json()['session']
    client.headers['Authorization'] = 'Bearer ' + session['access_token']
    return session


def test_the_app_can_sign_itself_in_as_the_demo_driver_with_no_typing():
    client, _, _ = make()
    assert client.get('/health').json()['standalone'] is True and client.get('/health').json()['demo_mode'] is True
    session = demo_session(client)
    assert session['user']['user_metadata']['name'] == 'Aaron'
    assert len(client.get('/trips').json()) == 12 and client.get('/cars').json()[0]['plate'] == 'WXY 4821'
    assert client.get('/emergency-contacts').json()[0]['name'] == 'Mum'


def test_typing_a_login_still_works_with_the_printed_password():
    client, _, services = make()
    assert client.get('/auth/config').json() == {'configured': True}
    session = sign_in(client, password_login(services))
    assert session['user']['user_metadata']['name'] == 'Aaron'
    assert len(client.get('/trips').json()) == 12


def test_the_password_is_random_unless_chosen_and_never_stored_in_plain_text():
    first, second = make()[2], make()[2]
    assert first.demo_password != second.demo_password
    assert make({'BUCKL_DEMO_PASSWORD': 'chosen-by-me'})[2].demo_password == 'chosen-by-me'
    assert all('password' not in user and isinstance(user['hash'], bytes) for user in first.users.values())


def test_a_new_driver_can_sign_up_and_starts_with_nothing():
    client, _, _ = make()
    signup = client.post('/auth/signup', json={'email': 'new@example.test', 'password': 'a-long-password', 'name': 'Jamie'}).json()
    assert signup['confirmation_required'] is False and signup['session']['user']['user_metadata']['name'] == 'Jamie'
    client.headers['Authorization'] = 'Bearer ' + signup['session']['access_token']
    assert client.get('/cars').json() == [] and client.get('/trips').json() == []
    car = client.post('/cars', json={'make': 'Perodua', 'model': 'Axia', 'year': 2020}).json()
    assert client.get('/cars').json()[0]['id'] == car['id']


def test_accounts_are_separate_and_bad_logins_are_refused():
    client, _, services = make()
    assert client.post('/auth/token', json=password_login(services) | {'password': 'wrong'}).status_code == 400
    assert client.post('/auth/signup', json={'email': DEMO_EMAIL, 'password': 'another-password', 'name': 'Copy'}).status_code == 422
    client.headers['Authorization'] = 'Bearer not-a-real-token'
    assert client.get('/cars').status_code == 401
    other = client.post('/auth/signup', json={'email': 'b@example.test', 'password': 'a-long-password', 'name': 'B'}).json()['session']
    client.headers['Authorization'] = 'Bearer ' + other['access_token']
    assert client.get('/trips').json() == []


def test_refresh_rotates_tokens_and_sign_out_revokes_both():
    client, _, _ = make()
    session = demo_session(client)
    refreshed = client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': session['refresh_token']}).json()['session']
    assert refreshed['access_token'] != session['access_token']
    assert client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': session['refresh_token']}).status_code == 400  # used once
    client.headers['Authorization'] = 'Bearer ' + refreshed['access_token']
    assert client.post('/auth/logout').status_code == 204
    assert client.get('/cars').status_code == 401
    assert client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': refreshed['refresh_token']}).status_code == 400


def test_sessions_expire():
    client, _, services = make()
    session = demo_session(client)
    assert client.get('/cars').status_code == 200
    real_now = services.now
    services.now = lambda: real_now() + standalone.ACCESS_SECONDS + 5
    assert client.get('/cars').status_code == 401  # access token has expired
    assert client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': session['refresh_token']}).status_code == 200
    services.now = lambda: real_now() + standalone.REFRESH_SECONDS + 5
    assert client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': session['refresh_token']}).status_code == 400


def test_the_number_of_accounts_is_capped():
    client, _, services = make()
    for n in range(standalone.MAX_USERS - len(services.users)):
        assert client.post('/auth/signup', json={'email': f'u{n}@example.test', 'password': 'a-long-password', 'name': 'U'}).status_code == 200
    assert client.post('/auth/signup', json={'email': 'one-too-many@example.test', 'password': 'a-long-password', 'name': 'U'}).status_code == 429


@pytest.mark.parametrize('name', standalone.REAL_CREDENTIALS)
def test_it_refuses_to_start_next_to_real_credentials(name):
    with pytest.raises(RuntimeError, match=name):
        create_standalone_app(environment={name: 'real-looking-value'})


def test_the_normal_app_has_no_demo_sign_in():
    from backend.app.main import create_app
    from backend.app.config import Settings
    plain = TestClient(create_app(settings=Settings(supabase_url='https://t.supabase.co', supabase_key='k')))
    assert plain.post('/auth/demo').status_code in (404, 405)
    assert plain.get('/health').json()['standalone'] is False


def test_a_test_text_is_simulated_and_printed_not_sent():
    client, lines, _ = make()
    demo_session(client)
    contact = client.get('/emergency-contacts').json()[0]
    result = client.post(f"/emergency-contacts/{contact['id']}/test", headers={'Idempotency-Key': 'standalone-test'}).json()
    assert result['status'] == 'sent' and result['test'] is True
    assert any('simulated SMS' in line and contact['phone'] in line for line in lines)


def test_car_checks_use_the_scripted_demo_results():
    client, _, _ = make()
    demo_session(client)
    car = client.get('/cars').json()[0]['id']
    scan = client.post('/car-checks/dashboard', data={'car_id': car, 'demo_scenario': 'battery'}, files={'photo': ('d.jpg', b'\xff\xd8\xff\xd9', 'image/jpeg')}).json()
    assert scan['stub'] is True and scan['findings'][0]['urgency'] == 'soon'
