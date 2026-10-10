import type { BrakeResult, DashboardResult, Finding, StartupResult, Urgency } from '../../api';

export type ReportItem = {
  key: string; title: string; description: string; urgency: Urgency | 'none';
  label: string; cost?: string; tone: 'success' | 'warning' | 'tint'; icon: string;
  target: 'car-report' | 'brake-check' | 'warning-light-result' | 'engine-sound-check';
};
const rank: Record<Urgency, number> = { monitor: 0, soon: 1, stop: 2 };
// Typical Malaysian workshop ranges. They are a guide only, never a quote.
const costs = { battery: [200, 350], brakes: [120, 250] } as const;
const money = (low: number, high: number) => `RM ${low}–${high}`;
export const worstFinding = (dashboard?: DashboardResult): Finding | undefined =>
  [...(dashboard?.findings ?? [])].sort((a, b) => rank[b.urgency] - rank[a.urgency])[0];

export function buildReport(dashboard?: DashboardResult, startup?: StartupResult, brakes?: BrakeResult) {
  const items: ReportItem[] = [];
  if (startup) {
    const attention = startup.urgency !== 'monitor';
    items.push({ key: 'battery', title: attention ? 'Possible weak battery' : 'Start-up sounds normal',
      description: `${startup.urgency_label}${startup.crank_seconds ? ` · slow start, ${startup.crank_seconds} s` : ''}`,
      urgency: startup.urgency, label: attention ? '' : 'Normal', cost: attention ? money(...costs.battery) : undefined,
      tone: attention ? 'warning' : 'success', icon: attention ? 'opt-battery.svg' : '90ace.svg', target: 'engine-sound-check' });
  }
  if (brakes) {
    const attention = brakes.urgency !== 'monitor';
    items.push({ key: 'brakes', title: attention ? 'Brakes due for a check' : 'Brakes look steady',
      description: attention ? `${brakes.urgency_label} · hard stops rising` : `${brakes.urgency_label} · no rise in hard stops`,
      urgency: brakes.urgency, label: attention ? '' : 'Normal', cost: attention ? money(...costs.brakes) : undefined,
      tone: attention ? 'warning' : 'success', icon: attention ? 'opt-brakes.svg' : '90ace.svg', target: 'brake-check' });
  }
  if (dashboard) {
    const findings = [...dashboard.findings].sort((a, b) => rank[b.urgency] - rank[a.urgency]);
    if (!findings.length) items.push({ key: 'dashboard', title: 'Dashboard lights', description: 'Monitor · no lights at your last scan',
      urgency: 'monitor', label: '', tone: 'success', icon: '90ace.svg', target: 'warning-light-result' });
    findings.forEach((finding, index) => items.push({ key: `dashboard-${finding.id ?? index}`, title: finding.label,
      description: `${finding.urgency_label ?? (finding.urgency === 'monitor' ? 'Monitor' : 'Check')} · ${firstSentence(finding.advice)}`,
      urgency: finding.urgency, label: '', tone: finding.urgency === 'monitor' ? 'success' : 'warning',
      icon: finding.urgency === 'monitor' ? '90ace.svg' : 'de6af.svg', target: 'warning-light-result' }));
  }
  const attention = items.filter(item => item.urgency !== 'monitor' && item.urgency !== 'none');
  const low = attention.reduce((sum, item) => sum + Number(item.cost?.match(/\d+/g)?.[0] ?? 0), 0);
  const high = attention.reduce((sum, item) => sum + Number(item.cost?.match(/\d+/g)?.[1] ?? 0), 0);
  const checked = [dashboard?.at, startup?.at].filter(Boolean).sort().at(-1);
  return { items, attention, estimate: low && high ? money(low, high) : undefined, checked };
}
export const firstSentence = (text: string) => text.split(/(?<=[.!?])\s+/)[0] ?? text;
export const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
export function checkedLabel(at?: string) {
  if (!at) return 'not yet';
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}
