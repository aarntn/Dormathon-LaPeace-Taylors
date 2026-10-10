import {TabBar} from '../../components';
import {Frame,Heading,useTripsNavigation} from './shared';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
export function Trips(){
 const go=useTripsNavigation();const d=useAppData();const trips=d.trips.filter(t=>t.ended_at);
 return <Frame className="trips-overview" footer={<TabBar active="Trips" onChange={t=>go(t==='Home'?'/drive/home':'/'+t.toLowerCase())}/>}>
 <Heading title="Trips">{trips.length} completed drives</Heading><AccountNotice/>
 {trips.length===0?<section className="catch-card"><img src="/assets/catch-up/41857.svg" alt="" className="catch-empty-art"/><h2 className="text-title-medium">Your first trip starts here</h2><p className="text-body-small">After your first drive, see your route, alerts and safety score here.</p></section>:<><button className="trips-pattern trips-panel" onClick={()=>go('/trips/when-you-get-tired')}><strong className="text-title-medium">When you get tired</strong><span className="text-body-small">Patterns from your recorded alerts</span></button><section className="trips-list trips-panel">{trips.map(t=><button key={t.id} className="trips-row" onClick={()=>go('/drive/trip-summary?trip='+encodeURIComponent(t.id))}><span className="trips-row-copy"><strong>{new Date(t.started_at).toLocaleString()}</strong><span className="text-body-small">{(t.distance_km??0).toFixed(1)} km · {Math.round((Date.parse(t.ended_at!)-Date.parse(t.started_at))/60000)} min</span></span><span className="text-body-small-strong">{t.passenger_mode?'Passenger':(t.safety_score??'—')+'/100'}</span></button>)}</section></>}</Frame>;
}
