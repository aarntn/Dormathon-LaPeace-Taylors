import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '../../routing/transitions';
import { MicrophoneMeter } from './microphone';
import { useMotionAnimation } from './useMotionAnimation';
import { useReducedMotionPreference as useReducedMotion } from './useReducedMotionPreference';

// Original heights from Figma Motion Phase A/B/C, not generated noise.
const phases = [
  [14,24,18,32,22,40,28,36,20,30,44,24,16,34,28,20,38,26,18,32,24,14,20,26,18,22,10,8,10,6,8,6,10,8,6,8],
  [42,27,46,19,48,15,47,24,44,32,39,39,32,44,24,47,15,48,19,46,27,42,35,36,41,29,16,7,17,6,17,8,16,11,14,13],
  [48,20,43,37,28,47,12,46,31,34,44,16,48,24,40,40,24,48,16,44,34,31,46,12,47,28,13,15,7,17,7,15,13,10,16,6],
];

function WaveformBar({ index, level, active, reduced }: { index: number; level: number | null; active: boolean; reduced: boolean | null }) {
  const height = phases[0][index];
  const controls = useMotionAnimation(level !== null ? { height: reduced ? height : 6 + level * (phases[2][index] - 6), opacity: reduced ? .35 + level * .65 : 1 }
    : !active ? { height: 6, opacity: .4 } : reduced ? { height, opacity: [.4, 1, .4] } : { height: [...phases.map(phase => phase[index]), height], opacity: 1 },
    { duration: level !== null ? .08 : .96, repeat: level === null && active ? Infinity : 0, ease: EASE, ...(reduced ? { height: { duration: 0 } } : {}) });
  return <motion.span style={{ left: `${index * 9.25 / 330 * 100}%` }} initial={{ height }} animate={controls} />;
}

export function Waveform({ stream, active = true, onUnavailable, className = '' }: {
  stream?: MediaStream | null; active?: boolean; onUnavailable?: () => void; className?: string;
}) {
  const reduced = useReducedMotion();
  const [reading, setReading] = useState<{ stream: MediaStream; level: number } | null>(null);
  useEffect(() => {
    if (!stream || !active) return;
    const meter = new MicrophoneMeter();
    let disposed = false;
    const unavailable = () => { meter.stop(); if (!disposed) { setReading(null); onUnavailable?.(); } };
    const tracks = stream.getAudioTracks();
    tracks.forEach(track => track.addEventListener('ended', unavailable));
    void meter.start(stream, level => { if (!disposed) setReading({ stream, level }); }).catch(unavailable);
    return () => { disposed = true; tracks.forEach(track => track.removeEventListener('ended', unavailable)); meter.stop(); };
  }, [stream, active, onUnavailable]);
  const level = active && reading && reading.stream === stream ? reading.level : null;
  return <div className={`waveform ${className}`} data-waveform-source={level === null ? 'fallback' : 'microphone'} aria-hidden="true">
    {phases[0].map((_, index) => <WaveformBar key={index} index={index} level={level} active={active} reduced={reduced} />)}
  </div>;
}
