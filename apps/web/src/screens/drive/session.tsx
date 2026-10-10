import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import {useNavigate} from 'react-router';
import {useAppData} from '../../integration/AppData';
import {useEyeWatch} from '../../eyewatch/useEyeWatch';
import type {Features} from '../../eyewatch/engine';
import type {PreDriveInput,PreDriveResult,Position,RouteOptions} from '../../api';
import {DriveRuntime} from './runtime';

export function DriveProvider({children}:{children:ReactNode}){
  const {api,session,selectedCar,refresh}=useAppData();const navigate=useNavigate();
  const runtime=useMemo(()=>new DriveRuntime(api,Date.now,session?sessionStorage:undefined,'buckl.trip.'+(session?.user.id??'guest')),[api,session?.user.id]);
  const snapshot=useSyncExternalStore(runtime.subscribe,runtime.getSnapshot);
  const onFeatures=useCallback((features:Features)=>runtime.recordFeatures({perclos:features.perclos,blink_rate:features.blinkRate,mean_blink_ms:features.meanBlinkMs,yawns:features.yawns,minutes_driving:features.minutesDriving,hour_of_day:features.hourOfDay}),[runtime]);
  const watch=useEyeWatch({onFeatures});
  const [input,setInput]=useState<PreDriveInput>({slept:6.5,awake:14,taps_ms:[],misses:0,hour:new Date().getHours(),alert_self:'bit_tired',trip_length:'1_2h',face_perclos:0,face_mean_blink_ms:0,face_yawns:0});
  const [result,setResult]=useState<PreDriveResult|null>(null);const [routeOptions,setRouteOptions]=useState<RouteOptions|null>(null);
  const [destination,setDestination]=useState<Position|null>(null);const [routeChoice,setRouteChoice]=useState<'safer'|'fastest'>('safer');const [error,setError]=useState('');
  const previousState=useRef('');const lastFix=useRef(0);
  useEffect(()=>{watch.session.stop();setResult(null);setInput(v=>({...v,taps_ms:[],misses:0}));},[session?.user.id]);
  useEffect(()=>{
    if(!snapshot.trip)return;
    if(snapshot.trip.passenger_mode)watch.session.stop();
    const timer=setInterval(()=>{void runtime.tick();if(Date.now()-lastFix.current>10000)runtime.staleSpeed();},250);
    const flush=setInterval(()=>{void runtime.flush().catch(()=>{});},10000);
    const location=setInterval(()=>{void runtime.locationTick().catch(e=>setError(e.message));},30000);
    let gps:number|undefined;
    if(navigator.geolocation)gps=navigator.geolocation.watchPosition(p=>{
      const age=Date.now()-p.timestamp;if(age>10000||age< -5000||p.coords.accuracy>100)return;lastFix.current=Date.now();
      runtime.recordPoint({at:new Date(p.timestamp).toISOString(),lat:p.coords.latitude,lng:p.coords.longitude,speed_kmh:p.coords.speed===null||p.coords.speed<0?null:p.coords.speed*3.6});
    },()=>{runtime.staleSpeed();setError('Location unavailable. Check location access while parked.');},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
    const motion=(event:DeviceMotionEvent)=>{if(event.acceleration)runtime.recordMotion(event.acceleration);};
    window.addEventListener('devicemotion',motion);
    return()=>{clearInterval(timer);clearInterval(flush);clearInterval(location);if(gps!==undefined)navigator.geolocation.clearWatch(gps);window.removeEventListener('devicemotion',motion);};
  },[snapshot.trip?.id,runtime]);
  useEffect(()=>{
    if(!snapshot.trip||snapshot.trip.passenger_mode){previousState.current='';return;}
    const state=watch.eye.alarm?'microsleep':watch.eye.state;
    if(state===previousState.current)return;previousState.current=state;
    if(['tired','microsleep','lost'].includes(state)){const p=snapshot.position;runtime.recordEvent({at:new Date().toISOString(),kind:state as 'tired'|'microsleep'|'lost',lat:p?.lat,lng:p?.lng});}
  },[watch.eye.state,watch.eye.alarm,snapshot.trip?.id,snapshot.position,runtime]);
  useEffect(()=>{if(snapshot.emergencyState==='sent'||snapshot.emergencyState==='unknown')navigate('/drive/contact-alerted',{replace:true});},[snapshot.emergencyState,navigate]);
  async function startTrip(passenger=false){
    if(!session)throw new Error('Sign in before starting a trip.');if(!selectedCar)throw new Error('Save your car first.');
    if(snapshot.trip)return snapshot.trip;
    const p=await currentPosition().catch(()=>null);const trip=await api.startTrip({car_id:selectedCar.id,predrive_id:passenger?null:result?.id,origin:p,destination,route_choice:routeChoice,passenger_mode:passenger});runtime.attach(trip);return trip;
  }
  async function finish(){try{await runtime.end();watch.session.stop();await refresh();navigate('/drive/trip-summary');}catch(e){setError(e instanceof Error?e.message:'Could not finish your trip.');}}
  async function acknowledge(){watch.session.acknowledge();runtime.cancelCountdown();void runtime.resolve().catch(e=>setError(e.message));navigate('/drive/driving',{replace:true});}
  return <Context value={{runtime,...snapshot,input,setInput,result,setResult,routeOptions,setRouteOptions,destination,setDestination,routeChoice,setRouteChoice,error:error||snapshot.error,setError,startTrip,finish,acknowledge}}>{children}</Context>;
}
const Context=createContext<{
  runtime:DriveRuntime;trip:ReturnType<DriveRuntime['getSnapshot']>['trip'];speed:number|null;position:ReturnType<DriveRuntime['getSnapshot']>['position'];countdown:number|null;episodeKey:string|null;emergencyState:string;alerts:ReturnType<DriveRuntime['getSnapshot']>['alerts'];summary:ReturnType<DriveRuntime['getSnapshot']>['summary'];
  input:PreDriveInput;setInput:React.Dispatch<React.SetStateAction<PreDriveInput>>;result:PreDriveResult|null;setResult:React.Dispatch<React.SetStateAction<PreDriveResult|null>>;
  routeOptions:RouteOptions|null;setRouteOptions:React.Dispatch<React.SetStateAction<RouteOptions|null>>;destination:Position|null;setDestination:React.Dispatch<React.SetStateAction<Position|null>>;routeChoice:'safer'|'fastest';setRouteChoice:React.Dispatch<React.SetStateAction<'safer'|'fastest'>>;
  error:string;setError:React.Dispatch<React.SetStateAction<string>>;startTrip:(passenger?:boolean)=>Promise<import('../../api').Trip>;finish:()=>Promise<void>;acknowledge:()=>Promise<void>
}|null>(null);
export function useDrive(){const value=useContext(Context);if(!value)throw new Error('DriveProvider required');return value;}
export function currentPosition():Promise<Position>{return new Promise((resolve,reject)=>{if(!navigator.geolocation){reject(new Error('Location unavailable.'));return;}navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),()=>reject(new Error('Allow location to find nearby services.')),{enableHighAccuracy:true,maximumAge:5000,timeout:10000});});}
