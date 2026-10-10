import { createContext, useContext, useState, type ReactNode } from 'react';

export const onboardingDefaults = {
  name: '', email: '', password: '', search: 'Myvi',
  contactName: '', contactPhone: '', batteryAge: '1_2y' as 'under_1y'|'1_2y'|'over_2y',
  version: '1.5 AV', plate: 'WXY 4821', year: '2021', colour: 'Granite Grey', mileage: '48,200 km',
  engine: '1.5 L', gearbox: 'Automatic', fuel: 'Petrol',
  service: 'Mar 2026', serviceMileage: '', modified: false, scratched: true,
  habits: ['Daily commute', 'Long highway trips'], maps: 'Waze',
};
export type OnboardingDraft = typeof onboardingDefaults;
type DraftContextValue = { draft: OnboardingDraft; update: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void };
const DraftContext = createContext<DraftContextValue | null>(null);
export function OnboardingProvider({ children, initialDraft = {} }: { children: ReactNode; initialDraft?: Partial<OnboardingDraft> }) {
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({ ...onboardingDefaults, ...initialDraft }));
  const update: DraftContextValue['update'] = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  return <DraftContext value={{ draft, update }}>{children}</DraftContext>;
}
export function useOnboardingDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('OnboardingProvider is required');
  return context;
}
