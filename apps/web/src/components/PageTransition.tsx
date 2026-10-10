import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { transitionFor, type Direction, type TransitionKind } from '../routing/transitions';

export type TransitionContext = { kind: TransitionKind; direction: Direction; reducedMotion: boolean };
const variants: Variants = {
  initial: (context: TransitionContext) => {
    const value = transitionFor(context.kind, context.direction, context.reducedMotion);
    return { ...value.initial, transition: value.transition };
  },
  animate: (context: TransitionContext) => {
    const value = transitionFor(context.kind, context.direction, context.reducedMotion);
    return { ...value.animate, transition: value.transition };
  },
  exit: (context: TransitionContext) => {
    const value = transitionFor(context.kind, context.direction, context.reducedMotion);
    return { ...value.exit, transition: value.transition };
  },
};

export function PageTransition({ children, context }: { children: ReactNode; context: TransitionContext }) {
  return <motion.div custom={context} variants={variants} initial="initial" animate="animate" exit="exit" className="route-page" data-transition={context.kind} data-direction={context.direction}>{children}</motion.div>;
}
