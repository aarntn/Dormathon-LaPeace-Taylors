import { useEffect, useState } from 'react';
import { DEMO_SIGNED_OUT } from '../../integration/AppData';
import { dashboardScenarios, getScenario, setScenario, startupScenarios } from './demoScenario';

type Kind = 'dashboard' | 'startup';

/** Hidden demo panel section: choose what the next dashboard scan and start-up check will return. */
export function DemoScenarios() {
  const [dashboard, setDashboard] = useState<string | null>(() => getScenario('dashboard'));
  const [startup, setStartup] = useState<string | null>(() => getScenario('startup'));
  const [serverDemo, setServerDemo] = useState<boolean | null>(null);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    let current = true;
    void fetch('/api/health').then(response => response.json()).then(value => { if (current) { setServerDemo(Boolean(value.demo_mode)); setStandalone(Boolean(value.standalone)); } }).catch(() => { if (current) setServerDemo(null); });
    return () => { current = false; };
  }, []);
  const choose = (kind: Kind, value: string, selected: string | null) => {
    const next = selected === value ? null : value;
    setScenario(kind, next);
    (kind === 'dashboard' ? setDashboard : setStartup)(next);
  };
  const group = (kind: Kind, title: string, options: [string, string][], selected: string | null) => <div className="demo-scenario-group" role="group" aria-label={title}>
    <h2 className="text-body-small-strong">{title}</h2>
    {options.map(([value, label]) => <button key={value} type="button" aria-pressed={selected === value} className={'demo-scenario text-body-small' + (selected === value ? ' demo-scenario--on' : '')} onClick={() => choose(kind, value, selected)}>{label}</button>)}
  </div>;
  return <section className="demo-scenarios">
    <h2 className="text-body-strong">Car check results</h2>
    <p className="text-body-small">{serverDemo === null ? 'Could not reach the server.' : serverDemo ? 'Server demo mode is on, so these are used and labelled as demos.' : 'Server demo mode is off. A dashboard photo finds nothing, and these choices are ignored.'} Tap a choice again to clear it.</p>
    {group('dashboard', 'Next dashboard scan', dashboardScenarios, dashboard)}
    {group('startup', 'Next start-up check', startupScenarios, startup)}
    {standalone && <button type="button" className="demo-scenario" onClick={() => { try { sessionStorage.removeItem(DEMO_SIGNED_OUT); } catch { /* the page reload still tries */ } window.location.assign('/drive/home'); }}>Sign in as the demo driver again</button>}
  </section>;
}
