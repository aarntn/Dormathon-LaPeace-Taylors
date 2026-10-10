// Durations are milliseconds and blendshape/PERCLOS thresholds are 0–1 ratios.
// Keep stage tuning here so the engine, movement gate and calibration agree.
export const eyeConfig = {
  targetFps: 15, closedThreshold: .5, jawThreshold: .6, yawnMs: 1500,
  perclosWindowMs: 60000, perclosTired: .15, minEvidenceMs: 5000,
  meanBlinkTiredMs: 400, minBlinkMs: 50, yawnWindowMs: 300000, tiredYawns: 3,
  microsleepMs: 1500, lostMs: 3000, maxFrameGapMs: 500,
  movingSpeed: 2.8, movingMs: 5000, gpsStaleMs: 6000,
  featureIntervalMs: 30000, calibrationMs: 5000, calibrationBlinks: 2,
  calibrationOpenMax: .35, calibrationBlinkMin: .55, calibrationContrast: .2,
  calibrationReopenMargin: .1,
  tiredReminderMs: 600000,
};
export type EyeConfig = typeof eyeConfig;
export type EyeState = 'alert' | 'tired' | 'microsleep' | 'lost';
export type Signal = { t: number; eyeClosed: number; jawOpen: number; faceVisible: boolean };
export type Features = { perclos: number; blinkRate: number; meanBlinkMs: number; yawns: number; minutesDriving: number; hourOfDay: number };
export type EyeSnapshot = Features & { state: EyeState; eyeClosed: number; faceVisible: boolean; closedSeconds: number; moving: boolean; alarm: boolean };
const mean = (values: number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
const valid = (f: Signal) => f.faceVisible && Number.isFinite(f.eyeClosed) && f.eyeClosed >= 0 && f.eyeClosed <= 1 && Number.isFinite(f.jawOpen) && f.jawOpen >= 0 && f.jawOpen <= 1;

export class EyeEngine {
  config: EyeConfig;
  snapshot: EyeSnapshot = {state:'alert',eyeClosed:0,faceVisible:false,closedSeconds:0,moving:false,alarm:false,perclos:0,blinkRate:0,meanBlinkMs:0,yawns:0,minutesDriving:0,hourOfDay:0};
  private previous?: Signal;
  private intervals: {start:number;end:number;closed:boolean}[] = [];
  private blinks: {t:number;ms:number}[] = [];
  private yawns: number[] = [];
  private closedAt?: number;
  private missingAt?: number;
  private jawAt?: number;
  private yawnCounted = false;
  private acknowledgedClosure = false;
  private startedAt?: number;
  private featureAt?: number;
  private onFeatures?: (features: Features)=>void;
  constructor(config: Partial<EyeConfig> = {}, onFeatures?: (features: Features)=>void) { this.config={...eyeConfig,...config};this.onFeatures=onFeatures; }
  setMoving(moving:boolean) { this.snapshot.moving=moving; }
  // An ongoing or unknown closure must reopen before rearming. If the eyes
  // already reopened before acknowledgement, the next closure can alarm.
  acknowledge() { this.snapshot.alarm=false;this.acknowledgedClosure=!this.snapshot.faceVisible || this.closedAt!==undefined; }
  update(input: Signal): EyeSnapshot {
    if(!Number.isFinite(input.t) || (this.previous && input.t<=this.previous.t)) return {...this.snapshot};
    const f={...input,faceVisible:valid(input)};
    const c=this.config;
    this.startedAt ??= f.t; this.featureAt ??= f.t;
    const closed=f.faceVisible && f.eyeClosed>=c.closedThreshold;
    const gap=this.previous ? f.t-this.previous.t : 0;
    // Missing time cannot prove continuous closure or sustained yawning.
    // Only adjacent valid frames contribute to the observed-time denominator.
    if(gap>c.maxFrameGapMs) {this.closedAt=undefined;this.jawAt=undefined;this.yawnCounted=false;this.missingAt ??= this.previous!.t;}
    if(this.previous && this.previous.faceVisible && f.faceVisible && gap<=c.maxFrameGapMs) this.intervals.push({start:this.previous.t,end:f.t,closed:this.previous.eyeClosed>=c.closedThreshold});
    if(!f.faceVisible) {this.missingAt ??= f.t;this.closedAt=undefined;this.jawAt=undefined;this.yawnCounted=false;}
    else {
      this.missingAt=undefined;
      if(closed) this.closedAt ??= f.t;
      else {
        if(this.closedAt!==undefined && gap<=c.maxFrameGapMs) {const ms=f.t-this.closedAt;if(ms>=c.minBlinkMs)this.blinks.push({t:f.t,ms});}
        this.closedAt=undefined;this.acknowledgedClosure=false;
      }
      if(f.jawOpen>c.jawThreshold) {this.jawAt ??= f.t;if(!this.yawnCounted && f.t-this.jawAt>c.yawnMs){this.yawns.push(f.t);this.yawnCounted=true;}}
      else {this.jawAt=undefined;this.yawnCounted=false;}
    }
    const cutoff=f.t-c.perclosWindowMs;
    this.intervals=this.intervals.filter(i=>i.end>cutoff);
    this.blinks=this.blinks.filter(b=>b.t>cutoff);
    this.yawns=this.yawns.filter(t=>t>f.t-c.yawnWindowMs);
    let observed=0,closedMs=0;
    // Weight PERCLOS by elapsed time, not frame count: inference FPS can vary.
    // Clip the oldest interval when it overlaps the rolling-window boundary.
    for(const i of this.intervals){const ms=i.end-Math.max(i.start,cutoff);observed+=ms;if(i.closed)closedMs+=ms;}
    const perclos=observed ? closedMs/observed : 0;
    const meanBlinkMs=mean(this.blinks.map(b=>b.ms));
    const closedSeconds=this.closedAt===undefined?0:(f.t-this.closedAt)/1000;
    const state:EyeState=this.missingAt!==undefined && f.t-this.missingAt>=c.lostMs ? 'lost'
      : closedSeconds*1000>=c.microsleepMs ? 'microsleep'
      : (observed>=c.minEvidenceMs && perclos>c.perclosTired) || meanBlinkMs>c.meanBlinkTiredMs || this.yawns.length>=c.tiredYawns ? 'tired' : 'alert';
    const features:Features={perclos,blinkRate:observed ? this.blinks.length*60000/observed : 0,meanBlinkMs,yawns:this.yawns.length,minutesDriving:(f.t-this.startedAt)/60000,hourOfDay:new Date().getHours()};
    // Movement gates alarm activation. Once latched, a speed drop or reopened
    // eyes cannot silence the alarm; acknowledgement or session stop does that.
    this.snapshot={...features,state,eyeClosed:f.faceVisible?f.eyeClosed:0,faceVisible:f.faceVisible,closedSeconds,moving:this.snapshot.moving,alarm:this.snapshot.alarm || (state==='microsleep' && this.snapshot.moving && !this.acknowledgedClosure)};
    this.previous=f;
    if(f.t-this.featureAt>=c.featureIntervalMs){this.featureAt=f.t;this.onFeatures?.({...features});}
    return {...this.snapshot};
  }
}

export class MovementGate {
  private aboveAt?:number;
  private lastAt?:number;
  config:EyeConfig;
  constructor(config:Partial<EyeConfig>={}) {this.config={...eyeConfig,...config};}
  fix(speed:number|null,t:number) {
    if(!Number.isFinite(t) || (this.lastAt!==undefined && t<this.lastAt))return;
    if(this.lastAt!==undefined && t-this.lastAt>this.config.gpsStaleMs)this.aboveAt=undefined;
    this.lastAt=t;
    if(speed!==null && Number.isFinite(speed) && speed>this.config.movingSpeed)this.aboveAt ??= t;else this.aboveAt=undefined;
  }
  isFresh(t:number){return this.lastAt!==undefined && t>=this.lastAt && t-this.lastAt<=this.config.gpsStaleMs;}
  // Require speed measurements spanning the confirmation period. Waiting on
  // one cached fix is insufficient evidence that the car stayed above speed.
  isMoving(t:number) {return this.isFresh(t) && this.aboveAt!==undefined && this.lastAt!-this.aboveAt>=this.config.movingMs;}
}

export type CalibrationSnapshot = {phase:'look'|'blink'|'ready';seconds:number;blinks:number;threshold:number;openLevel:number;closedLevel:number};
export class Calibration {
  config:EyeConfig;
  snapshot:CalibrationSnapshot={phase:'look',seconds:0,blinks:0,threshold:.5,openLevel:0,closedLevel:0};
  private lookAt?:number;
  private lastAt?:number;
  private open:number[]=[];
  private peaks:number[]=[];
  private peak?:number;
  constructor(config:Partial<EyeConfig>={}){this.config={...eyeConfig,...config};}
  update(f:Signal):CalibrationSnapshot {
    if(this.snapshot.phase==='ready')return {...this.snapshot};
    if(!valid(f) || (this.lastAt!==undefined && f.t-this.lastAt>this.config.maxFrameGapMs)) {this.lookAt=undefined;this.open=[];this.peak=undefined;if(this.snapshot.phase==='look')this.snapshot.seconds=0;this.lastAt=f.t;return {...this.snapshot};}
    this.lastAt=f.t;
    if(this.snapshot.phase==='look') {
      if(f.eyeClosed>this.config.calibrationOpenMax){this.lookAt=undefined;this.open=[];this.snapshot.seconds=0;return {...this.snapshot};}
      this.lookAt ??= f.t;this.open.push(f.eyeClosed);this.snapshot.seconds=(f.t-this.lookAt)/1000;
      if(f.t-this.lookAt>=this.config.calibrationMs){this.snapshot.phase='blink';this.snapshot.openLevel=mean(this.open);}
    } else {
      // A blink completes only on reopening. Repeated closed frames belong to
      // one blink; their peak supplies the personal closed-eye calibration.
      if(f.eyeClosed>=Math.max(this.config.calibrationBlinkMin,this.snapshot.openLevel+this.config.calibrationContrast))this.peak=Math.max(this.peak??0,f.eyeClosed);
      else if(f.eyeClosed<=this.snapshot.openLevel+this.config.calibrationReopenMargin && this.peak!==undefined){this.peaks.push(this.peak);this.peak=undefined;this.snapshot.blinks=this.peaks.length;}
      if(this.peaks.length>=this.config.calibrationBlinks){this.snapshot.closedLevel=mean(this.peaks);this.snapshot.threshold=(this.snapshot.openLevel+this.snapshot.closedLevel)/2;this.snapshot.phase='ready';}
    }
    return {...this.snapshot};
  }
}
