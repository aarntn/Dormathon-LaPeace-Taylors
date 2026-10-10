"""Public authentication proxy using the project's publishable key, never admin access."""
from typing import Literal

import httpx
from fastapi import Header, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Credentials(BaseModel):
    model_config = ConfigDict(extra='forbid')
    email: str = Field(pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$', max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class Signup(Credentials):
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=1024)


class TokenRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    grant_type: Literal['password', 'refresh_token']
    email: str | None = None
    password: str | None = None
    refresh_token: str | None = Field(default=None, max_length=4096)

    @model_validator(mode='after')
    def validate_grant(self):
        if self.grant_type == 'password':
            Credentials(email=self.email, password=self.password)
        elif not self.refresh_token:
            raise ValueError('A refresh token is required')
        return self


def install_auth(app, settings, http):
    def upstream(path, body=None, authorization=None):
        if not settings.supabase_ready:
            raise HTTPException(503, 'Account setup is not configured yet.')
        headers = {'apikey': settings.supabase_key}
        if authorization:
            headers['Authorization'] = authorization
        try:
            result = http.post(settings.supabase_url+'/auth/v1/'+path, json=body, headers=headers)
        except httpx.HTTPError as error:
            raise HTTPException(503, 'Account service unavailable. Try again.') from error
        if result.is_error:
            data = result.json() if 'json' in result.headers.get('content-type', '') else {}
            raise HTTPException(result.status_code, data.get('msg') or data.get('message') or data.get('error_description') or 'Account request failed.')
        return result.json() if result.content else None

    def session(data):
        if not data or not data.get('access_token'):
            return None
        return {k: data[k] for k in ('access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'user') if k in data}

    @app.get('/auth/config', tags=['Account'])
    def config(response: Response):
        response.headers['Cache-Control'] = 'no-store'
        return {'configured': settings.supabase_ready}

    @app.post('/auth/signup', tags=['Account'])
    def signup(body: Signup, response: Response):
        response.headers['Cache-Control'] = 'no-store'
        data = upstream('signup', {'email': body.email, 'password': body.password, 'data': {'name': body.name.strip()}})
        value = session(data)
        return {'session': value, 'confirmation_required': value is None}

    @app.post('/auth/token', tags=['Account'])
    def token(body: TokenRequest, response: Response):
        response.headers['Cache-Control'] = 'no-store'
        payload = {'email': body.email, 'password': body.password} if body.grant_type == 'password' else {'refresh_token': body.refresh_token}
        return {'session': session(upstream('token?grant_type='+body.grant_type, payload))}

    @app.post('/auth/logout', tags=['Account'], status_code=204)
    def logout(authorization: str | None = Header(default=None)):
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(401, 'A session token is required')
        upstream('logout?scope=local', authorization=authorization)
        return Response(status_code=204, headers={'Cache-Control': 'no-store'})
