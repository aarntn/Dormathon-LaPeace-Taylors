import { useEffect } from 'react';
import { useAnimationControls, type TargetAndTransition, type Transition } from 'framer-motion';

/** Start independently of the route's initial=false presence context. */
export function useMotionAnimation(target: TargetAndTransition, transition: Transition, from?: TargetAndTransition) {
  const controls = useAnimationControls();
  // Equal keyframes do not restart when unrelated gallery/parent state changes.
  const signature = JSON.stringify([target, transition, from]);
  useEffect(() => {
    if (from) controls.set(from);
    void controls.start(target, transition);
    return () => controls.stop();
  }, [controls, signature]);
  return controls;
}
