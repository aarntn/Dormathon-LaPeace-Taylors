import { IconButton } from '../../components';
import { Art, Frame, Glyph, useOnboardingNavigation, usePrototypeTimer } from './shared';

export type FaceScanProps = { progress?: number; faceFound?: boolean; eyesTracked?: boolean; autoAdvance?: boolean };
export function FaceScan({ progress = 70, faceFound = true, eyesTracked = true, autoAdvance = true }: FaceScanProps) {
  const percent = Math.max(0, Math.min(100, progress));
  const go = useOnboardingNavigation();
  usePrototypeTimer('all-set', 2.5, autoAdvance);
  const checks = [{ complete: faceFound, title: 'Face found' }, { complete: eyesTracked, title: 'Both eyes tracked' }, { complete: false, title: 'Learning your normal blink' }];
  return <Frame dark className="ob-face-scan" footer={<p className="text-body-small">Hold your phone at arm’s length</p>}>
    <IconButton icon="Close" theme="Dark" onClick={() => go('face-scan-intro', true)} />
    <header className="ob-heading"><h1 className="text-heading-large">Look at the screen</h1><p className="text-body-regular">Blink normally and keep still</p></header>
    <div className="ob-scan-art" role="img" aria-label={'Face scan ' + percent + '%'}>
      <Art name="f8f27.svg" className="ob-scan-track" />
      <span className="ob-scan-variable-progress" style={{ background: `conic-gradient(var(--drive-accent) ${percent}%, transparent 0)` }} />
      <Art name="76867.png" className="ob-scan-guide" /><Art name="b7757.svg" className="ob-scan-eyes" />
    </div>
    <p className="ob-scan-percent text-numeric-large">{percent}%</p>
    <div className="ob-scan-checks">{checks.map(({ complete, title }) => <div key={title} className={complete ? 'complete' : ''}><span>{complete && <Glyph name="d86f4.svg" size={14} />}</span><p className="text-body-small-strong">{title}</p></div>)}</div>
  </Frame>;
}
