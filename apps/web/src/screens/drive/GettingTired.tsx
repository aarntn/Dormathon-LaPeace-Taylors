import { useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { DriveFrame, Gauge, RestStopCard, SpokenPrompt, TripBar, useDriveNavigation } from './shared';

export type GettingTiredProps = { duration?: string; detail?: string; restStop?: string; spoken?: string };
export function GettingTired({ duration = 'Driving 1 h 05 min', detail = 'Slow blinks · 3 yawns in 10 min', restStop = 'R&R Seremban · 12 km · about 9 min', spoken = 'Spoken: “You’re getting tired. There’s a rest stop in 12 km.”' }: GettingTiredProps) {
  const go = useDriveNavigation();
  const watch=useEyeWatch();const live=watch.status!=='idle';
  if(live){duration=`Driving ${Math.floor(watch.eye.minutesDriving)} min`;detail=`${(watch.eye.perclos*100).toFixed(0)}% eyes closed ? ${watch.eye.yawns} yawns in 5 min`;spoken="Spoken: ?You look tired. There's a rest stop ahead.?";}
  return <DriveFrame dark footer={<Button style="Drive" label="Remind me in 10 min" onClick={() => live?watch.remind():go('/drive/driving')} />}><main className="drive-content drive-tired"><TripBar status="Signs of tiredness" duration={duration} warning /><Gauge mode="tired" title="Tired" detail={detail} /><RestStopCard title="Take a break soon" detail={restStop} /><SpokenPrompt>{spoken}</SpokenPrompt></main></DriveFrame>;
}
