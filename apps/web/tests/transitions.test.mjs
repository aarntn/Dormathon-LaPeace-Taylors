import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionFor, navigationDirection } from '../src/routing/transitions.ts';

test('browser back reverses forward push even when returning from another transition kind', () => {
  assert.equal(navigationDirection(3, 2, 'POP'), -1);
  const back = transitionFor('push', -1, false);
  assert.equal(back.initial.x, '-100%');
  assert.equal(back.exit.x, '100%');
  assert.equal(back.transition.duration, 0.45);
  assert.equal(navigationDirection(2, 3, 'POP'), 1);
});

test('sheet, drive cross-fade and tab preserve their specified timings', () => {
  assert.equal(transitionFor('sheet', 1, false).initial.y, '100%');
  assert.equal(transitionFor('sheet', -1, false).exit.y, '100%');
  assert.equal(transitionFor('sheet', 1, false).transition.duration, 0.5);
  assert.equal(transitionFor('fade', 1, false).transition.duration, 0.3);
  assert.equal(transitionFor('tab', 1, false).transition.duration, 0.2);
  assert.deepEqual(transitionFor('fade', 1, false).initial, { opacity: 0 });
});

test('reduced motion removes movement and animation delay', () => {
  for (const kind of ['push', 'sheet', 'fade', 'tab']) {
    const result = transitionFor(kind, 1, true);
    assert.deepEqual(result.initial, { opacity: 1 });
    assert.equal(result.transition.duration, 0);
  }
});
