import { useState } from 'react';
import { Input } from '../../components';
import { Art, Frame, Heading, useProfileNavigation } from './shared';

export type PopularCar = { name: string; kind: string; initial: string };
const cars: PopularCar[] = [{ name: 'Perodua Bezza', kind: 'Sedan', initial: 'P' }, { name: 'Perodua Axia', kind: 'Hatchback', initial: 'P' }, { name: 'Proton Saga', kind: 'Sedan', initial: 'P' }, { name: 'Proton X50', kind: 'SUV', initial: 'P' }, { name: 'Toyota Vios', kind: 'Sedan', initial: 'T' }];
export function AddACar({ items = cars }: { items?: PopularCar[] }) {
  const [search, setSearch] = useState('');
  const go = useProfileNavigation();
  const matching = items.filter(car => car.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <Frame back="/profile/my-cars"><Heading title="Add a car">Search for the model, or scan its number plate.</Heading><div className="profile-search"><Input aria-label="Search make or model" placeholder="Search make or model" value={search} onChange={event => setSearch(event.target.value)} /><Art name="search" /></div><div className="profile-scan profile-panel"><span className="profile-scan-icon"><Art name="camera" /></span><div className="profile-car-copy"><h2 className="text-body-strong">Scan the number plate</h2><p className="text-body-small profile-secondary">We’ll fill in the make, model and year for you</p></div><Art name="chevron" /></div><section className="profile-popular"><h2 className="text-body-small-strong profile-secondary">Popular in Malaysia</h2><div className="profile-popular-list profile-panel">{matching.map(car => <button key={car.name} type="button" className="profile-popular-car" onClick={() => go('/profile/my-cars', true)}><span className="profile-make text-body-strong">{car.initial}</span><span className="profile-popular-copy"><span className="text-body-strong">{car.name}</span><span className="text-body-small profile-secondary">{car.kind}</span></span><Art name="chevron" /></button>)}{matching.length === 0 && <p className="profile-no-results text-body-small" role="status">No matching models</p>}</div></section></Frame>;
}
