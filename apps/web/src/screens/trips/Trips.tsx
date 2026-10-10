import { Button, TabBar } from '../../components';
import type { Trip, TripSummary } from '../../api';
import { Art, Frame, useTripsNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { AccountNotice } from '../../integration/AccountNotice';
import { useResource } from '../../integration/useResource';
import { useTripSummaries } from '../../integration/useTripSummaries';
import { nightBlocks } from './patterns';

type Badge = { label: string; tone: 'danger' | 'warning' | 'success' };
const day = 86_400_000;
const startOfWeek = (time: number) => { const date = new Date(time); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return date.getTime(); };
const hours = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
const clock = (time: number) => new Date(time).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(am|pm)/i, (_, half) => ` ${half.toLowerCase()}`);
function dayLabel(time: number) {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(time).setHours(0, 0, 0, 0)) / day);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : new Date(time).toLocaleDateString('en-GB', { weekday: 'short' });
}
function badgeFor(summary: TripSummary): Badge {
  const alarms = summary.events.filter(event => event.kind === 'microsleep' || event.kind === 'not_responding').length;
  const tired = summary.events.filter(event => event.kind === 'tired').length;
  return alarms ? { label: `${alarms} ${alarms === 1 ? 'alarm' : 'alarms'}`, tone: 'danger' } : tired ? { label: `${tired} tired`, tone: 'warning' } : { label: 'All alert', tone: 'success' };
}
export function Trips() {
  const go = useTripsNavigation(); const data = useAppData(); const { api, session } = data;
  const done = data.trips.filter(trip => trip.ended_at).sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  const recent = done.slice(0, 12); const summaries = useTripSummaries(recent, session?.user.id);
  const patterns = useResource(() => api.patterns(), session?.user.id);
  const now = new Date(); const month = done.filter(trip => { const date = new Date(trip.started_at); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
  const minutes = month.reduce((sum, trip) => sum + Math.round((Date.parse(trip.ended_at!) - Date.parse(trip.started_at)) / 60000), 0);
  const footer = <TabBar active="Trips" onChange={tab => go(tab === 'Home' ? '/drive/home' : '/' + tab.toLowerCase())} />;
  if (!done.length) return <Frame className="trips-overview trips-empty" footer={footer}>
    <header className="trips-heading"><h1 className="text-heading-large">Trips</h1><p className="text-body-regular">No drives yet</p></header><AccountNotice />
    <div className="trips-empty-art"><img src="/assets/catch-up/41857.svg" alt="" /></div>
    <section className="trips-empty-copy"><h2 className="text-title-medium">Your first drive will show up here</h2><p className="text-body-regular">After a few drives, we’ll show when you tend to get tired, so we can warn you earlier.</p></section>
    <div className="trips-empty-cta"><Button label="Start a drive" onClick={() => go('/drive/home')} /></div>
  </Frame>;
  const total = patterns.value?.slots.reduce((sum, slot) => sum + slot.tired_alerts, 0) ?? 0; const blocks = nightBlocks(patterns.value?.slots ?? []); const peak = Math.max(1, ...blocks.map(block => block.count));
  const late = patterns.value ? Math.round(patterns.value.late_night_share * total) : 0;
  const thisWeek = startOfWeek(Date.now()); const groups = new Map<string, Trip[]>();
  for (const trip of recent) { const start = startOfWeek(Date.parse(trip.started_at)); const name = start >= thisWeek ? 'This week' : start >= thisWeek - 7 * day ? 'Last week' : 'Earlier'; groups.set(name, [...(groups.get(name) ?? []), trip]); }
  return <Frame className="trips-overview" footer={footer}>
    <header className="trips-heading"><h1 className="text-heading-large">Trips</h1><p className="text-body-regular">{month.length} {month.length === 1 ? 'drive' : 'drives'} this month · {hours(minutes)}</p></header><AccountNotice />
    <button className="trips-pattern trips-panel" onClick={() => go('/trips/when-you-get-tired')}>
      <span className="trips-pattern-head text-body-small-strong"><span>Your pattern</span><Art name="chev.svg" /></span>
      <strong className="text-title-medium">{total ? 'You get tired faster at night' : patterns.loading ? 'Loading your pattern…' : 'No pattern yet'}</strong>
      <span className="trips-bars" aria-hidden="true">{blocks.map(block => <span key={block.label} className={block.count ? block.night ? 'trips-bar trips-bar--night' : 'trips-bar trips-bar--day' : 'trips-bar'} style={{ height: block.count ? Math.max(18, Math.round(block.count / peak * 44)) : 4 }} />)}</span>
      <span className="text-body-small trips-pattern-note">{total ? `${late} of your ${total} tired alerts happened late at night.` : 'Tired alerts from your drives will show here.'}</span>
    </button>
    {[...groups].map(([name, list]) => <section key={name} className="trips-group"><h2 className="trips-week text-body-strong">{name}</h2>
      <div className="trips-list trips-panel">{list.map(trip => { const start = Date.parse(trip.started_at); const length = Math.round((Date.parse(trip.ended_at!) - start) / 60000); const badge = summaries[trip.id] ? badgeFor(summaries[trip.id]) : undefined;
        return <button key={trip.id} className="trips-row" onClick={() => go('/drive/trip-summary?trip=' + encodeURIComponent(trip.id))}>
          <span className="trips-row-copy"><strong className="text-body-strong">{(trip.distance_km ?? 0).toFixed(1)} km drive</strong><span className="text-body-small">{dayLabel(start)} · {clock(start)} · {length} min</span></span>
          {trip.passenger_mode ? <span className="trips-status text-body-small-strong"><span className="trips-dot" />Passenger</span> : badge && <span className={`trips-status text-body-small-strong trips-${badge.tone}`}><span className="trips-dot" />{badge.label}</span>}
        </button>; })}</div></section>)}
  </Frame>;
}
