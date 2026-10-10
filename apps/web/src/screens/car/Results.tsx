import { Button } from '../../components';
import { Art, Frame, FooterStack, WorkshopButton, useCarNavigation } from './shared';
import { useCarSession } from './session';
import { sentences, worstFinding } from './report';
import type { Urgency } from '../../api';

const severity: Record<Urgency, { title: string; text: string; tone: 'success' | 'warning' | 'danger' }> = {
  monitor: { title: 'Monitor', text: 'Keep an eye on it and mention it at your next service.', tone: 'success' },
  soon: { title: 'Book service soon', text: 'It may get worse if you leave it. Book a check in the next few days.', tone: 'warning' },
  stop: { title: 'Stop safely now', text: 'Pull over when it’s safe and switch off the engine. Don’t keep driving.', tone: 'danger' },
};

/** C3 Warning light result, filled from the captured dashboard result. */
export function WarningLightResult() {
  const go = useCarNavigation(); const { dashboard } = useCarSession(); const finding = worstFinding(dashboard);
  if (!finding) return <Frame back="car-check" footer={<WorkshopButton />} className="car-result"><div className="car-result-icon car-result-icon--none"><Art name="nolight-icon.svg" /></div><header className="car-heading"><h1 className="text-heading-large">No light scanned yet</h1><p className="text-body-regular">Take a photo of a warning light and we’ll explain it.</p></header><Button label="Scan a warning light" onClick={() => go('scan-a-warning-light', false, true)} /></Frame>;
  const level = severity[finding.urgency]; const steps = sentences(finding.advice); const thermo = /temperature|overheat|coolant/i.test(finding.label);
  return <Frame back="car-check" className="car-result" footer={<FooterStack><Button style="Secondary" label="Scan another light" onClick={() => go('scan-a-warning-light', false, true)} /><WorkshopButton service={thermo ? 'cooling' : 'battery'} /></FooterStack>}>
    <div className={`car-result-icon car-result-icon--${level.tone}`}>{thermo ? <Art name="result-thermo.svg" /> : <Art name="de6af.svg" />}</div>
    <header className="car-heading"><h1 className="text-heading-large">{finding.label}</h1><p className="text-body-regular">{dashboard?.stub ? 'A possible match from your photo — a demo indication.' : 'A possible match from your photo. It may not be exact.'}</p></header>
    <section className={`car-severity car-severity--${level.tone}`}><strong className="text-body-strong">{finding.urgency_label ?? level.title}</strong><p className="text-body-small">{level.text}</p></section>
    {steps.length > 0 && <section className="car-steps car-panel"><h2 className="text-body-small-strong">What to do</h2><ol>{steps.map((step, index) => <li key={step}><span className="car-step-number text-label-small">{index + 1}</span><p className="text-body-small">{step}</p></li>)}</ol></section>}
  </Frame>;
}

type TipsProps = { icon: string; title: string; description: string; tips: string[]; action: string; secondary?: SecondaryAction; onAction: () => void };
type SecondaryAction = { label: string; onClick: () => void } | undefined;
function TipsScreen({ icon, title, description, tips, action, secondary, onAction }: TipsProps) {
  return <Frame back="car-check" className="car-result car-tips" footer={<FooterStack>{secondary && <Button style="Secondary" label={secondary.label} onClick={secondary.onClick} />}<Button label={action} onClick={onAction} /></FooterStack>}>
    <div className="car-result-icon car-result-icon--none"><Art name={icon} /></div>
    <header className="car-heading"><h1 className="text-heading-large">{title}</h1><p className="text-body-regular">{description}</p></header>
    <section className="car-tips-card car-panel"><h2 className="text-body-small-strong">Try this</h2><ul>{tips.map(tip => <li key={tip}><Art name="tip-bullet.svg" /><p className="text-body-regular">{tip}</p></li>)}</ul></section>
  </Frame>;
}
/** C3b Couldn’t read the light. */
export function CouldntReadTheLight() {
  const go = useCarNavigation();
  return <TipsScreen icon="nolight-icon.svg" title="Couldn’t read that light" description="The photo was blurry, or there was glare on the glass." tips={['Hold the phone steady, close to the dashboard', 'Switch the ignition on so the lights are lit', 'Tilt the phone to avoid reflections']}
    action="Try again" onAction={() => go('scan-a-warning-light', false, true)} secondary={{ label: 'Find a workshop nearby', onClick: () => go('workshops-near-you') }} />;
}
/** C4b Didn’t hear the engine. */
export function DidntHearTheEngine() {
  const go = useCarNavigation();
  return <TipsScreen icon="noaudio-icon.svg" title="We didn’t hear the engine" description="It was too quiet, or there was too much noise around." tips={['Put the phone on the dashboard, not in a bag', 'Wind the windows up and turn the radio off', 'Tap record before you turn the key']}
    action="Try again" onAction={() => go('engine-sound-check')} />;
}
