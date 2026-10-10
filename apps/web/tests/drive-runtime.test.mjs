import test from 'node:test';
import assert from 'node:assert/strict';
const {DriveRuntime}=await import('../src/screens/drive/runtime.ts').catch(()=>({}));
const point={at:'2026-10-10T00:00:01Z',lat:3,lng:101,speed_kmh:40};
function api(){const calls=[];return {calls,sendPoints:async(id,p)=>{calls.push(['points',p]);return{};},sendEvent:async()=>{},sendFeatures:async()=>{},endTrip:async()=>{calls.push(['end']);return{safety_score:100};},emergency:async(id,p,key)=>{calls.push(['emergency',key]);return{alerts:[{id:'alert',status:'sent'}]};},resolveEmergency:async()=>({resolved_at:'2026-10-10T00:00:10Z',ok_text_status:'sent'}),emergencyLocation:async()=>{calls.push(['location']);}};}
test('countdown cancellation prevents sending and a completed retry keeps its episode key',async()=>{
  assert.ok(DriveRuntime,'DriveRuntime is missing');let now=0;const a=api();let fail=true;const emergency=a.emergency;a.emergency=async(...args)=>{if(fail){fail=false;throw new TypeError('offline');}return emergency(...args);};
  const drive=new DriveRuntime(a,()=>now);drive.attach({id:'trip',passenger_mode:false});drive.recordPoint(point);drive.beginCountdown();now=9999;await drive.tick();assert.equal(a.calls.length,0);drive.cancelCountdown();now=20000;await drive.tick();assert.equal(a.calls.length,0);
  drive.beginCountdown();const key=drive.getSnapshot().episodeKey;now=30000;await drive.tick();assert.equal(drive.getSnapshot().emergencyState,'pending');now=35000;await drive.tick();assert.equal(a.calls[0][0],'emergency');assert.equal(a.calls[0][1],key);
});
test('passenger suppresses face uploads and escalation while preserving GPS',async()=>{
  assert.ok(DriveRuntime,'DriveRuntime is missing');const a=api();const drive=new DriveRuntime(a,()=>100);drive.attach({id:'trip',passenger_mode:true});drive.recordPoint(point);drive.beginCountdown();await drive.tick();assert.equal(drive.getSnapshot().countdown,null);await drive.flush();assert.deepEqual(a.calls,[['points',[point]]]);
});
test('ending waits for GPS and events; a failed flush keeps the trip active and queue retryable',async()=>{
  assert.ok(DriveRuntime,'DriveRuntime is missing');const a=api();let fail=true;const send=a.sendPoints;a.sendPoints=async(...args)=>{if(fail)throw new Error('offline');return send(...args);};const drive=new DriveRuntime(a,()=>0);drive.attach({id:'trip',passenger_mode:false});drive.recordPoint(point);
  await assert.rejects(drive.end(),/offline/);assert.equal(drive.getSnapshot().trip.id,'trip');assert.equal(a.calls.length,0);fail=false;await drive.end();assert.deepEqual(a.calls.map(c=>c[0]),['points','end']);assert.equal(drive.getSnapshot().trip,null);
});
test('new countdown after resolution creates a new episode and location never precedes an initial send',async()=>{
  assert.ok(DriveRuntime,'DriveRuntime is missing');let now=0;const a=api();const drive=new DriveRuntime(a,()=>now);drive.attach({id:'trip',passenger_mode:false});drive.recordPoint(point);drive.beginCountdown();const first=drive.getSnapshot().episodeKey;await drive.locationTick();assert.equal(a.calls.length,0);now=10000;await drive.tick();await drive.resolve();drive.beginCountdown();assert.notEqual(drive.getSnapshot().episodeKey,first);
});
test('ending waits for an in-flight emergency and resolves it before closing the trip',async()=>{
 const a=api();let deliver;const order=[];a.emergency=()=>new Promise(r=>deliver=r);a.resolveEmergency=async()=>{order.push('resolve');return{resolved_at:'now',ok_text_status:'sent'};};a.endTrip=async()=>{order.push('end');return{safety_score:100};};
 let now=0;const d=new DriveRuntime(a,()=>now);d.attach({id:'trip',passenger_mode:false});d.recordPoint(point);d.beginCountdown();now=10000;const sending=d.tick();const ending=d.end();await new Promise(r=>setTimeout(r,0));assert.deepEqual(order,[]);deliver({alerts:[{id:'alert',status:'sent'}]});await sending;await ending;assert.deepEqual(order,['resolve','end']);
});
test('harsh braking requires recent motion evidence and GPS deceleration, with a cooldown',async()=>{
 const a=api();const events=[];a.sendEvent=async(id,e)=>events.push(e);let now=1000;const d=new DriveRuntime(a,()=>now);d.attach({id:'trip',passenger_mode:false});
 d.recordPoint({...point,speed_kmh:50});d.recordPoint({...point,at:'2026-10-10T00:00:02Z',speed_kmh:20});await d.flush();assert.equal(events.length,0);
 now=3000;d.recordMotion({x:3,y:0,z:0});d.recordPoint({...point,at:'2026-10-10T00:00:03Z',speed_kmh:50});d.recordPoint({...point,at:'2026-10-10T00:00:04Z',speed_kmh:20});await d.flush();assert.equal(events.length,1);
});
test('acknowledgement reconciles a lost response without submitting another initial text',async()=>{
 const a=api();let reject;const order=[];a.emergency=()=>{order.push('send');return new Promise((r,j)=>reject=j);};a.emergencyAlerts=async()=>{order.push('lookup');return{alerts:[{id:'possibly-sent',status:'unknown'}]};};a.resolveEmergency=async()=>{order.push('resolve');return{resolved_at:'now',ok_text_status:null};};
 let now=0;const d=new DriveRuntime(a,()=>now);d.attach({id:'trip',passenger_mode:false});d.recordPoint(point);d.beginCountdown();now=10000;const sending=d.tick();await d.resolve();reject(new TypeError('response lost'));await sending;now=16000;await d.tick();assert.deepEqual(order,['send','lookup','resolve']);assert.equal(d.getSnapshot().emergencyState,'resolved');
});
test('a new trip cannot escalate with the preceding trip location; location updates retain observation time',async()=>{
 const a=api();const locations=[];a.emergencyLocation=async(id,p)=>locations.push(p);let now=Date.parse(point.at);const d=new DriveRuntime(a,()=>now);d.attach({id:'first',passenger_mode:false});d.recordPoint(point);await d.end();d.attach({id:'second',passenger_mode:false});assert.equal(d.getSnapshot().position,null);d.beginCountdown();now+=10000;await d.tick();assert.equal(a.calls.filter(c=>c[0]==='emergency').length,0);
 const observed={...point,at:new Date(now).toISOString()};d.recordPoint(observed);await d.tick();now+=1000;await d.locationTick();assert.equal(locations[0].at,observed.at);now+=20000;await d.locationTick();assert.equal(locations.length,1);
});
test('acknowledging a request that never reached the server cancels its episode and allows trip end',async()=>{
 const a=api();let now=0;const calls=[];a.emergency=async()=>{throw new TypeError('offline');};a.emergencyAlerts=async()=>({alerts:[]});a.cancelEmergencyEpisode=async(id,p,key)=>{calls.push(key);return{alerts:[{id:'cancelled',status:'cancelled',resolved_at:'now'}]};};
 const d=new DriveRuntime(a,()=>now);d.attach({id:'trip',passenger_mode:false});d.recordPoint(point);d.beginCountdown();const key=d.getSnapshot().episodeKey;now=10000;await d.tick();await d.resolve();now=16000;await d.tick();assert.deepEqual(calls,[key]);await d.end();assert.equal(d.getSnapshot().trip,null);
});
test('acknowledging without GPS clears an episode that could never submit a text',async()=>{
 const a=api();let now=0;const d=new DriveRuntime(a,()=>now);d.attach({id:'trip',passenger_mode:false});d.beginCountdown();now=10000;await d.tick();await d.resolve();await d.end();assert.equal(d.getSnapshot().trip,null);assert.equal(a.calls.some(c=>c[0]==='emergency'),false);
});
