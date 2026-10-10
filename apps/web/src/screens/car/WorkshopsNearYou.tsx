import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components';
import type { Service, Workshop } from '../../api';
import { useAppData } from '../../integration/AppData';
import { Art, Frame, Heading } from './shared';
import { useCarSession } from './session';
import { buildReport, checkedLabel } from './report';
import { reportText } from './CarReport';

const services: [Service, string][] = [['cooling', 'Cooling'], ['battery', 'Battery'], ['brakes', 'Brakes'], ['tyres', 'Tyres'], ['fuel', 'Fuel']];
const reasons: Record<Service, string> = { cooling: 'engine cooling', battery: 'a weak battery', brakes: 'brakes', tyres: 'tyres', fuel: 'fuel' };
const whatsappNumber = (phone: string | null) => {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return !digits ? '' : digits.startsWith('60') ? digits : digits.startsWith('0') ? '6' + digits : digits;
};

/** C7 Workshops near you: filtered by the problem, with Call, Directions and a user-started WhatsApp report. */
export function WorkshopsNearYou() {
  const [params, setParams] = useSearchParams(); const data = useAppData(); const { dashboard, startup, brakes } = useCarSession();
  const requested = params.get('service') as Service | null; const service: Service = services.some(([value]) => value === requested) ? requested! : 'cooling';
  const [shops, setShops] = useState<Workshop[]>(); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false; setLoading(true); setMessage(''); setShops(undefined);
    if (!navigator.geolocation) { setLoading(false); setMessage('Location isn’t available. Open Maps to search for workshops.'); return; }
    navigator.geolocation.getCurrentPosition(position => {
      void data.api.workshops({ lat: position.coords.latitude, lng: position.coords.longitude }, service).then(result => { if (!cancelled) { setShops(result.workshops.slice(0, 3)); if (!result.workshops.length) setMessage(result.message ?? 'No workshops found nearby.'); } })
        .catch(error => { if (!cancelled) setMessage(error instanceof Error ? error.message : 'Could not load workshops.'); }).finally(() => { if (!cancelled) setLoading(false); });
    }, () => { if (!cancelled) { setLoading(false); setMessage('Allow location so we can find workshops near you.'); } }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
    return () => { cancelled = true; };
  }, [service, data.api]);
  const report = buildReport(dashboard, startup, brakes);
  const sendReport = () => {
    const text = reportText(report.items, report.estimate, checkedLabel(report.checked));
    window.open(`https://wa.me/${whatsappNumber(shops?.find(shop => shop.phone)?.phone ?? null)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };
  return <Frame back="car-check" className="car-workshops" footer={<Button label="Send report on WhatsApp" onClick={sendReport} disabled={!report.items.length} />}>
    <Heading title="Workshops near you">{`For ${reasons[service]} · closest first`}</Heading>
    <div className="car-service-filter" role="tablist" aria-label="Problem">{services.map(([value, name]) => <button key={value} role="tab" aria-selected={value === service} className={'text-body-small-strong' + (value === service ? ' active' : '')} onClick={() => setParams({ service: value }, { replace: true })}>{name}</button>)}</div>
    <section className="car-shops car-panel" aria-busy={loading}>
      {loading && <p className="car-shops-note text-body-small" role="status">Finding workshops…</p>}
      {!loading && message && <p className="car-shops-note text-body-small" role="status">{message}</p>}
      {shops?.map(shop => <article key={shop.osm_id} className="car-shop"><div className="car-shop-head"><div><h2 className="text-body-strong">{shop.name}</h2><p className="text-body-small">{shop.service_match ? `${services.find(([value]) => value === service)![1]} · ` : ''}{shop.opening_hours ?? 'Opening hours not listed'}</p></div><span className="text-body-small-strong">{shop.distance_km.toFixed(1)} km</span></div>
        <div className="car-shop-actions">{shop.phone && <a className="car-shop-action text-body-small-strong" href={`tel:${shop.phone}`}><Art name="action-call.svg" />Call</a>}<a className="car-shop-action text-body-small-strong" href={shop.google_maps_url} target="_blank" rel="noopener noreferrer"><Art name="action-directions.svg" />Directions</a></div></article>)}
    </section>
    <section className="car-severity car-severity--tint"><strong className="text-body-small-strong">Send them your report</strong><p className="text-body-small">They’ll see your warning-light scan and car report before you arrive.</p></section>
  </Frame>;
}
