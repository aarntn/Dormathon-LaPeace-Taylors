import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import source from '../../design/figma-tokens.json';
import { MotionSamples } from './MotionSamples';
import { AppFrame, BrandMark, Button, buttonStyles, IconButton, icons, iconThemes, Input, inputStates, Option, TabBar, tabs, CarSide, CarTop, EyeLandmarks, type Tab } from '../components';

const tokenName = (name: string) => name.toLowerCase().replace(/[\s/]+/g, '-');

export function Components() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabs, setActiveTabs] = useState<Tab[]>([...tabs]);
  const [feedback, setFeedback] = useState('');
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);
  const notify = (message: string) => {
    clearTimeout(feedbackTimer.current); setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 1800);
  };

  return <AppFrame><main className="gallery">
    <header className="gallery__header">
      <div className="gallery__brand"><BrandMark /><span className="text-label-small text-text-secondary">BUCKL</span></div>
      <h1 className="text-heading-large">Components</h1>
      <p className="text-body-regular text-text-secondary">The shared building blocks. Tap, type and explore every state.</p>
      <nav aria-label="Component sections" className="gallery__nav text-body-small"><a href="#buttons">Buttons</a><a href="#inputs">Inputs</a><a href="#motion">Motion</a><a href="#tokens">Tokens</a><Link to="/components/canvas">Canvas view</Link></nav>
    </header>

    <section className="gallery__section" id="buttons">
      <div className="section-heading"><h2 className="text-title-medium">Button</h2><span className="text-label-small text-text-secondary">10 VARIANTS</span></div>
      <div className="sample-stack">{buttonStyles.map(style => <div key={style} className={`sample ${['Light', 'Outline', 'Drive'].includes(style) ? 'sample--dark' : ''}`}>
        <p className="sample__caption text-label-small">{style} · Default</p><Button style={style} label="Button" onClick={() => notify(`${style} button pressed`)} />
        <p className="sample__caption text-label-small">{style} · Pressed</p><Button style={style} state="Pressed" label="Button" onClick={() => notify(`${style} button pressed`)} />
      </div>)}</div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">IconButton</h2><span className="text-label-small text-text-secondary">6 VARIANTS</span></div>
      <div className="sample-stack">{iconThemes.map(theme => <div className={`sample ${theme === 'Dark' ? 'sample--dark' : ''}`} key={theme}>
        <p className="sample__caption text-label-small">{theme}</p><div className="sample-row">{icons.map(icon => <div key={icon} className="sample"><IconButton icon={icon} theme={theme} onClick={() => notify(`${icon} pressed`)} /><span className="sample__caption text-label-small">{icon}</span></div>)}</div>
      </div>)}</div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">TabBar</h2><span className="text-label-small text-text-secondary">4 ACTIVE STATES</span></div>
      <div className="sample-stack">{tabs.map((tab, index) => <div key={tab} className="tabs-sample"><span className="sample__caption text-label-small">{tab}</span>
        <TabBar active={activeTabs[index]} onChange={value => setActiveTabs(current => current.map((item, itemIndex) => itemIndex === index ? value : item))} />
      </div>)}</div>
    </section>

    <section className="gallery__section" id="inputs">
      <div className="section-heading"><h2 className="text-title-medium">Input</h2><span className="text-label-small text-text-secondary">3 STATES</span></div>
      <div className="sample-stack">{inputStates.map(state => <div key={state} className="sample"><p className="sample__caption text-label-small">{state}</p><Input state={state} text="Value" aria-label={`${state} input`} /></div>)}</div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">Option</h2><span className="text-label-small text-text-secondary">TAP TO TOGGLE</span></div>
      <div className="sample-stack"><div className="sample"><p className="sample__caption text-label-small">Default</p><Option /></div><div className="sample"><p className="sample__caption text-label-small">Selected</p><Option state="Selected" /></div></div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">BrandMark</h2><span className="text-label-small text-text-secondary">ORIGINAL SVG</span></div>
      <div className="sample-stack"><div className="sample-row sample-row--spaced"><div className="logo-sample"><BrandMark theme="Navy" /><span className="sample__caption text-label-small">Navy</span></div><div className="logo-sample logo-sample--dark"><BrandMark theme="White" /><span className="sample__caption text-label-small">White</span></div></div>
        {(['On light', 'On dark', 'Mono'] as const).map(version => <div key={version} className={`logo-sample ${version === 'On dark' ? 'logo-sample--dark' : ''}`}><BrandMark version={version} /><span className="sample__caption text-label-small">{version}</span></div>)}
      </div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">Illustrations</h2><span className="text-label-small text-text-secondary">ORIGINAL SVG</span></div>
      <div className="sample-stack"><div className="sample"><p className="sample__caption text-label-small">CarSide</p><div className="illustration-sample illustration-sample--side"><CarSide /></div></div>
        <div className="illustration-sample illustration-sample--pair"><p className="sample__caption text-label-small">CarTop</p><CarTop /><p className="sample__caption text-label-small">EyeLandmarks</p><EyeLandmarks /></div>
      </div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">Transitions</h2><span className="text-label-small text-text-secondary">NO BOUNCE</span></div>
      <div className="sample-stack">
        <Button label="Push · 0.45 s" style="Secondary" onClick={() => navigate('/components/preview/push')} />
        <Button label="Sheet · 0.5 s" style="Secondary" onClick={() => navigate('/components/preview/sheet', { state: { backgroundLocation: location } })} />
        <Button label="Fade · 0.3 s" style="Secondary" onClick={() => navigate('/components/preview/fade')} />
        <Button label="Tab · 0.2 s" style="Secondary" onClick={() => navigate('/components/preview/tab')} />
      </div>
    </section>

    <MotionSamples />
    <section className="gallery__section" id="tokens">
      <div className="section-heading"><h2 className="text-title-medium">Colours</h2><span className="text-label-small text-text-secondary">22 TOKENS</span></div>
      <div className="swatches">{source.variables.map(variable => { const name = tokenName(variable.name); const colour = variable.values['26:0']; const hex = '#' + [colour.r, colour.g, colour.b].map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join(''); return <div key={name} className="swatch"><div className="swatch__colour" style={{ background: `var(--${name})` }} /><div className="swatch__label"><span className="text-label-small">{variable.name}</span><span className="text-label-small text-text-secondary">{hex.toUpperCase()}</span></div></div>; })}</div>
    </section>

    <section className="gallery__section">
      <div className="section-heading"><h2 className="text-title-medium">Typography</h2><span className="text-label-small text-text-secondary">INTER</span></div>
      {source.textStyles.filter(style => style.fontName.family === 'Inter').map(style => <div key={style.name} className="type-sample"><p className="type-sample__name text-label-small text-text-secondary">{style.name}</p><p className={`text-${tokenName(style.name)}`}>{style.name === 'Numeric/Large' ? '128' : 'Ready for the road'}</p></div>)}
    </section>
    <div className="text-label-small text-text-secondary">BUCKL · Component review</div>
    <div role="status" aria-live="polite">{feedback && <div className="gallery__feedback text-body-small">{feedback}</div>}</div>
  </main></AppFrame>;
}
