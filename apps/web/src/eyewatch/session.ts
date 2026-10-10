import { Calibration, EyeEngine, MovementGate, eyeConfig, type CalibrationSnapshot, type EyeConfig, type EyeSnapshot, type Features, type Signal } from './engine.ts';
import { Alarm, speakLocal } from './alarm.ts';

export type WatchSnapshot = {
  status:'idle'|'starting'|'running'|'error';error:string;stream:MediaStream|null;
  eye:EyeSnapshot;calibration:CalibrationSnapshot|null;calibrated:boolean;
  fps:number;delegate:string;gps:string;wake:string;audio:boolean;voice:string;
  pretendMoving:boolean;eyesVisible:boolean;goodDistance:boolean;config:EyeConfig;
};
const storageKey='dormathon.eye-calibration.v1';
export class EyeWatchSession {
  private listeners=new Set<()=>void>();
  private engine=new EyeEngine();
  private movement=new MovementGate();
  private calibration?:Calibration;
  private alarm=new Alarm();
  private video?:HTMLVideoElement;
  private worker?:Worker;
  private wake?:WakeLockSentinel;
  private wakePending=false;
  private gps?:number;
  private frame?:number;
  private fallbackFrame?:number;
  private heartbeat?:ReturnType<typeof setInterval>;
  // Every stop invalidates pending camera, worker, GPS, audio and wake results.
  // Late acquisitions release their resources instead of reviving a session.
  private generation=0;
  private busy=false;
  private lastCapture=-Infinity;
  private lastMediaTime=-Infinity;
  private lastResult=-Infinity;
  private lastSignal=-Infinity;
  private fpsAt=0;
  private frames=0;
  private watching=false;
  private cancelInitialisation?:()=>void;
  private config:EyeConfig={...eyeConfig};
  onFeatures?: (features:Features)=>void;
  snapshot:WatchSnapshot={status:'idle',error:'',stream:null,eye:{...this.engine.snapshot},calibration:null,calibrated:false,fps:0,delegate:'Not loaded',gps:'Not started',wake:'Not requested',audio:false,voice:'Local voice not checked',pretendMoving:false,eyesVisible:false,goodDistance:false,config:{...eyeConfig}};
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
  getSnapshot=()=>this.snapshot;
  private emit(patch:Partial<WatchSnapshot>={}) {this.snapshot={...this.snapshot,...patch};this.listeners.forEach(fn=>fn());}
  async enableSound() {const generation=this.generation;try{await this.alarm.unlock();if(generation!==this.generation)return;if(this.snapshot.eye.alarm)this.alarm.start();this.emit({audio:this.alarm.ready});}catch(error){if(generation===this.generation)this.emit({audio:false,error:error instanceof Error?error.message:'Sound unavailable'});}}
  async start(video:HTMLVideoElement) {
    if(this.snapshot.status==='starting'||this.snapshot.status==='running')return;
    this.stop();const generation=++this.generation;
    this.video=video;this.watching=true;this.config={...eyeConfig};
    let calibrated=false;
    try{const saved=JSON.parse(localStorage.getItem(storageKey)??'null');if(saved && Number.isFinite(saved.threshold) && saved.threshold>.1 && saved.threshold<.95){this.config.closedThreshold=saved.threshold;calibrated=true;}}catch{}
    this.engine=new EyeEngine(this.config,features=>this.onFeatures?.(features));this.movement=new MovementGate(this.config);
    this.emit({status:'starting',error:'',calibrated,eye:{...this.engine.snapshot},config:{...this.config}});
    // Start audio unlock within the user's tap, before awaiting permissions.
    const sound=this.enableSound();
    void this.alarm.preloadVoices().then(()=>{if(generation===this.generation)this.emit({voice:'Offline voice files ready'});}).catch(()=>{if(generation===this.generation)this.emit({voice:'Offline voice files unavailable'});});
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera needs a trusted HTTPS connection');
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
      this.emit({stream});video.srcObject=stream;video.muted=true;video.playsInline=true;await video.play();
      if(generation!==this.generation)return;
      stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(generation===this.generation)this.fail('Camera stopped. Restart eye watch.');},{once:true}));
      const worker=new Worker(new URL('./model.worker.ts',import.meta.url),{type:'module'});this.worker=worker;
      await new Promise<void>((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('Eye model took too long to load. Retry with a connection.')),45000);
        this.cancelInitialisation=()=>{clearTimeout(timeout);reject(new Error('Eye watch stopped'));};
        worker.onerror=()=>{clearTimeout(timeout);reject(new Error('Eye model worker failed to start'));};
        worker.onmessage=({data})=>{
          if(generation!==this.generation)return;
          if(data.type==='ready'){clearTimeout(timeout);this.cancelInitialisation=undefined;this.emit({delegate:data.delegate});resolve();}
          else if(data.type==='error'){clearTimeout(timeout);reject(new Error(data.message));this.fail('Eye model failed: '+data.message);}
          else if(data.type==='signal') {this.busy=false;this.lastResult=performance.now();this.frames++;this.consume(data);}
        };
        worker.postMessage({type:'init',base:location.origin});
      });
      if(generation!==this.generation)return;
      worker.onerror=()=>{if(generation===this.generation)this.fail('Eye model stopped. Restart eye watch.');};
      this.emit({status:'running'});this.lastResult=performance.now();this.fpsAt=this.lastResult;this.frames=0;
      this.requestLocation();void this.requestWake(generation);
      document.addEventListener('visibilitychange',this.visibility);
      this.schedule(generation);
      this.heartbeat=setInterval(()=>{
        const now=performance.now();
        this.engine.setMoving(this.snapshot.pretendMoving||this.movement.isMoving(now));
        if(now-this.lastResult>this.config.maxFrameGapMs)this.consume({t:now,eyeClosed:0,jawOpen:0,faceVisible:false});
        if(now-this.fpsAt>=1000){this.emit({fps:this.frames*1000/(now-this.fpsAt),audio:this.alarm.ready,...(!this.movement.isFresh(now)&&this.snapshot.gps.includes('km/h')?{gps:'Stale speed — movement unconfirmed'}:{})});this.frames=0;this.fpsAt=now;}
      },250);
      await sound;
    }catch(error){if(generation===this.generation)this.fail(error instanceof Error?error.message:'Could not start eye watch');}
  }
  // A detector failure ends monitoring but must preserve an existing alarm.
  private fail(message:string){const alarm=this.snapshot.eye.alarm;this.stop(alarm);this.emit({status:'error',error:message,eye:{...this.snapshot.eye,faceVisible:false,state:'lost',alarm}});if(alarm)void this.requestWake(this.generation);}
  private schedule(generation:number){
    const video=this.video;if(!video)return;
    const callback=()=>{if(generation!==this.generation)return;this.schedule(generation);const now=performance.now();if(this.busy || now-this.lastCapture<1000/this.config.targetFps || video.readyState<2 || document.hidden)return;
      // The rAF fallback can run while the camera is frozen. An unchanged
      // frame is not fresh evidence; let the missing-frame heartbeat take over.
      if(video.currentTime===this.lastMediaTime)return;
      this.busy=true;this.lastCapture=now;this.lastMediaTime=video.currentTime;
      void createImageBitmap(video).then(bitmap=>{if(generation!==this.generation){bitmap.close();return;}this.worker?.postMessage({type:'frame',bitmap,t:now},[bitmap]);}).catch(()=>{if(generation===this.generation)this.busy=false;});
    };
    if('requestVideoFrameCallback' in video)this.frame=video.requestVideoFrameCallback(callback);
    else this.fallbackFrame=requestAnimationFrame(callback);
  }
  private consume(signal:Signal & {eyesVisible?:boolean;goodDistance?:boolean}) {
    if(this.snapshot.status!=='running')return;
    // Late worker frames must not replace a newer missing-frame heartbeat.
    if(signal.t<performance.now()-this.config.maxFrameGapMs)signal={t:performance.now(),eyeClosed:0,jawOpen:0,faceVisible:false};
    if(signal.t<=this.lastSignal)return;this.lastSignal=signal.t;
    this.engine.setMoving(this.snapshot.pretendMoving||this.movement.isMoving(performance.now()));
    if(this.calibration){const calibration=this.calibration.update(signal);this.emit({calibration});if(calibration.phase==='ready'){this.config.closedThreshold=calibration.threshold;try{localStorage.setItem(storageKey,JSON.stringify({threshold:calibration.threshold,openLevel:calibration.openLevel,closedLevel:calibration.closedLevel}));}catch{}this.calibration=undefined;this.engine=new EyeEngine(this.config,features=>this.onFeatures?.(features));this.emit({calibrated:true,config:{...this.config}});}}
    const eye=this.watching?this.engine.update(signal):{...this.engine.snapshot,eyeClosed:signal.eyeClosed,faceVisible:signal.faceVisible};
    if(eye.alarm){try{this.alarm.start();}catch(error){this.emit({audio:false,error:error instanceof Error?error.message:'Alarm audio unavailable'});}}
    this.emit({eye,eyesVisible:signal.eyesVisible??false,goodDistance:signal.goodDistance??false});
  }
  calibrate() {this.acknowledge();this.watching=false;this.calibration=new Calibration(this.config);this.emit({calibration:{...this.calibration.snapshot},calibrated:false});}
  begin() {this.engine=new EyeEngine(this.config,features=>this.onFeatures?.(features));this.watching=true;this.emit({eye:{...this.engine.snapshot}});}
  // After failure, retain missing-eye flags rather than restoring stale engine
  // visibility or movement while clearing the sound latch.
  acknowledge() {this.engine.acknowledge();this.alarm.stop();this.emit({eye:this.snapshot.status==='error'?{...this.snapshot.eye,alarm:false}:{...this.engine.snapshot}});}
  setPretendMoving(value:boolean) {this.emit({pretendMoving:value});}
  tune(key:keyof EyeConfig,value:number){if(!Number.isFinite(value)||value<=0)return;if(['closedThreshold','jawThreshold','perclosTired','calibrationOpenMax','calibrationBlinkMin','calibrationContrast'].includes(key)&&value>=1)return;this.config={...this.config,[key]:value};this.engine.config={...this.config};this.movement.config={...this.config};if(this.calibration)this.calibration.config={...this.config};this.emit({config:{...this.config}});}
  speak(text:string){const local=speakLocal(text);const fallback=!local && this.alarm.speak(text.includes('tired')?'tired':'lost');this.emit({voice:local?'On-device English voice':fallback?'Offline recorded voice':'Voice unavailable — enable sound'});}
  private requestLocation(){
    if(!navigator.geolocation){this.emit({gps:'Location unavailable — movement unknown'});return;}
    this.emit({gps:'Waiting for speed'});
    const generation=this.generation;
    // Convert the position's original wall-clock timestamp to monotonic time.
    // Callback delivery must not extend the lifetime of an old speed reading.
    this.gps=navigator.geolocation.watchPosition(position=>{if(generation!==this.generation)return;const speed=position.coords.speed;const now=performance.now();const age=Math.max(0,Date.now()-position.timestamp);if(!Number.isFinite(age)||age>this.config.gpsStaleMs){this.movement.fix(null,now);this.emit({gps:'Stale location — movement unknown'});return;}this.movement.fix(speed,now-age);this.emit({gps:speed===null||!Number.isFinite(speed)||speed<0?'Speed unavailable — movement unknown':`${(speed*3.6).toFixed(1)} km/h`});},()=>{if(generation!==this.generation)return;this.movement.fix(null,performance.now());this.emit({gps:'Location denied or unavailable — movement unknown'});},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
  }
  private visibility=()=>{if(!document.hidden && (this.snapshot.status==='running'||this.snapshot.eye.alarm)){void this.requestWake(this.generation);this.emit({audio:this.alarm.ready});}};
  private async requestWake(generation:number){
    if(!('wakeLock' in navigator)){this.emit({wake:'Screen wake lock unsupported'});return;}
    // Initial acquisition and visibility recovery may overlap. Own at most
    // one pending request, and release a sentinel arriving after stop.
    if(this.wakePending || (this.wake && !this.wake.released))return;
    this.wakePending=true;
    try{const lock=await navigator.wakeLock.request('screen');if(generation!==this.generation){await lock.release();return;}this.wake=lock;this.emit({wake:'Screen kept awake'});lock.addEventListener('release',()=>{if(generation===this.generation)this.emit({wake:'Screen wake lock released'});});}catch{if(generation===this.generation)this.emit({wake:'Screen wake lock unavailable'});}finally{if(generation===this.generation)this.wakePending=false;}
  }
  stop(keepAlarm=false){
    // Preserve sound and screen wake only for a latched alarm after failure.
    // Explicit End drive/Stop releases every session-owned resource.
    ++this.generation;this.watching=false;this.calibration=undefined;
    this.cancelInitialisation?.();this.cancelInitialisation=undefined;
    clearInterval(this.heartbeat);this.heartbeat=undefined;
    if(this.video && this.frame!==undefined)this.video.cancelVideoFrameCallback?.(this.frame);
    if(this.fallbackFrame!==undefined)cancelAnimationFrame(this.fallbackFrame);
    this.frame=undefined;this.fallbackFrame=undefined;
    this.worker?.terminate();this.worker=undefined;this.busy=false;this.lastCapture=-Infinity;this.lastMediaTime=-Infinity;this.lastResult=-Infinity;this.lastSignal=-Infinity;
    this.snapshot.stream?.getTracks().forEach(t=>t.stop());if(this.video){this.video.srcObject=null;this.video=undefined;}
    if(this.gps!==undefined)navigator.geolocation.clearWatch(this.gps);this.gps=undefined;
    this.wakePending=false;if(!keepAlarm){void this.wake?.release().catch(()=>{});this.wake=undefined;document.removeEventListener('visibilitychange',this.visibility);}
    if(!keepAlarm)this.alarm.dispose();if('speechSynthesis' in window)speechSynthesis.cancel();
    if(!keepAlarm)this.engine.acknowledge();this.emit({status:'idle',stream:null,pretendMoving:false,audio:keepAlarm&&this.alarm.ready,fps:0,eye:{...this.engine.snapshot,alarm:keepAlarm&&this.engine.snapshot.alarm,moving:false,faceVisible:false,...(!keepAlarm?{state:'alert',eyeClosed:0,closedSeconds:0}:{})},calibration:null,gps:'Not started',wake:keepAlarm?this.snapshot.wake:'Not requested'});
  }
}
