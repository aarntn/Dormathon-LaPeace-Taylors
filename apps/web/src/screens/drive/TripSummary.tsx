import {useSearchParams} from 'react-router';
import {Button} from '../../components';
import {Back,DriveFrame,Heading,useDriveNavigation} from './shared';
import {useDrive} from './session';
import {useAppData} from '../../integration/AppData';
import {useResource} from '../../integration/useResource';
import {AccountNotice} from '../../integration/AccountNotice';
import {RouteTrace} from '../../integration/RouteTrace';
import {useDrivePreview} from './DemoPanel';
import {summarySample} from './demoSamples';
import type {TripSummary as Summary} from '../../api';
const duration=(seconds:number)=>{const m=Math.round(seconds/60);return m>=60?`${Math.floor(m/60)} h ${m%60} min`:`${m} min`;};
const sampleBars=[8,10,8,11,10,13,11,14,16,21,24,27,30,35,38,46,77,32,24,19,16,14,13,13];
const names={tired:'Slow blinks',microsleep:'Microsleep',yawn:'Yawning',hard_brake:'Hard braking',lost:'Eyes out of view',not_responding:'No response'};
const icons={microsleep:'0ad48.svg',yawn:'616ac.svg',tired:'5ade7.svg',hard_brake:'5ade7.svg',lost:'0ad48.svg',not_responding:'0ad48.svg'};
export function TripSummaryView({summary,title,subtitle,preview=false}:{summary:Summary;title:string;subtitle:string;preview?:boolean}){
 const go=useDriveNavigation();const microsleeps=summary.events.filter(e=>e.kind==='microsleep').length;
 const bars=Array.from({length:24},()=>0);const first=summary.events.length?Math.min(...summary.events.map(e=>Date.parse(e.at))):0;
 if(!preview)for(const e of summary.events){const i=Math.min(23,Math.max(0,Math.floor((Date.parse(e.at)-first)/Math.max(1,summary.duration_seconds*1000)*24)));bars[i]+=1;}
 const values=preview?sampleBars:bars;const max=Math.max(...values,1);
 return <DriveFrame footer={<Button label="Done" onClick={()=>go('/drive/home',true)}/>}><main className="drive-content drive-summary current-summary"><Back close to="/drive/home"/><Heading title={title}>{subtitle}</Heading>
 <section className="summary-route">{preview?<img src="/assets/drive-current/868ca.svg" width="390" height="150" alt="Example trip route"/>:<RouteTrace points={summary.route_polyline}/>}<div className="summary-legend text-label-small">{[['6cb7a.svg','Tired'],['6665a.svg','Microsleep'],['fd9b0.svg','Hard braking']].map(([icon,label])=><span key={label}><img src={'/assets/drive-current/'+icon} width="8" height="8" alt=""/>{label}</span>)}</div></section>
 <section className="summary-trip-stats">{[[summary.distance_km.toLocaleString(undefined,{maximumFractionDigits:1})+' km','Distance'],[duration(summary.duration_seconds),'Duration'],[Math.round(summary.avg_speed_kmh)+' km/h','Avg speed']].map(([value,label])=><div key={label}><p className="text-label-small">{label}</p><strong className="text-body-strong">{value}</strong></div>)}</section>
 <section className="summary-risk"><div><h2 className="text-body-small-strong">Safety score · {summary.safety_score} / 100</h2>{preview&&<span className="summary-risk-badge text-body-small-strong"><img src="/assets/drive-current/6cb7a.svg" width="8" height="8" alt=""/>Medium</span>}</div><ul>{summary.trip_risk_lines.map(line=><li className="text-body-small" key={line}><img src="/assets/drive-current/008f0.svg" width="6" height="13" alt=""/>{line}</li>)}</ul>{!preview&&<p className="text-body-small summary-rule">Demo rule: 100 minus points for microsleeps, tired alerts and hard brakes.</p>}</section>
 <section className="summary-chart"><header><h2 className="text-body-strong">{preview?'Drowsiness on this trip':'Alerts on this trip'}</h2><span className="text-body-small-strong drive-danger">{microsleeps} microsleep{microsleeps===1?'':'s'}</span></header><div className="summary-chart-bars" role="img" aria-label={preview?'Example drowsiness chart':'Recorded alerts across the trip'}>{values.map((value,i)=><span key={i} className={preview?(value>=70?'danger':value>=30?'warning':'success'):'warning'} style={{height:value?`${preview?value:value/max*77}px`:'0px'}}/>)}</div><div className="summary-chart-labels text-label-small"><span>Start</span><span>{Math.round(summary.duration_seconds/120)} min</span><span>{Math.round(summary.duration_seconds/60)} min</span></div></section>
 <section className="drive-events" aria-label="Trip events">{summary.events.length===0?<p className="text-body-small">No alerts recorded on this trip.</p>:summary.events.map((e,i)=><article key={e.id} className="drive-list-card"><span className={'drive-card-icon drive-card-icon--'+(e.kind==='microsleep'?'danger':'warning')}><img src={'/assets/drive-current/'+icons[e.kind]} alt=""/></span><div className="drive-card-copy"><div className="summary-event-title"><h2 className="text-body-strong">{names[e.kind]}</h2><span className="text-label-small">{preview?['58 min','44 min','39 min','3 times'][i]:new Date(e.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div><p className="text-body-small">{preview?['Eyes closed 1.8 s · alarm sounded','3 times in 5 minutes','Blinks were getting longer','Mostly where traffic slowed near Kajang'][i]:e.kind==='hard_brake'?'Sudden slowing recorded':e.kind==='microsleep'?'Eyes closed during the drive':'Observation recorded'}</p></div></article>)}</section>{preview&&<p className="text-label-small summary-rule">Demo rule: 100 minus points for microsleeps, tired alerts and hard brakes.</p>}</main></DriveFrame>;
}
export function TripSummary(){
 const go=useDriveNavigation();const d=useDrive();const {api,session,trips}=useAppData();const [params]=useSearchParams();const id=params.get('trip');const preview=useDrivePreview()==='summary'&&!d.trip;
 const r=useResource(()=>api.summary(id!),id&&session&&!preview?session.user.id+id:undefined);const summary=id?r.value:d.summary;
 if(preview)return <TripSummaryView summary={summarySample} title="PJ → Seremban" subtitle="Today · 1 h 12 min · 68 km" preview/>;
 const trip=trips.find(t=>t.id===(id??summary?.trip_id));
 if(summary)return <TripSummaryView summary={summary} title={`${summary.distance_km.toLocaleString(undefined,{maximumFractionDigits:1})} km trip`} subtitle={`${trip?new Date(trip.started_at).toLocaleDateString()+' · ':''}${duration(summary.duration_seconds)}`}/>;
 return <DriveFrame footer={<Button label="Done" onClick={()=>go('/drive/home',true)}/>}><main className="drive-content drive-summary"><Back close to="/drive/home"/><Heading title="Trip summary">Your completed trip</Heading><AccountNotice/>{r.loading&&<p role="status">Loading trip…</p>}{r.error?<><p role="alert" className="catch-error">{r.error}</p><Button label="Try again" onClick={r.retry}/></>:!r.loading&&<p className="text-body-small">Complete a trip to see its summary.</p>}</main></DriveFrame>;
}
