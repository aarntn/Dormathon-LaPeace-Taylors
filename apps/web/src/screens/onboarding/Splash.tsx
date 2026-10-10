import { useDemoLogo } from '../drive/DemoPanel';
import { Art, Frame, useOnboardingNavigation, usePrototypeTimer } from './shared';
export function Splash({ autoAdvance = true, tagline = 'Eyes on you. Eyes on your car.' }: { autoAdvance?: boolean; tagline?: string }) {
  const go = useOnboardingNavigation();
  usePrototypeTimer('loading', 1.2, autoAdvance);
  const tap = useDemoLogo(() => go('loading'));
  return <Frame className="ob-brand-screen ob-splash"><button className="ob-splash-mark" aria-label="BUCKL" onClick={tap}><Art name="1cd24.svg" /></button><Art name="wordmark-splash.svg" className="ob-wordmark" /><p className="text-body-regular ob-tagline">{tagline}</p></Frame>;
}
