import { useEyeWatch } from '../../eyewatch/useEyeWatch';
import { Button } from '../../components';
import { DriveFrame, Gauge, RestStopCard, SpokenPrompt, TripBar, useDriveNavigation } from './shared';

export type GettingTiredProps = { duration?: string; detail?: string; restStop?: string; spoken?: string };
export function GettingTired({ duration = 'Driving 1 h 05 min', detail = 'Slow blinks · 3 yawns in 10 min', restStop = 'Next safe stop: R&R Seremban · 12 km · about 9 min', spoken = 'Spoken: “You may be getting tired. Let’s take a 15-minute break at the next rest stop.”' }: GettingTiredProps) {
  const go = useDriveNavigation();
  const watch=useEyeWatch();const live=watch.status!=='idle';
  if(live){duration=`Driving ${Math.floor(watch.eye.minutesDriving)} min`;detail=`${(watch.eye.perclos*100).toFixed(0)}% eyes closed · ${watch.eye.yawns} yawns in 5 min`;spoken="Spoken: “You’re getting tired. Take a 15-minute break at the next safe stop.”";}
  return <DriveFrame dark footer={<Button style="Drive" label="Remind me in 10 min" onClick={() => live?watch.remind():go('/drive/driving')} />}><main className="drive-content drive-tired"><TripBar status="Signs of tiredness" duration={duration} warning /><Gauge mode="tired" title="Tired" detail={detail} /><RestStopCard title="Take a 15-minute break" detail={restStop} /><SpokenPrompt>{spoken}</SpokenPrompt></main></DriveFrame>;
}
