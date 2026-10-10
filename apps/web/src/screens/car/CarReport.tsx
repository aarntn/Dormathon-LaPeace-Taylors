import { useState } from 'react';
import { Art,Card,Frame,Heading,WorkshopButton,useCarNavigation } from './shared';
import { useCarSession } from './session';
export type CarReportProps={findingCount?:number;estimatedRepair?:string;checkedAt?:string;scratchCost?:string;beltCost?:string};
function Spot({x,y,success=false}:{x:number;y:number;success?:boolean}){
  return <div className="car-map-spot" style={{left:x,top:y}}><Art name={success?'3c3c2.svg':'c2c25.svg'}/><Art className="car-map-core" name={success?'618d6.svg':'50151.svg'}/></div>;
}
export function CarReport({findingCount=2,estimatedRepair='RM 180 – 420',checkedAt='today',scratchCost='RM 120–250',beltCost='RM 60–170'}:CarReportProps){
  const go=useCarNavigation();const {notify,dashboard,startup,brakes,loadingReport}=useCarSession();const [sharing,setSharing]=useState(false);
  const dashboardFindings=dashboard?.findings??[];
  const allFindings=[...dashboardFindings,...(startup?[{label:startup.verdict,advice:startup.stub?'Demo indication — not a vehicle diagnosis.':'',urgency:startup.urgency,urgency_label:startup.urgency_label}]:[])];
  const total=allFindings.length||findingCount;
  const checked=dashboard?.at??startup?.at;
  const checkedLabel=checked?new Date(checked).toLocaleDateString(undefined,{month:'short',day:'numeric'}):checkedAt;
  const share=async()=>{
    if(sharing)return;setSharing(true);
    const text=allFindings.length?`${total} ${total===1?'thing':'things'} to check · checked ${checkedLabel}. ${allFindings.map(finding=>finding.label).join('. ')}`:`${findingCount} things to check · Estimated repair ${estimatedRepair} · checked ${checkedAt}. Scratch on rear bumper: ${scratchCost}. Drive belt squeal: ${beltCost}.`;
    try{if(navigator.share)await navigator.share({title:'Dormathon car report',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);notify('Report copied');}else notify('Sharing is unavailable in this browser');}
    catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))notify('Couldn’t share the report. Try again.');}
    finally{setSharing(false);}
  };
  return <Frame back="car-check" share={()=>void share()} footer={<WorkshopButton/>}>
    <Heading title={loadingReport?'Loading report…':`${total} ${total===1?'thing':'things'} to check`}>{allFindings.length?'Your latest dashboard and start-up checks · ':`Estimated repair ${estimatedRepair} · `}checked {checkedLabel}</Heading>
    <div className="car-map car-panel"><div className="car-map-scene"><Art name="76ad4.svg" className="car-map-vehicle"/><Spot x={181} y={208}/><Spot x={181} y={34}/>{[[134.4,55],[227.4,55],[134.4,166],[227.4,166]].map(([x,y])=><Spot key={`${x}-${y}`} x={x} y={y} success/>)}<span className="car-map-label text-label-small" style={{top:36}}>Start-up sound</span><span className="car-map-label text-label-small" style={{top:210}}>Dashboard scan</span></div></div>
    <section className="car-findings" aria-label="Findings">{allFindings.length?allFindings.map((finding,index)=>{const warning=finding.urgency!=='monitor';return <Card key={finding.label+index} title={finding.label} description={finding.advice} icon={warning?'de6af.svg':'90ace.svg'} tone={warning?'warning':'success'} aside={<span className={'text-body-small-strong car-cost '+(warning?'car-warning':'car-success')}>{finding.urgency_label??(warning?'Check':'Monitor')}</span>}/>;}):<><Card title="Scratch on rear bumper" description="Paint only · not urgent" icon="3e88f.svg" tone="warning" aside={<span className="text-body-small-strong car-cost">{scratchCost}</span>} onClick={()=>go('scratch-detail')}/><Card title="Drive belt squeal" description="Getting louder each check" icon="a0ba0.svg" tone="warning" aside={<span className="text-body-small-strong car-cost">{beltCost}</span>} onClick={()=>go('belt-squeal-trend')}/></>}{brakes&&<Card title="Brake check" description={brakes.verdict} icon="a0ba0.svg" tone={brakes.urgency==='soon'?'warning':'success'} aside={<span className={'text-body-small-strong car-cost '+(brakes.urgency==='soon'?'car-warning':'car-success')}>{brakes.urgency_label}</span>}/>}</section>
  </Frame>;
}
