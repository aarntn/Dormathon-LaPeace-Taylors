import { createContext, useContext, useState, type ReactNode } from 'react';

const TripsContext = createContext({ nightReminders: false, enableNightReminders: () => {} });
export function TripsProvider({ children }: { children: ReactNode }) {
  const [nightReminders, setNightReminders] = useState(false);
  return <TripsContext value={{ nightReminders, enableNightReminders: () => setNightReminders(true) }}>{children}</TripsContext>;
}
export const useTripsSession = () => useContext(TripsContext);
