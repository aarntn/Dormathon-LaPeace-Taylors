import { useOnboardingDraft } from './draft';
import { Art, Continue, Frame, Glyph, Heading } from './shared';
export function AllSet({blinkDuration=0.2}:{blinkDuration?:number}) {
  const {draft}=useOnboardingDraft();
  const rows=[['50ffb.svg','Perodua Myvi '+draft.version,(draft.plate||'WXY 4821')+' · '+(draft.year||'2021')+' · '+draft.colour],['0c82e.svg','Eye profile saved','Your normal blink is about '+blinkDuration+' s'],['1d7ce.svg','Alarm','Loud sound and vibration'],['74e1c.svg','Maps app',draft.maps+' · opens for rest stops']];
  return <Frame className="ob-all-set" footer={<Continue to="/drive/home" label="Go to home" />}><div className="ob-success"><Glyph name="f5e9d.svg" size={40} /></div><Heading title={'You’re all set, '+(draft.name||'Aaron')}>Dormathon knows your car and your eyes. Start a drive whenever you’re ready.</Heading><div className="ob-summary">{rows.map(([name,title,description],i)=><div key={name}><span className="ob-summary-icon">{i===0?<Art name={name} />:<Glyph name={name} size={22} />}</span><span className="ob-car-copy"><span className="text-body-strong">{title}</span><span className="text-body-small">{description}</span></span></div>)}</div></Frame>;
}
