import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, LiveDot, Waveform } from '../../components';
import { MicrophoneMeter } from '../../components/motion/microphone';
import { Art, Card, Frame, Heading, useCarNavigation } from './shared';
import { LoadingCard } from './LoadingCard';
import { useCarSession } from './session';
import { crankSeconds, type LevelSample } from './crank';

const DURATION_SECONDS = 8;
const MINIMUM_CHECKING_MS = 1000;
const QUIET_LEVEL = 0.04; // below this the phone heard no engine
const RADIUS = 106.7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** C4 Start-up battery check. It records only while this screen is listening, then uploads once. */
export function EngineSoundCheck({ checkingPreview = false }: { checkingPreview?: boolean }) {
  const go = useCarNavigation(); const [params] = useSearchParams(); const preview = params.has('preview');
  const { analyseStartup, startup, uploading, notify } = useCarSession();
  const [recording, setRecording] = useState(false); const [elapsed, setElapsed] = useState(0); const [checking, setChecking] = useState(false); const [stream, setStream] = useState<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null); const timer = useRef<number | null>(null); const discard = useRef(false); const meter = useRef<MicrophoneMeter | null>(null); const loudest = useRef(0); const levels = useRef<LevelSample[]>([]);
  const stop = () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; if (recorder.current?.state === 'recording') recorder.current.stop(); };
  const release = (media: MediaStream | null) => { media?.getTracks().forEach(track => track.stop()); meter.current?.stop(); meter.current = null; };
  useEffect(() => () => { discard.current = true; stop(); recorder.current?.stream.getTracks().forEach(track => track.stop()); meter.current?.stop(); }, []);
  const start = async () => {
    if (recording || checking || uploading) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { notify('Audio recording is not available in this browser.'); return; }
    try {
      discard.current = false; loudest.current = 0; levels.current = [];
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); // phone voice filters would flatten engine sound setStream(media);
      const chunks: BlobPart[] = []; const next = new MediaRecorder(media); recorder.current = next; setElapsed(0); setRecording(true);
      meter.current = new MicrophoneMeter(); void meter.current.start(media, level => { loudest.current = Math.max(loudest.current, level); levels.current.push({ t: performance.now(), level }); }).catch(() => undefined);
      next.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => { release(media); setStream(null); setRecording(false); if (!discard.current) void finish(new Blob(chunks, { type: next.mimeType || 'audio/webm' })); };
      next.start(); let seconds = 0;
      timer.current = window.setInterval(() => { seconds += 1; setElapsed(seconds); if (seconds >= DURATION_SECONDS) stop(); }, 1000);
    } catch { notify('Microphone access is needed to record the engine start.'); }
  };
  const finish = async (audio: Blob) => {
    if (!audio.size || loudest.current < QUIET_LEVEL) { go('didnt-hear-the-engine'); return; }
    const crank = crankSeconds(levels.current); levels.current = [];
    if (crank === null) { go('didnt-hear-the-engine'); return; }
    setChecking(true); const started = performance.now(); let failed = false;
    try { await analyseStartup(audio, crank); } catch (error) { failed = true; notify(error instanceof Error ? error.message : 'Could not save the start-up recording.'); }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, MINIMUM_CHECKING_MS - (performance.now() - started))));
    if (!discard.current) { setChecking(false); if (failed) go('didnt-hear-the-engine'); }
  };
  const shown = recording ? elapsed : startup || checkingPreview ? DURATION_SECONDS : 0;
  const warning = startup ? startup.urgency !== 'monitor' : false;
  return <Frame back="car-check" className="car-engine" footer={<Button label={recording ? 'Recording…' : startup ? 'See my report' : 'Record start-up'} onClick={startup && !recording ? () => go('car-report') : () => void start()} disabled={recording || checking || checkingPreview} />}>
    <Heading title="Start-up battery check">We only listen while you start the engine. It can flag a possible weak battery, not every engine fault.</Heading>
    <div className="car-recorder">
      <Art name="93915.svg" className="car-recorder-track" />
      <svg className="car-recorder-arc" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--brand-navy)" strokeWidth="6.6" strokeDasharray={`${CIRCUMFERENCE * Math.min(1, shown / DURATION_SECONDS)} ${CIRCUMFERENCE}`} transform="rotate(-90 110 110)" /></svg>
      {(recording || preview) && <div className="car-listening text-body-small-strong"><LiveDot color="Red" />Listening</div>}
      <p className="car-recorded-time text-heading-display">{clock(shown)}</p>
      <p className="car-recording-duration text-body-small">{recording ? 'Start your engine now' : startup ? 'Recorded' : 'Tap record, then start your engine'}</p>
      <div className="car-waveform"><Waveform stream={stream} active={recording} /></div>
    </div>
    <section className="car-heard"><h2 className="text-body-strong">What we heard</h2>
      {startup ? <Card title={startup.crank_seconds && warning ? `Slow start: ${startup.crank_seconds} s` : startup.verdict} description={startup.stub ? 'A demo indication, not a vehicle diagnosis.' : undefined} icon={warning ? 'de6af.svg' : '90ace.svg'} tone={warning ? 'warning' : 'success'} aside={<span className={'text-body-small-strong ' + (warning ? 'car-warning' : 'car-success')}>{warning ? 'Check' : 'Normal'}</span>} />
        : <p className="car-heard-empty text-body-small">Your result will appear here after the recording.</p>}
    </section>
    {(checking || checkingPreview) && <LoadingCard title="Checking the start-up sound…" tone="light">Measuring how long the engine took to start</LoadingCard>}
  </Frame>;
}
export const CheckingTheSound = () => <EngineSoundCheck checkingPreview />;
