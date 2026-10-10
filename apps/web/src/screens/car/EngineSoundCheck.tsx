import { Button } from '../../components';
import { Art,Card,Frame,Heading,useCarNavigation } from './shared';
export type EngineSoundCheckProps={elapsedSeconds?:number;durationSeconds?:number;idleFinding?:string;squealFinding?:string};
export function EngineSoundCheck({elapsedSeconds=9,durationSeconds=15,idleFinding='Idle is steady',squealFinding='High squeal at start-up'}:EngineSoundCheckProps){
  const go=useCarNavigation();
  return <Frame back="car-check" className="car-engine" footer={<Button label="See my report" onClick={()=>go('car-report')}/>}>
    <Heading title="Engine sound check">Engine idling, bonnet open, phone about 30 cm from the engine.</Heading>
    <div className="car-recorder"><Art name="93915.svg" className="car-recorder-track"/><Art name="b2d0c.svg" className="car-recorder-progress"/><div className="car-listening text-body-small-strong"><Art name="6665a.svg"/>Listening</div><p className="car-recorded-time text-heading-display">{Math.floor(elapsedSeconds/60)}:{String(Math.floor(elapsedSeconds%60)).padStart(2,'0')}</p><p className="car-recording-duration text-body-small">of {durationSeconds} seconds</p><Art name="waveform.svg" className="car-waveform"/></div>
    <section className="car-heard"><h2 className="text-body-strong">What we hear so far</h2><Card title={idleFinding} icon="90ace.svg" tone="success" aside={<span className="text-body-small-strong car-success">Normal</span>}/><Card title={squealFinding} icon="de6af.svg" tone="warning" aside={<span className="text-body-small-strong car-warning">Check</span>}/></section>
  </Frame>;
}
