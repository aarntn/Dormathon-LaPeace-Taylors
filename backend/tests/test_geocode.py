from uuid import uuid4

import httpx
from fastapi.testclient import TestClient
from backend.app.main import create_app
from backend.app.config import Settings


def test_explicit_destination_lookup_returns_real_coordinates_and_requires_authentication():
    def upstream(request):
        if request.url.path == '/auth/v1/user':
            return httpx.Response(200, json={'id': str(uuid4())})
        assert request.url.host == 'nominatim.openstreetmap.org'
        assert request.url.params['q'] == 'Bangi'
        assert request.url.params['countrycodes'] == 'my'
        assert 'BUCKL' in request.headers['User-Agent']
        return httpx.Response(200,json=[{'lat':'2.961','lon':'101.757','display_name':'Bangi, Malaysia'}])
    app=create_app(settings=Settings(supabase_url='https://test',supabase_key='publishable'),http=httpx.Client(transport=httpx.MockTransport(upstream)))
    with TestClient(app) as client:
        assert client.get('/geocode?q=Bangi').status_code==401
        response=client.get('/geocode?q=Bangi',headers={'Authorization':'Bearer test'})
        assert response.status_code==200
        assert response.json()==[{'lat':2.961,'lng':101.757,'name':'Bangi, Malaysia'}]
