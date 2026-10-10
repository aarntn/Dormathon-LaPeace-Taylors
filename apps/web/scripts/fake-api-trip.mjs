import assert from 'node:assert/strict';
import { createApi } from '../src/api.ts';

const baseUrl = process.argv[2];
if (!baseUrl?.startsWith('http://127.0.0.1:')) throw new Error('Use the Python fake-trip runner to supply a temporary loopback server.');
const api = createApi({baseUrl, getAccessToken: () => 'valid'});
const advance = async seconds => {
  const response = await fetch(`${baseUrl}/__fake/advance?seconds=${seconds}`, {method:'POST'});
  assert.ok(response.ok); return (await response.json()).at;
};
await api.saveProfile('Aaron');
const car = await api.createCar({make:'Perodua',model:'Myvi',year:2022});
const contact = await api.createContact({name:'Demo contact',phone:'+60111111111',share_live_location:true,text_when_ok:true});
const predrive = await api.predrive({slept:8,awake:4,taps_ms:[250,260,270],misses:0,hour:12,
  alert_self:'very_alert',trip_length:'under_30',face_perclos:.05,face_mean_blink_ms:100,face_yawns:0});
assert.equal(predrive.level,'safe');
const routeOptions = await api.routeOptions({lat:3,lng:101.6},{lat:3,lng:101.7});
const trip = await api.startTrip({car_id:car.id,predrive_id:predrive.id,route_choice:'safer',
  origin:{lat:3,lng:101.6},destination:{lat:3,lng:101.7}});
const at = await advance(600);
const start = Date.parse(trip.started_at);
const points = [0,300,600].map((seconds,index) => ({at:new Date(start+seconds*1000).toISOString(),lat:3,lng:101.6+index*.01,speed_kmh:30}));
assert.equal((await api.sendPoints(trip.id,points)).accepted,3);
assert.equal((await api.sendPoints(trip.id,points)).accepted,0);
for (const seconds of [580,590]) {
  const event = {at:new Date(start+seconds*1000).toISOString(),kind:'hard_brake',lat:3,lng:101.61};
  await api.sendEvent(trip.id,event);
}
await api.sendFeatures(trip.id,{perclos:.08,blink_rate:12,mean_blink_ms:150,yawns:0,minutes_driving:10,hour_of_day:12,hard_brakes:2});
// This fixture advances the complete simulated countdown before escalation.
await advance(10);
const emergency = await api.emergency(trip.id,{lat:3,lng:101.62},'fake-countdown-one');
assert.ok(emergency.alerts.every(a=>a.status==='sent'));
await api.emergency(trip.id,{lat:3,lng:101.62},'fake-countdown-one');
const updateAt = await advance(120);
for (const alert of emergency.alerts) {
  await api.emergencyLocation(alert.id,{at:updateAt,lat:3.01,lng:101.63});
  await api.resolveEmergency(alert.id);
}
const testText = await api.testContact(contact.id,'fake-trip-test');
assert.equal(testText.status,'sent');
await api.testContact(contact.id,'fake-trip-test');
await api.endTrip(trip.id);
const summary = await api.summary(trip.id);
assert.equal(summary.hard_brake_count,2);assert.equal(summary.safety_score,92);
assert.equal(summary.score_source,'demo_rule');assert.equal(summary.route_polyline.length,3);
assert.ok(summary.avg_speed_kmh>0);
const shops = await api.workshops({lat:3.05,lng:101.6},'brakes');
assert.equal(shops.workshops[0].name,'Brake shop');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),mode:'fake',transport:'api.ts → local HTTP → FastAPI',
  predrive,routeOptions,testText,summary},null,2));
