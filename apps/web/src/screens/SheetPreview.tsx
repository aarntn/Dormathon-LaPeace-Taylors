import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Button, IconButton } from '../components';
import { EASE, transitionFor } from '../routing/transitions';

export function SheetPreview() {
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const reducedMotion = Boolean(useReducedMotion());
  const transition = transitionFor('sheet', 1, reducedMotion);
  const close = () => window.history.state?.idx > 0 ? navigate(-1) : navigate('/components', { replace: true });

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  return <motion.dialog ref={dialog} className="sheet-dialog" aria-labelledby="sheet-heading" onCancel={event => { event.preventDefault(); close(); }}
    initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}>
    <div className="sheet-backdrop" onClick={close} />
    <motion.div className="sheet-content" {...transition}>
      <div className="sheet-handle" />
      <header className="sheet-content__header"><h1 id="sheet-heading" className="text-heading-large">Bottom sheet</h1><IconButton icon="Close" onClick={close} /></header>
      <p className="text-body-regular text-text-secondary">Slides up over the current screen. Close it to return to the same place.</p>
      <Button label="Close sheet" onClick={close} />
    </motion.div>
  </motion.dialog>;
}
