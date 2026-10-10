import { useEffect, type ReactNode, type InputHTMLAttributes } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { AppFrame, Button, IconButton, Input, Option } from '../../components';

export const onboardingPath = (name: string) => '/onboarding/' + name;
export function useOnboardingNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const index = Number(window.history.state?.idx ?? 0);
  const trail = (location.state as { onboardingTrail?: { path: string; index: number }[] } | null)?.onboardingTrail ?? [];
  return (name: string, back = false, sheet = false) => {
    const path = name.startsWith('/') ? name : onboardingPath(name);
    if (back) {
      const target = [...trail].reverse().find(entry => entry.path === path && entry.index < index);
      if (target) { navigate(target.index - index); return; }
      navigate(path, { replace: true, state: { direction: -1 } }); return;
    }
    navigate(path, { state: { onboardingTrail: [...trail, { path: location.pathname, index }].slice(-64), ...(sheet ? { backgroundLocation: location } : {}) } });
  };
}
export function usePrototypeTimer(next: string, seconds: number, enabled: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const preview = params.has('preview');
  useEffect(() => {
    if (!enabled || preview) return;
    const timer = setTimeout(() => navigate(onboardingPath(next), { replace: true, state: location.state }), seconds * 1000);
    return () => clearTimeout(timer);
  }, [next, seconds, enabled, preview, navigate, location.state]);
}
export function Art({ name, className = '' }: { name: string; className?: string }) {
  return <img src={'/assets/onboarding/' + name} alt="" className={'ob-art ' + className} />;
}
export function Glyph({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="ob-glyph" style={{ width: size, height: size }}><Art name={name} /></span>;
}
export function Heading({ title, children }: { title: string; children: ReactNode }) {
  return <header className="ob-heading"><h1 className="text-heading-large">{title}</h1><p className="text-body-regular">{children}</p></header>;
}
export function Steps({ step }: { step: number }) {
  return <div className="ob-steps">{step===4 ? <Art name="maps-steps.svg" /> : <div className="ob-steps__bars">{[1,2,3,4].map(n => <span key={n} className={n <= step ? 'complete' : n === 4 ? 'last' : ''} />)}</div>}<p className="text-label-small">Step {step} of 4</p></div>;
}
export function Frame({ children, footer, back, step, className = '', dark = false }: { children: ReactNode; footer?: ReactNode; back?: string; step?: number; className?: string; dark?: boolean }) {
  const go = useOnboardingNavigation();
  return <AppFrame className={'ob-frame ' + className} theme={dark ? 'Dark' : 'Light'} footer={footer}><main className="ob-content">{back && <IconButton icon="Back" onClick={() => go(back, true)} />}{step && <Steps step={step} />}{children}</main></AppFrame>;
}
export function Continue({ to, label = 'Continue' }: { to: string; label?: string }) {
  const go = useOnboardingNavigation();
  return <Button label={label} onClick={() => go(to)} />;
}
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; state?: 'Placeholder' | 'Filled' | 'Focused' }) {
  return <label className="ob-field"><span className="text-body-small-strong">{label}</span><Input aria-label={label} text={label} {...props} /></label>;
}
export function Choice({ title, description, selected, choose }: { title: string; description: string; selected: boolean; choose: () => void }) {
  return <Option title={title} description={description} state={selected ? 'Selected' : 'Default'} onChange={choose} />;
}
