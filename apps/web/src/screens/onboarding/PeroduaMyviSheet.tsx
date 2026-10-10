import { useEffect, useRef } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../../components';
import { EASE, transitionFor } from '../../routing/transitions';
import { useOnboardingDraft } from './draft';
import { Art, Choice, useOnboardingNavigation } from './shared';

export function PeroduaMyviSheet({ versions = [['1.5 AV','Top version · 2018 – today'],['1.5 H','2018 – today'],['1.3 G','2018 – today']] }: { versions?: string[][] }) {
  const dialog=useRef<HTMLDialogElement>(null); const closing=useRef(false); const {draft,update}=useOnboardingDraft();
  const navigate=useNavigate(); const location=useLocation(); const go=useOnboardingNavigation();
  const reducedMotion=Boolean(useReducedMotion()); const present=useIsPresent();
  const close=()=>{if(closing.current)return;closing.current=true;location.state?.backgroundLocation ? navigate(-1) : navigate('/onboarding/whats-your-car',{replace:true});};
  useEffect(()=>{
    const element=dialog.current; const overflow=document.body.style.overflow; const focus=document.activeElement;
    document.body.style.overflow='hidden'; element?.showModal(); element?.focus();
    return ()=>{element?.close();document.body.style.overflow=overflow;if(focus instanceof HTMLElement&&focus.isConnected)focus.focus({preventScroll:true});};
  },[]);
  return <motion.dialog ref={dialog} className="sheet-dialog ob-sheet-dialog" tabIndex={-1} inert={!present} style={{pointerEvents:present?'auto':'none'}} aria-labelledby="ob-sheet-title" onCancel={e=>{e.preventDefault();close();}} initial={{opacity:reducedMotion?1:0}} animate={{opacity:1}} exit={{opacity:reducedMotion?1:0}} transition={{duration:reducedMotion?0:0.5,ease:EASE}}>
    <div className="ob-sheet-backdrop" onClick={close} />
    <motion.section className="ob-car-sheet" {...transitionFor('sheet',1,reducedMotion)} data-transition="sheet">
      <div className="ob-sheet-handle" /><Art name="0b9c1.svg" />
      <header className="ob-sheet-heading"><h1 id="ob-sheet-title" className="text-heading-large">Perodua Myvi</h1><p className="text-body-regular">Hatchback · 5 seats · petrol</p></header>
      <div className="ob-versions"><h2 className="text-body-small-strong">Which version is yours?</h2>{versions.map(([title,description])=><Choice key={title} title={title} description={description} selected={draft.version===title} choose={()=>{update('version',title);update('engine',title.startsWith('1.3')?'1.3 L':'1.5 L');}} />)}</div>
      <Button label="This is my car" onClick={()=>{if(closing.current)return;closing.current=true;go('car-details');}} />
    </motion.section>
  </motion.dialog>;
}
