import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { EyeWatchSession } from './session';
import type { Features } from './engine';

type Watch = {session:EyeWatchSession;video:React.RefObject<HTMLVideoElement|null>;start:()=>void;beginDrive:()=>void;remind:()=>void;mode:'test'|'drive'};
const Context=createContext<Watch|null>(null);
const activePaths=new Set(['face-reading','line-up-your-face','quick-eye-check','driving','getting-tired','microsleep-alarm','no-response','contact-alerted','cant-see-your-eyes','waze-open-still-watching','tired-while-waze-is-open'].map(p=>'/drive/'+p).concat('/onboarding/face-scan'));
export function EyeWatchProvider({children}:{children:ReactNode}) {
  const [session]=useState(()=>new EyeWatchSession());
  const video=useRef<HTMLVideoElement>(null);
  const snapshot=useSyncExternalStore(session.subscribe,session.getSnapshot);
  const [mode,setMode]=useState<'test'|'drive'>('test');
  const location=useLocation();const navigate=useNavigate();
  const reminder=useRef(0);const lastWarning=useRef('');
  useEffect(()=>()=>session.stop(),[session]);
  useEffect(()=>{if(location.pathname!=='/test-eyes' && !activePaths.has(location.pathname) && session.snapshot.status!=='idle')session.stop();},[location.pathname,session]);
  useEffect(()=>{
    if(mode!=='drive'||(snapshot.status!=='running'&&!snapshot.eye.alarm)||!session.snapshot.calibrated || ['/onboarding/face-scan','/drive/face-reading','/drive/line-up-your-face','/drive/quick-eye-check','/drive/no-response','/drive/contact-alerted'].includes(location.pathname))return;
    const state=snapshot.eye.alarm?'alarm':snapshot.eye.state;
    const target=state==='alarm'?'/drive/microsleep-alarm':state==='lost'?'/drive/cant-see-your-eyes':state==='tired' && performance.now()>=reminder.current?'/drive/getting-tired':undefined;
    if(target && location.pathname!==target){
      if(lastWarning.current!==state){if(state==='tired')session.speak("You look tired. There's a rest stop ahead.");if(state==='lost')session.speak("I can't see your eyes. Adjust your phone when it's safe.");}
      lastWarning.current=state;navigate(target,{replace:true});
    }else if(!target && snapshot.eye.faceVisible && location.pathname==='/drive/cant-see-your-eyes'){navigate('/drive/driving',{replace:true});lastWarning.current='';}
    if(state==='alert')lastWarning.current='';
  },[snapshot.eye,snapshot.status,location.pathname,mode,navigate,session]);
  const start=()=>{reminder.current=0;lastWarning.current='';setMode(location.pathname==='/test-eyes'?'test':'drive');if(video.current)void session.start(video.current);};
  const beginDrive=()=>{if(!session.snapshot.calibrated || session.snapshot.status!=='running')return;session.begin();setMode('drive');navigate('/drive/driving');};
  const remind=()=>{reminder.current=performance.now()+snapshot.config.tiredReminderMs;navigate('/drive/driving',{replace:true});};
  return <Context value={{session,video,start,beginDrive,remind,mode}}><video ref={video} className="eye-processing-video" aria-hidden muted playsInline />{children}</Context>;
}
export function useEyeWatch(options?:{onFeatures?:(features:Features)=>void}) {
  const context=useContext(Context);if(!context)throw new Error('useEyeWatch requires EyeWatchProvider');
  const snapshot=useSyncExternalStore(context.session.subscribe,context.session.getSnapshot);
  useEffect(()=>{if(!options?.onFeatures)return;context.session.onFeatures=options.onFeatures;return ()=>{context.session.onFeatures=undefined;};},[context.session,options?.onFeatures]);
  return {...context,...snapshot};
}
export function CameraPreview({className=''}:{className?:string}) {
  const {stream}=useEyeWatch();const ref=useRef<HTMLVideoElement>(null);
  useEffect(()=>{const video=ref.current;if(!video)return;video.srcObject=stream;void video.play().catch(()=>{});return ()=>{video.srcObject=null;};},[stream]);
  return <video ref={ref} className={'eye-preview '+className} muted playsInline aria-label="Front camera preview" />;
}
export function EyeDebug(){const {eye,fps}=useEyeWatch();return <dl className="eye-debug text-body-small"><div><dt>eyeClosed</dt><dd>{eye.eyeClosed.toFixed(3)}</dd></div><div><dt>PERCLOS</dt><dd>{(eye.perclos*100).toFixed(1)}%</dd></div><div><dt>State</dt><dd data-eye-state>{eye.state}</dd></div><div><dt>FPS</dt><dd>{fps.toFixed(1)}</dd></div></dl>;}
