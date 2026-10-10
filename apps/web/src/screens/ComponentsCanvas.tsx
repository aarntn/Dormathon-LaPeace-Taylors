import { Link } from 'react-router';
import { BrandMark, Button, buttonStyles, IconButton, icons, iconThemes, Input, inputStates, Option, TabBar, tabs, CarSide, CarTop, EyeLandmarks } from '../components';

export function ComponentsCanvas() {
  return <main className="canvas-review"><header className="canvas-review__header"><Link to="/components" className="text-body-small">Back to components</Link><h1 className="text-heading-large">Figma canvas review</h1><p className="text-body-regular text-text-secondary">Original 1600 × 1000 layout. The status bar slot is empty because the browser uses your phone’s own status bar.</p></header>
    <div className="canvas-scroll"><div className="figma-canvas">
      <div className="canvas-set canvas-set--grey canvas-buttons">{(['Default', 'Pressed'] as const).flatMap(state => buttonStyles.map(style => <Button key={`${style}-${state}`} style={style} state={state} />))}</div>
      <div className="canvas-set canvas-set--grey canvas-icons">{iconThemes.flatMap(theme => icons.map(icon => <IconButton key={`${theme}-${icon}`} theme={theme} icon={icon} />))}</div>
      <div className="canvas-set canvas-set--light canvas-tabs">{tabs.map(active => <TabBar key={active} active={active} />)}</div>
      <CarSide className="canvas-car-side" /><CarTop className="canvas-car-top" /><EyeLandmarks className="canvas-eyes" />
      <div className="canvas-set canvas-set--grey canvas-brands"><BrandMark theme="Navy" /><BrandMark theme="White" /></div>
      <div className="canvas-set canvas-set--light canvas-inputs">{inputStates.map(state => <Input key={state} state={state} />)}</div>
      <div className="canvas-set canvas-set--light canvas-options"><Option /><Option state="Selected" /></div>
    </div></div>
  </main>;
}
