import { useState } from 'react';
import { useOnboardingDraft } from './draft';
import { Art, Continue, Field, Frame, Heading } from './shared';
const colours=['Granite Grey','Silver','White','Red','Maroon','Blue'];
export function CarDetails() {
  const {draft,update}=useOnboardingDraft(); const [editing,setEditing]=useState(false);
  return <Frame back="whats-your-car" step={2} footer={<Continue to="service-and-condition" />}><Heading title="About your Myvi">Add what you know. You can change it later.</Heading><div className="ob-form">
    <div className="ob-fields-row ob-plate-year"><Field label="Plate number" placeholder="WXY 4821" value={draft.plate} onChange={e=>update('plate',e.target.value)} /><Field label="Year" placeholder="2021" inputMode="numeric" value={draft.year} onChange={e=>update('year',e.target.value)} /></div>
    <div className="ob-colours"><div className="ob-card-head text-body-small-strong"><span>Colour</span><span>{draft.colour}</span></div><div className="ob-swatches"><Art name="6be5a.svg" />{colours.map((colour,i)=><button key={colour} aria-label={colour} aria-pressed={colour===draft.colour} style={{left:1+i*54}} onClick={()=>update('colour',colour)} />)}</div></div>
    <Field label="Mileage now" placeholder="48,200 km" inputMode="numeric" value={draft.mileage} onChange={e=>update('mileage',e.target.value)} />
    <section className="ob-specs"><div className="ob-card-head text-body-small-strong"><h2>Filled in from your model</h2><button onClick={()=>setEditing(!editing)}>{editing?'Done':'Edit'}</button></div>
    {(['engine','gearbox','fuel'] as const).map(key=><div className="ob-spec" key={key}><span className="text-body-regular">{key[0].toUpperCase()+key.slice(1)}</span>{editing?<Field label={key} value={draft[key]} onChange={e=>update(key,e.target.value)} />:<span className="text-body-strong">{draft[key]}</span>}</div>)}
    <p className="text-label-small">Check the gearbox is right. It changes how a healthy engine sounds.</p></section>
  </div></Frame>;
}
