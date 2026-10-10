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
const PULSING_CV = 0.15;    // average jump / mean above this = pulsing (cranking)
const MIN_CRANK_S = 0.2, MAX_CRANK_S = 6;

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0;
};

// Pulsing = average jump between neighbouring readings, relative to loudness.
// A slow rise or fall (the idle settling) barely counts; 5-10 pulses a second do.
function variation(samples: LevelSample[], from: number, to: number) {
  const values = samples.filter(s => s.t >= from && s.t < to).map(s => s.level);
  if (values.length < 4) return { cv: 0, mean: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  let jumps = 0;
  for (let i = 1; i < values.length; i++) jumps += Math.abs(values[i]-values[i-1]);
  return { cv: mean > 0 ? jumps/(values.length-1)/mean : 0, mean };
}

export function crankSeconds(samples: LevelSample[]): number | null {
  if (samples.length < 20) return null;
  const t0 = samples[0].t;
  const raw = samples.map(s => ({ t: s.t - t0, level: s.level }));
  // ~50 ms smoothing removes idle ripple (25+ firings a second) but keeps crank pulses (5-10 a second).
  const points = raw.map(p => {
    const near = raw.filter(q => Math.abs(q.t - p.t) <= 25);
    return { t: p.t, level: near.reduce((a, q) => a + q.level, 0) / near.length };
  });
  const end = points[points.length - 1].t;
  const quiet = percentile(points.map(p => p.level), .1);
  const loud = percentile(points.map(p => p.level), .95);
  if (loud < .04 || loud < quiet * 2.5) return null;          // never got clearly louder than the background
  const on = quiet + (loud - quiet) * .3;

  // 1. Onset: first moment the sound stays above the threshold for 100 ms.
  let onset: number | null = null;
  for (const p of points) {
    const held = points.filter(q => q.t >= p.t && q.t < p.t + 100);
    if (held.length >= 3 && held.every(q => q.level > on)) { onset = p.t; break; }
  }
  if (onset === null) return null;

  // 2. Catch: after onset, the first point where pulsing stops and stays stopped.
  for (let t = onset + 150; t + WINDOW_MS + SETTLE_MS <= end; t += 20) {
    let settled = true;
    for (let u = t; u <= t + SETTLE_MS; u += 50) {
      const { cv, mean } = variation(points, u, u + WINDOW_MS);
      if (cv > PULSING_CV || mean < on * .6) { settled = false; break; }
    }
    if (settled) {
      const seconds = (t - onset) / 1000;
      return seconds >= MIN_CRANK_S && seconds <= MAX_CRANK_S ? Math.round(seconds * 10) / 10 : null;
    }
  }
  return null;
}
