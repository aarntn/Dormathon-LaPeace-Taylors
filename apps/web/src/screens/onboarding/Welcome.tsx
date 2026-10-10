import { useState } from 'react';
import { Button } from '../../components';
import { useDemoLogo } from '../drive/DemoPanel';
import { Art, Frame, Heading, useOnboardingNavigation } from './shared';
export function Welcome() {
  const go = useOnboardingNavigation(); const logo = useDemoLogo(); const [notice, setNotice] = useState('');
  const footer = <div className="ob-welcome-actions"><Button label="Sign up with email" onClick={() => go('sign-up')} /><Button style="Secondary" label="Continue with Google" onClick={() => setNotice('Google sign-in isn’t available yet. Sign up with email instead.')} />{notice && <p role="status" className="text-body-small api-error">{notice}</p>}<p className="text-body-small">Already have an account? <button className="text-body-small-strong" onClick={() => go('/onboarding/sign-up?mode=signin')}>Log in</button></p></div>;
  return <Frame className="ob-welcome" footer={footer}><div className="ob-welcome-hero"><Art name="d8350.svg" className="ob-hero-halo" /><button className="ob-hero-mark" aria-label="BUCKL" onClick={logo}><Art name="4e2f1.svg" /></button><Art name="a89d2.svg" className="ob-hero-car" /></div><Heading title="Drive awake, arrive safe">A co-pilot that checks you’re safe to drive, watches for danger on the trip, and helps you act when you or your car show warning signs.</Heading></Frame>;
}
