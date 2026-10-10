import {Button} from '../../components';
import {Frame,Heading} from './shared';
import {useAppData} from '../../integration/AppData';
import {useResource} from '../../integration/useResource';
import {AccountNotice} from '../../integration/AccountNotice';
export function DrivingStats(){
 const d=useAppData();const r=useResource(()=>d.api.patterns(),d.session?.user.id);
 const trips=d.trips.filter(t=>t.ended_at);const scores=trips.filter(t=>t.safety_score!=null);const average=scores.length?Math.round(scores.reduce((n,t)=>n+t.safety_score!,0)/scores.length):null;
 return <Frame back="/profile/profile"><Heading title="Driving stats">Your recorded trips and tired alerts</Heading><AccountNotice/><section className="catch-card"><h2 className="text-title-medium">{trips.length} completed trips</h2><p className="text-body-small">{trips.reduce((n,t)=>n+(t.distance_km??0),0).toFixed(1)} km recorded</p>{average!==null&&<p className="text-body-small">Average safety score: {average}/100. Calculated using the demo rule.</p>}</section>
 {r.loading&&<p role="status">Loading alerts…</p>}{r.error&&<><p role="alert" className="catch-error">{r.error}</p><Button label="Try again" onClick={r.retry}/></>}{r.value&&<section className="catch-card"><h2 className="text-title-medium">Tiredness alerts</h2>{r.value.slots.map(s=><div className="catch-data-row" key={s.from_hour}><span>{s.from_hour}:00</span><strong>{s.tired_alerts}</strong></div>)}</section>}</Frame>;
}
