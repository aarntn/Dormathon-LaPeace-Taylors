import { useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { DriveFrame, Glyph, RestStopCard, useDriveNavigation } from './shared';

export type MicrosleepAlarmProps = { closedSeconds?: number; restStop?: string };
export function MicrosleepAlarm({ closedSeconds = 1.8, restStop = 'R&R Seremban · 4 km · about 3 min' }: MicrosleepAlarmProps) {
  const go = useDriveNavigation();
  const watch=useEyeWatch();const live=watch.status!=='idle';
  if(live)closedSeconds=Math.max(watch.config.microsleepMs/1000,watch.eye.closedSeconds);
  return <DriveFrame dark className="drive-alarm" footer={<><p className="drive-footer-note text-body-small">The alarm keeps sounding until you tap below.</p><Button style="Outline" label="I'm awake" onClick={() => {watch.session.acknowledge();go('/drive/driving');}} /></>}><main className="drive-content drive-alarm__content"><div className="drive-alarm-icon"><Glyph name="7792c.svg" size={44} /></div><header className="drive-alarm-heading"><h1 className="text-heading-display">Wake up</h1><p className="text-body-regular">Your eyes closed for {closedSeconds} seconds while driving.</p></header>{live&&!watch.audio&&<div className="eye-live-status"><p role="alert" className="text-body-small">Alarm sound is paused.</p><Button label="Enable sound" onClick={()=>void watch.session.enableSound()} /></div>}<RestStopCard alarm title="Pull over and rest" detail={restStop} /></main></DriveFrame>;
}
