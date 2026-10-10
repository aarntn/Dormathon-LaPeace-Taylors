import {useEffect,useState} from 'react';
/** Discard a response when its account or resource changes. */
export function useResource<T>(load:()=>Promise<T>,key:string|undefined){
 const [value,setValue]=useState<T>();const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);const [loading,setLoading]=useState(false);
 useEffect(()=>{let current=true;setValue(undefined);setError('');if(!key){setLoading(false);return;}setLoading(true);void load().then(v=>{if(current)setValue(v);}).catch(e=>{if(current)setError(e instanceof Error?e.message:'Could not load this information.');}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[key,attempt]);
 return {value,error,loading,retry:()=>setAttempt(n=>n+1)};
}
