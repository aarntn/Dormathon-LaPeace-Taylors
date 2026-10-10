import { BrandMark } from '../../components';
import { useDemoLogo } from '../drive/DemoPanel';
import { Art, Frame, useOnboardingNavigation, usePrototypeTimer } from './shared';
export function Loading({ progress = 65, autoAdvance = true }: { progress?: number; autoAdvance?: boolean }) {
  const go = useOnboardingNavigation();
  usePrototypeTimer('welcome', 1.5, autoAdvance);
  const tap = useDemoLogo(() => go('welcome'));
  return <Frame className="ob-brand-screen ob-loading"><button className="ob-loading-mark" aria-label="BUCKL" onClick={tap}><BrandMark theme="White" /></button><Art name="wordmark-loading.svg" className="ob-wordmark" /><div className="ob-loading-progress" role="progressbar" aria-label="Getting your co-driver ready" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: Math.max(0,Math.min(100,progress)) + '%' }} /></div><p className="text-body-small ob-loading-caption">Getting your co-driver ready</p></Frame>;
}
