import { useCallback, useEffect, useRef, useState } from 'react';

export function useRearCamera(enabled:boolean){
  const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const generation=useRef(0);
  const [attempt,setAttempt]=useState(0);const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');const [error,setError]=useState('');
  const stop=useCallback(()=>{
    generation.current++;
    stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    if(video.current)video.current.srcObject=null;
  },[]);
  useEffect(()=>{
    if(!enabled)return;
    const request=++generation.current;let acquired:MediaStream|null=null;
    const disconnected=()=>{if(request===generation.current){stream.current=null;setStatus('error');setError('The camera was disconnected. Try again or skip this photo.');}};
    setStatus('loading');setError('');
    void (async()=>{
      try{
        if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera unavailable');
        acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
        if(request!==generation.current){acquired.getTracks().forEach(track=>track.stop());return;}
        if(!acquired.active)throw new Error('Camera disconnected');
        acquired.getTracks().forEach(track=>track.addEventListener('ended',disconnected));
        stream.current=acquired;
        if(!video.current)throw new Error('Camera view unavailable');
        video.current.srcObject=acquired;await video.current.play();
        if(!acquired.active)throw new Error('Camera disconnected');
        if(request===generation.current)setStatus('ready');
      }catch(reason){
        acquired?.getTracks().forEach(track=>track.stop());
        if(request!==generation.current)return;
        stream.current=null;setStatus('error');
        const denied=reason instanceof DOMException&&(reason.name==='NotAllowedError'||reason.name==='SecurityError');
        setError(denied?'Allow camera access in your browser, then try again.':'The camera is unavailable. Try again or skip this photo.');
      }
    })();
    return ()=>{acquired?.getTracks().forEach(track=>track.removeEventListener('ended',disconnected));stop();};
  },[enabled,attempt,stop]);
  const capture=useCallback(async()=>{
    const element=video.current;
    if(!element||!element.videoWidth||!stream.current?.active)throw new Error('Camera is not ready');
    const canvas=document.createElement('canvas');canvas.width=element.videoWidth;canvas.height=element.videoHeight;
    const context=canvas.getContext('2d');if(!context)throw new Error('Photo capture unavailable');
    context.drawImage(element,0,0);
    return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Photo capture failed')),'image/jpeg',0.9));
  },[]);
  return {video,status,error,stop,capture,retry:()=>setAttempt(value=>value+1)};
}
