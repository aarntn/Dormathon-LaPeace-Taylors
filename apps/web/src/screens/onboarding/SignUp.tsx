import { useOnboardingDraft } from './draft';
import { Continue, Field, Frame, Heading } from './shared';
export function SignUp() {
  const {draft,update} = useOnboardingDraft();
  const footer = <div className="ob-signup-actions"><p className="text-body-small">By continuing you agree to our Terms and Privacy Policy.</p><Continue to="whats-your-car" /></div>;
  return <Frame back="welcome" footer={footer}><Heading title="Create your account">We’ll use it to save your car and your trips.</Heading><div className="ob-form"><Field label="Full name" autoComplete="name" value={draft.name} onChange={e => update('name',e.target.value)} /><Field label="Email" type="email" autoComplete="email" state="Focused" value={draft.email} onChange={e => update('email',e.target.value)} /><Field label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={draft.password} onChange={e => update('password',e.target.value)} /></div></Frame>;
}
