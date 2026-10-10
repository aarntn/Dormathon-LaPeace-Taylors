import { Button } from '../../components';
import { Art,DetailRow,Frame,Heading,useCarNavigation } from './shared';
import { useCarSession } from './session';
export type ScratchDetailProps={depth?:string;size?:string;confidence?:string;fix?:string;cost?:string;photoNumber?:number;photoUrl?:string};
export function ScratchDetail({depth='Paint only',size='About 12 cm',confidence='High',fix='Polish or touch-up',cost='RM 120–250',photoNumber=6,photoUrl}:ScratchDetailProps){
  const go=useCarNavigation();const {notify,markScratchExisting}=useCarSession();
  return <Frame back="car-report" className="car-double-footer" footer={<div className="car-footer-stack"><Button style="Secondary" label="It was already here" onClick={()=>{markScratchExisting();notify('Marked as existing damage for this preview');go('car-report',true);}}/><Button label="Back to report" onClick={()=>go('car-report',true)}/></div>}>
    <div className="car-scratch-photo">{photoUrl?<img src={photoUrl} alt="Rear bumper scratch" className="car-scratch-image"/>:<><div className="car-scratch-ground"/><Art name="85b73.svg"/></>}<span className="car-scratch-box"/><span className="car-scratch-tag text-label-small">Scratch · {size.toLowerCase()}</span></div>
    <Heading title="Scratch on rear bumper">Rear left corner · photo {photoNumber} of 8</Heading>
    <dl className="car-details car-panel">{[['How deep',depth],['Size',size],['How sure we are',confidence],['Usual fix',fix],['Estimated cost',cost]].map(([label,value])=><DetailRow key={label} label={label} value={value}/>)}</dl>
    <section className="car-callout car-callout--success"><h2 className="text-body-small-strong">Safe to drive</h2><p className="text-body-small">It won’t get worse quickly. Fix it when it suits you.</p></section>
  </Frame>;
}
