import { useState } from 'react';
import { Art, Card, Frame, Heading, WorkshopButton, useCarNavigation } from './shared';
import { useCarSession } from './session';
import { buildReport, checkedLabel } from './report';

function Spot({ x, y, kind }: { x: number; y: number; kind: 'ok' | 'warning' }) {
  const ok = kind === 'ok';
  return <div className="car-map-spot" style={{ left: x, top: y }}><Art name={ok ? '3c3c2.svg' : 'c2c25.svg'} /><Art className="car-map-core" name={ok ? '618d6.svg' : '50151.svg'} /></div>;
}
export function reportText(items: { title: string; description: string }[], estimate: string | undefined, checked: string) {
  return `BUCKL car report · checked ${checked}.${estimate ? ` Estimated cost ${estimate}.` : ''} ${items.map(item => `${item.title} (${item.description})`).join('. ')}`;
}
export function CarReport() {
  const go = useCarNavigation(); const { notify, dashboard, startup, brakes, loadingReport } = useCarSession(); const [sharing, setSharing] = useState(false);
  const report = buildReport(dashboard, startup, brakes); const count = report.attention.length; const when = checkedLabel(report.checked);
  const share = async () => {
    if (sharing) return; setSharing(true);
    const text = reportText(report.items, report.estimate, when);
    try { if (navigator.share) await navigator.share({ title: 'BUCKL car report', text }); else if (navigator.clipboard) { await navigator.clipboard.writeText(text); notify('Report copied'); } else notify('Sharing is unavailable in this browser'); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) notify('Couldn’t share the report. Try again.'); }
    finally { setSharing(false); }
  };
  const status = (key: string) => report.items.find(item => item.key === key);
  const spot = (key: string): 'ok' | 'warning' => status(key) && status(key)!.urgency !== 'monitor' ? 'warning' : 'ok';
  return <Frame back="car-check" share={() => void share()} footer={<WorkshopButton service={report.attention[0]?.key === 'brakes' ? 'brakes' : 'battery'} />}>
    <Heading title={loadingReport ? 'Loading report…' : report.items.length ? `${count} ${count === 1 ? 'thing' : 'things'} to check` : 'No report yet'}>{report.items.length ? `${report.estimate ? `Estimated cost ${report.estimate} · ` : ''}checked ${when}` : 'Run a check to build your report.'}</Heading>
    <div className="car-map car-panel"><div className="car-map-scene"><Spot x={181} y={34} kind={spot('battery')} /><Spot x={227.4} y={166} kind={spot('brakes')} />{[[134.4, 55], [227.4, 55], [134.4, 166], [181, 208]].map(([x, y]) => <Spot key={`${x}-${y}`} x={x} y={y} kind="ok" />)}<span className="car-map-label text-label-small" style={{ top: 36 }}>Battery</span><span className="car-map-label text-label-small" style={{ top: 168 }}>Brakes</span></div></div>
    <section className="car-findings" aria-label="Findings">{report.items.map(item => <Card key={item.key} title={item.title} description={item.description} icon={item.icon} tone={item.tone} aside={item.cost ? <span className="text-body-small-strong car-cost">{item.cost}</span> : undefined} onClick={() => go(item.target)} />)}
      {!report.items.length && <Card title="Nothing checked yet" description="Scan a warning light, record a start-up, or drive a few trips." icon="dea3d.svg" />}</section>
  </Frame>;
}
