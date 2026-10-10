import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { useSearchParams } from 'react-router';
import { Button, IconButton } from '../../components';
import { EASE, transitionFor } from '../../routing/transitions';
import { Art,Glyph,useCarNavigation } from './shared';
import { useRearCamera } from './useRearCamera';
import { useCarSession } from './session';

export type PhotoWalkAroundProps={title?:string;photoNumber?:number;photoTotal?:number};
export function PhotoWalkAround({title='Front left corner',photoNumber=3,photoTotal=8}:PhotoWalkAroundProps){
  const [params]=useSearchParams();const preview=params.has('preview');const present=useIsPresent();const reducedMotion=Boolean(useReducedMotion());
  const go=useCarNavigation();const {savePhoto,photoUrl}=useCarSession();const camera=useRearCamera(present&&!preview);
  const dialog=useRef<HTMLDialogElement>(null);const closing=useRef(false);const alive=useRef(true);const active=useRef(present);
  const captureGeneration=useRef(0);
  const [capturing,setCapturing]=useState(false);const [captureError,setCaptureError]=useState('');
  useLayoutEffect(()=>{active.current=present;if(!present)captureGeneration.current++;},[present]);
  const close=()=>{if(closing.current)return;closing.current=true;camera.stop();go('car-check',true);};
  const next=()=>{if(closing.current)return;closing.current=true;camera.stop();go('engine-sound-check');};
  const takePhoto=async()=>{
    if(closing.current||capturing)return;
    if(preview){next();return;}
    const request=captureGeneration.current;
    setCapturing(true);setCaptureError('');
    try{const blob=await camera.capture();if(!closing.current&&alive.current&&active.current&&request===captureGeneration.current){savePhoto(blob);next();}}
    catch{if(!closing.current&&alive.current&&active.current&&request===captureGeneration.current)setCaptureError('Couldn’t take the photo. Try again.');}
    finally{if(alive.current)setCapturing(false);}
  };
  useEffect(()=>{
    alive.current=true;const element=dialog.current;const focus=document.activeElement;const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';element?.showModal();element?.focus();
    return ()=>{
      alive.current=false;element?.close();document.body.style.overflow=overflow;
      if(focus instanceof HTMLElement&&focus.isConnected)focus.focus({preventScroll:true});
      else{const heading=document.querySelector<HTMLElement>('.route-stack .route-page:last-child .car-heading h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
    };
  },[]);
  return <motion.dialog ref={dialog} tabIndex={-1} className="sheet-dialog car-camera-dialog" aria-labelledby="car-camera-title" inert={!present} style={{pointerEvents:present?'auto':'none'}} onCancel={event=>{event.preventDefault();close();}} initial={{opacity:reducedMotion?1:0}} animate={{opacity:1}} variants={{exit:(kind:'push'|'sheet')=>({opacity:reducedMotion||kind==='push'?1:0,transition:{duration:reducedMotion?0:kind==='push'?0.45:0.5,ease:EASE}})}} exit="exit" transition={{duration:reducedMotion?0:0.5,ease:EASE}}>
    <motion.div className="sheet-backdrop" variants={{exit:(kind:'push'|'sheet')=>({opacity:kind==='push'?0:1,transition:{duration:0}})}} exit="exit"/>
    <motion.section className="car-camera" {...transitionFor('sheet',1,reducedMotion)} variants={{exit:(kind:'push'|'sheet')=>{const value=transitionFor(kind,1,reducedMotion);return {...value.exit,transition:value.transition};}}} exit="exit" data-transition="sheet">
      <div className="car-camera-fallback"><div className="car-camera-ground"/><Art name="56750.svg"/>{preview&&<><span className="car-camera-detection"/><span className="car-camera-detection-label text-label-small">Possible scratch</span></>}</div>
      <video ref={camera.video} autoPlay muted playsInline className={'car-camera-video'+(camera.status==='ready'?' car-camera-video--ready':'')} aria-label="Rear camera view"/>
      <div className="car-camera-top"><IconButton icon="Close" theme="Dark" onClick={close}/><header><h1 id="car-camera-title" className="text-title-medium">{title}</h1><p className="text-body-small">Photo {photoNumber} of {photoTotal}</p></header></div>
      <div className="car-camera-progress" aria-label={`Photo ${photoNumber} of ${photoTotal}`}>{Array.from({length:photoTotal},(_,i)=><span key={i} className={i<photoNumber?'complete':''}/>)}</div>
      <p className="car-camera-hint text-body-small-strong">Fit the whole corner in the frame</p>
      <div className="car-camera-corners"><Art name="718fe.svg"/><Art name="fe8b7.svg"/><Art name="b1862.svg"/><Art name="94eec.svg"/></div>
      {!preview&&camera.status==='error'&&<section className="car-camera-error"><p role="alert" className="text-body-small">{camera.error}</p><Button style="Light" label="Try camera again" onClick={camera.retry}/></section>}
      <div className="car-capture-panel">{preview?<div className="car-photo-quality text-body-small">{['Sharp','Bright enough','Good angle'].map(label=><span key={label}><Glyph name="bf7f3.svg" size={16}/>{label}</span>)}</div>:captureError?<p className="car-camera-status text-body-small" role="alert">{captureError}</p>:<p className="car-camera-status text-body-small" role="status">{camera.status==='loading'?'Opening camera…':camera.status==='ready'?'Ready to take a photo':'Camera unavailable'}</p>}
        <div className="car-captured">{photoUrl?<img src={photoUrl} alt="Last captured photo"/>:<span/>}<span/></div>
        <button type="button" className="car-shutter" aria-label="Take photo" disabled={capturing||(!preview&&camera.status!=='ready')} onClick={()=>void takePhoto()}><Art name="35987.svg"/></button>
        <button type="button" className="car-skip text-body-strong" onClick={next}>Skip</button>
      </div>
    </motion.section>
  </motion.dialog>;
}
