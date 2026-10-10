export type TransitionKind = 'push' | 'sheet' | 'fade' | 'tab';
export type Direction = 1 | -1;
export const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export function navigationDirection(previousIndex: number, nextIndex: number, action: string): Direction {
  return action === 'POP' && nextIndex < previousIndex ? -1 : 1;
}

export function transitionFor(kind: TransitionKind, direction: Direction, reducedMotion: boolean) {
  if (reducedMotion) return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0, ease: EASE } };
  if (kind === 'push') return {
    initial: { x: direction === 1 ? '100%' : '-100%', opacity: 1 },
    animate: { x: '0%', opacity: 1 },
    exit: { x: direction === 1 ? '-100%' : '100%', opacity: 1 },
    transition: { duration: 0.45, ease: EASE },
  };
  if (kind === 'sheet') return {
    initial: { y: '100%', opacity: 1 }, animate: { y: '0%', opacity: 1 }, exit: { y: '100%', opacity: 1 },
    transition: { duration: 0.5, ease: EASE },
  };
  return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: kind === 'tab' ? 0.2 : 0.3, ease: EASE } };
}
