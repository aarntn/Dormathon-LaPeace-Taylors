import type { BucklApi, EmergencyAlert, Trip, TripEventInput, TripFeatures, TripPoint, TripSummary } from '../../api.ts';

type Snapshot={trip:Trip|null;speed:number|null;position:TripPoint|null;countdown:number|null;episodeKey:string|null;emergencyState:'idle'|'countdown'|'pending'|'sent'|'unknown'|'resolved';alerts:EmergencyAlert[];error:string;summary:TripSummary|null};
type Disk=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export class DriveRuntime {
  private value:Snapshot={trip:null,speed:null,position:null,countdown:null,episodeKey:null,emergencyState:'idle',alerts:[],error:'',summary:null};
  private listeners=new Set<()=>void>();private points:TripPoint[]=[];private events:TripEventInput[]=[];private features?:TripFeatures;
  private deadline:number|null=null;private retryAt=0;private sending=false;private flushPending?:Promise<void>;private sendPending?:Promise<void>;private motionAt=-Infinity;private brakeAt=-Infinity;private resolving=false;private resolveWanted=false;
  private api:BucklApi;private now:()=>number;private disk?:Disk;private diskKey:string;
  constructor(api:BucklApi,now:()=>number=Date.now,disk?:Disk,diskKey='buckl.active-trip.v1'){
    this.api=api;this.now=now;this.disk=disk;this.diskKey=diskKey;
    try{const saved=JSON.parse(disk?.getItem(diskKey)??'null');if(saved?.value?.trip?.id){this.value=saved.value;this.points=saved.points??[];this.events=saved.events??[];this.features=saved.features;this.deadline=saved.deadline;this.resolveWanted=Boolean(saved.resolveWanted);}}catch{}
  }
  getSnapshot=()=>this.value;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private emit(patch:Partial<Snapshot>={}){this.value={...this.value,...patch};try{if(this.value.trip)this.disk?.setItem(this.diskKey,JSON.stringify({value:this.value,points:this.points,events:this.events,features:this.features,deadline:this.deadline,resolveWanted:this.resolveWanted}));else this.disk?.removeItem(this.diskKey);}catch{}this.listeners.forEach(fn=>fn());}
  attach(trip:Trip){this.points=[];this.events=[];this.features=undefined;this.deadline=null;this.resolveWanted=false;this.motionAt=-Infinity;this.brakeAt=-Infinity;this.retryAt=0;this.emit({trip,position:null,speed:null,summary:null,alerts:[],episodeKey:null,emergencyState:'idle',countdown:null,error:''});}
  recordPoint(point:TripPoint){if(!this.value.trip||this.value.trip.ended_at)return;if(this.value.trip.started_at&&Date.parse(point.at)<Date.parse(this.value.trip.started_at))return;
    if(this.value.position?.at===point.at)return;const previous=this.value.position;
    if(previous?.speed_kmh!==null&&previous?.speed_kmh!==undefined&&point.speed_kmh!==null){const dt=(Date.parse(point.at)-Date.parse(previous.at))/1000;if(dt>0&&dt<=3&&(previous.speed_kmh-point.speed_kmh)/3.6/dt>=3&&previous.speed_kmh>=20&&this.now()-this.motionAt<=3000&&this.now()-this.brakeAt>=5000){this.brakeAt=this.now();this.recordEvent({at:point.at,kind:'hard_brake',lat:point.lat,lng:point.lng});}}
    this.points.push(point);this.emit({position:point,speed:point.speed_kmh});}
  recordMotion(a:{x:number|null;y:number|null;z:number|null}){if([a.x,a.y,a.z].every(v=>v!==null&&Number.isFinite(v))&&Math.hypot(a.x!,a.y!,a.z!)>=2)this.motionAt=this.now();}
  staleSpeed(){this.emit({speed:null});}
  recordEvent(event:TripEventInput){if(!this.value.trip||(this.value.trip.passenger_mode&&event.kind!=='hard_brake'))return;this.events.push(event);this.emit();}
  recordFeatures(features:TripFeatures){if(!this.value.trip||this.value.trip.passenger_mode)return;this.features=features;this.emit();}
  flush=async()=>{
    if(this.flushPending)return this.flushPending;const trip=this.value.trip;if(!trip)return;
    this.flushPending=(async()=>{while(this.points.length){const batch=this.points.slice(0,500);await this.api.sendPoints(trip.id,batch);this.points.splice(0,batch.length);this.emit();}
      while(this.events.length){await this.api.sendEvent(trip.id,this.events[0]);this.events.shift();this.emit();}
      if(this.features){const features=this.features;await this.api.sendFeatures(trip.id,features);if(this.features===features)this.features=undefined;this.emit();}})();
    try{await this.flushPending;this.emit({error:''});}catch(error){this.emit({error:error instanceof Error?error.message:'Trip upload pending.'});throw error;}finally{this.flushPending=undefined;}
  };
  async end(){const trip=this.value.trip;if(!trip)throw new Error('No active trip.');if(this.sendPending)await this.sendPending;if(this.value.emergencyState==='pending'&&!this.value.alerts.length)throw new Error('Wait for the emergency text status before ending the trip.');if(['pending','sent','unknown'].includes(this.value.emergencyState)||this.sending)await this.resolve();if(this.resolveWanted)throw new Error('Emergency status is still being confirmed. Try again shortly.');await this.flush();const summary=await this.api.endTrip(trip.id);this.deadline=null;this.emit({trip:null,countdown:null,summary,speed:null});return summary;}
  beginCountdown(){if(this.resolveWanted||!this.value.trip||this.value.trip.passenger_mode||['countdown','pending','sent','unknown'].includes(this.value.emergencyState))return;this.deadline=this.now()+10000;this.resolveWanted=false;this.emit({countdown:10,episodeKey:crypto.randomUUID(),emergencyState:'countdown',alerts:[],error:''});}
  cancelCountdown(){if(this.value.emergencyState!=='countdown')return;this.deadline=null;this.emit({countdown:null,emergencyState:'idle',episodeKey:null});}
  async tick(){
    if(this.resolveWanted){
      if(this.sending||this.resolving||this.now()<this.retryAt)return;
      try{if(!this.value.alerts.length&&this.value.trip&&this.value.episodeKey){
        let result=await this.api.emergencyAlerts(this.value.trip.id,this.value.episodeKey);
        if(!result.alerts.length){
          if(!this.value.position)throw new Error('Location is unavailable for cancelling this episode.');
          const cancelled=await this.api.cancelEmergencyEpisode(this.value.trip.id,this.value.position,this.value.episodeKey);
          result={alerts:cancelled.alerts.map(a=>['failed','pending','sending'].includes(a.ok_text_status??'')?{...a,resolved_at:null}:a)};
          if(!result.alerts.length){this.resolveWanted=false;this.emit({emergencyState:'resolved',error:''});return;}
        }
        this.emit({alerts:result.alerts});
      }await this.resolve();}catch(error){this.emit({error:error instanceof Error?error.message:'Emergency acknowledgement pending.'});}
      finally{this.retryAt=this.now()+5000;}return;
    }
    const trip=this.value.trip;if(!trip||trip.passenger_mode||this.sending)return;
    if(this.value.emergencyState==='countdown'){const left=Math.max(0,Math.ceil((this.deadline!-this.now())/1000));this.emit({countdown:left});if(left>0)return;this.emit({countdown:null,emergencyState:'pending'});}
    if(this.value.emergencyState!=='pending'||this.now()<this.retryAt)return;
    const position=this.value.position;if(!position){this.emit({error:'Location is unavailable. No text has been sent.'});return;}
    this.sending=true;this.sendPending=(async()=>{
    try{const result=await this.api.emergency(trip.id,{lat:position.lat,lng:position.lng},this.value.episodeKey!);
      const unknown=result.alerts.some(a=>a.status==='unknown');const sent=result.alerts.length>0&&result.alerts.every(a=>a.status==='sent'||Boolean(a.resolved_at));
      this.emit({alerts:result.alerts,emergencyState:this.resolveWanted?'resolved':unknown?'unknown':sent?'sent':'pending',error:unknown?'Delivery could not be confirmed.':sent?'':result.alerts.length?'Text pending. Retrying.':'No emergency contact is saved.'});
      if(this.resolveWanted)await this.resolve();
    }catch(error){this.emit({error:error instanceof Error?error.message:'Text pending. Retrying.'});}
    finally{this.sending=false;this.retryAt=this.now()+5000;}
    })();try{await this.sendPending;}finally{this.sendPending=undefined;}
  }
  async locationTick(){if(this.resolveWanted||!this.value.position||!['sent','pending'].includes(this.value.emergencyState))return;const point=this.value.position;const age=this.now()-Date.parse(point.at);if(age>10000||age< -5000)return;
    for(const alert of this.value.alerts.filter(a=>!a.resolved_at&&a.status==='sent'))await this.api.emergencyLocation(alert.id,{lat:point.lat,lng:point.lng,at:point.at});}
  async resolve(){this.cancelCountdown();if(this.resolving)return;this.resolveWanted=true;this.emit({countdown:null,emergencyState:'resolved'});if(!this.sending&&!this.value.position&&this.value.alerts.length===0){this.resolveWanted=false;this.emit({episodeKey:null,error:''});return;}if(this.value.alerts.length===0&&(this.sending||this.value.episodeKey)){this.emit({emergencyState:'pending',error:'Confirming emergency status before resolving.'});return;}
    this.resolving=true;try{for(const alert of this.value.alerts){if(!alert.resolved_at){const resolved=await this.api.resolveEmergency(alert.id);if(['failed','pending','sending'].includes(resolved.ok_text_status??''))throw new Error('Acknowledgement text pending.');Object.assign(alert,resolved);}}
      this.resolveWanted=false;this.emit({alerts:[...this.value.alerts],error:''});
    }catch(error){this.emit({error:error instanceof Error?error.message:'Acknowledgement pending.'});throw error;}finally{this.resolving=false;}}
}
