from fastapi.testclient import TestClient

from backend.app.standalone import DEMO_EMAIL, DEMO_PASSWORD, create_standalone_app

SIGN_IN = {'grant_type': 'password', 'email': DEMO_EMAIL, 'password': DEMO_PASSWORD}


def make():
    lines = []
    client = TestClient(create_standalone_app(announce=lines.append))
    return client, lines


def sign_in(client, body=SIGN_IN):
    response = client.post('/auth/token', json=body)
    assert response.status_code == 200, response.text
    client.headers['Authorization'] = 'Bearer ' + response.json()['session']['access_token']
    return response.json()['session']


def test_accounts_are_configured_and_the_demo_account_is_ready():
    client, _ = make()
    assert client.get('/auth/config').json() == {'configured': True}
    assert client.get('/health').json()['demo_mode'] is True
    session = sign_in(client)
    assert session['user']['user_metadata']['name'] == 'Aaron'
    assert len(client.get('/trips').json()) == 12 and client.get('/cars').json()[0]['plate'] == 'WXY 4821'


def test_a_new_driver_can_sign_up_and_starts_with_nothing():
    client, _ = make()
    signup = client.post('/auth/signup', json={'email': 'new@example.test', 'password': 'a-long-password', 'name': 'Jamie'}).json()
    assert signup['confirmation_required'] is False and signup['session']['user']['user_metadata']['name'] == 'Jamie'
    client.headers['Authorization'] = 'Bearer ' + signup['session']['access_token']
    assert client.get('/cars').json() == [] and client.get('/trips').json() == []
    car = client.post('/cars', json={'make': 'Perodua', 'model': 'Axia', 'year': 2020}).json()
    assert client.get('/cars').json()[0]['id'] == car['id']


def test_accounts_are_separate_and_bad_logins_are_refused():
    client, _ = make()
    assert client.post('/auth/token', json=SIGN_IN | {'password': 'wrong'}).status_code == 400
    assert client.post('/auth/signup', json={'email': DEMO_EMAIL, 'password': 'another-password', 'name': 'Copy'}).status_code == 422
    client.headers['Authorization'] = 'Bearer not-a-real-token'
    assert client.get('/cars').status_code == 401
    other = client.post('/auth/signup', json={'email': 'b@example.test', 'password': 'a-long-password', 'name': 'B'}).json()['session']
    client.headers['Authorization'] = 'Bearer ' + other['access_token']
    assert client.get('/trips').json() == []


def test_refresh_and_sign_out_work():
    client, _ = make()
    session = sign_in(client)
    refreshed = client.post('/auth/token', json={'grant_type': 'refresh_token', 'refresh_token': session['refresh_token']}).json()['session']
    assert refreshed['access_token'] != session['access_token']
    assert client.post('/auth/logout').status_code == 204
    assert client.get('/cars').status_code == 401


def test_a_test_text_is_simulated_and_printed_not_sent():
    client, lines = make()
    sign_in(client)
    contact = client.get('/emergency-contacts').json()[0]
    result = client.post(f"/emergency-contacts/{contact['id']}/test", headers={'Idempotency-Key': 'standalone-test'}).json()
    assert result['status'] == 'sent' and result['test'] is True
    assert any('simulated SMS' in line and contact['phone'] in line for line in lines)


def test_car_checks_use_the_scripted_demo_results():
    client, _ = make()
    sign_in(client)
    car = client.get('/cars').json()[0]['id']
    scan = client.post('/car-checks/dashboard', data={'car_id': car, 'demo_scenario': 'battery'}, files={'photo': ('d.jpg', b'\xff\xd8\xff\xd9', 'image/jpeg')}).json()
    assert scan['stub'] is True and scan['findings'][0]['urgency'] == 'soon'
