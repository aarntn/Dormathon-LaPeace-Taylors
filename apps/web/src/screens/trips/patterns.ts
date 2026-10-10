// /patterns returns eight three-hour slots from midnight (Malaysia time). The Figma charts start at 6 am.
const labels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
const order = [2, 3, 4, 5, 6, 7, 0, 1];
export type NightBlock = { label: string; count: number; night: boolean };
export function nightBlocks(slots: { from_hour: number; tired_alerts: number }[]): NightBlock[] {
  return order.map(slot => ({ label: labels[slot], count: slots.find(item => item.from_hour === slot * 3)?.tired_alerts ?? 0, night: slot === 7 || slot === 0 || slot === 1 }));
}
