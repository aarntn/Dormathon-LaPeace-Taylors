import { Button } from '../../components';
import { Art, Frame, Heading, useProfileNavigation } from './shared';

export type ProfileCar = { name: string; detail: string; status: string; current: boolean };
const cars: ProfileCar[] = [
  { name: 'Perodua Myvi 1.5 AV', detail: 'WXY 4821 · 2021 · Granite Grey', status: '2 things to check', current: true },
  { name: 'Honda City 1.5 V', detail: 'BKL 2290 · 2019 · White', status: 'All good · checked 2 weeks ago', current: false },
];
export function MyCars({ items = cars }: { items?: ProfileCar[] }) {
  const go = useProfileNavigation();
  return <Frame back="/profile/profile" footer={<Button label="Add a car" onClick={() => go('/profile/add-a-car')} />}><Heading title="My cars">Dormathon keeps checks and trips separate for each car.</Heading>{items.map(car => <article key={car.name} className={'profile-garage-card profile-panel' + (car.current ? ' profile-garage-card--current' : '')}><div className="profile-garage-top"><span className="profile-car-picture"><Art name="car-side" /></span><div className="profile-garage-copy"><h2 className="text-body-strong">{car.name}</h2><p className="text-body-small profile-secondary">{car.detail}</p><p className={'profile-inline-status text-body-small-strong ' + (car.current ? 'profile-warning' : 'profile-success')}><span className={'profile-dot' + (car.current ? '' : ' profile-dot--success')} />{car.status}</p></div></div><div className="profile-garage-actions text-body-small-strong"><span className="profile-inline-status">{car.current && <Art name="check" />}{car.current ? 'Driving this car' : 'Switch to this car'}</span><span className="profile-secondary">Edit details</span></div></article>)}</Frame>;
}
