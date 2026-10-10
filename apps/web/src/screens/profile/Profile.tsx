import { useState } from 'react';
import { Button, TabBar } from '../../components';
import { Art, Frame, RowList, useProfileNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { AccountNotice } from '../../integration/AccountNotice';
import { useResource } from '../../integration/useResource';
import { useTripSummaries } from '../../integration/useTripSummaries';
import { buildReport } from '../car/report';

const MAPS = { waze: 'Waze', google: 'Google Maps', apple: 'Apple Maps' } as Record<string, string>;
const mapsApp = () => { try { const saved = localStorage.getItem('buckl.mapsApp') ?? ''; return MAPS[saved.toLowerCase()] ?? (saved || 'Waze'); } catch { return 'Waze'; } };

export function Profile() {
  const d = useAppData(); const go = useProfileNavigation(); const [notice, setNotice] = useState('');
  const name = d.session?.user.user_metadata?.name ?? 'Your profile';
  const now = new Date(); const month = d.trips.filter(trip => { const date = new Date(trip.started_at); return trip.ended_at && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
  const summaries = useTripSummaries(month, d.session?.user.id);
  const minutes = month.reduce((sum, trip) => sum + (Date.parse(trip.ended_at!) - Date.parse(trip.started_at)) / 60000, 0);
  const events = Object.values(summaries).flatMap(summary => summary.events);
  const tired = events.filter(event => event.kind === 'tired').length; const microsleeps = events.filter(event => event.kind === 'microsleep').length;
  const report = useResource(async () => d.selectedCar ? d.api.carReport(d.selectedCar.id) : null, d.selectedCar ? d.session?.user.id + ':' + d.selectedCar.id : undefined);
  const attention = report.value ? buildReport(report.value.dashboard ?? undefined, report.value.startup ?? undefined, report.value.brakes).attention.length : undefined;
  const alertLine = !month.length ? 'No drives yet this month' : !tired && !microsleeps ? 'No tiredness alerts this month' : `${tired} tiredness ${tired === 1 ? 'alert' : 'alerts'} and ${microsleeps} ${microsleeps === 1 ? 'microsleep' : 'microsleeps'} this month`;
  const soon = (label: string) => () => setNotice(`${label} isn’t available in the app yet.`);
  return <Frame className="profile-overview" footer={<TabBar active="Profile" onChange={tab => go(tab === 'Home' ? '/drive/home' : '/' + tab.toLowerCase())} />}>
    <header className="profile-person"><span className="profile-avatar text-heading-large">{name.slice(0, 1)}</span><div className="profile-person-copy"><h1 className="text-heading-large">{name}</h1><p className="text-body-small profile-secondary">{d.session?.user.email}</p></div>
      <button type="button" className="profile-edit" aria-label="Edit profile" onClick={soon('Editing your profile')}><Art name="edit" /></button></header>
    <AccountNotice />
    <section className="profile-stats" aria-label="This month">
      <span className="profile-between"><strong className="text-body-strong">This month</strong><button type="button" className="profile-stat-link text-body-small-strong" onClick={() => go('/profile/driving-stats')}>See stats <Art name="chevron-white" /></button></span>
      <span className="profile-numbers">{[[String(month.length), month.length === 1 ? 'drive' : 'drives'], [`${Math.round(minutes / 60)} h`, 'driving'], [String(tired + microsleeps), 'alerts']].map(([value, label]) => <span key={label}><span className="text-numeric-large">{value}</span><span className="text-label-small">{label}</span></span>)}</span>
      <span className="profile-alert-line text-body-small"><span className={'profile-dot' + (!tired && !microsleeps ? ' profile-dot--success' : '')} />{alertLine}</span>
    </section>
    <section className="profile-group"><span className="profile-between"><h2 className="text-body-small-strong profile-secondary">My cars</h2><button type="button" className="profile-text-action text-body-small-strong" onClick={() => go('/profile/add-a-car')}><Art name="plus" />Add a car</button></span>
      {d.selectedCar ? <button type="button" className="profile-current-car profile-panel" onClick={() => go('/profile/my-cars')}><span className="profile-brand"><Art name="brand" /></span><span className="profile-car-copy"><strong className="text-body-strong">{d.selectedCar.make} {d.selectedCar.model}</strong><span className="profile-inline-status text-body-small profile-secondary">{attention !== undefined && <span className={'profile-dot' + (attention ? '' : ' profile-dot--success')} />}{[d.selectedCar.plate, attention === undefined ? undefined : attention ? `${attention} ${attention === 1 ? 'thing' : 'things'} to check` : 'All good'].filter(Boolean).join(' · ')}</span></span><Art name="chevron" /></button>
        : <p className="text-body-small profile-secondary">No car saved yet.</p>}</section>
    <section className="profile-group"><h2 className="text-body-small-strong profile-secondary">Settings</h2>
      <RowList label="Settings" rows={[
        { title: 'Alarm and alerts', icon: 'bell', value: 'Loud', onSelect: soon('Alarm settings') },
        { title: 'Maps app', icon: 'map', value: mapsApp(), to: '/onboarding/which-maps-app' },
        { title: 'Emergency contact', icon: 'shield-check', value: d.contacts[0]?.name, to: '/profile/emergency-contact' },
        { title: 'Eye profile', icon: 'eye', value: 'Re-scan', to: '/onboarding/face-scan-intro' },
        { title: 'Privacy and legal', icon: 'shield', to: '/profile/privacy-and-legal' },
        { title: 'Help and support', icon: 'help', onSelect: soon('Help and support') },
      ]} /></section>
    {notice && <p role="status" className="text-body-small profile-secondary profile-notice-line">{notice}</p>}
    {d.session && <Button style="Secondary" label="Sign out" onClick={() => void d.signOut().then(() => go('/onboarding/welcome')).catch(() => {})} />}
  </Frame>;
}
