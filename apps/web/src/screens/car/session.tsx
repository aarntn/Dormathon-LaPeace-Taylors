import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BrakeResult, CarReport, DashboardResult, StartupResult } from '../../api';
import { useAppData } from '../../integration/AppData';
import { getScenario } from './demoScenario';

type CarSession={
  photoUrl:string|undefined;savePhoto:(photo:Blob)=>void;notify:(message:string)=>void;
  scratchAlreadyPresent:boolean;markScratchExisting:()=>void;
  dashboard:DashboardResult|undefined;startup:StartupResult|undefined;brakes:BrakeResult|undefined;
  loadingReport:boolean;uploading:'dashboard'|'startup'|undefined;
  analyseDashboard:(photo:Blob)=>Promise<DashboardResult>;analyseStartup:(audio:Blob,crankSeconds?:number)=>Promise<StartupResult>;
  refreshReport:()=>Promise<void>;
};
const Context=createContext<CarSession|null>(null);
export function CarProvider({children}:{children:ReactNode}){
  const data=useAppData();
  const [photo,setPhoto]=useState<Blob>(); const [photoUrl,setPhotoUrl]=useState<string>();
  const [message,setMessage]=useState('');
  const [scratchAlreadyPresent,setScratchAlreadyPresent]=useState(false);
  const [report,setReport]=useState<CarReport>();const [dashboard,setDashboard]=useState<DashboardResult>();const [startup,setStartup]=useState<StartupResult>();const [loadingReport,setLoadingReport]=useState(false);
  const [uploading,setUploading]=useState<'dashboard'|'startup'>();
  useEffect(()=>{
    if(!photo)return;
    const url=URL.createObjectURL(photo);setPhotoUrl(url);
    return ()=>URL.revokeObjectURL(url);
  },[photo]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),2500);return ()=>clearTimeout(timer);},[message]);
  const refreshReport=async()=>{
    if(!data.session||!data.selectedCar){setReport(undefined);setDashboard(undefined);setStartup(undefined);return;}
    setLoadingReport(true);
    try{const next=await data.api.carReport(data.selectedCar.id);setReport(next);setDashboard(next.dashboard??undefined);setStartup(next.startup??undefined);}
    catch(error){setMessage(error instanceof Error?error.message:'Could not load your car report.');}
    finally{setLoadingReport(false);}
  };
  useEffect(()=>{void refreshReport();},[data.session?.user.id,data.selectedCar?.id]);
  const analyseDashboard=async(photo:Blob)=>{
    if(!data.selectedCar)throw new Error('Add a car before checking a dashboard warning.');
    setUploading('dashboard');
    try{
      const result=await data.api.dashboardCheck(data.selectedCar.id,photo,getScenario('dashboard')??undefined);
      // A scan that found nothing readable is not a saved result, so it must not read as "no lights" in the report.
      if(result.findings.length){setDashboard(result);setReport(previous=>previous?{...previous,dashboard:result}:previous);}
      setMessage(result.stub?'Dashboard scan saved. Model result is a demo indication.':'Dashboard scan complete.');
      return result;
    }finally{setUploading(undefined);}
  };
  const analyseStartup=async(audio:Blob,crankSeconds?:number)=>{
    if(!data.selectedCar)throw new Error('Add a car before recording a start-up check.');
    setUploading('startup');
    try{
      const result=await data.api.startupCheck(data.selectedCar.id,audio,crankSeconds,getScenario('startup')??undefined);
      setStartup(result);setReport(previous=>previous?{...previous,startup:result}:previous);
      setMessage(result.stub?'Start-up check saved. Model result is a demo indication.':'Start-up check complete.');
      return result;
    }finally{setUploading(undefined);}
  };
  return <Context.Provider value={{photoUrl,savePhoto:setPhoto,notify:setMessage,scratchAlreadyPresent,markScratchExisting:()=>setScratchAlreadyPresent(true),dashboard,startup,brakes:report?.brakes,loadingReport,uploading,analyseDashboard,analyseStartup,refreshReport}}>{children}{message&&<div role="status" className="car-feedback text-body-small">{message}</div>}</Context.Provider>;
}
export function useCarSession(){const session=useContext(Context);if(!session)throw new Error('CarProvider is required');return session;}
