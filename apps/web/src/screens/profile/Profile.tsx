import {Button,TabBar} from '../../components';
import {Frame,RowList,useProfileNavigation} from './shared';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
export function Profile(){
 const d=useAppData();const go=useProfileNavigation();const name=d.session?.user.user_metadata?.name??'Your profile';const finished=d.trips.filter(t=>t.ended_at);
 const minutes=finished.reduce((n,t)=>n+(Date.parse(t.ended_at!)-Date.parse(t.started_at))/60000,0);
 return <Frame className="profile-overview" footer={<TabBar active="Profile" onChange={t=>go(t==='Home'?'/drive/home':'/'+t.toLowerCase())}/>}>
 <header className="profile-person"><span className="profile-avatar text-heading-large">{name.slice(0,1)}</span><div className="profile-person-copy"><h1 className="text-heading-large">{name}</h1><p className="text-body-small">{d.session?.user.email}</p></div></header><AccountNotice/>
 <button className="profile-stats" onClick={()=>go('/profile/driving-stats')}><strong className="text-body-strong">Your driving</strong><span className="profile-numbers">{[[String(finished.length),'drives'],[Math.round(minutes/60)+' h','driving']].map(([v,l])=><span key={l}><span className="text-numeric-large">{v}</span><span className="text-label-small">{l}</span></span>)}</span></button>
 <section className="profile-group"><h2 className="text-body-small-strong">My cars</h2><RowList rows={[{title:d.selectedCar?d.selectedCar.make+' '+d.selectedCar.model:'Add a car',icon:'brand',to:d.selectedCar?'/profile/my-cars':'/profile/add-a-car'}]} label="My cars"/></section>
 <section className="profile-group"><h2 className="text-body-small-strong">Settings</h2><RowList rows={[{title:'Emergency contact',icon:'bell',value:d.contacts[0]?.name,to:'/profile/emergency-contact'},{title:'Maps app',icon:'map',value:localStorage.getItem('buckl.mapsApp')??'Waze',to:'/onboarding/which-maps-app'},{title:'Eye profile',icon:'eye',value:'Re-scan',to:'/onboarding/face-scan-intro'},{title:'Privacy and legal',icon:'shield',to:'/profile/privacy-and-legal'}]} label="Settings"/></section>
 {d.session&&<Button style="Secondary" label="Sign out" onClick={()=>void d.signOut().then(()=>go('/onboarding/welcome')).catch(()=>{})}/>}</Frame>;
}
