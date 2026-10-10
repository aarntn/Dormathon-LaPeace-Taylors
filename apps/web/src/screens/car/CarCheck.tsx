import { TabBar } from '../../components';
import { Art, Card, Frame, Heading, useCarNavigation } from './shared';
import { useAppData } from '../../integration/AppData';
import { useCarSession } from './session';
import { buildReport, checkedLabel } from './report';

export function CarCheck() {
  const go = useCarNavigation(); const data = useAppData(); const car = data.selectedCar; const session = useCarSession();
  const report = buildReport(session.dashboard, session.startup, session.brakes);
  const count = report.attention.length;
  const phrases = report.attention.map(item => item.title.replace(/^Possible /, '')).map((text, index) => index ? text.charAt(0).toLowerCase() + text.slice(1) : text.charAt(0).toUpperCase() + text.slice(1));
  const summary = report.items.length ? phrases.join(', ') || 'Nothing needs attention' : '';
  const when = report.checked ? checkedLabel(report.checked) : session.loadingReport ? 'Loading…' : '';
  return <Frame className="car-overview" footer={<TabBar active="Car" onChange={tab => { if (tab !== 'Car') go(tab === 'Home' ? '/drive/home' : '/' + tab.toLowerCase()); }} />}>
    <Heading title="Car check">{car ? `${car.make} ${car.model}${car.plate ? ` · ${car.plate}` : ''}` : 'Add your car to start'}</Heading>
    <div className="car-overview-art"><Art name="ae49e.svg" /></div>
    <section className="car-checks" aria-label="Checks">
      <Card title="Scan a warning light" description="Snap a dashboard light or gauge. We explain what it means." icon="opt-camera.svg" asideInHeading aside={<span className="text-label-small car-duration">10 sec</span>} chevron onClick={() => go('scan-a-warning-light', false, true)} />
      <Card title="Start-up battery check" description="Record your engine starting. A slow start means a weak battery." icon="opt-battery.svg" asideInHeading aside={<span className="text-label-small car-duration">5 sec</span>} chevron onClick={() => go('engine-sound-check')} />
      <Card title="Brake check" description="How hard you brake tells us when to get your brakes checked." icon="opt-brakes.svg" asideInHeading aside={<span className="text-label-small car-duration">From your drives</span>} chevron onClick={() => go('brake-check')} />
    </section>
    <section className="car-last-report"><h2 className="text-body-strong">Last report</h2>
      {report.items.length
        ? <Card title={count ? `${count} ${count === 1 ? 'thing' : 'things'} to check` : 'Nothing to check'} description={summary} icon="dea3d.svg" asideInHeading aside={<span className="text-label-small car-duration">{when}</span>} chevron onClick={() => go('car-report')} />
        : <Card title="No checks yet" description="Run a check above and your report will appear here." icon="dea3d.svg" />}
    </section>
  </Frame>;
}
