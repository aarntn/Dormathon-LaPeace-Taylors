import { useState } from 'react';
import { Art,Card,Frame,Heading,WorkshopButton,useCarNavigation } from './shared';
import { useCarSession } from './session';
export type CarReportProps={findingCount?:number;estimatedRepair?:string;checkedAt?:string;scratchCost?:string;beltCost?:string};
function Spot({x,y,success=false}:{x:number;y:number;success?:boolean}){
  return <div className="car-map-spot" style={{left:x,top:y}}><Art name={success?'3c3c2.svg':'c2c25.svg'}/><Art className="car-map-core" name={success?'618d6.svg':'50151.svg'}/></div>;
}
export function CarReport({findingCount=2,estimatedRepair='RM 180 – 420',checkedAt='today',scratchCost='RM 120–250',beltCost='RM 60–170'}:CarReportProps){
  const go=useCarNavigation();const {notify}=useCarSession();const [sharing,setSharing]=useState(false);
  const share=async()=>{
    if(sharing)return;setSharing(true);
    const text=`${findingCount} things to check · Estimated repair ${estimatedRepair} · checked ${checkedAt}. Scratch on rear bumper: ${scratchCost}. Drive belt squeal: ${beltCost}.`;
    try{if(navigator.share)await navigator.share({title:'Dormathon car report',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);notify('Report copied');}else notify('Sharing is unavailable in this browser');}
    catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))notify('Couldn’t share the report. Try again.');}
    finally{setSharing(false);}
  };
  return <Frame back="car-check" share={()=>void share()} footer={<WorkshopButton/>}>
    <Heading title={`${findingCount} things to check`}>Estimated repair {estimatedRepair} · checked {checkedAt}</Heading>
    <div className="car-map car-panel"><div className="car-map-scene"><Art name="76ad4.svg" className="car-map-vehicle"/><Spot x={181} y={208}/><Spot x={181} y={34}/>{[[134.4,55],[227.4,55],[134.4,166],[227.4,166]].map(([x,y])=><Spot key={`${x}-${y}`} x={x} y={y} success/>)}<span className="car-map-label text-label-small" style={{top:36}}>Belt squeal</span><span className="car-map-label text-label-small" style={{top:210}}>Scratch</span></div></div>
    <section className="car-findings" aria-label="Findings"><Card title="Scratch on rear bumper" description="Paint only · not urgent" icon="3e88f.svg" tone="warning" aside={<span className="text-body-small-strong car-cost">{scratchCost}</span>} onClick={()=>go('scratch-detail')}/><Card title="Drive belt squeal" description="Getting louder each check" icon="a0ba0.svg" tone="warning" aside={<span className="text-body-small-strong car-cost">{beltCost}</span>} onClick={()=>go('belt-squeal-trend')}/><Card title="Tyres, lights, windscreen" description="No problems found" icon="90ace.svg" tone="success"/></section>
  </Frame>;
}
