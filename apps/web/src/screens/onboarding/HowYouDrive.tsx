import { useOnboardingDraft } from './draft';
import { Choice, Continue, Frame, Heading } from './shared';
const choices=[['Daily commute','Short drives, often in traffic'],['Long highway trips','Balik kampung and outstation drives'],['Late nights or early mornings','Driving when you’d normally be asleep'],['Ride-hailing or delivery','Many hours on the road for work']];
export function HowYouDrive({ options=choices }: {options?:string[][]}) {
  const {draft,update}=useOnboardingDraft();
  return <Frame back="service-and-condition" step={3} footer={<Continue to="which-maps-app" />}><Heading title="How do you usually drive?">Pick all that apply. It helps us time your break reminders.</Heading><div className="ob-options">{options.map(([title,description])=><Choice key={title} title={title} description={description} selected={draft.habits.includes(title)} choose={()=>update('habits',draft.habits.includes(title)?draft.habits.filter(h=>h!==title):[...draft.habits,title])} />)}</div></Frame>;
}
