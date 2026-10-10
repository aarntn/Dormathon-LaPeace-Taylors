import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, ApiError } from '../src/api.ts';

test('typed client sends a fresh bearer token, batches points and encodes map coordinates', async () => {
  const calls = []; let token = 'one';
  const api = createApi({ baseUrl: '/api', getAccessToken: () => token, fetcher: async (url, init) => {
    calls.push({url, init}); return Response.json({accepted: 1});
  }});
  const points = [{at: '2026-10-10T00:00:00Z', lat: 3, lng: 101, speed_kmh: 30}];
  assert.deepEqual(await api.sendPoints('trip', points), {accepted: 1});
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer one');
  assert.deepEqual(JSON.parse(calls[0].init.body), {points});
  token = 'two'; await api.routeOptions({lat: 3, lng: 101}, {lat: 4, lng: 102});
  assert.equal(calls[1].init.headers.get('Authorization'), 'Bearer two');
  const url = new URL(calls[1].url, 'https://local.test');
  assert.equal(url.searchParams.get('from'), '3,101'); assert.equal(url.searchParams.get('to'), '4,102');
});

test('test texts require an explicit stable key; multipart requests let fetch set the boundary', async () => {
  const calls = [];
  const api = createApi({getAccessToken: () => 'jwt', fetcher: async (url, init) => {calls.push(init); return Response.json({status:'sent'});}});
  await api.testContact('contact', 'retry-key');
  assert.equal(calls[0].headers.get('Idempotency-Key'), 'retry-key');
  await api.dashboardCheck('car', new Blob(['photo'], {type:'image/jpeg'}));
  assert.ok(calls[1].body instanceof FormData);
  assert.equal(calls[1].headers.has('Content-Type'), false);
});

test('API failures preserve status and detail without automatic emergency resubmission', async () => {
  let count = 0;
  const api = createApi({getAccessToken: () => 'jwt', fetcher: async () => {count++; return Response.json({detail:'Passenger mode'}, {status:409});}});
  await assert.rejects(api.emergency('trip', {lat:3,lng:101}, 'countdown-one'), error => error instanceof ApiError && error.status === 409 && error.message === 'Passenger mode');
  assert.equal(count, 1);
  const signedOut = createApi({getAccessToken: () => null, fetcher: () => assert.fail('Unauthenticated network call')});
  await assert.rejects(signedOut.trips(), /Sign in/);
});
