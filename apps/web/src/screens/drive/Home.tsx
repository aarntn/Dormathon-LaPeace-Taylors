import {Button,CarSide,TabBar,BrandMark} from '../../components';
import {DriveFrame,Heading,useDriveNavigation} from './shared';
import {useDemoLogo} from './DemoPanel';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
import {useDrive} from './session';
export function Home(){
 const go=useDriveNavigation();const logoTap=useDemoLogo();const d=useAppData();const drive=useDrive();const car=d.selectedCar;const recent=d.trips.filter(t=>t.ended_at).slice(0,3);
 const ready=d.session&&car;const reminder=Number(sessionStorage.getItem('buckl.check-reminder')??0);
 return <DriveFrame className="drive-home" footer={<TabBar active="Home" onChange={tab=>go(tab==='Home'?'/drive/home':'/'+tab.toLowerCase())}/>}>
 <main className="drive-content drive-home__content"><div className="drive-home__top"><button className="drive-logo" aria-label="BUCKL logo" onClick={logoTap}><BrandMark/></button><button className="drive-avatar text-body-strong" aria-label="Profile" onClick={()=>go('/profile')}>{(d.session?.user.user_metadata?.name??'B').slice(0,1)}</button></div>
 <AccountNotice/><button className="drive-car-hero" onClick={()=>go(car?'/car':'/onboarding/whats-your-car')}><CarSide/><p className="text-title-medium">{car?car.make+' '+car.model:'Add your car'}</p><p className="text-body-small">{car?.plate??'Save your car before your first trip'}</p></button>
 <section className="drive-home__pitch"><Heading title="Check before you drive">A quick readiness check, then BUCKL watches for tiredness on the road.</Heading>
 <Button className="drive-start-button" label={drive.trip?'Return to your trip':ready?'Check before driving':'Set up BUCKL'} onClick={()=>go(drive.trip?(drive.trip.passenger_mode?'/drive/passenger-mode':'/drive/mount-your-phone'):ready?'/drive/before-you-drive':'/onboarding/welcome')}/>
 {reminder>0&&<p className="text-body-small" role="status">{Date.now()>=reminder?'Your 20-minute check reminder is due. Repeat the readiness check.':'Rest before repeating the check in 20 minutes.'}</p>}
 </section><section className="drive-recent"><h2 className="text-body-strong">Recent trips</h2>{recent.length===0?<p className="text-body-small">Your completed trips will appear here.</p>:recent.map(t=><button key={t.id} className="drive-list-card" onClick={()=>go('/drive/trip-summary?trip='+encodeURIComponent(t.id))}><span className="drive-card-copy"><strong>{new Date(t.started_at).toLocaleDateString()}</strong><span className="text-body-small">{(t.distance_km??0).toFixed(1)} km · {t.passenger_mode?'Passenger':'Driver'} · {t.safety_score??'—'} safety score</span></span></button>)}</section></main></DriveFrame>;
}
