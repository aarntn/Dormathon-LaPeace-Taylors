import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AppFrame, Button, IconButton } from '../../components';
import type { Service } from '../../api';
import { useAppData } from '../../integration/AppData';

export function useCarNavigation() {
  const navigate=useNavigate(); const location=useLocation();
  const index=Number(window.history.state?.idx??0);
  const trail=(location.state as {carTrail?:{path:string;index:number}[]} | null)?.carTrail??[];
  return (name:string,back=false,sheet=false)=>{
    const path=name.startsWith('/')?name:'/car/'+name;
    if(back){
      const canonical=(value:string)=>value==='/car'?'/car/car-check':value;
      const target=[...trail].reverse().find(entry=>canonical(entry.path)===canonical(path)&&entry.index<index);
      if(target){navigate(target.index-index);return;}
      navigate(path,{replace:true,state:{direction:-1}});return;
    }
    navigate(path,{state:{carTrail:[...trail,{path:location.pathname,index}].slice(-64),...(sheet?{backgroundLocation:location}:{})}});
  };
}
export function Art({name,className='',style}:{name:string;className?:string;style?:CSSProperties}){
  return <img src={'/assets/car/'+name} alt="" className={'car-art '+className} style={style}/>;
}
export function Glyph({name,size=20}:{name:string;size?:number}){
  return <span className="car-glyph" style={{width:size,height:size}}><Art name={name}/></span>;
}
export function Heading({title,children}:{title:string;children:ReactNode}){
  return <header className="car-heading"><h1 className="text-heading-large">{title}</h1><p className="text-body-regular">{children}</p></header>;
}
export function Frame({children,back,footer,className='',share}:{children:ReactNode;back?:string;footer?:ReactNode;className?:string;share?:()=>void}){
  const go=useCarNavigation();
  return <AppFrame className={'car-frame '+className} footer={footer}><main className="car-content">{back&&<div className="car-topbar"><IconButton icon="Back" onClick={()=>go(back,true)}/>{share&&<IconButton icon="Share" onClick={share}/>}</div>}{children}</main></AppFrame>;
}
export function Card({title,description,icon,tone='tint',aside,asideInHeading=false,onClick,chevron=false}:{title:string;description?:string;icon:string;tone?:'tint'|'success'|'warning';aside?:ReactNode;asideInHeading?:boolean;onClick?:()=>void;chevron?:boolean}){
  const content=<><span className={'car-card-icon car-card-icon--'+tone}>{icon==='dea3d.svg'?<Art name={icon}/>:<Glyph name={icon} size={tone==='tint'?22:20}/>}</span><span className="car-card-copy"><span className="car-card-head"><span className="text-body-strong">{title}</span>{asideInHeading&&aside}</span>{description&&<span className="text-body-small">{description}</span>}</span>{!asideInHeading&&aside}{chevron&&<Glyph name="24cc9.svg"/>}</>;
  return onClick?<button type="button" className="car-card" onClick={onClick}>{content}</button>:<div className="car-card">{content}</div>;
}
export function DetailRow({label,value}:{label:string;value:string}){
  return <div className="car-detail-row"><dt className="text-body-regular">{label}</dt><dd className="text-body-strong">{value}</dd></div>;
}
export function WorkshopButton({service='cooling',style='Primary'}:{service?:Service;style?:'Primary'|'Secondary'}){
  const go=useCarNavigation();
  return <Button style={style} label="Find a workshop nearby" onClick={()=>go('workshops-near-you?service='+service)}/>;
}
export function FooterStack({children}:{children:ReactNode}){return <div className="car-footer-stack">{children}</div>;}
export function ResponsiveChart({children}:{children:ReactNode}){
  const container=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);
  useLayoutEffect(()=>{
    const element=container.current;if(!element)return;
    const measure=()=>setScale(element.clientWidth<350?element.clientWidth/358:1);
    measure();const observer=new ResizeObserver(measure);observer.observe(element);return ()=>observer.disconnect();
  },[]);
  return <div ref={container} className="car-chart"><div className="car-chart-scene" style={{transform:`translateX(-50%) scale(${scale})`,transformOrigin:'top center'}}>{children}</div></div>;
}
