import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createApi, type BucklApi, type Car, type CarInput, type Contact, type ContactInput, type Trip } from '../api';
import { AuthClient, type AuthSession } from './auth';

type AppData={api:BucklApi;session:AuthSession|null;configured:boolean;configState:'pending'|'configured'|'unconfigured'|'unavailable';loading:boolean;error:string;cars:Car[];contacts:Contact[];trips:Trip[];selectedCar:Car|undefined;selectCar:(id:string)=>void;
  refresh:()=>Promise<void>;signUp:(name:string,email:string,password:string)=>Promise<AuthSession|null>;signIn:(email:string,password:string)=>Promise<AuthSession>;signOut:()=>Promise<void>;rename:(name:string)=>Promise<void>;ensureSetup:(car:CarInput,contact?:ContactInput)=>Promise<Car>};
const Context=createContext<AppData|null>(null);
export function AppDataProvider({children}:{children:ReactNode}){
  const [auth]=useState(()=>new AuthClient({storage:sessionStorage}));
  const session=useSyncExternalStore(auth.subscribe,auth.getSnapshot);
  const [api]=useState(()=>createApi({getAccessToken:auth.getAccessToken}));
  const [configured,setConfigured]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const [configState,setConfigState]=useState<AppData['configState']>('pending');
  const [cars,setCars]=useState<Car[]>([]);const [contacts,setContacts]=useState<Contact[]>([]);const [trips,setTrips]=useState<Trip[]>([]);
  const [selectedId,setSelectedId]=useState('');
  const currentUser=useRef(session?.user.id);currentUser.current=session?.user.id;
  const refresh=useCallback(async()=>{
    const user=auth.getSnapshot()?.user.id;if(!user)return;setLoading(true);
    try{const [nextCars,nextContacts,nextTrips]=await Promise.all([api.cars(),api.contacts(),api.trips()]);
      if(currentUser.current!==user)return;setCars(nextCars);setContacts(nextContacts);setTrips(nextTrips);setError('');
    }catch(reason){if(currentUser.current===user)setError(reason instanceof Error?reason.message:'Could not load your account.');}
    finally{if(currentUser.current===user)setLoading(false);}
  },[api,auth]);
  useEffect(()=>{void fetch('/api/auth/config').then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(typeof data.configured!=='boolean')throw new Error('Invalid account configuration');setConfigured(data.configured);setConfigState(data.configured?'configured':'unconfigured');}).catch(()=>{setConfigured(false);setConfigState('unavailable');});},[]);
  useEffect(()=>{setSelectedId(sessionStorage.getItem('buckl.car.'+(session?.user.id??''))??'');setCars([]);setContacts([]);setTrips([]);setError('');setLoading(false);if(session)void refresh();},[session?.user.id,refresh]);
  const setupPending=useRef<Promise<Car>|null>(null);
  async function ensureSetup(car:CarInput,contact?:ContactInput){
    if(setupPending.current)return setupPending.current;
    const user=auth.getSnapshot()?.user;if(!user)throw new Error('Sign in to save your car.');
    const assertUser=()=>{if(auth.getSnapshot()?.user.id!==user.id)throw new Error('Account changed. Try again.');};
    setupPending.current=(async()=>{assertUser();
      await api.saveProfile(user.user_metadata?.name?.trim()||user.email?.split('@')[0]||'Driver');
      const existing=await api.cars();const match=existing.find(c=>car.plate?c.plate===car.plate:c.make===car.make&&c.model===car.model&&c.year===car.year);
      assertUser();const saved=match??await api.createCar(car);
      if(contact){const known=await api.contacts();const matched=known.find(c=>c.phone===contact.phone);assertUser();if(matched)await api.updateContact(matched.id,contact);else await api.createContact(contact);}
      assertUser();await refresh();return saved;
    })();try{return await setupPending.current;}finally{setupPending.current=null;}
  }
  return <Context value={{api,session,configured,configState,loading,error,cars,contacts,trips,selectedCar:cars.find(c=>c.id===selectedId)??cars[0],selectCar:(id)=>{if(!cars.some(c=>c.id===id))return;setSelectedId(id);sessionStorage.setItem('buckl.car.'+session?.user.id,id);},refresh,ensureSetup,
    signUp:(...args)=>auth.signUp(...args),signIn:(...args)=>auth.signIn(...args),signOut:()=>auth.signOut(),rename:async(name)=>{const clean=name.trim();if(!clean)throw new Error('Enter your name.');await api.saveProfile(clean);auth.rename(clean);}}}>{children}</Context>;
}
export function useAppData(){const value=useContext(Context);if(!value)throw new Error('AppDataProvider is required');return value;}
