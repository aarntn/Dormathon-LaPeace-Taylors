import {Button} from '../../components';
import type {PreDriveInput,PreDriveResult} from '../../api';
import {Back,DriveFrame,Heading,useDriveNavigation} from './shared';

const icons={safe:'52330.svg',caution:'3e754.svg',high:'30ca7.svg'};
const dots={safe:'4b216.svg',caution:'6cb7a.svg',high:'6665a.svg'};
const titles={safe:'You’re good to go',caution:'More tired than usual',high:'Please don’t drive yet'};
const notes={safe:'We’ll still watch your eyes the whole way',caution:'We’ve adjusted tonight’s drive',high:'A short rest helps most'};
const sleepLabel=(hours:number)=>hours<5?'Under 5 h':hours<6?'5–6 h':hours<7?'6–7 h':'7 h +';
const awakeLabel=(hours:number)=>hours<8?'Under 8 h':hours<12?'8–12 h':hours<16?'12–16 h':'16 h +';

export function ReadinessResult({result,input,usual}:{result:PreDriveResult;input:PreDriveInput;usual?:number}){
 const go=useDriveNavigation();const high=result.level==='high';const level=result.level;
 const reaction=input.taps_ms.length?Math.round(input.taps_ms.reduce((a,b)=>a+b,0)/input.taps_ms.length):null;
 const eyes=input.face_mean_blink_ms>350?(input.face_yawns>0?'Long blinks, yawning':'Slower blinks'):'Normal';
 const rows=[['Reaction time',reaction===null?'—':`${reaction} ms`,true],['Your usual',usual===undefined?'—':`${usual} ms`,false],['Sleep last night',sleepLabel(input.slept),false],['Awake for',awakeLabel(input.awake),false],['Eyes',eyes,true],['You said',{very_alert:'Very alert',ok:'OK',bit_tired:'A bit tired',very_tired:'Very tired'}[input.alert_self],false],['Trip length',{under_30:'Under 30 min','30_60':'30–60 min','1_2h':'1–2 h',over_2h:'2 h +'}[input.trip_length],false]] as const;
 return <DriveFrame className={`readiness-result readiness-result--${level}`} footer={<div className="readiness-actions">{high?<><Button style="Secondary" label="Get a ride instead" onClick={()=>window.open('https://www.grab.com/my/transport/','_blank','noopener,noreferrer')}/><Button label="Remind me in 20 min" onClick={()=>{sessionStorage.setItem('buckl.check-reminder',String(Date.now()+1200000));go('/drive/home');}}/></>:<>{level==='caution'&&<Button style="Secondary" label="Not driving now" onClick={()=>go('/drive/home')}/>}<Button label="Mount my phone" onClick={()=>go('/drive/pick-your-route')}/></>}</div>}><main className="drive-content readiness-result__content"><Back to="/drive/before-you-drive"/><div className="readiness-result__icon"><img src={'/assets/drive-current/'+icons[level]} width="32" height="32" alt=""/></div><div className={`readiness-chip ${level} text-body-small-strong`}><img src={'/assets/drive-current/'+dots[level]} width="8" height="8" alt=""/>{result.label}</div><Heading title={titles[level]}>{result.reasons.join(' ')}</Heading><section className="readiness-findings">{rows.map(([label,value,tone])=><div key={label}><span className="text-body-regular">{label}</span><strong className={'text-body-strong '+(tone?'readiness-result__value':'')}>{value}</strong></div>)}</section><section className="readiness-plan"><strong className="text-body-small-strong">{notes[level]}</strong><p className="text-body-small">{result.plan}</p></section><p className="text-label-small readiness-disclaimer">{result.disclaimer}</p>{high&&<button className="text-body-strong readiness-override" onClick={()=>go('/drive/pick-your-route')}>Drive anyway</button>}</main></DriveFrame>;
}
