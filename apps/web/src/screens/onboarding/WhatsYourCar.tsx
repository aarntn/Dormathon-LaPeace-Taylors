import { Input } from '../../components';
import { useOnboardingDraft } from './draft';
import { Art, Frame, Glyph, Heading, useOnboardingNavigation } from './shared';
export type CarMatch = { title: string; description: string; initial: string };
const popular: CarMatch[] = [{title:'Perodua Axia',description:'Hatchback',initial:'P'},{title:'Perodua Bezza',description:'Sedan',initial:'P'},{title:'Proton Saga',description:'Sedan',initial:'P'},{title:'Honda City',description:'Sedan',initial:'H'}];
function CarRow({title,description,initial,selected=false,onClick}:CarMatch & {selected?:boolean;onClick?:()=>void}) {
  const contents = <><span className="ob-car-initial text-body-strong">{initial}</span><span className="ob-car-copy"><span className="text-body-strong">{title}</span><span className="text-body-small">{description}</span></span><Glyph name="24cc9.svg" /></>;
  return onClick ? <button className={'ob-car-row ' + (selected?'selected':'')} onClick={onClick}>{contents}</button> : <div className="ob-car-row">{contents}</div>;
}
export function WhatsYourCar({ matches = popular }: { matches?: CarMatch[] }) {
  const {draft,update}=useOnboardingDraft(); const go=useOnboardingNavigation();
  const showMyvi = !draft.search.trim() || 'perodua myvi'.includes(draft.search.toLowerCase().trim());
  return <Frame back="sign-up" step={1}><Heading title="What’s your car?">We use it to tailor your car checks and alerts.</Heading><div className="ob-search"><Glyph name="34f42.svg" /><Input aria-label="Search cars" state="Focused" value={draft.search} onChange={e=>update('search',e.target.value)} /><button aria-label="Clear search" onClick={()=>update('search','')}><Art name="ecf2b.svg" /></button></div>{showMyvi && <section className="ob-car-results"><h2 className="text-body-small-strong">Best match</h2><div className="ob-car-card"><CarRow title="Perodua Myvi" description="Hatchback · 2005 – today" initial="P" selected onClick={()=>go('perodua-myvi-sheet',false,true)} /></div></section>}<section className="ob-car-results"><h2 className="text-body-small-strong">Popular in Malaysia</h2><div className="ob-car-card">{matches.map(car=><CarRow key={car.title} {...car} />)}</div></section><div className="ob-manual text-body-small-strong"><Glyph name="0e61d.svg" size={18} />Can’t find it? Add your car manually</div></Frame>;
}
