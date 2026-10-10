import {useEffect,useState} from 'react';
import { BrandMark } from '../../components';
import { useDemoLogo } from '../drive/DemoPanel';
import { Art, Frame, useOnboardingNavigation } from './shared';
export function Loading({ progress = 0, autoAdvance = true }: { progress?: number; autoAdvance?: boolean }) {
  const go = useOnboardingNavigation();
  const [elapsed,setElapsed]=useState(0);useEffect(()=>{if(!autoAdvance)return;const start=performance.now();const timer=setInterval(()=>{const p=Math.min(100,(performance.now()-start)/2200*100);setElapsed(p);if(p===100){clearInterval(timer);go('welcome');}},40);return()=>clearInterval(timer);},[autoAdvance]);
  const tap = useDemoLogo(() => go('welcome'));
  return <Frame className="ob-brand-screen ob-loading"><button className="ob-loading-mark" aria-label="BUCKL" onClick={tap}><BrandMark theme="White" /></button><Art name="wordmark-loading.svg" className="ob-wordmark" /><div className="ob-loading-progress" role="progressbar" aria-label="Getting your co-driver ready" aria-valuenow={autoAdvance?elapsed:progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: Math.max(0,Math.min(100,autoAdvance?elapsed:progress)) + '%' }} /></div><p className="text-body-small ob-loading-caption">Getting your co-driver ready</p></Frame>;
}
