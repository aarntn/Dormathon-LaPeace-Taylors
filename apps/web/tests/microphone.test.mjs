import test from 'node:test';
import assert from 'node:assert/strict';
import { microphoneLevel, MicrophoneMeter } from '../src/components/motion/microphone.ts';

test('loudness reflects actual samples, with silence at zero and bounded peaks', () => {
  assert.equal(microphoneLevel(new Float32Array(8)), 0);
  assert.ok(microphoneLevel(new Float32Array([.1, -.1])) > 0);
  assert.ok(microphoneLevel(new Float32Array([.5, -.5])) > microphoneLevel(new Float32Array([.1, -.1])));
  assert.equal(microphoneLevel(new Float32Array([2, -2])), 1);
});

function fixture() {
  let callback, closes = 0, disconnects = 0, stops = 0;
  const analyser = { fftSize: 0, getFloatTimeDomainData: samples => samples.fill(.25), disconnect: () => disconnects++ };
  const source = { connect: target => assert.equal(target, analyser), disconnect: () => disconnects++ };
  const context = { state: 'running', createAnalyser: () => analyser, createMediaStreamSource: () => source, close: async () => { closes++; }, resume: async () => {} };
  const stream = { getAudioTracks: () => [{ readyState: 'live', stop: () => stops++ }] };
  const frames = new Map();
  const deps = { createContext: () => context, requestFrame: fn => { callback = fn; frames.set(1, fn); return 1; }, cancelFrame: id => frames.delete(id) };
  return { deps, stream, sample: () => callback(), counts: () => ({ closes, disconnects, stops, frames: frames.size }) };
}

test('meter uses an existing stream, samples it and releases its own resources', async () => {
  const f = fixture(); const levels = []; const meter = new MicrophoneMeter(f.deps);
  await meter.start(f.stream, level => levels.push(level)); f.sample();
  assert.ok(levels[0] > 0); meter.stop();
  assert.deepEqual(f.counts(), { closes: 1, disconnects: 2, stops: 0, frames: 0 });
  f.sample(); assert.equal(levels.length, 1, 'stale frame cannot emit after stop');
});

test('late audio resume after stop never starts sampling or emits a level', async () => {
  const f = fixture(); let resume; let frames = 0, closes = 0;
  const context = { state: 'suspended', createAnalyser: () => ({ fftSize: 0 }), createMediaStreamSource: () => ({ connect() {}, disconnect() {} }), resume: () => new Promise(resolve => resume = resolve), close: async () => { closes++; } };
  const meter = new MicrophoneMeter({ ...f.deps, createContext: () => context, requestFrame: () => { frames++; return 1; } });
  const pending = meter.start(f.stream, () => assert.fail('late sample'));
  meter.stop(); resume(); await pending;
  assert.equal(frames, 0); assert.equal(closes, 1);
});
