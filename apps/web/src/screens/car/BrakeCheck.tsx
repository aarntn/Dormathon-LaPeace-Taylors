import { Button } from '../../components';
import { Frame, FooterStack, Heading, WorkshopButton } from './shared';
import { useCarSession } from './session';

const day = 86_400_000;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (time: number) => `${new Date(time).getDate()} ${months[new Date(time).getMonth()]}`;

/** C6 Brake check, from the hard-stop counts recorded on the driver’s own trips. */
export function BrakeCheck() {
  const { brakes, notify, loadingReport } = useCarSession();
  const weeks = brakes?.hard_stops_per_week.slice(-6) ?? [];
  const attention = brakes ? brakes.urgency !== 'monitor' : false;
  const max = Math.max(1, ...weeks); const first = weeks.find(value => value > 0);
  const ratio = first && weeks.length ? Math.round((weeks.at(-1) ?? 0) / first) : 0;
  const now = Date.now(); const startLabel = weeks.length ? new Date(now - (weeks.length - 1) * 7 * day).toLocaleDateString('en-GB', { month: 'long' }) : '';
  const title = loadingReport ? 'Loading brake check…' : !brakes ? 'No brake data yet' : attention ? 'Brakes due for a check' : 'Brakes look steady';
  return <Frame back="car-check" className="car-brakes" footer={<FooterStack><Button style="Secondary" label="Remind me in 1,000 km" onClick={() => notify('Reminders aren’t available yet.')} /><WorkshopButton service="brakes" /></FooterStack>}>
    <Heading title={title}>{brakes ? `Based on how you’ve braked over the last ${weeks.length} weeks` : 'Drive a few trips and we’ll show how hard you brake.'}</Heading>
    {brakes && <section className="car-chart-card car-panel"><div className="car-chart-head text-body-small-strong"><p>Hard stops per week</p>{attention && ratio > 1 && <p className="car-warning">{ratio}× since {startLabel}</p>}</div>
      <div className="car-bars">{weeks.map((value, index) => <div key={index} className="car-bar"><span style={{ height: Math.max(8, Math.round(value / max * 96)) }} className={attention && value >= max * 0.6 ? 'car-bar--warn' : ''} /><small className="text-label-small">{label(now - (weeks.length - 1 - index) * 7 * day)}</small></div>)}</div></section>}
    {brakes && <section className={`car-severity ${attention ? 'car-severity--warning' : 'car-severity--success'}`}><strong className="text-body-strong">{attention ? 'Get your brakes checked at your next service' : 'Nothing to do right now'}</strong><p className="text-body-small">{attention ? 'Hard stops wear brake pads faster, so yours may need a check sooner than usual.' : 'Your hard stops are steady. Keep a safe gap and we’ll flag any rise.'}</p></section>}
  </Frame>;
}
