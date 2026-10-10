import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { useLocation, useSearchParams } from 'react-router';
import { IconButton, ScanLine } from '../../components';
import { EASE, transitionFor } from '../../routing/transitions';
import { Art, useCarNavigation } from './shared';
import { useRearCamera } from './useRearCamera';
import { useCarSession } from './session';
import { DashboardSample } from './DashboardSample';
import { LoadingCard } from './LoadingCard';

const MINIMUM_READING_MS = 1000;

/** Camera sheet for C2 Scan a warning light, with the C2b Reading the light card over it. */
export function ScanAWarningLight() {
  const [params] = useSearchParams(); const preview = params.has('preview'); const present = useIsPresent(); const reducedMotion = Boolean(useReducedMotion());
  const location = useLocation(); const go = useCarNavigation(); const { savePhoto, analyseDashboard, notify } = useCarSession();
  const reading = location.pathname.endsWith('/reading-the-light');
  const camera = useRearCamera(present && !preview && !reading);
  const dialog = useRef<HTMLDialogElement>(null); const closing = useRef(false); const alive = useRef(true); const active = useRef(present);
  const generation = useRef(0); const [capturing, setCapturing] = useState(false); const [captureError, setCaptureError] = useState('');
  useLayoutEffect(() => { active.current = present; if (!present) generation.current++; }, [present]);
  const close = () => { if (closing.current) return; closing.current = true; camera.stop(); go('car-check', true); };
  const finish = (to: string) => { if (closing.current) return; closing.current = true; go(to); };
  const read = async (photo: Blob, request: number) => {
    const started = performance.now(); let next = 'warning-light-result';
    try { const result = await analyseDashboard(photo); if (!result.findings.length) next = 'couldnt-read-the-light'; }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not read the dashboard photo.'); next = 'couldnt-read-the-light'; }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, MINIMUM_READING_MS - (performance.now() - started))));
    if (alive.current && request === generation.current) finish(next);
  };
  const takePhoto = async () => {
    if (closing.current || capturing || reading) return;
    if (preview) { go('reading-the-light', false, true); return; }
    const request = generation.current; setCapturing(true); setCaptureError('');
    try {
      const blob = await camera.capture();
      if (closing.current || !alive.current || !active.current || request !== generation.current) return;
      // The photo leaves the phone only now, after the user took it.
      savePhoto(blob); camera.stop(); go('reading-the-light', false, true);
      void read(blob, request);
    } catch { if (alive.current && active.current && request === generation.current) setCaptureError('Couldn’t take the photo. Try again.'); }
    finally { if (alive.current) setCapturing(false); }
  };
  useEffect(() => {
    alive.current = true; const element = dialog.current; const focus = document.activeElement; const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; element?.showModal(); element?.focus();
    return () => { alive.current = false; element?.close(); document.body.style.overflow = overflow; if (focus instanceof HTMLElement && focus.isConnected) focus.focus({ preventScroll: true }); };
  }, []);
  const status = preview ? '' : captureError || (camera.status === 'loading' ? 'Opening camera…' : camera.status === 'error' ? camera.error : '');
  return <motion.dialog ref={dialog} tabIndex={-1} className="sheet-dialog car-camera-dialog" aria-labelledby="scan-title" inert={!present} style={{ pointerEvents: present ? 'auto' : 'none' }}
    onCancel={event => { event.preventDefault(); if (!reading) close(); }} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }}
    variants={{ exit: (kind: 'push' | 'sheet') => ({ opacity: reducedMotion || kind === 'push' ? 1 : 0, transition: { duration: reducedMotion ? 0 : kind === 'push' ? 0.45 : 0.5, ease: EASE } }) }} exit="exit" transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}>
    <motion.div className="sheet-backdrop" variants={{ exit: (kind: 'push' | 'sheet') => ({ opacity: kind === 'push' ? 0 : 1, transition: { duration: 0 } }) }} exit="exit" />
    <motion.section className="scan-sheet" {...transitionFor('sheet', 1, reducedMotion)} variants={{ exit: (kind: 'push' | 'sheet') => { const value = transitionFor(kind, 1, reducedMotion); return { ...value.exit, transition: value.transition }; } }} exit="exit" data-transition="sheet">
      <div className="scan-top"><IconButton icon="Close" theme="Dark" onClick={close} disabled={reading} /></div>
      <header className="scan-heading"><h1 id="scan-title" className="text-heading-large">Scan a warning light</h1><p className="text-body-regular">Fit the dashboard inside the frame</p></header>
      <div className="scan-viewfinder">
        <video ref={camera.video} autoPlay muted playsInline className={'scan-video' + (camera.status === 'ready' ? ' scan-video--ready' : '')} aria-label="Rear camera view" />
        {preview && <><div className="scan-sample"><DashboardSample /></div><span className="scan-detection" /><span className="scan-tag text-label-small">Engine temperature</span></>}
        <ScanLine active={!reading} />
        <Art name="scan-corners.svg" className="scan-corners" />
      </div>
      <div className="scan-shutter-wrap"><button type="button" className="scan-shutter" aria-label="Take photo" disabled={capturing || reading || (!preview && camera.status !== 'ready')} onClick={() => void takePhoto()}><Art name="scan-shutter.svg" /></button></div>
      {status && !reading && <p className="scan-status text-body-small" role={captureError || camera.status === 'error' ? 'alert' : 'status'}>{status}{camera.status === 'error' && <button type="button" className="scan-retry text-body-small-strong" onClick={camera.retry}>Try camera again</button>}</p>}
      {reading && <LoadingCard title="Reading the light…">Checking it against 12 common warning lights</LoadingCard>}
    </motion.section>
  </motion.dialog>;
}
