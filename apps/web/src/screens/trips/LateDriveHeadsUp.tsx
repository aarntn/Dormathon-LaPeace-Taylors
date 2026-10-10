import { Button } from '../../components';
import { Art, Frame, Heading, useTripsNavigation } from './shared';

const defaultReasons = ['It’s past 10 pm, when you usually get tired', '3 of your last 4 late drives had tired alerts', 'You’ve already driven 40 min today'];
export type LateDriveHeadsUpProps = { title?: string; detail?: string; reasons?: string[]; plan?: string };
export function LateDriveHeadsUp({ title = 'Tonight’s drive is higher risk', detail = 'UM → Home · about 25 min · 11:20 pm', reasons = defaultReasons, plan = 'The alarm is set to be more sensitive, and we’ll check in halfway with a voice prompt.' }: LateDriveHeadsUpProps) {
  const go = useTripsNavigation();
  return <Frame className="trips-double-footer" back="/trips/when-you-get-tired" footer={<><Button style="Secondary" label="Not tonight" onClick={() => go('/drive/home')} /><Button label="Do the 1-minute check" onClick={() => go('/drive/before-you-drive')} /></>}><div className="trips-icon-wrap"><span className="trips-night-icon"><Art name="moon.svg" /></span></div><Heading title={title}>{detail}</Heading><section className="trips-panel trips-why"><h2 className="text-body-small-strong trips-secondary">Why we think so</h2>{reasons.map(reason => <div key={reason}><Art name="bullet.svg" /><p className="text-body-regular">{reason}</p></div>)}</section><section className="trips-plan trips-plan--success"><h2 className="text-body-small-strong">We’ve made a plan</h2><p className="text-body-small">{plan}</p></section></Frame>;
}
