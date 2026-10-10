import { useState } from 'react';
import { Button, Input } from '../../components';
import { Art, Frame, Heading, useProfileNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { AccountNotice } from '../../integration/AccountNotice';

const popular = [['Perodua', 'Bezza', 'Sedan'], ['Perodua', 'Axia', 'Hatchback'], ['Proton', 'Saga', 'Sedan'], ['Proton', 'X50', 'SUV'], ['Toyota', 'Vios', 'Sedan'], ['Perodua', 'Myvi', 'Hatchback'], ['Honda', 'City', 'Sedan']] as const;

/** P4 Add a car: search or pick a popular model, then confirm year and plate. Manual entry stays available. */
export function AddACar() {
  const d = useAppData(); const go = useProfileNavigation();
  const [query, setQuery] = useState(''); const [form, setForm] = useState(false); const [make, setMake] = useState(''); const [model, setModel] = useState(''); const [plate, setPlate] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear())); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const text = query.trim().toLowerCase();
  const results = text ? popular.filter(([brand, name]) => `${brand} ${name}`.toLowerCase().includes(text)) : popular.slice(0, 5);
  const choose = (brand: string, name: string) => { setMake(brand); setModel(name); setForm(true); };
  async function save() {
    setBusy(true); setError('');
    try {
      if (!make.trim() || !model.trim()) throw new Error('Enter the make and model.');
      const car = await d.ensureSetup({ make: make.trim(), model: model.trim(), year: Number(year), plate: plate.trim().toUpperCase() || null });
      d.selectCar(car.id); go('/profile/my-cars', true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save your car.'); } finally { setBusy(false); }
  }
  if (form) return <Frame back="/profile/my-cars" footer={<Button label={busy ? 'Saving…' : 'Save car'} disabled={busy || !d.session} onClick={() => void save()} />}>
    <Heading title="Add a car">Enter your car’s details.</Heading><AccountNotice />
    <Input aria-label="Make" placeholder="Make" value={make} onChange={event => setMake(event.target.value)} />
    <Input aria-label="Model" placeholder="Model" value={model} onChange={event => setModel(event.target.value)} />
    <Input aria-label="Year" type="number" min="1900" max={new Date().getFullYear() + 1} value={year} onChange={event => setYear(event.target.value)} />
    <Input aria-label="Number plate" placeholder="Number plate (optional)" value={plate} onChange={event => setPlate(event.target.value)} />
    {error && <p className="catch-error" role="alert">{error}</p>}
  </Frame>;
  return <Frame back="/profile/my-cars">
    <Heading title="Add a car">Search for the model, or scan its number plate.</Heading><AccountNotice />
    <div className="profile-search"><Art name="search" /><Input aria-label="Search make or model" placeholder="Search make or model" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <button type="button" className="profile-scan profile-panel" onClick={() => setNotice('Plate scanning isn’t available yet. Search for your model or add it by hand.')}>
      <span className="profile-scan-icon"><Art name="camera" /></span><span className="profile-car-copy"><strong className="text-body-strong">Scan the number plate</strong><span className="text-body-small profile-secondary">We’ll fill in the make, model and year for you</span></span><Art name="chevron" /></button>
    {notice && <p role="status" className="text-body-small profile-secondary">{notice}</p>}
    <section className="profile-popular"><h2 className="text-body-small-strong profile-secondary">{text ? 'Results' : 'Popular in Malaysia'}</h2>
      <div className="profile-popular-list profile-panel">{results.map(([brand, name, body]) => <button key={brand + name} type="button" className="profile-popular-car" onClick={() => choose(brand, name)}><span className="profile-make text-body-strong">{brand[0]}</span><span className="profile-popular-copy"><strong className="text-body-strong">{brand} {name}</strong><span className="text-body-small profile-secondary">{body}</span></span><Art name="chevron" /></button>)}
        {!results.length && <p className="profile-no-results text-body-small profile-secondary">No match. Add your car by hand instead.</p>}</div>
      <button type="button" className="profile-text-action text-body-small-strong profile-manual" onClick={() => { setMake(''); setModel(''); setForm(true); }}><Art name="plus" />Can’t find it? Add your car manually</button></section>
  </Frame>;
}
