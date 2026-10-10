import { TabBar, type Tab } from '../../components';
import { Art, Chart, Frame, Heading, useTripsNavigation } from './shared';

export type Trip = { title: string; detail: string; status: string; tone: 'danger' | 'warning' | 'success' };
const defaultThisWeek: Trip[] = [
  { title: 'PJ → Seremban', detail: 'Today · 3:40 pm · 58 min', status: '1 alarm', tone: 'danger' },
  { title: 'UM → Home', detail: 'Thu · 11:20 pm · 25 min', status: '2 tired', tone: 'warning' },
  { title: 'Home → Mid Valley', detail: 'Wed · 6:10 pm · 18 min', status: 'All alert', tone: 'success' },
];
const defaultLastWeek: Trip[] = [
  { title: 'Home → UM', detail: 'Mon · 8:05 am · 22 min', status: 'All alert', tone: 'success' },
  { title: 'Sunway → Home', detail: 'Sat · 12:40 am · 31 min', status: '3 tired', tone: 'warning' },
];
function TripList({ trips, label }: { trips: Trip[]; label: string }) {
  const go = useTripsNavigation();
  return <section className="trips-list trips-panel" aria-label={label}>{trips.map((trip, index) => <button key={index} type="button" className="trips-row" onClick={() => go('/drive/trip-summary')}><span className="trips-row-copy"><span className="text-body-strong">{trip.title}</span><span className="text-body-small">{trip.detail}</span></span><span className={'trips-status trips-' + trip.tone}><Art name={trip.tone + '.svg'} /><span className="text-body-small-strong">{trip.status}</span></span></button>)}</section>;
}
export type TripsProps = { monthSummary?: string; pattern?: string; patternDetail?: string; patternChart?: string; thisWeek?: Trip[]; lastWeek?: Trip[] };
export function Trips({ monthSummary = '12 drives this month · 9 h 40 min', pattern = 'You get tired faster after 10 pm', patternDetail = '7 of your 9 tired alerts happened late at night.', patternChart = 'pattern.svg', thisWeek = defaultThisWeek, lastWeek = defaultLastWeek }: TripsProps) {
  const go = useTripsNavigation();
  const paths: Record<Tab, string> = { Home: '/drive/home', Trips: '/trips/trips', Car: '/car/car-check', Profile: '/profile' };
  return <Frame className="trips-overview" footer={<TabBar active="Trips" onChange={tab => tab !== 'Trips' && go(paths[tab])} />}><Heading title="Trips">{monthSummary}</Heading><button type="button" className="trips-pattern trips-panel" onClick={() => go('/trips/when-you-get-tired')}><span className="trips-between"><span className="text-body-small-strong trips-secondary">Your pattern</span><Art name="chevron.svg" /></span><span className="text-title-medium">{pattern}</span><Chart name={patternChart} height={44} label={patternDetail} /><span className="text-body-small trips-secondary">{patternDetail}</span></button><h2 className="trips-week text-body-small-strong">This week</h2><TripList trips={thisWeek} label="This week" /><h2 className="trips-week text-body-small-strong">Last week</h2><TripList trips={lastWeek} label="Last week" /></Frame>;
}
