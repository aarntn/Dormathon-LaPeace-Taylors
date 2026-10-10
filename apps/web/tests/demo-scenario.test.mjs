import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.sessionStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
const { getScenario, setScenario, dashboardScenarios, startupScenarios } = await import('../src/screens/car/demoScenario.ts');

test('a chosen demo scenario is remembered for the session and can be cleared', () => {
  assert.equal(getScenario('dashboard'), null);
  setScenario('dashboard', 'battery');
  setScenario('startup', 'quiet');
  assert.equal(getScenario('dashboard'), 'battery');
  assert.equal(getScenario('startup'), 'quiet');
  setScenario('dashboard', null);
  assert.equal(getScenario('dashboard'), null);
  assert.equal(getScenario('startup'), 'quiet');
});
test('the scenarios offered match the ones the server knows', () => {
  assert.deepEqual(dashboardScenarios.map(([value]) => value), ['overheating', 'battery', 'oil', 'unreadable']);
  assert.deepEqual(startupScenarios.map(([value]) => value), ['slow', 'normal', 'quiet']);
});
test('storage that throws never breaks the panel', () => {
  globalThis.sessionStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(getScenario('dashboard'), null);
  assert.doesNotThrow(() => setScenario('dashboard', 'oil'));
});
