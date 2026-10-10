import {useSearchParams} from 'react-router';
import {Button} from '../../components';
import {Back,DriveFrame,Heading,useDriveNavigation} from './shared';
import {useDrive} from './session';
import {useAppData} from '../../integration/AppData';
import {useResource} from '../../integration/useResource';
import {AccountNotice} from '../../integration/AccountNotice';
import {RouteTrace} from '../../integration/RouteTrace';
export function TripSummary(){
 const go=useDriveNavigation();const d=useDrive();const {api,session}=useAppData();const [params]=useSearchParams();const id=params.get('trip');const r=useResource(()=>api.summary(id!),id&&session?session.user.id+id:undefined);const summary=id?r.value:d.summary;
 return <DriveFrame footer={<Button label="Done" onClick={()=>go('/drive/home',true)}/>}><main className="drive-content drive-summary"><Back close to="/drive/home"/><Heading title="Trip summary">{summary?new Date(summary.events[0]?.at??Date.now()).toLocaleDateString():'Your completed trip'}</Heading><AccountNotice/>
 {r.loading&&<p role="status">Loading trip…</p>}{r.error&&<><p role="alert" className="catch-error">{r.error}</p><Button label="Try again" onClick={r.retry}/></>}
 {summary?<><RouteTrace points={summary.route_polyline}/><section className="catch-card"><div className="catch-stats">{[[summary.distance_km.toFixed(1)+' km','Distance'],[Math.round(summary.duration_seconds/60)+' min','Duration'],[summary.avg_speed_kmh.toFixed(0)+' km/h','Average speed']].map(([v,l])=><div key={l}><strong>{v}</strong><span className="text-label-small">{l}</span></div>)}</div></section>
 <section className="catch-card"><h2 className="text-title-medium">Safety score: {summary.safety_score}/100</h2><p className="text-body-small">{summary.score_explanation}</p><p className="text-body-small">Demo rule: 100 minus points for microsleeps, tired alerts and hard brakes.</p>{summary.trip_risk_lines.map(line=><p key={line} className="text-body-small">{line}</p>)}</section>
 <section className="drive-events" aria-label="Trip events">{summary.events.length===0?<p className="text-body-small">No alerts recorded on this trip.</p>:summary.events.map(e=><article key={e.id} className="drive-list-card"><div className="drive-card-copy"><h2 className="text-body-strong">{e.kind.replaceAll('_',' ')}</h2><p className="text-body-small">{new Date(e.at).toLocaleTimeString()}</p></div></article>)}</section></>:!r.loading&&!r.error&&<p className="text-body-small">Complete a trip to see its summary.</p>}</main></DriveFrame>;
}
