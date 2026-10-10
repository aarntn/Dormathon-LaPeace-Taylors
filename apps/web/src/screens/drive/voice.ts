type Result={isFinal:boolean;0:{transcript:string}};
type Recognizer={processLocally?:boolean;lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:ArrayLike<Result>})=>void)|null;onerror:((event:{error:string})=>void)|null;start:()=>void;abort:()=>void};
export type SpeechConstructor={new():Recognizer;available?:(options:{langs:string[];processLocally:boolean})=>Promise<string>};
/** Never enable a cloud recognizer: acknowledgement audio must stay local. */
export async function listenForAcknowledgement(Constructor:SpeechConstructor|undefined,acknowledge:()=>void,status:(text:string)=>void=()=>{}):Promise<()=>void>{
  if(!Constructor){status('Voice acknowledgement unavailable. Use the button.');return()=>{};}
  const recognition=new Constructor();
  if(!('processLocally' in recognition)||!Constructor.available||await Constructor.available({langs:['en-US'],processLocally:true})!=='available'){
    status('On-device voice acknowledgement unavailable. Use the button.');return()=>{};
  }
  recognition.processLocally=true;recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=false;
  let acknowledged=false;
  recognition.onresult=event=>{for(const result of Array.from(event.results)){if(!acknowledged&&result.isFinal&&/\b(?:i['’]?m|i am)\s+(?:awake|ok|okay)\b/i.test(result[0].transcript)){acknowledged=true;acknowledge();}}};
  recognition.onerror=()=>status('Voice acknowledgement unavailable. Use the button.');
  recognition.start();status('Listening on this device.');
  return()=>{recognition.onresult=null;recognition.onerror=null;recognition.abort();};
}
