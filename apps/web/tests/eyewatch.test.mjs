import test from 'node:test';
import assert from 'node:assert/strict';
import { EyeEngine, Calibration, MovementGate, eyeConfig } from '../src/eyewatch/engine.ts';

const frame = (t, eyeClosed=0, jawOpen=0, faceVisible=true) => ({t,eyeClosed,jawOpen,faceVisible});
const feed = (engine, start, end, eyes=0, jaw=0, visible=true) => { let out; for(let t=start;t<=end;t+=100) out=engine.update(frame(t,eyes,jaw,visible));return out; };
test('continuous closure alarms only while moving and acknowledgement needs a reopen',()=>{
 const e=new EyeEngine(); feed(e,0,5000); assert.equal(feed(e,5100,6600,1).state,'microsleep'); assert.equal(e.snapshot.alarm,false);
 e.setMoving(true); assert.equal(e.update(frame(6700,1)).alarm,true); e.acknowledge(); assert.equal(e.update(frame(6800,1)).alarm,false);
 e.update(frame(6900)); assert.equal(feed(e,7000,8500,1).alarm,true);
});
test('lost face and frame gaps cannot count as continuous closure',()=>{
 const e=new EyeEngine(); e.setMoving(true); feed(e,0,1000,1); e.update(frame(1100,0,0,false));
 assert.equal(feed(e,1200,4100,0,0,false).state,'lost'); assert.equal(e.snapshot.alarm,false);
 assert.equal(e.update(frame(4200,1)).alarm,false); assert.equal(e.update(frame(8000,1)).alarm,false);
});
test('acknowledgement after eyes already reopened allows the next closure to alarm',()=>{
 const e=new EyeEngine();e.setMoving(true);feed(e,0,1500,1);assert.equal(e.snapshot.alarm,true);
 e.update(frame(1600));e.acknowledge();assert.equal(feed(e,1700,3200,1).alarm,true);
});
test('rolling PERCLOS uses elapsed valid time and expires old evidence',()=>{
 const e=new EyeEngine(); feed(e,0,10000); feed(e,10100,12100,1); feed(e,12200,13000);
 assert.equal(e.snapshot.state,'tired'); assert.ok(e.snapshot.perclos>.15);
 feed(e,13100,75000); assert.equal(e.snapshot.state,'alert'); assert.equal(e.snapshot.perclos,0);
});
test('mean long blinks and sustained yawns trigger tired independently',()=>{
 const e=new EyeEngine(); feed(e,0,10000); feed(e,10100,10700,1); e.update(frame(10800)); assert.ok(e.snapshot.meanBlinkMs>400);assert.equal(e.snapshot.state,'tired');
 const y=new EyeEngine({perclosTired:1,meanBlinkTiredMs:9999});let t=0;
 for(let i=0;i<3;i++){feed(y,t,t+1600,0,.8);y.update(frame(t+1700));t+=2000;}
 assert.equal(y.snapshot.yawns,3);assert.equal(y.snapshot.state,'tired'); feed(y,t,310000);assert.equal(y.snapshot.yawns,0);
});
test('features contain exactly numeric fields on the configured cadence',()=>{
 const received=[];const e=new EyeEngine({},f=>received.push(f));feed(e,0,29900);assert.equal(received.length,0);e.update(frame(30000));
 assert.equal(received.length,1);assert.deepEqual(Object.keys(received[0]).sort(),['blinkRate','hourOfDay','meanBlinkMs','minutesDriving','perclos','yawns']);assert.ok(Object.values(received[0]).every(Number.isFinite));
});
test('movement requires five seconds, rejects null and expires stale fixes',()=>{
 const m=new MovementGate();m.fix(3,0);for(let t=1000;t<=5000;t+=1000)m.fix(3,t);assert.equal(m.isMoving(5000),true);
 assert.equal(m.isMoving(11001),false);m.fix(null,12000);assert.equal(m.isMoving(12000),false);
 m.fix(3,13000);m.fix(0,15000);m.fix(3,16000);assert.equal(m.isMoving(18000),false);
 const stale=new MovementGate();stale.fix(3,0);stale.fix(3,10000);assert.equal(stale.isMoving(10000),false);
});
test('calibration needs five valid seconds and two completed blinks',()=>{
 const c=new Calibration();for(let t=0;t<=5000;t+=100)c.update(frame(t,.1));assert.equal(c.snapshot.phase,'blink');
 for(let n=0;n<2;n++){c.update(frame(5100+n*500,.9));c.update(frame(5200+n*500,.95));c.update(frame(5300+n*500,.1));}
 assert.equal(c.snapshot.phase,'ready');assert.equal(c.snapshot.blinks,2);assert.ok(c.snapshot.threshold>.4&&c.snapshot.threshold<.7);
});
test('calibration cannot complete from absent faces or flat blink scores',()=>{
 const c=new Calibration();for(let t=0;t<=10000;t+=100)c.update(frame(t,1,0,false));assert.equal(c.snapshot.phase,'look');
 for(let t=10100;t<=16100;t+=100)c.update(frame(t,.1));for(let t=16200;t<20000;t+=100)c.update(frame(t,.1));assert.notEqual(c.snapshot.phase,'ready');
});
test('all stage thresholds have a single exported configuration',()=>{assert.equal(eyeConfig.microsleepMs,1500);assert.equal(eyeConfig.targetFps,15);});
