import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let model:FaceLandmarker|undefined;
let delegate='GPU';
self.onmessage=async ({data})=>{
  if(data.type==='init'){
    try {
      // Module workers require the module WASM loader, served from this app.
      const files=await FilesetResolver.forVisionTasks(data.base+'/eyewatch/wasm',true);
      const loader=await import(/* @vite-ignore */ files.wasmLoaderPath);
      const globals=self as unknown as {ModuleFactory:unknown};
      globals.ModuleFactory=loader.default;
      const options={baseOptions:{modelAssetPath:data.base+'/eyewatch/face_landmarker.task',delegate:'GPU' as 'GPU'|'CPU'},runningMode:'VIDEO' as const,numFaces:1,outputFaceBlendshapes:true};
      try{model=await FaceLandmarker.createFromOptions(files,options);}
      // MediaPipe consumes/clears ModuleFactory during creation. Restore it
      // before CPU retry because importing the cached loader will not rerun it.
      catch{delegate='CPU';globals.ModuleFactory=loader.default;model=await FaceLandmarker.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}
      self.postMessage({type:'ready',delegate});
    }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'Could not load eye model'});}
  }else if(data.type==='frame'){
    const bitmap:ImageBitmap=data.bitmap;
    try{
      if(!model)throw new Error('Eye model is not ready');
      const result=model.detectForVideo(bitmap,data.t);
      const scores=result.faceBlendshapes[0]?.categories;
      const score=(name:string)=>scores?.find(c=>c.categoryName===name)?.score;
      const left=score('eyeBlinkLeft'),right=score('eyeBlinkRight'),jaw=score('jawOpen');
      const points=result.faceLandmarks[0];
      const faceVisible=Boolean(points && left!==undefined && right!==undefined && jaw!==undefined);
      // Numeric fit flags only; landmarks and bitmaps never leave this worker.
      const eyesVisible=Boolean(points && [33,133,362,263].every(i=>points[i].x>.03 && points[i].x<.97 && points[i].y>.03 && points[i].y<.97));
      const span=points?Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)):0;
      self.postMessage({type:'signal',t:data.t,eyeClosed:faceVisible?(left!+right!)/2:0,jawOpen:jaw??0,faceVisible,eyesVisible,goodDistance:span>.15 && span<.8});
    }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'Eye detection failed'});}
    finally{bitmap.close();}
  }
};
