import { useMemo, useState } from 'react';
import type { Trip, TripSummary } from '../../api';
import { Art, Frame, Heading } from './shared';
import { useAppData } from '../../integration/AppData';
import { AccountNotice } from '../../integration/AccountNotice';
import { useTripSummaries } from '../../integration/useTripSummaries';

type Period = 'Week' | 'Month' | 'Year';
const day = 86_400_000;
const alertKinds = new Set(['tired', 'microsleep']);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);

/** Window [from, to) for the selected period and the one before it, with the bucket each alert falls in. */
function windows(period: Period, now: number) {
  const date = new Date(now);
  if (period === 'Week') { const start = startOfDay(now) - ((date.getDay() + 6) % 7) * day; return { start, end: start + 7 * day, previous: start - 7 * day, labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], bucket: (t: number) => Math.floor((startOfDay(t) - start) / day), last: 'last week' }; }
  if (period === 'Month') { const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime(); const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime(); const weeks = Math.ceil((end - start) / (7 * day)); return { start, end, previous: new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime(), labels: Array.from({ length: weeks }, (_, i) => `Wk ${i + 1}`), bucket: (t: number) => Math.min(weeks - 1, Math.floor((t - start) / (7 * day))), last: 'last month' }; }
  const start = new Date(date.getFullYear(), 0, 1).getTime();
  return { start, end: new Date(date.getFullYear() + 1, 0, 1).getTime(), previous: new Date(date.getFullYear() - 1, 0, 1).getTime(), labels: monthNames.map(name => name[0]), bucket: (t: number) => new Date(t).getMonth(), last: 'last year' };
}
const countIn = (trips: Trip[], summaries: Record<string, TripSummary>, from: number, to: number) =>
  trips.filter(trip => { const start = Date.parse(trip.started_at); return start >= from && start < to; }).flatMap(trip => summaries[trip.id]?.events ?? []).filter(event => alertKinds.has(event.kind)).length;

export function DrivingStats() {
  const d = useAppData(); const [period, setPeriod] = useState<Period>('Month');
  const done = useMemo(() => d.trips.filter(trip => trip.ended_at && !trip.passenger_mode).sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)).slice(0, 60), [d.trips]);
  const summaries = useTripSummaries(done, d.session?.user.id);
  const now = Date.now(); const range = windows(period, now);
  const inRange = done.filter(trip => { const start = Date.parse(trip.started_at); return start >= range.start && start < range.end; });
  const counts = range.labels.map(() => 0); const hours = new Array(24).fill(0) as number[]; const minutesIn: number[] = [];
  for (const trip of inRange) for (const event of summaries[trip.id]?.events ?? []) {
    if (!alertKinds.has(event.kind)) continue;
    const at = Date.parse(event.at); counts[Math.max(0, range.bucket(at))]++; hours[new Date(at).getHours()]++;
    const into = Math.round((at - Date.parse(trip.started_at)) / 60000); const length = Math.round((Date.parse(trip.ended_at!) - Date.parse(trip.started_at)) / 60000);
    if (event.kind === 'tired' && into >= 0 && into <= length) minutesIn.push(into);
  }
  const total = counts.reduce((sum, value) => sum + value, 0);
  const previousTrips = done.some(trip => { const start = Date.parse(trip.started_at); return start >= range.previous && start < range.start; });
  const previous = countIn(done, summaries, range.previous, range.start);
  const trend = !previousTrips ? '' : total < previous ? `down from ${previous} ${range.last}` : total > previous ? `up from ${previous} ${range.last}` : `same as ${range.last}`;
  const peak = Math.max(1, ...counts); const hourPeak = Math.max(1, ...hours); const ordered = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);
  const typical = minutesIn.length >= 3 ? [...minutesIn].sort((a, b) => a - b)[Math.floor(minutesIn.length / 2)] : undefined;
  const lateShare = total ? hours.reduce((sum, value, hour) => sum + (hour >= 23 || hour < 4 ? value : 0), 0) / total : 0;
  return <Frame back="/profile/profile" className="profile-stats-screen">
    <header className="profile-heading profile-stats-heading"><h1 className="text-heading-large">Driving stats</h1>
      <div className="profile-period text-body-strong" role="tablist" aria-label="Period">{(['Week', 'Month', 'Year'] as Period[]).map(name => <span key={name} role="tab" tabIndex={0} aria-selected={name === period} className={name === period ? 'profile-period-active' : ''} onClick={() => setPeriod(name)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setPeriod(name); }}>{name}</span>)}</div></header>
    <AccountNotice />
    <section className="profile-alert-chart profile-panel"><span className="text-body-small-strong profile-secondary">Tiredness alerts</span>
      <div className="profile-alert-count"><div><span className="text-heading-display">{total}</span>{trend && <span className={'text-body-small-strong ' + (total <= previous ? 'profile-success' : 'profile-warning')}>{trend}</span>}</div></div>
      <div className="profile-bars" role="img" aria-label={`${total} tiredness alerts this ${period.toLowerCase()}`}>{counts.map((value, index) => <span key={index} className="profile-bar-col"><small className="text-label-small profile-tertiary">{value}</small><span className={value ? 'profile-bar' : 'profile-bar profile-bar--empty'} style={{ height: value ? Math.max(20, Math.round(value / peak * 68)) : 4 }} /><small className="text-label-small profile-tertiary">{range.labels[index]}</small></span>)}</div></section>
    <section className="profile-hours-chart profile-panel"><h2 className="text-body-strong">When you get tired</h2>
      <div className="profile-hour-bars" role="img" aria-label="Tired alerts by hour of day">{ordered.map(hour => <span key={hour} className={'profile-hour-bar' + (hours[hour] ? (hour >= 21 || hour < 5 ? ' profile-hour-bar--night' : ' profile-hour-bar--day') : '')} style={{ height: hours[hour] ? Math.max(14, Math.round(hours[hour] / hourPeak * 56)) : 6 }} />)}</div>
      <div className="profile-hour-labels text-label-small profile-tertiary"><span>6 am</span><span>12 pm</span><span>6 pm</span><span>12 am</span></div></section>
    <section className="profile-insights">
      {typical !== undefined && <div className="profile-insight profile-panel"><span className="profile-insight-icon"><Art name="clock" /></span><span className="profile-car-copy"><strong className="text-body-strong">Tired about {typical} minutes in</strong><span className="text-body-small profile-secondary">Plan a stop at {Math.max(5, typical - 5)} minutes.</span></span></div>}
      {total > 0 && lateShare >= 0.5 && <div className="profile-insight profile-panel"><span className="profile-insight-icon"><Art name="moon" /></span><span className="profile-car-copy"><strong className="text-body-strong">Most alerts after 11 pm</strong><span className="text-body-small profile-secondary">Late drives are your riskiest.</span></span></div>}
      {total === 0 && <p className="text-body-small profile-secondary profile-empty">No tiredness alerts recorded this {period.toLowerCase()}.</p>}
    </section>
  </Frame>;
}
