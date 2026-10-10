import {useState} from 'react';
import {Button,Input} from '../../components';
import {Frame,Heading,useProfileNavigation} from './shared';
import {useAppData} from '../../integration/AppData';
import {AccountNotice} from '../../integration/AccountNotice';
export function AddACar(){
 const d=useAppData();const go=useProfileNavigation();const [make,setMake]=useState('');const [model,setModel]=useState('');const [plate,setPlate]=useState('');const [year,setYear]=useState(String(new Date().getFullYear()));const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(){setBusy(true);setError('');try{if(!make.trim()||!model.trim())throw new Error('Enter the make and model.');const c=await d.ensureSetup({make:make.trim(),model:model.trim(),year:Number(year),plate:plate.trim().toUpperCase()||null});d.selectCar(c.id);go('/profile/my-cars');}catch(e){setError(e instanceof Error?e.message:'Could not save your car.');}finally{setBusy(false);}}
 return <Frame back="/profile/my-cars" footer={<Button label={busy?'Saving…':'Save car'} disabled={busy||!d.session} onClick={()=>void save()}/>}><Heading title="Add a car">Enter your car’s details.</Heading><AccountNotice/><Input aria-label="Make" placeholder="Make" value={make} onChange={e=>setMake(e.target.value)}/><Input aria-label="Model" placeholder="Model" value={model} onChange={e=>setModel(e.target.value)}/><Input aria-label="Year" type="number" min="1900" max={new Date().getFullYear()+1} value={year} onChange={e=>setYear(e.target.value)}/><Input aria-label="Number plate" placeholder="Number plate (optional)" value={plate} onChange={e=>setPlate(e.target.value)}/>{error&&<p className="catch-error" role="alert">{error}</p>}</Frame>;
}
