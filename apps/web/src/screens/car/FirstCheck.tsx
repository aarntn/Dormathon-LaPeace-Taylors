import { Button } from '../../components';
import { Art,Frame,Heading,useCarNavigation } from './shared';
const stops=[[181,6],[270.6,46],[282.6,136],[270.6,226],[181,266],[91.4,226],[79.4,136],[91.4,46]];
const instructions=[['Take 8 photos around the car','About 3 minutes. Daylight works best.'],['Tap any old scratches','So we don’t flag them as new damage later.'],['Record the engine for 15 seconds','Engine warm, bonnet open.']];
export function FirstCheck({carName='Myvi'}:{carName?:string}){
  const go=useCarNavigation();
  return <Frame back="car-check" footer={<Button label="Start walk-around" onClick={()=>go('photo-walk-around',false,true)}/>}>
    <div className="car-photo-stops"><div className="car-photo-stops-scene"><Art name="76ad4.svg"/>{stops.map(([left,top],i)=><span key={i} className={'car-stop text-label-small'+(i===0?' car-stop--active':'')} style={{left,top}}>{i+1}</span>)}</div></div>
    <Heading title="Your first check">These photos become your {carName}’s starting point. Later checks only flag what’s new.</Heading>
    <ol className="car-first-steps car-panel">{instructions.map(([title,description],i)=><li key={title}><span className="car-step-number text-body-small-strong">{i+1}</span><div><h2 className="text-body-strong">{title}</h2><p className="text-body-small">{description}</p></div></li>)}</ol>
  </Frame>;
}
