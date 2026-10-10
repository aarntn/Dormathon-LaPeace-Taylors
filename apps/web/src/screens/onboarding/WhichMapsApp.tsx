import { useOnboardingDraft } from './draft';
import { Choice, Continue, Frame, Glyph, Heading } from './shared';
const choices=[['Waze','Opens Waze with the rest stop as your destination'],['Google Maps','Opens Google Maps with the rest stop as your destination'],['Apple Maps','iPhone only']];
export function WhichMapsApp({options=choices}:{options?:string[][]}) {
  const {draft,update}=useOnboardingDraft();
  return <Frame back="how-you-drive" step={4} footer={<Continue to="emergency-contact" />}><Heading title="Which maps app do you use?">We’ll open it when it’s time for a break. Your saved places stay where they are.</Heading><div className="ob-options">{options.map(([title,description])=><Choice key={title} title={title} description={description} selected={draft.maps===title} choose={()=>{update('maps',title);localStorage.setItem('buckl.mapsApp',title);}} />)}</div><aside className="ob-maps-tip"><span className="ob-tip-icon"><Glyph name="ebe3a.svg" /></span><div><h2 className="text-body-strong">Have CarPlay or Android Auto?</h2><p className="text-body-small">Put directions on your car screen and keep BUCKL on your phone, so it never stops watching.</p></div></aside></Frame>;
}
