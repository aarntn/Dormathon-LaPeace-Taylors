import { useCallback, useEffect, useRef, useState } from 'react';
import { AlarmFlash, Button, Countdown, LiveDot, LoadingDots, ProgressBar, ScanLine, ScanRing, TapDot, Waveform } from '../components';

export function MotionSamples() {
  const [progress, setProgress] = useState(.7);
  const [run, setRun] = useState(0);
  const [seconds, setSeconds] = useState(8);
  const [counting, setCounting] = useState(false);
  const [dotVisible, setDotVisible] = useState(false);
  const [tapResult, setTapResult] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [microphoneStatus, setMicrophoneStatus] = useState('Figma fallback');
  const capture = useRef<{ stream?: MediaStream; generation: number }>({ generation: 0 });
  const tap = useRef<{ shownAt: number; timer?: ReturnType<typeof setTimeout> }>({ shownAt: 0 });

  const stopMicrophone = useCallback(() => {
    capture.current.generation++;
    capture.current.stream?.getTracks().forEach(track => track.stop());
    capture.current.stream = undefined;
    setStream(null);
    setMicrophoneStatus('Figma fallback');
  }, []);
  const unavailable = useCallback(() => { stopMicrophone(); setMicrophoneStatus('Microphone unavailable · Figma fallback'); }, [stopMicrophone]);
  useEffect(() => () => {
    capture.current.generation++;
    capture.current.stream?.getTracks().forEach(track => track.stop());
    clearTimeout(tap.current.timer);
  }, []);
  useEffect(() => {
    if (!counting) return;
    const deadline = performance.now() + 8000;
    const update = () => {
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setSeconds(left);
      if (!left) setCounting(false);
    };
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, [counting]);
  const startMicrophone = async () => {
    const generation = ++capture.current.generation;
    setMicrophoneStatus('Waiting for microphone');
    try {
      const next = await navigator.mediaDevices.getUserMedia({ audio: true });
      // A late permission result must not restart capture after leaving the page.
      if (generation !== capture.current.generation) { next.getTracks().forEach(track => track.stop()); return; }
      capture.current.stream = next;
      setStream(next);
      setMicrophoneStatus('Microphone level · nothing recorded');
    } catch {
      if (generation === capture.current.generation) setMicrophoneStatus('Microphone unavailable · Figma fallback');
    }
  };
  const showDot = () => {
    clearTimeout(tap.current.timer);
    tap.current.shownAt = performance.now(); setDotVisible(true); setTapResult('');
    tap.current.timer = setTimeout(() => { setDotVisible(false); setTapResult('Dot expired'); }, 880);
  };
  return <section className="gallery__section motion-samples" id="motion">
    <div className="section-heading"><h2 className="text-title-medium">Motion</h2><span className="text-label-small text-text-secondary">9 COMPONENTS</span></div>
    <div className="sample-stack">
      <div className="sample"><p className="sample__caption text-label-small">LoadingDots · Dark · 0.28 s per step</p><LoadingDots /></div>
      <div className="sample sample--dark"><p className="sample__caption text-label-small">LoadingDots · Light</p><LoadingDots tone="Light" /></div>
      <div className="sample sample--dark"><p className="sample__caption text-label-small">ProgressBar · 2.2 s</p><ProgressBar key={run} /><Button style="Drive" label="Replay progress" onClick={() => setRun(value => value + 1)} /></div>
      <div className="sample"><p className="sample__caption text-label-small">LiveDot · Green / Red · 1.1 s</p><div className="sample-row"><LiveDot /><LiveDot color="Red" /></div></div>
      <div className="sample motion-scan-sample"><p className="sample__caption text-label-small">ScanRing · progress prop</p><ScanRing progress={progress}><span className="text-numeric-large">{Math.round(progress * 100)}%</span></ScanRing><input type="range" aria-label="Scan progress" min="0" max="100" value={progress * 100} onChange={event => setProgress(Number(event.target.value) / 100)} /></div>
      <div className="sample"><p className="sample__caption text-label-small">Countdown · seconds prop</p><div className="motion-countdown-sample"><Countdown secondsLeft={seconds} totalSeconds={8} /></div><Button style="Secondary" label={counting ? 'Cancel countdown' : 'Start countdown'} onClick={() => { setSeconds(8); setCounting(!counting); }} /></div>
      <div className="sample"><p className="sample__caption text-label-small">AlarmFlash · 0–18%</p><div className="motion-alarm-sample"><AlarmFlash /><span className="text-heading-large">Wake up</span></div></div>
      <div className="sample"><p className="sample__caption text-label-small">Waveform · microphone level / Figma loop</p><Waveform stream={stream} onUnavailable={unavailable} /><p className="text-body-small" role="status" data-microphone-status>{microphoneStatus}</p><Button style="Secondary" label={stream ? 'Stop microphone preview' : 'Start microphone preview'} onClick={stream ? stopMicrophone : startMicrophone} disabled={microphoneStatus === 'Waiting for microphone'} /></div>
      <div className="sample"><p className="sample__caption text-label-small">ScanLine · 1.6 s each way</p><ScanLine /></div>
      <div className="sample motion-tap-sample"><p className="sample__caption text-label-small">TapDot · pop, hold, fade</p><TapDot visible={dotVisible} onTap={() => { clearTimeout(tap.current.timer); setTapResult(`Tapped in ${Math.round(performance.now() - tap.current.shownAt)} ms`); setDotVisible(false); }} /><p className="text-body-small" role="status" data-tap-result>{tapResult}</p><Button style="Secondary" label="Show tap dot" onClick={showDot} /></div>
    </div>
  </section>;
}
