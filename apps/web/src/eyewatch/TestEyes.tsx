import { useCallback, useState } from 'react';
import { AppFrame, BrandMark, Button } from '../components';
import { useDemoLogo } from '../screens/drive/DemoPanel';
import { CameraPreview, EyeDebug, useEyeWatch } from './useEyeWatch';
import type { Features } from './engine';

export function TestEyes(){
  const [features,setFeatures]=useState<Features|null>(null);
  const onFeatures=useCallback((value:Features)=>setFeatures(value),[]);
  const watch=useEyeWatch({onFeatures});const logoTap=useDemoLogo();
  const running=watch.status==='running';const active=running||watch.status==='starting';
  const calibration=watch.calibration;
  return <AppFrame className="eye-test" footer={<Button label={active?'Stop eye watch':'Start eye watch'} onClick={()=>active?watch.session.stop():watch.start()} />}><main className="eye-test-content"><button className="drive-logo" aria-label="Dormathon logo" onClick={logoTap}><BrandMark /></button><h1 className="text-heading-large">Test eyes</h1><p className="text-body-regular">Set up while parked. Camera frames stay on this phone.</p><div className="eye-camera">{watch.stream?<CameraPreview />:<p className="text-body-small">Front camera preview</p>}</div><p className="text-body-strong" role="status">{watch.status==='starting'?'Loading camera and eye model…':watch.status==='idle'?'Ready to start':watch.status==='error'?'Eye watch unavailable':`Eye watch: ${watch.eye.state}`}</p><EyeDebug />{watch.error && <p role="alert" className="text-body-small eye-error">{watch.error}</p>}
    {watch.eye.alarm && <Button style="Primary" label="I'm awake" onClick={()=>watch.session.acknowledge()} />}
    {running && !watch.audio && <Button label="Enable sound" onClick={()=>void watch.session.enableSound()} />}
    {running && <><Button style="Secondary" label={calibration&&calibration.phase!=='ready'?'Restart eye check':'Calibrate eyes'} onClick={()=>watch.session.calibrate()} /><p className="text-body-small" role="status">{calibration?.phase==='look'?`Look ahead with eyes open: ${Math.min(5,calibration.seconds).toFixed(1)} / 5 s`:calibration?.phase==='blink'?`Blink twice: ${calibration.blinks} / 2`:calibration?.phase==='ready'?'Eye check saved. Ready to drive.':watch.calibrated?'Saved eye check loaded.':'Using the default threshold. Calibrate before driving.'}</p>{calibration?.phase==='ready'&&<Button style="Secondary" label="Resume test" onClick={()=>watch.session.begin()} />}<Button style="Secondary" label="Use Drive screens" disabled={!watch.calibrated} onClick={watch.beginDrive} /></>}
    <dl className="eye-debug text-body-small"><div><dt>Model</dt><dd>{watch.delegate}</dd></div><div><dt>Movement</dt><dd>{watch.eye.moving?'Moving':'Unconfirmed / stopped'}</dd></div><div><dt>GPS</dt><dd>{watch.gps}</dd></div><div><dt>Screen</dt><dd>{watch.wake}</dd></div><div><dt>Audio</dt><dd>{watch.audio?'Enabled':'Not enabled'}</dd></div><div><dt>Voice</dt><dd>{watch.voice}</dd></div></dl><p className="text-body-small">Keep this page visible. Your browser may pause the camera when another app is open. Test low light while parked.</p>{features && <details><summary className="text-body-small-strong">Latest numeric features</summary><pre className="text-body-small">{JSON.stringify(features,null,2)}</pre></details>}</main></AppFrame>;
}
