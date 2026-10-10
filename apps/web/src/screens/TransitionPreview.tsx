import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppFrame, Button, BrandMark, IconButton, TabBar, CarSide, type Tab } from '../components';
import { transitionFor } from '../routing/transitions';

export function TransitionPreview() {
  const { kind } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Home');
  const reducedMotion = Boolean(useReducedMotion());
  const dark = kind === 'fade';
  const goBack = () => window.history.state?.idx > 0 ? navigate(-1) : navigate('/components', { replace: true });
  const descriptions: Record<string, string> = {
    push: 'Forward slides in from the right. Back slides out to the right.',
    fade: 'Driving states cross-fade, keeping the same frame on screen.',
    tab: 'Tab screens fade smoothly between views.',
  };
  return <AppFrame theme={dark ? 'Dark' : 'Light'} footer={<Button label="Back to components" style={dark ? 'Light' : 'Primary'} onClick={goBack} />}>
    <main className="preview"><header className="preview__header"><IconButton icon="Back" theme={dark ? 'Dark' : 'Light'} onClick={goBack} /><span className="text-label-small">TRANSITION PREVIEW</span><BrandMark theme={dark ? 'White' : 'Navy'} /></header>
      <h1 className="text-heading-large">{kind === 'push' ? 'Push' : kind === 'fade' ? 'Cross-fade' : 'Tab fade'}</h1><p className={`text-body-regular ${dark ? 'text-drive-text-secondary' : 'text-text-secondary'}`}>{descriptions[kind ?? 'push']}</p>
      <div className="preview__art"><CarSide /></div>{kind === 'tab' && <><div className="preview__tab"><TabBar active={tab} onChange={setTab} /></div><div className="preview__tab" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.p key={tab} className="text-title-medium" {...transitionFor('tab', 1, reducedMotion)}>{tab}</motion.p></AnimatePresence></div></>}
    </main>
  </AppFrame>;
}
