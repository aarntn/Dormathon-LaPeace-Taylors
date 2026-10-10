import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, checkedLabel, firstSentence, sentences, worstFinding } from '../src/screens/car/report.ts';
import { nightBlocks } from '../src/screens/trips/patterns.ts';

const finding = (label, urgency, advice = 'Do this. Then that.') => ({ id: label, label, urgency, urgency_label: urgency, advice, confidence: 0.9, photo_url: null });
const startup = (urgency, crank = 2.8) => ({ id: 's', at: '2026-10-10T00:00:00Z', crank_seconds: crank, verdict: 'v', urgency, urgency_label: 'Book a check soon', stub: false });
const brakes = urgency => ({ hard_stops_per_week: [1, 2, 3, 3, 4, 5], trend_per_week: 1, urgency, urgency_label: 'Book service soon', verdict: 'v', score_source: 'demo_rule' });

test('report counts only items that need attention and estimates cost from them', () => {
  const report = buildReport({ id: 'd', findings: [finding('Oil light', 'monitor')], stub: false }, startup('soon'), brakes('soon'));
  assert.equal(report.items.length, 3);
  assert.deepEqual(report.attention.map(item => item.key), ['battery', 'brakes']);
  assert.equal(report.estimate, 'RM 320–600');
});
test('a healthy report has no estimate and no attention items', () => {
  const report = buildReport(undefined, startup('monitor'), brakes('monitor'));
  assert.equal(report.attention.length, 0);
  assert.equal(report.estimate, undefined);
  assert.ok(report.items.every(item => item.tone === 'success'));
});
test('an empty dashboard scan reads as no lights, and no data gives an empty report', () => {
  assert.equal(buildReport({ id: 'd', findings: [], stub: false }).items[0].description, 'Monitor · no lights at your last scan');
  assert.equal(buildReport().items.length, 0);
});
test('the most urgent finding comes first', () => {
  const dashboard = { id: 'd', findings: [finding('a', 'monitor'), finding('b', 'stop'), finding('c', 'soon')], stub: false };
  assert.equal(worstFinding(dashboard).label, 'b');
  assert.equal(worstFinding(undefined), undefined);
});
test('advice splits into sentences', () => {
  assert.equal(firstSentence('Pull over. Wait.'), 'Pull over.');
  assert.deepEqual(sentences('A. B! C?'), ['A.', 'B!', 'C?']);
});
test('checked label uses plain days', () => {
  assert.equal(checkedLabel(undefined), 'not yet');
  assert.equal(checkedLabel(new Date().toISOString()), 'today');
  assert.equal(checkedLabel(new Date(Date.now() - 86_400_000 * 1.5).toISOString()), 'yesterday');
  assert.equal(checkedLabel(new Date(Date.now() - 86_400_000 * 5).toISOString()), '5 days ago');
});
test('night chart starts at 6 am and marks 9 pm to 6 am as night', () => {
  const slots = [0, 3, 6, 9, 12, 15, 18, 21].map((from_hour, index) => ({ from_hour, tired_alerts: index }));
  const blocks = nightBlocks(slots);
  assert.deepEqual(blocks.map(block => block.label), ['6a', '9a', '12p', '3p', '6p', '9p', '12a', '3a']);
  assert.deepEqual(blocks.map(block => block.count), [2, 3, 4, 5, 6, 7, 0, 1]);
  assert.deepEqual(blocks.map(block => block.night), [false, false, false, false, false, true, true, true]);
  assert.equal(nightBlocks([]).every(block => block.count === 0), true);
});
