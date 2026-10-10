import { Art, Continue, Frame, Glyph, Heading } from './shared';
export function FaceScanIntro() {
  const tips=[['09366.svg','The scan stays on your phone'],['ebea4.svg','Face a light, not a window behind you'],['5f49b.svg','Glasses are fine, sunglasses are not']];
  return <Frame back="allow-access" className="ob-face-intro" footer={<Continue to="face-scan" label="Start face scan" />}><div className="ob-face-art"><Art name="4cfc0.svg" className="ob-face-disc" /><Art name="0cd68.png" className="ob-face-guide" /><Art name="bad90.svg" className="ob-face-eyes" /></div><Heading title="Now, let’s learn your eyes">A 20-second scan learns what your normal blinks look like, so BUCKL can tell when you’re getting sleepy.</Heading><div className="ob-face-tips">{tips.map(([name,title])=><div key={name}><span className="ob-tip-icon"><Glyph name={name} /></span><p className="text-body-strong">{title}</p></div>)}</div></Frame>;
}
