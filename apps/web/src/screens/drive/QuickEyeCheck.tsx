import { useEffect, useRef } from 'react';
import { useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { Back, DriveFrame, Gauge, Glyph, Heading, Steps, useDriveNavigation } from './shared';

export type QuickEyeCheckProps = { blinks?: number; targetBlinks?: number };
export function QuickEyeCheck({ blinks = 1, targetBlinks = 2 }: QuickEyeCheckProps) {
  const go = useDriveNavigation();
  const watch=useEyeWatch();const started=useRef(false);const live=watch.status!=='idle';
  useEffect(()=>{if(watch.status!=='running'){started.current=false;return;}if(!started.current){started.current=true;watch.session.calibrate();}},[watch.status,watch.session]);
  const check=watch.calibration;if(live)blinks=check?.blinks??0;
  return <DriveFrame dark footer={<Button style="Light" label="Start driving" disabled={live&&(watch.status!=='running'||check?.phase!=='ready')} onClick={() => live?watch.beginDrive():go('/drive/driving')} />}><main className="drive-content drive-setup drive-setup--dark"><Back dark to="/drive/line-up-your-face" /><Steps step={3} dark /><Heading dark title="Quick eye check">Look ahead, then blink twice. This adjusts to the light in your car today.</Heading><Gauge mode="check" title={live&&check?.phase==='look'?'Look ahead':'Blink twice'} detail={live&&check?.phase==='look'?`${Math.min(5,check.seconds).toFixed(1)} of 5 seconds`:`${blinks} of ${targetBlinks}`} /><div className="drive-check-steps"><div><span className="drive-check-step drive-check-step--done"><Glyph name="d86f4.svg" size={14} /></span><p className="text-body-small-strong">{live?'Look ahead for 5 seconds':'Looked ahead for 3 seconds'}</p></div><div><span className="drive-check-step drive-check-step--current" /><p className="text-body-small-strong">Blink twice</p></div><div><span className="drive-check-step" /><p className="text-body-small-strong drive-secondary">Ready to drive</p></div></div>{live&&watch.error&&<p role="alert" className="text-body-small eye-live-status">{watch.error}</p>}</main></DriveFrame>;
}
