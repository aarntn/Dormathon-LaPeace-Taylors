import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton } from '../../components';
import { useDriveNavigation } from './shared';
import { EyeDebug, useEyeWatch } from '../../eyewatch/useEyeWatch';
import {useDrive} from './session';
import {EmergencyReceipt} from './EmergencyReceipt';

const DemoContext = createContext<() => void>(() => {});
export type DrivePreview='safe'|'caution'|'high'|'face'|'tap'|'working'|'route'|'passenger'|'countdown'|'contact'|'receipt'|'summary';
const PreviewContext=createContext<DrivePreview|null>(null);
export const useDrivePreview=()=>useContext(PreviewContext);
const previewLinks:readonly [string,string,DrivePreview][]=[['Safe to drive','/drive/check-result','safe'],['Caution','/drive/check-result','caution'],['High risk','/drive/check-result','high'],['Face reading','/drive/face-reading','face'],['Tap test','/drive/tap-test','tap'],['Working out your result','/drive/working-out-your-result','working'],['Pick your route','/drive/pick-your-route','route'],['Passenger mode','/drive/passenger-mode','passenger'],['No response countdown','/drive/no-response','countdown'],['Contact alerted','/drive/contact-alerted','contact'],['What Mum receives','/drive/home','receipt'],['Trip summary','/drive/trip-summary','summary']];
const demoLinks = [
  ['Demo: getting tired', '/drive/getting-tired'],
  ['Demo: eyes close for 1.8 s', '/drive/microsleep-alarm'],
  ['Demo: phone gets knocked', '/drive/cant-see-your-eyes'],
  ['Demo: Waze open', '/drive/waze-open-still-watching'],
  ['Demo: Tired while Waze is open', '/drive/tired-while-waze-is-open'],
  ['Demo: Back to alert', '/drive/driving'],
  ['Demo: start a drive at 11:20 pm', '/trips/late-drive-heads-up'],
  ['Demo: blurry dashboard photo', '/car/couldnt-read-the-light'],
  ['Demo: quiet start-up recording', '/car/didnt-hear-the-engine'],
] as const;

// The original logo remains the only visible trigger. Three keyboard activations
// also work, without exposing an extra demo control on the product screen.
export function useDemoLogo(onSingle?: () => void) {
  const open = useContext(DemoContext);
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return () => {
    taps.current += 1;
    clearTimeout(timer.current);
    if (taps.current === 3) { taps.current = 0; open(); return; }
    timer.current = setTimeout(() => { taps.current = 0; onSingle?.(); }, 500);
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preview,setPreview]=useState<DrivePreview|null>(null);
  const {trip}=useDrive();
  useEffect(()=>{if(trip)setPreview(null);},[trip?.id]);
  return <PreviewContext value={preview}><DemoContext value={() => setOpen(true)}>{children}{preview==='receipt'&&<EmergencyReceipt close={()=>setPreview(null)}/>}{open && <DemoDialog close={() => setOpen(false)} select={setPreview} />}</DemoContext></PreviewContext>;
}
function DemoDialog({ close,select }: { close: () => void;select:(value:DrivePreview|null)=>void }) {
  const watch=useEyeWatch();
  const drive=useDrive();
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useDriveNavigation();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="drive-demo" aria-labelledby="drive-demo-title" onCancel={event => { event.preventDefault(); close(); }}><header><h1 id="drive-demo-title" className="text-title-medium">Drive demo</h1><IconButton icon="Close" onClick={close} /></header><p className="text-body-small">Preview states using the Figma sample values. No messages are sent.</p><div>{demoLinks.map(([label, path]) => <Button key={path} style="Secondary" label={label} disabled={Boolean(drive.trip)} onClick={() => { select(null);navigate(path); close(); }} />)}{previewLinks.map(([label,path,state])=><Button key={state} style="Secondary" label={label} disabled={Boolean(drive.trip)} onClick={()=>{select(state);navigate(path);close();}}/>)}</div><section className="eye-demo-controls"><label className="text-body-strong">Pretend we're moving<input type="checkbox" checked={watch.pretendMoving} onChange={event=>watch.session.setPretendMoving(event.target.checked)} /></label><EyeDebug /><details><summary className="text-body-small-strong">Tune thresholds for the stage</summary>{(Object.keys(watch.config) as (keyof typeof watch.config)[]).map(key=><label key={key} className="text-body-small">{key}<input type="number" min="0.01" step="any" value={watch.config[key]} onChange={event=>watch.session.tune(key,event.target.valueAsNumber)} /></label>)}</details></section></dialog>;
}
