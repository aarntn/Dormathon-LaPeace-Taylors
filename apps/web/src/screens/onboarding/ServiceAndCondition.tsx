import { useOnboardingDraft } from './draft';
import { Choice, Continue, Field, Frame, Heading } from './shared';
export function ServiceAndCondition() {
  const {draft,update}=useOnboardingDraft();
  return <Frame back="car-details" step={2} footer={<Continue to="how-you-drive" />}><Heading title="Service and condition">This is the starting point for your car checks.</Heading><div className="ob-service-form"><div className="ob-fields-row"><Field label="Last service" value={draft.service} onChange={e=>update('service',e.target.value)} /><Field label="Mileage then" placeholder="e.g. 45,000 km" inputMode="numeric" value={draft.serviceMileage} onChange={e=>update('serviceMileage',e.target.value)} /></div>
    <section className="ob-condition"><h2 className="text-body-strong">Any modifications?</h2><p className="text-body-small">Exhaust, intake or bodykit changes how your car sounds.</p><div className="ob-condition-options"><Choice title="No, it’s stock" description="As it left the factory" selected={!draft.modified} choose={()=>update('modified',false)} /><Choice title="Yes, it’s modified" description="We’ll learn its sound on the first check" selected={draft.modified} choose={()=>update('modified',true)} /></div></section>
    <section className="ob-condition"><h2 className="text-body-strong">Any scratches or dents now?</h2><p className="text-body-small">So we don’t flag old marks as new damage.</p><div className="ob-condition-options"><Choice title="No, it’s clean" description="Nothing to note" selected={!draft.scratched} choose={()=>update('scratched',false)} /><Choice title="Yes, a few" description="Mark them on your first walk-around" selected={draft.scratched} choose={()=>update('scratched',true)} /></div></section>
  </div></Frame>;
}
