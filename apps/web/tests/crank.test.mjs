import test from 'node:test';
import assert from 'node:assert/strict';
import { crankSeconds } from '../src/screens/car/crank.ts';

// Synthetic start-up: background, pulsing crank, then a smooth idle (60 level readings a second).
function recording(crank, { quietFor = 1, total = 8, seed = 1, crankHz = 8, idle = .3, ripple = 0, depth = .73, scale = 1, jitter = 0 } = {}) {
  let s = seed; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (let t = 0; t < total * 1000; t += 1000 / 60) {
    const sec = t / 1000; let level;
    if (sec < quietFor) level = .01 + rand() * .01;
    else if (sec < quietFor + crank) level = .3 * (1 + depth * Math.sin(2 * Math.PI * crankHz * (sec - quietFor))) + rand() * .04;
    else level = idle + .15 * Math.exp(-(sec - quietFor - crank) / .5) + rand() * .03 + ripple * Math.sin(2 * Math.PI * 27 * sec);
    out.push({ t: 1000 + t, level: level * scale * (1 + jitter * (rand() - .5)) });
  }
  return out;
}

test('times normal, slow and very slow starts', () => {
  for (const crank of [.8, 1.5, 3]) {
    const got = crankSeconds(recording(crank));
    assert.ok(got !== null && Math.abs(got - crank) <= .35, `crank ${crank}s measured as ${got}`);
  }
});

test('works with slower pulsing and a quieter idle', () => {
  const got = crankSeconds(recording(2, { crankHz: 5, idle: .2, seed: 7 }));
  assert.ok(got !== null && Math.abs(got - 2) <= .4, `measured ${got}`);
});

test('returns null when nothing was heard or the engine never caught', () => {
  assert.equal(crankSeconds(recording(0, { quietFor: 8 })), null);
  assert.equal(crankSeconds(recording(7.5, { quietFor: .5 })), null);
});

test('fast idle ripple is not mistaken for cranking', () => {
  const got = crankSeconds(recording(1.2, { ripple: .06, seed: 3 }));
  assert.ok(got !== null && Math.abs(got - 1.2) <= .35, `measured ${got}`);
});

test('handles gentle pulsing, a quiet microphone and noisy readings', () => {
  for (const crank of [.6, 1.4, 2.6]) {
    const got = crankSeconds(recording(crank, { depth: .3, scale: .05, jitter: .4, seed: 11 }));
    assert.ok(got !== null && Math.abs(got - crank) <= .4, `crank ${crank}s measured as ${got}`);
  }
});

test('engine already running when recording starts gives no reading', () => {
  assert.equal(crankSeconds(recording(1, { quietFor: 0 })), null);
});
