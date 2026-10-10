import { useOnboardingDraft } from './draft';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components';
import { useAppData } from '../../integration/AppData';
import { Field, Frame, Heading, useOnboardingNavigation } from './shared';
export function SignUp() {
  const {draft,update} = useOnboardingDraft();
  const {signUp,signIn,api}=useAppData();const go=useOnboardingNavigation();const [params,setParams]=useSearchParams();const login=params.get('mode')==='signin';
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function submit(){if(!draft.email.includes('@')||draft.password.length<(login?1:8)||(!login&&!draft.name.trim())){setMessage('Enter your name, email and password.');return;}setBusy(true);setMessage('');
    try{const session=login?await signIn(draft.email,draft.password):await signUp(draft.name,draft.email,draft.password);update('password','');if(!session){setMessage('Check your email to confirm your account, then sign in.');setParams({mode:'signin'});return;}const savedCars=login?await api.cars():[];go(login&&savedCars.length?'/drive/home':'whats-your-car');}catch(e){setMessage(e instanceof Error?e.message:'Account request failed.');}finally{setBusy(false);}}
  const footer = <div className="ob-signup-actions"><p className="text-body-small">By continuing you agree to our Terms and Privacy Policy.</p><Button label={busy?'Please wait…':login?'Sign in':'Continue'} disabled={busy} onClick={()=>void submit()}/><button className="quiet-link text-body-small" onClick={()=>setParams(login?{}:{mode:'signin'})}>{login?'Create an account':'Already have an account? Sign in'}</button></div>;
  return <Frame back="welcome" footer={footer}><Heading title={login?'Welcome back':'Create your account'}>We’ll use it to save your car and your trips.</Heading><div className="ob-form">{!login&&<Field label="Full name" autoComplete="name" value={draft.name} onChange={e => update('name',e.target.value)} />}<Field label="Email" type="email" autoComplete="email" state="Focused" value={draft.email} onChange={e => update('email',e.target.value)} /><Field label="Password" type="password" autoComplete={login?'current-password':'new-password'} placeholder="At least 8 characters" value={draft.password} onChange={e => update('password',e.target.value)} />{message&&<p role="status" className="text-body-small api-error">{message}</p>}</div></Frame>;
}
