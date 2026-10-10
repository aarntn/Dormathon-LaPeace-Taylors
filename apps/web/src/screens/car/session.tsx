import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type CarSession={photoUrl:string|undefined;savePhoto:(photo:Blob)=>void;notify:(message:string)=>void;scratchAlreadyPresent:boolean;markScratchExisting:()=>void};
const Context=createContext<CarSession|null>(null);
export function CarProvider({children}:{children:ReactNode}){
  const [photo,setPhoto]=useState<Blob>(); const [photoUrl,setPhotoUrl]=useState<string>();
  const [message,setMessage]=useState('');
  const [scratchAlreadyPresent,setScratchAlreadyPresent]=useState(false);
  useEffect(()=>{
    if(!photo)return;
    const url=URL.createObjectURL(photo);setPhotoUrl(url);
    return ()=>URL.revokeObjectURL(url);
  },[photo]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),2500);return ()=>clearTimeout(timer);},[message]);
  return <Context.Provider value={{photoUrl,savePhoto:setPhoto,notify:setMessage,scratchAlreadyPresent,markScratchExisting:()=>setScratchAlreadyPresent(true)}}>{children}{message&&<div role="status" className="car-feedback text-body-small">{message}</div>}</Context.Provider>;
}
export function useCarSession(){const session=useContext(Context);if(!session)throw new Error('CarProvider is required');return session;}
