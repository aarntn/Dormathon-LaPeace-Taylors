import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components';
import { Art,Card,Frame,Heading,useCarNavigation } from './shared';
import { useCarSession } from './session';
export type EngineSoundCheckProps={elapsedSeconds?:number;durationSeconds?:number;idleFinding?:string;squealFinding?:string};
export function EngineSoundCheck({elapsedSeconds=9,durationSeconds=15,idleFinding='Idle is steady',squealFinding='High squeal at start-up'}:EngineSoundCheckProps){
  const go=useCarNavigation();const {analyseStartup,startup,uploading,notify}=useCarSession();
  const [recording,setRecording]=useState(false);const [elapsed,setElapsed]=useState(startup?durationSeconds:0);
  const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const timer=useRef<number|null>(null);const discard=useRef(false);
  const stop=()=>{if(timer.current!==null)window.clearInterval(timer.current);recorder.current?.state==='recording'&&recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());};
  useEffect(()=>()=>{discard.current=true;stop();},[]);
  const start=async()=>{
    if(recording||uploading)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){notify('Audio recording is not available in this browser.');return;}
    try{
      discard.current=false;const nextStream=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=nextStream;
      const chunks:BlobPart[]=[];const nextRecorder=new MediaRecorder(nextStream);recorder.current=nextRecorder;setElapsed(0);setRecording(true);
      nextRecorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      nextRecorder.onstop=()=>{
        nextStream.getTracks().forEach(track=>track.stop());setRecording(false);
        if(discard.current)return;
        const audio=new Blob(chunks,{type:nextRecorder.mimeType||'audio/webm'});
        if(audio.size)void analyseStartup(audio).catch(error=>notify(error instanceof Error?error.message:'Could not save the start-up recording.'));
      };
      nextRecorder.start();let seconds=0;timer.current=window.setInterval(()=>{seconds+=1;setElapsed(seconds);if(seconds>=durationSeconds)stop();},1000);
    }catch{notify('Microphone access is needed to record the engine start.');}
  };
  const title=startup?.verdict??(recording?'Listening to the engine start…':'Record while the engine starts');
  const warning=startup?.urgency==='soon'||startup?.urgency==='stop';
  return <Frame
    back="car-check"
    className="car-engine"
    footer={<Button label={recording?'Recording…':uploading==='startup'?'Analysing…':startup?'See my report':'Record start-up'} onClick={startup?()=>go('car-report'):()=>void start()} disabled={recording||uploading==='startup'}/>}
  >
    <Heading title="Start-up sound check">Before you start the engine, place the phone about 30 cm from it.</Heading>
    <div className="car-recorder"><Art name="93915.svg" className="car-recorder-track"/><Art name="b2d0c.svg" className="car-recorder-progress"/><div className="car-listening text-body-small-strong"><Art name="6665a.svg"/>{recording?'Listening':'Ready'}</div><p className="car-recorded-time text-heading-display">{Math.floor((recording?elapsed:startup?durationSeconds:elapsedSeconds)/60)}:{String(Math.floor((recording?elapsed:startup?durationSeconds:elapsedSeconds)%60)).padStart(2,'0')}</p><p className="car-recording-duration text-body-small">of {durationSeconds} seconds</p><Art name="waveform.svg" className="car-waveform"/></div>
    <section className="car-heard"><h2 className="text-body-strong">{startup?'Start-up result':'What we hear so far'}</h2><Card title={startup?title:idleFinding} description={startup?.stub?'A demo indication — not a vehicle diagnosis.':undefined} icon={warning?'de6af.svg':'90ace.svg'} tone={warning?'warning':'success'} aside={<span className={'text-body-small-strong '+(warning?'car-warning':'car-success')}>{warning?startup?.urgency_label??'Check':'Normal'}</span>}/>{!startup&&<Card title={squealFinding} icon="de6af.svg" tone="warning" aside={<span className="text-body-small-strong car-warning">Check</span>}/>}</section>
  </Frame>;
}
