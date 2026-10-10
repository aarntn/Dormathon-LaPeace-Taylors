// Scripted car-check results for presentations. The hidden demo panel (triple-tap the logo) picks one;
// the server honours it only when it runs with DEMO_MODE on, and labels every such result a demo.
export type DashboardScenario = 'overheating' | 'battery' | 'oil' | 'unreadable';
export type StartupScenario = 'slow' | 'normal' | 'quiet';
type Kind = 'dashboard' | 'startup';

export const dashboardScenarios: [DashboardScenario, string][] = [
  ['overheating', 'Engine overheating: stop safely'],
  ['battery', 'Battery warning: book soon'],
  ['oil', 'Oil pressure: stop safely'],
  ['unreadable', 'Couldn’t read the light'],
];
export const startupScenarios: [StartupScenario, string][] = [
  ['slow', 'Slow start: weak battery'],
  ['normal', 'Normal start'],
  ['quiet', 'Didn’t hear the engine'],
];

const key = (kind: Kind) => 'buckl.demo.' + kind;
export function getScenario<T extends string>(kind: Kind): T | null {
  try { return (sessionStorage.getItem(key(kind)) as T | null) || null; } catch { return null; }
}
export function setScenario(kind: Kind, value: string | null) {
  try { if (value) sessionStorage.setItem(key(kind), value); else sessionStorage.removeItem(key(kind)); } catch { /* the choice just resets */ }
}
