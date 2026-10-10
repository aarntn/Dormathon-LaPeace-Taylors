import { Button } from '../../components';
import { Frame, Heading, useTripsNavigation } from './shared';
import { useTripsSession } from './session';
import { useAppData } from '../../integration/AppData';
import { useResource } from '../../integration/useResource';
import { AccountNotice } from '../../integration/AccountNotice';
import { nightBlocks } from './patterns';

export function WhenYouGetTired() {
  const go = useTripsNavigation(); const { enableNightReminders } = useTripsSession(); const { api, session } = useAppData();
  const resource = useResource(() => api.patterns(), session?.user.id);
  const slots = resource.value?.slots ?? []; const total = slots.reduce((sum, slot) => sum + slot.tired_alerts, 0);
  const blocks = nightBlocks(slots); const peak = Math.max(1, ...blocks.map(block => block.count)); const late = resource.value ? Math.round(resource.value.late_night_share * total) : 0;
  return <Frame back="/trips/trips" footer={<Button label="Turn on night reminders" onClick={() => { enableNightReminders(); go('/trips/trips', true); }} />}>
    <Heading title="When you get tired">Based on your recorded driving alerts</Heading><AccountNotice />
    {resource.loading && <p role="status" className="trips-secondary">Loading patterns…</p>}
    {resource.error && <><p role="alert" className="catch-error">{resource.error}</p><Button label="Try again" onClick={resource.retry} /></>}
    {resource.value && <>
      <section className="trips-panel trips-chart-panel"><div className="trips-chart-head text-body-small-strong"><h2>Tired alerts by time of day</h2><span>{total} {total === 1 ? 'alert' : 'alerts'}</span></div>
        <div className="trips-bars trips-bars--large" role="img" aria-label={`${total} tired alerts by time of day`}>{blocks.map(block => <span key={block.label} className="trips-bar-col"><span className={block.count ? block.night ? 'trips-bar trips-bar--night' : 'trips-bar trips-bar--day' : 'trips-bar'} style={{ height: block.count ? Math.max(24, Math.round(block.count / peak * 82)) : 4 }} /><small className="text-label-small">{block.label}</small></span>)}</div></section>
      <dl className="trips-panel trips-facts"><div><dt className="text-body-regular">Late-night alerts</dt><dd className="text-body-strong">{late} of {total}</dd></div></dl>
    </>}
    <section className="trips-plan"><h2 className="text-body-small-strong">Night reminders</h2><p className="text-body-small">After 10 pm we’ll suggest a break every 30 min and warn you before a long drive.</p></section>
  </Frame>;
}
