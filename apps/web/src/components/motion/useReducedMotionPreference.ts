import { useSyncExternalStore } from 'react';

let query: MediaQueryList | undefined;
const listeners = new Set<() => void>();
const getQuery = () => query ??= window.matchMedia('(prefers-reduced-motion: reduce)');
const changed = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
  if (!listeners.size) getQuery().addEventListener('change', changed);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) getQuery().removeEventListener('change', changed);
  };
};

/** Also responds if the phone's accessibility setting changes while open. */
export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, () => getQuery().matches, () => false);
}
