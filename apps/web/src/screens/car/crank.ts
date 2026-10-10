/**
 * Times an engine start from the microphone loudness envelope.
 *
 * Cranking (starter motor turning the engine) makes a loud, pulsing sound:
 * the loudness rises and falls with each compression stroke, several times a
 * second. Once the engine catches, the sound becomes a smooth idle. We find
 * when the sound starts, then when the pulsing stops, and report the gap.
 * Signal processing only, not a diagnosis: a long crank MAY mean a weak battery.
 */
export type LevelSample = { t: number; level: number }; // t in ms

const WINDOW_MS = 300;      // window for measuring pulsing
const SETTLE_MS = 450;      // pulsing must stay low this long to count as "caught"
const PULSING = 0.1;        // 4-15 Hz wobble / loudness above this = cranking
const MIN_CRANK_S = 0.2, MAX_CRANK_S = 6;

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0;
};
const smooth = (points: LevelSample[], halfMs: number) => points.map(p => {
  const near = points.filter(q => Math.abs(q.t - p.t) <= halfMs);
  return { t: p.t, level: near.reduce((a, q) => a + q.level, 0) / near.length };
});

export function crankSeconds(samples: LevelSample[]): number | null {
  if (samples.length < 20) return null;
  const t0 = samples[0].t;
  const raw = samples.map(s => ({ t: s.t - t0, level: s.level }));
  const end = raw[raw.length - 1].t;
  // ~50 ms smoothing removes idle ripple (25+ firings a second) but keeps crank pulses (5-10 a second).
  const env = smooth(raw, 25);
  const slow = smooth(env, 125);                                 // the overall loudness, without the pulses
  const wobble = env.map((p, i) => ({ t: p.t, level: p.level - slow[i].level }));
  const quiet = percentile(slow.map(p => p.level), .1);
  const loud = percentile(slow.map(p => p.level), .95);
  if (loud <= 0.002 || loud < quiet * 2) return null;           // never got clearly louder than the background
  const on = quiet + (loud - quiet) * .3;

  // 1. Onset: first moment the overall loudness stays above the threshold for 100 ms.
  let onset: number | null = null;
  for (const p of slow) {
    const held = slow.filter(q => q.t >= p.t && q.t < p.t + 100);
    if (held.length >= 3 && held.every(q => q.level > on)) { onset = p.t; break; }
  }
  if (onset === null || onset < 150) return null;              // already loud when recording began: no start to time

  const pulsing = (from: number) => {
    const w = wobble.filter(q => q.t >= from && q.t < from + WINDOW_MS);
    const m = slow.filter(q => q.t >= from && q.t < from + WINDOW_MS);
    if (w.length < 4) return { ratio: 0, mean: 0 };
    const mean = m.reduce((a, q) => a + q.level, 0) / m.length;
    const rms = Math.sqrt(w.reduce((a, q) => a + q.level * q.level, 0) / w.length);
    return { ratio: mean > 0 ? rms / mean : 0, mean };
  };

  // 2. Catch: after onset, the first point where pulsing stops and stays stopped while the engine is still loud.
  for (let t = onset + 100; t + WINDOW_MS + SETTLE_MS <= end; t += 20) {
    let settled = true;
    for (let u = t; u <= t + SETTLE_MS; u += 50) {
      const { ratio, mean } = pulsing(u);
      if (ratio > PULSING || mean < on * .6) { settled = false; break; }
    }
    if (settled) {
      const seconds = (t - onset) / 1000;
      return seconds >= MIN_CRANK_S && seconds <= MAX_CRANK_S ? Math.round(seconds * 10) / 10 : null;
    }
  }
  return null;
}
