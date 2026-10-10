import { Button } from '../../components';
import { Art,Frame,Heading,useCarNavigation } from './shared';
const stops=[[181,6],[270.6,46],[282.6,136],[270.6,226],[181,266],[91.4,226],[79.4,136],[91.4,46]];
const instructions=[['Park safely first','Keep the engine area clear before checking a warning.'],['Photograph the warning light or temperature gauge','Use good light and keep the display sharp in the frame.'],['Check the plain-language result','BUCKL will tell you whether to monitor it, book service soon, or stop safely now.']];
export function FirstCheck({carName='Myvi'}:{carName?:string}){
  const go=useCarNavigation();
  return <Frame
    back="car-check"
    footer={<Button label="Scan dashboard" onClick={()=>go('photo-walk-around',false,true)}/>}
  >
    <div className="car-photo-stops"><div className="car-photo-stops-scene"><Art name="76ad4.svg"/>{stops.map(([left,top],i)=><span key={i} className={'car-stop text-label-small'+(i===0?' car-stop--active':'')} style={{left,top}}>{i+1}</span>)}</div></div>
    <Heading title="Dashboard scan">Take one clear photo of a warning light or temperature gauge in your {carName}.</Heading>
    <ol className="car-first-steps car-panel">{instructions.map(([title,description],i)=><li key={title}><span className="car-step-number text-body-small-strong">{i+1}</span><div><h2 className="text-body-strong">{title}</h2><p className="text-body-small">{description}</p></div></li>)}</ol>
  </Frame>;
}
