import { TabBar, type Tab } from '../../components';
import { Art, Frame, RowList, useProfileNavigation, type RowData } from './shared';

const settings: RowData[] = [
  { title: 'Alarm and alerts', icon: 'bell', value: 'Loud' },
  { title: 'Maps app', icon: 'map', value: 'Waze', to: '/onboarding/which-maps-app' },
  { title: 'Eye profile', icon: 'eye', value: 'Re-scan', to: '/onboarding/face-scan-intro' },
  { title: 'Privacy and legal', icon: 'shield', to: '/profile/privacy-and-legal' },
  { title: 'Help and support', icon: 'help' },
];
export type ProfileProps = { name?: string; email?: string; drives?: string; drivingTime?: string; breaks?: string; alerts?: string; car?: string; carStatus?: string; rows?: RowData[] };
export function Profile({ name = 'Michael Jackson', email = 'mj@example.com', drives = '18', drivingTime = '14 h', breaks = '6', alerts = '5 tiredness alerts and 1 microsleep this month', car = 'Perodua Myvi 1.5 AV', carStatus = 'WXY 4821 · 2 things to check', rows = settings }: ProfileProps) {
  const go = useProfileNavigation();
  const paths: Record<Tab, string> = { Home: '/drive/home', Trips: '/trips/trips', Car: '/car/car-check', Profile: '/profile/profile' };
  return <Frame className="profile-overview" footer={<TabBar active="Profile" onChange={tab => tab !== 'Profile' && go(paths[tab])} />}>
    <header className="profile-person"><span className="profile-avatar text-heading-large" aria-hidden="true">{name.slice(0, 1)}</span><div className="profile-person-copy"><h1 className="text-heading-large">{name}</h1><p className="text-body-small profile-secondary">{email}</p></div><span className="profile-edit" aria-hidden="true"><Art name="edit" /></span></header>
    <button type="button" className="profile-stats" onClick={() => go('/profile/driving-stats')}><span className="profile-between"><span className="text-body-strong">This month</span><span className="profile-stat-link text-body-small-strong">See stats<Art name="chevron-white" /></span></span><span className="profile-numbers">{[[drives, 'drives'], [drivingTime, 'driving'], [breaks, 'breaks taken']].map(([value, label]) => <span key={label}><span className="text-numeric-large">{value}</span><span className="text-label-small">{label}</span></span>)}</span><span className="profile-alert-line text-body-small"><span className="profile-dot" />{alerts}</span></button>
    <section className="profile-group" aria-label="My cars"><div className="profile-between"><h2 className="text-body-small-strong profile-secondary">My cars</h2><button type="button" className="profile-text-action text-body-small-strong" onClick={() => go('/profile/add-a-car')}><Art name="plus" />Add a car</button></div><button type="button" className="profile-current-car profile-panel" onClick={() => go('/profile/my-cars')}><span className="profile-brand"><Art name="brand" /></span><span className="profile-car-copy"><span className="text-body-strong">{car}</span><span className="profile-inline-status text-body-small profile-secondary"><span className="profile-dot" />{carStatus}</span></span><Art name="chevron" /></button></section>
    <section className="profile-group" aria-label="Settings"><h2 className="text-body-small-strong profile-secondary">Settings</h2><RowList rows={rows} label="Settings" /></section>
  </Frame>;
}
