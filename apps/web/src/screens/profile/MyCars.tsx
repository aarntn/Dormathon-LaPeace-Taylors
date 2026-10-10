import { useEffect, useState } from 'react';
import { Button } from '../../components';
import { Art, Frame, Heading, useProfileNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { AccountNotice } from '../../integration/AccountNotice';
import { buildReport, checkedLabel } from '../car/report';

type Status = { count: number; checked?: string } | 'none';
export function MyCars() {
  const d = useAppData(); const go = useProfileNavigation(); const [status, setStatus] = useState<Record<string, Status>>({}); const [notice, setNotice] = useState('');
  const key = d.cars.map(car => car.id).join(',');
  useEffect(() => {
    let current = true; setStatus({});
    for (const car of d.cars) void d.api.carReport(car.id).then(report => {
      const built = buildReport(report.dashboard ?? undefined, report.startup ?? undefined, report.brakes);
      if (current) setStatus(previous => ({ ...previous, [car.id]: built.checked ? { count: built.attention.length, checked: built.checked } : 'none' }));
    }).catch(() => undefined);
    return () => { current = false; };
  }, [key, d.session?.user.id, d.api]);
  return <Frame back="/profile/profile" footer={<Button label="Add a car" onClick={() => go('/profile/add-a-car')} />}>
    <Heading title="My cars">BUCKL keeps checks and trips separate for each car.</Heading><AccountNotice />
    {d.cars.length === 0 && <p className="text-body-small profile-secondary">No cars saved yet.</p>}
    {d.cars.map(car => { const current = d.selectedCar?.id === car.id; const info = status[car.id];
      return <article key={car.id} className={'profile-garage-card profile-panel' + (current ? ' profile-garage-card--current' : '')}>
        <div className="profile-garage-top"><span className="profile-car-picture"><Art name="car-side" /></span>
          <div className="profile-garage-copy"><h2 className="text-body-strong">{car.make} {car.model}</h2><p className="text-body-small profile-secondary">{[car.plate, car.year, car.colour].filter(Boolean).join(' · ')}</p>
            {info && <p className={'profile-inline-status text-body-small-strong ' + (info !== 'none' && info.count ? 'profile-warning' : 'profile-success')}>{info === 'none' ? <span className="profile-secondary">Not checked yet</span> : <><span className={'profile-dot' + (info.count ? '' : ' profile-dot--success')} />{info.count ? `${info.count} ${info.count === 1 ? 'thing' : 'things'} to check` : `All good · checked ${checkedLabel(info.checked)}`}</>}</p>}</div></div>
        <div className="profile-garage-actions text-body-small-strong">
          {current ? <span className="profile-inline-status"><Art name="check" />Driving this car</span> : <button type="button" className="profile-garage-switch text-body-small-strong" onClick={() => d.selectCar(car.id)}>Switch to this car</button>}
          <button type="button" className="profile-garage-edit text-body-small-strong" onClick={() => setNotice('Editing car details isn’t available in the app yet.')}>Edit details</button></div>
      </article>; })}
    {notice && <p role="status" className="text-body-small profile-secondary profile-notice-line">{notice}</p>}
  </Frame>;
}
