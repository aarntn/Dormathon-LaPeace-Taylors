import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '../../routing/transitions';
import scanTrack from '../../assets/figma/motion/scan-track.svg';
import scanRing from '../../assets/figma/motion/scan-ring.svg';
import countdownTrack from '../../assets/figma/motion/countdown-track.svg';
import countdownRing from '../../assets/figma/motion/countdown-ring.svg';
import tapHalo from '../../assets/figma/motion/tap-halo.svg';
import tapDot from '../../assets/figma/motion/tap-dot.svg';
import { useMotionAnimation } from './useMotionAnimation';
import { useReducedMotionPreference as useReducedMotion } from './useReducedMotionPreference';

type BaseProps = { className?: string };
const bounded = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

function LoadingDot({ index, tone, reduced }: { index: number; tone: 'Light' | 'Dark'; reduced: boolean | null }) {
  const controls = useMotionAnimation(reduced ? { y: 3, opacity: [.3, 1, .3] } : { y: [3, 0, 3, 3], opacity: tone === 'Light' ? [.3, 1, .3, .3] : 1 },
    { duration: .84, delay: index * .28, times: reduced ? [0, .5, 1] : [0, 1 / 3, 2 / 3, 1], repeat: Infinity, ease: EASE, ...(reduced ? { y: { duration: 0 } } : {}) });
  return <motion.span style={{ left: index * 16 }} animate={controls} />;
}

export function LoadingDots({ tone = 'Dark', className = '' }: BaseProps & { tone?: 'Light' | 'Dark' }) {
  const reduced = useReducedMotion();
  return <span className={`loading-dots loading-dots--${tone.toLowerCase()} ${className}`} aria-hidden="true">
    {[0, 1, 2].map(index => <LoadingDot key={index} index={index} tone={tone} reduced={reduced} />)}
  </span>;
}

export function ProgressBar({ progress, duration = 2.2, onComplete, className = '' }: BaseProps & { progress?: number; duration?: number; onComplete?: () => void }) {
  const reduced = useReducedMotion();
  const value = progress === undefined ? 1 : bounded(progress);
  const controls = useMotionAnimation({ scaleX: value, opacity: 1 },
    { duration: progress === undefined ? duration : .2, ease: EASE, ...(reduced ? { scaleX: { duration: 0 } } : {}) },
    progress === undefined ? { scaleX: reduced ? value : .05, opacity: reduced ? .4 : 1 } : undefined);
  return <div className={`motion-progress ${className}`} role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress === undefined ? undefined : Math.round(value * 100)}>
    <motion.span animate={controls} onAnimationComplete={onComplete}
      style={{ transformOrigin: 'left' }} />
  </div>;
}

export function LiveDot({ color = 'Green', className = '' }: BaseProps & { color?: 'Green' | 'Red' }) {
  const reduced = useReducedMotion();
  const controls = useMotionAnimation(reduced ? { scale: 1, opacity: [.3, 1, .3] } : { scale: [1, 2], opacity: [1, 1] },
    { duration: 1.1, repeat: Infinity, repeatDelay: .25, ease: EASE, ...(reduced ? { scale: { duration: 0 } } : {}) });
  return <span className={`live-dot live-dot--${color.toLowerCase()} ${className}`} aria-hidden="true">
    <motion.span className="live-dot__halo" animate={controls} /><span className="live-dot__core" />
  </span>;
}

function Ring({ progress, countdown = false }: { progress: number; countdown?: boolean }) {
  const reduced = useReducedMotion();
  const value = bounded(progress);
  const mask = countdown ? countdownRing : scanRing;
  return <><img src={countdown ? countdownTrack : scanTrack} alt="" className="motion-ring__track" />
    <motion.span className="motion-ring__fill" initial={false} animate={{ '--ring-progress': value * 100 }}
      transition={{ duration: reduced ? 0 : countdown ? 1 : .2, ease: EASE }}
      style={{ maskImage: `url("${mask}")` } as CSSProperties} />
  </>;
}

export function ScanRing({ progress = 0, children, className = '' }: BaseProps & { progress?: number; children?: ReactNode }) {
  return <div className={`motion-ring motion-ring--scan ${className}`} role="progressbar" aria-label="Face reading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(bounded(progress) * 100)}>
    <Ring progress={progress} /><div className="motion-ring__content">{children}</div>
  </div>;
}

export function Countdown({ secondsLeft, totalSeconds = 10, className = '' }: BaseProps & { secondsLeft: number; totalSeconds?: number }) {
  const seconds = Number.isFinite(secondsLeft) ? Math.max(0, Math.ceil(secondsLeft)) : 0;
  return <div className={`motion-ring motion-ring--countdown ${className}`} role="timer" aria-label={`${seconds} seconds remaining`}>
    <Ring countdown progress={totalSeconds > 0 ? seconds / totalSeconds : 0} /><span className="motion-countdown-number text-heading-display">{seconds}</span>
  </div>;
}

export function AlarmFlash({ active = true, className = '' }: BaseProps & { active?: boolean }) {
  const reduced = useReducedMotion();
  const controls = useMotionAnimation({ opacity: active ? reduced ? [0, .08, 0] : [0, 0, .18, .18, 0] : 0 },
    { duration: reduced ? 1.8 : .95, times: reduced ? [0, .5, 1] : [0, .3 / .95, .55 / .95, .6 / .95, 1], repeat: active ? Infinity : 0, ease: EASE });
  return <motion.div className={`alarm-flash ${className}`} aria-hidden="true" initial={{ opacity: 0 }}
    animate={controls} />;
}

export function ScanLine({ active = true, className = '' }: BaseProps & { active?: boolean }) {
  const reduced = useReducedMotion();
  const controls = useMotionAnimation(active ? reduced ? { y: 16, opacity: [.2, 1, .2] } : { y: [16, 344], opacity: 1 } : { y: 16, opacity: 0 },
    { duration: 1.6, repeat: active ? Infinity : 0, repeatType: 'reverse', ease: EASE, ...(reduced ? { y: { duration: 0 } } : {}) });
  return <div className={`scan-line ${className}`} aria-hidden="true"><motion.div className="scan-line__sweep"
    animate={controls}><span /></motion.div></div>;
}

export function TapDot({ visible, onTap, className = '' }: BaseProps & { visible: boolean; onTap?: () => void }) {
  const reduced = useReducedMotion();
  return <div className={`tap-dot ${className}`}><motion.button type="button" aria-label="Tap the dot" disabled={!visible}
    onClick={visible ? onTap : undefined} initial={{ opacity: 0, scale: reduced ? 1 : .4 }}
    animate={{ opacity: visible ? 1 : 0, scale: reduced ? 1 : visible ? 1 : .4 }}
    transition={{ duration: visible ? .18 : .2, ease: EASE, ...(reduced ? { scale: { duration: 0 } } : {}) }}><img src={tapHalo} alt="" className="tap-dot__halo" /><img src={tapDot} alt="" className="tap-dot__core" /></motion.button></div>;
}
