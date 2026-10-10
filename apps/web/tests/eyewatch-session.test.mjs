import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EyeWatchSession } from '../src/eyewatch/session.ts';

// Browser ownership tests with controlled API timing; real GPU inference is
// exercised separately by browser-review.mjs --eyes.
const names=['navigator','window','document','location','localStorage','performance','Worker','AudioContext','fetch','createImageBitmap','requestAnimationFrame','cancelAnimationFrame','setInterval','clearInterval'];
const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
let env,session;
const flush=()=>new Promise(r=>setTimeout(r,1));
beforeEach(()=>{
 env={now:10000,frames:0,oscillators:0,stops:0,wakeRequests:0,wakeReleases:0,rafs:new Map(),intervals:new Map(),signal:{eyeClosed:.1,jawOpen:0,faceVisible:true,eyesVisible:true,goodDistance:true}};
 let id=0;
 const track={readyState:'live',stop(){this.readyState='ended';},addEventListener(){}};
 env.stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 env.video={srcObject:null,muted:false,playsInline:false,currentTime:0,readyState:2,play:async()=>{}};
 const doc=new EventTarget();doc.hidden=false;
 const api={
  navigator:{mediaDevices:{getUserMedia:async options=>{env.constraints=options;return env.stream;}},geolocation:{watchPosition:(success,error)=>{env.gpsSuccess=success;env.gpsError=error;return 1;},clearWatch:()=>{env.gpsCleared=true;}},wakeLock:{request:async()=>{env.wakeRequests++;const lock=new EventTarget();lock.released=false;lock.release=async()=>{if(!lock.released)env.wakeReleases++;lock.released=true;lock.dispatchEvent(new Event('release'));};return env.wakePromise?await env.wakePromise:lock;}},vibrate:()=>true},
  window:{},document:doc,location:{origin:'https://example.test'},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>env.now},
  Worker:class{constructor(){env.worker=this;}postMessage(data){if(data.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',delegate:'GPU fixture'}}));else{env.frames++;data.bitmap.close();queueMicrotask(()=>this.onmessage({data:{type:'signal',t:data.t,...env.signal}}));}}terminate(){env.workerStopped=true;}},
  AudioContext:class{state='running';currentTime=0;destination={};resume=async()=>{};close=async()=>{this.state='closed';};decodeAudioData=async()=>({});createOscillator(){return {type:'',frequency:{value:0,setValueAtTime(){}},connect(){},disconnect(){},start(){env.oscillators++;},stop(){env.stops++;}};}createGain(){return {gain:{value:0,cancelScheduledValues(){},setValueAtTime(){}},connect(){},disconnect(){}};}},
  fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)}),createImageBitmap:async()=>({close(){}}),
  requestAnimationFrame:fn=>{const next=++id;env.rafs.set(next,fn);return next;},cancelAnimationFrame:n=>env.rafs.delete(n),setInterval:(fn,ms)=>{const next=++id;env.intervals.set(next,{fn,ms});return next;},clearInterval:n=>env.intervals.delete(n),
 };
 for(const [name,value] of Object.entries(api))Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 session=new EyeWatchSession();
});
afterEach(()=>{session.stop();for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
async function frame(time,mediaTime){env.now=time;env.video.currentTime=mediaTime;const [id,fn]=env.rafs.entries().next().value;env.rafs.delete(id);fn();await flush();}
function heartbeat(){[...env.intervals.values()].find(i=>i.ms===250).fn();}

test('frozen rAF camera is never processed repeatedly as fresh closure',async()=>{
 await session.start(env.video);session.setPretendMoving(true);env.signal.eyeClosed=.95;
 for(let t=10000;t<=12000;t+=100)await frame(t,0);
 assert.equal(env.frames,1);assert.equal(env.oscillators,0);
 heartbeat();env.now=15200;heartbeat();assert.equal(session.snapshot.eye.state,'lost');
});
test('GPS movement expires from measurement time, not callback receipt',async()=>{
 await session.start(env.video);
 env.gpsSuccess({timestamp:Date.now()-5000,coords:{speed:3}});heartbeat();assert.equal(session.snapshot.eye.moving,false);
 env.now=15000;env.gpsSuccess({timestamp:Date.now()-5000,coords:{speed:3}});heartbeat();assert.equal(session.snapshot.eye.moving,true);
 env.now=16100;heartbeat();assert.equal(session.snapshot.eye.moving,false);
 session.stop();env.gpsSuccess({timestamp:Date.now(),coords:{speed:10}});assert.equal(session.snapshot.gps,'Not started');
});
test('pending wake requests cannot overlap and late sentinel is released after stop',async()=>{
 let resolve;env.wakePromise=new Promise(r=>{resolve=r;});await session.start(env.video);
 document.dispatchEvent(new Event('visibilitychange'));assert.equal(env.wakeRequests,1);
 session.stop();resolve({release:async()=>{env.wakeReleases++;}});await flush();assert.equal(env.wakeReleases,1);
});
test('camera permission resolving after stop releases the acquired tracks',async()=>{
 let resolve;navigator.mediaDevices.getUserMedia=()=>new Promise(r=>{resolve=r;});
 const start=session.start(env.video);session.stop();resolve(env.stream);await start;
 assert.equal(env.stream.getTracks()[0].readyState,'ended');assert.equal(env.video.srcObject,null);
});
test('camera/model failure during alarm preserves sound until acknowledgement',async()=>{
 await session.start(env.video);session.setPretendMoving(true);env.signal.eyeClosed=.95;
 for(let t=10000;t<=11600;t+=100)await frame(t,(t-10000)/1000);
 assert.equal(session.snapshot.eye.alarm,true);assert.equal(env.oscillators,1);
 env.worker.onerror();assert.equal(session.snapshot.status,'error');assert.equal(env.stops,0);assert.equal(session.snapshot.eye.alarm,true);assert.equal(env.wakeReleases,0);
 session.acknowledge();assert.equal(env.stops,1);assert.equal(session.snapshot.eye.alarm,false);
  assert.equal(session.snapshot.eye.faceVisible,false);assert.equal(session.snapshot.eye.moving,false);assert.equal(session.snapshot.eye.state,'lost');
});
