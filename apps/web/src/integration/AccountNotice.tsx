import {Button} from '../components';
import {useAppData} from './AppData';
import {useNavigate} from 'react-router';
export function AccountNotice(){
 const d=useAppData();const navigate=useNavigate();
 if(!d.session&&d.configState==='pending')return <p role="status" className="text-body-small">Loading account settings…</p>;
 if(!d.session&&d.configState==='unavailable')return <aside className="catch-card"><p className="catch-error" role="alert">Couldn’t load account settings. Check your connection and reload.</p><Button style="Secondary" label="Reload" onClick={()=>window.location.reload()}/></aside>;
 if(!d.session)return <aside className="catch-card"><p className="text-body-small">{d.configured?'Sign in to save checks, cars and trips.':'Account setup is waiting for the BUCKL database configuration.'}</p><Button style="Secondary" label="Sign in" onClick={()=>navigate('/onboarding/sign-up?mode=signin')}/></aside>;
 if(d.error)return <aside className="catch-card"><p className="catch-error" role="alert">{d.error}</p><Button style="Secondary" label="Try again" onClick={()=>void d.refresh()}/></aside>;
 return d.loading?<p role="status" className="text-body-small">Loading your account…</p>:null;
}
