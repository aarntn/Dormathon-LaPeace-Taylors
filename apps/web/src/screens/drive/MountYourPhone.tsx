import {useDrive} from './session';
import { useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { Art, Back, DriveFrame, Glyph, Heading, Steps, useDriveNavigation } from './shared';

export function MountYourPhone() {
  const go = useDriveNavigation();const d=useDrive();
  const watch=useEyeWatch();
  return <DriveFrame footer={<Button label="My phone is mounted" onClick={() => {if(!new URLSearchParams(location.search).has('preview'))watch.start();go('/drive/line-up-your-face');}} />}><main className="drive-content drive-setup"><Back to="/drive/home" /><Steps step={1} /><Heading title="Mount your phone">Do this while parked. The front camera needs a clear view of your eyes.</Heading><div className="drive-dashboard"><Art name="742ca.svg" alt="Phone mounting positions on the dashboard" /><span className="drive-tag drive-tag--best text-label-small">Best</span><span className="drive-tag drive-tag--vent text-label-small">OK on a vent</span><span className="drive-tag drive-tag--low text-label-small">Too low</span></div><div className="drive-mount-tips">{[['d8df5.svg', 'At eye level, just left of the wheel'], ['30181.svg', 'About an arm’s length from your face'], ['d6288.svg', 'Not blocking your view of the road']].map(([name, text]) => <div key={name}><span className="drive-tip-icon"><Glyph name={name} size={18} /></span><p className="text-body-strong">{text}</p></div>)}</div><button className="quiet-link text-body-small" onClick={()=>{void d.startTrip(true).then(()=>{watch.session.stop();go('/drive/passenger-mode');}).catch(e=>d.setError(e.message));}}>I’m a passenger</button>{d.error&&<p role="alert" className="text-body-small api-error">{d.error}</p>}</main></DriveFrame>;
}
