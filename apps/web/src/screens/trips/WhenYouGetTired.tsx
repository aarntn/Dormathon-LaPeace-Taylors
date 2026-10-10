import {Button} from '../../components';
import {Frame,Heading,useTripsNavigation} from './shared';
import {useTripsSession} from './session';
import {useAppData} from '../../integration/AppData';
import {useResource} from '../../integration/useResource';
import {AccountNotice} from '../../integration/AccountNotice';
export function WhenYouGetTired(){
 const go=useTripsNavigation();const {enableNightReminders}=useTripsSession();const {api,session}=useAppData();const r=useResource(()=>api.patterns(),session?.user.id);const total=r.value?.slots.reduce((n,s)=>n+s.tired_alerts,0)??0;
 return <Frame back="/trips/trips" footer={<Button label="Turn on night reminders" onClick={()=>{enableNightReminders();go('/trips/trips',true);}}/>}><Heading title="When you get tired">Based on your recorded driving alerts</Heading><AccountNotice/>{r.loading&&<p role="status">Loading patterns…</p>}{r.error&&<><p role="alert" className="catch-error">{r.error}</p><Button label="Try again" onClick={r.retry}/></>}
 {r.value&&<><section className="trips-panel trips-chart-panel"><h2 className="text-body-strong">{total} tired alerts</h2>{total===0?<p className="text-body-small">No tired alerts recorded yet.</p>:r.value.slots.filter(s=>s.tired_alerts>0).map(s=><div key={s.from_hour} className="catch-data-row"><span>{s.from_hour}:00</span><strong>{s.tired_alerts}</strong></div>)}</section><dl className="trips-panel trips-facts"><div><dt>Late-night alerts</dt><dd>{Math.round(r.value.late_night_share*100)}%</dd></div></dl></>}
 <section className="trips-plan"><h2 className="text-body-small-strong">Night reminders</h2><p className="text-body-small">After 10 pm we’ll suggest a break every 30 min and warn you before a long drive.</p></section></Frame>;
}
