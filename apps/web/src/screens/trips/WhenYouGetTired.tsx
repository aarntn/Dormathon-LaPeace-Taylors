import { Button } from '../../components';
import { Chart, Frame, Heading } from './shared';
import { useTripsNavigation } from './shared';
import { useTripsSession } from './session';

export type WhenYouGetTiredProps = { period?: string; alerts?: number; lateNightAlerts?: string; usuallyStartsAfter?: string; mostOftenOn?: string; chart?: string; chartLabel?: string };
export function WhenYouGetTired({ period = 'Based on your last 30 days of driving', alerts = 9, lateNightAlerts = '7 of 9', usuallyStartsAfter = '35 min of driving', mostOftenOn = 'The drive home from campus', chart = 'time-of-day.svg', chartLabel = 'Tired alerts by time of day, from 6 am to 3 am.' }: WhenYouGetTiredProps) {
  const go = useTripsNavigation();
  const { enableNightReminders } = useTripsSession();
  return <Frame back="/trips/trips" footer={<Button label="Turn on night reminders" onClick={() => { enableNightReminders(); go('/trips/trips', true); }} />}><Heading title="When you get tired">{period}</Heading><section className="trips-panel trips-chart-panel" aria-label="Tired alerts by time of day"><div className="trips-between text-body-small-strong"><h2 className="trips-secondary">Tired alerts by time of day</h2><span>{alerts} alerts</span></div><Chart name={chart} height={131} label={chartLabel} /></section><dl className="trips-panel trips-facts">{[['Late-night alerts', lateNightAlerts], ['Usually starts after', usuallyStartsAfter], ['Most often on', mostOftenOn]].map(([label, value]) => <div key={label}><dt className="text-body-regular trips-secondary">{label}</dt><dd className="text-body-strong">{value}</dd></div>)}</dl><section className="trips-plan"><h2 className="text-body-small-strong">Night reminders</h2><p className="text-body-small">After 10 pm we’ll suggest a break every 30 min and warn you before a long drive.</p></section></Frame>;
}
