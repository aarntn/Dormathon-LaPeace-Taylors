import {useEffect,useState,type ReactNode} from 'react';
import {Button,TabBar} from '../../components';
import {DriveFrame,Heading,useDriveNavigation} from './shared';
import {useDemoLogo} from './DemoPanel';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
import {useDrive} from './session';
import type {CarReport} from '../../api';

type HomeTrip = {id?:string;title:string;description:string;warning?:boolean};
export type HomeViewProps = {initial?:string;carName?:string;status?:string;findingCount?:number;attention?:string;trips?:HomeTrip[];activeTrip?:boolean;reminder?:string;accountNotice?:ReactNode;onLogo:()=>void;onProfile:()=>void;onCar:()=>void;onStart:()=>void;onAttention:()=>void;onTrip:(id?:string)=>void;onTab:(tab:string)=>void};
const art=(name:string)=>'/assets/home/'+name;
const previewTrips:HomeTrip[]=[{title:'PJ → UM',description:'24 min · alert the whole way'}];

/** Figma presentation defaults are used only for the unconfigured local preview. */
export function HomeView({initial='M',carName='Perodua Myvi',status='Ready to drive',findingCount=2,attention='Weak battery · brakes due for a check',trips=previewTrips,activeTrip=false,reminder,accountNotice,onLogo,onProfile,onCar,onStart,onAttention,onTrip,onTab}:HomeViewProps){
 return <DriveFrame className="drive-home" footer={<TabBar active="Home" onChange={onTab}/>}>
  <main className="drive-content drive-home__content">
   <div className="drive-home__top"><button className="drive-logo" aria-label="BUCKL logo" onClick={onLogo}><img src={art('buckl-lockup.svg')} width="139.8" height="40.8" alt="BUCKL"/></button><button className="drive-avatar text-body-strong" aria-label="Profile" onClick={onProfile}>{initial}</button></div>
   {accountNotice}
   <button className="drive-car-hero" onClick={onCar}><img className="illustration" src={art('01b12.svg')} width="360" height="140" alt="Side view of a car"/><p className="text-title-medium">{carName}</p><div className="drive-car-status text-body-small-strong"><span><img src={art('4b216.svg')} width="8" height="8" alt=""/>{status}</span>{findingCount>0&&<span><img src={art('6cb7a.svg')} width="8" height="8" alt=""/>{findingCount} {findingCount===1?'thing':'things'} to check</span>}</div></button>
   <section className="drive-home__pitch"><Heading title="Stay awake on the road">A one-minute check before you go, then BUCKL watches your eyes and wakes you if they start to close.</Heading><Button className="drive-start-button" label={activeTrip?'Return to your trip':'Start drive watch'} onClick={onStart}/>{reminder&&<p className="text-body-small" role="status">{reminder}</p>}</section>
   {attention&&<button className="drive-list-card drive-home-attention" onClick={onAttention}><span className="drive-card-icon drive-card-icon--warning"><img src={art('b5e0a.svg')} width="22" height="22" alt=""/></span><span className="drive-card-copy"><strong className="text-body-strong">Your car needs attention</strong><span className="text-body-small">{attention}</span></span><img src={art('88e26.svg')} width="20" height="20" alt=""/></button>}
   <section className="drive-recent"><h2 className="text-body-strong">Recent trips</h2>{trips.length===0?<p className="text-body-small drive-home-empty">Your completed trips will appear here.</p>:trips.map((trip,index)=><button key={trip.id??index} className="drive-list-card drive-recent__card" onClick={()=>onTrip(trip.id)}><span className={`drive-card-icon drive-card-icon--${trip.warning?'warning':'success'}`}><img src={art('90ace.svg')} width="13.5" height="9.83" alt=""/></span><span className="drive-card-copy"><strong className="text-body-strong">{trip.title}</strong><span className="text-body-small">{trip.description}</span></span><span className="drive-card-arrow"><img src={art('24169.svg')} width="11.93" height="10.43" alt=""/></span></button>)}</section>
  </main>
 </DriveFrame>;
}

export function Home(){
 const go=useDriveNavigation();const logoTap=useDemoLogo();const d=useAppData();const drive=useDrive();const car=d.selectedCar;
 const [report,setReport]=useState<{carId:string;value:CarReport}|null>(null);
 useEffect(()=>{let cancelled=false;setReport(null);if(car)void d.api.carReport(car.id).then(value=>{if(!cancelled)setReport({carId:car.id,value});}).catch(()=>{});return()=>{cancelled=true;};},[car?.id,d.api]);
 const preview=d.configState==='unconfigured'&&!d.session;
 const currentReport=report?.carId===car?.id?report?.value:null;
 const findings=[...(currentReport?.dashboard?.findings.filter(f=>f.urgency!=='monitor').map(f=>f.label)??[]),...(currentReport?.startup&&currentReport.startup.urgency!=='monitor'?[currentReport.startup.verdict]:[]),...(currentReport?.brakes&&currentReport.brakes.urgency!=='monitor'?[currentReport.brakes.verdict]:[])];
 const recent=d.trips.filter(t=>t.ended_at).slice(0,3).map(t=>({id:t.id,title:`${(t.distance_km??0).toFixed(1)} km trip`,description:`${Math.round((Date.parse(t.ended_at!)-Date.parse(t.started_at))/60000)} min · ${t.passenger_mode?'passenger trip':t.safety_score!=null?t.safety_score+' safety score':'trip completed'}`,warning:t.safety_score!=null&&t.safety_score<80}));
 const reminder=Number(sessionStorage.getItem('buckl.check-reminder')??0);
 return <HomeView {...(preview?{}:{initial:(d.session?.user.user_metadata?.name??'B').slice(0,1),carName:car?car.make+' '+car.model:'Add your car',status:car?'Car added':'Set up your car',findingCount:findings.length,attention:findings.join(' · '),trips:recent})} accountNotice={preview?undefined:<AccountNotice/>} reminder={reminder>0?(Date.now()>=reminder?'Your 20-minute check reminder is due. Repeat the readiness check.':'Rest before repeating the check in 20 minutes.'):undefined} activeTrip={Boolean(drive.trip)} onLogo={logoTap} onProfile={()=>go('/profile')} onCar={()=>go(car||preview?'/car':'/onboarding/whats-your-car')} onStart={()=>go(drive.trip?(drive.trip.passenger_mode?'/drive/passenger-mode':'/drive/mount-your-phone'):d.session&&car?'/drive/before-you-drive':'/onboarding/welcome')} onAttention={()=>go('/car/car-report')} onTrip={id=>go(id?'/drive/trip-summary?trip='+encodeURIComponent(id):'/trips')} onTab={tab=>go(tab==='Home'?'/drive/home':'/'+tab.toLowerCase())}/>;
}
