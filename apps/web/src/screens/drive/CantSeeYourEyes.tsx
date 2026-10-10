import { CameraPreview, useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { Art, DriveFrame, Glyph, Heading, SpokenPrompt, TripBar, useDriveNavigation } from './shared';

export type CantSeeYourEyesProps = { duration?: string; hint?: string };
export function CantSeeYourEyes({ duration = 'Driving 46 min', hint = 'Tilt the phone up a little' }: CantSeeYourEyesProps) {
  const go = useDriveNavigation();
  const watch=useEyeWatch();const live=watch.status!=='idle';
  if(live)duration=`Driving ${Math.floor(watch.eye.minutesDriving)} min`;
  return <DriveFrame dark footer={<><p className="drive-footer-note text-body-small drive-secondary">Watching starts again on its own once your eyes are back in view.</p><Button style="Drive" label="OK" disabled={live&&!watch.eye.faceVisible} onClick={() => go('/drive/driving')} /></>}><main className="drive-content drive-lost"><TripBar status="Eyes not found" duration={duration} warning /><div className="drive-lost-icon"><Glyph name="9bdb9.svg" size={40} /></div><Heading dark title="Can’t see your eyes">Your phone may have moved, or your head is turned away. Adjust it when it’s safe.</Heading><div className="drive-lost-camera">{live&&watch.stream&&<CameraPreview />}<Art name="40771.png" className="drive-lost-camera__guide" /><Art name="2501d.svg" className={'drive-lost-camera__face'+(live?' eye-static-hidden':'')} /><div className="drive-live-hint"><Glyph name="dd919.svg" size={16} /><p className="text-body-small-strong">{hint}</p></div></div>{live&&watch.status==='error'&&<div className="eye-live-status"><p role="alert" className="text-body-small">{watch.error}</p><Button style="Secondary" label="Restart eye watch" onClick={watch.start} /></div>}<SpokenPrompt>Spoken: “I can’t see your eyes. Adjust your phone when it’s safe.”</SpokenPrompt></main></DriveFrame>;
}

