import { ApiError } from '../api.ts';

export type AuthSession = {access_token:string;refresh_token:string;expires_at:number;expires_in?:number;
  user:{id:string;email?:string;user_metadata?:{name?:string}}};
type Disk = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const key='buckl.session.v1';
export class AuthClient {
  private session:AuthSession|null=null;
  private listeners=new Set<()=>void>();
  private refreshing?:Promise<string|null>;
  private generation=0;
  private disk?:Disk;
  private fetcher:typeof fetch;
  private now:()=>number;
  constructor({storage,fetcher=fetch.bind(globalThis),now=Date.now}:{storage?:Disk;fetcher?:typeof fetch;now?:()=>number}={}){
    this.disk=storage;this.fetcher=fetcher;this.now=now;
    try{const saved=JSON.parse(storage?.getItem(key)??'null');if(saved?.access_token&&saved?.refresh_token&&saved?.user?.id&&Number.isFinite(saved.expires_at))this.session=saved;}catch{}
  }
  getSnapshot=()=>this.session;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>{this.listeners.delete(fn);};};
  private save(value:AuthSession|null){this.session=value;try{if(value)this.disk?.setItem(key,JSON.stringify(value));else this.disk?.removeItem(key);}catch{}this.listeners.forEach(fn=>fn());}
  private normalise(value:AuthSession|null){return value?{...value,expires_at:value.expires_at??Math.floor(this.now()/1000)+(value.expires_in??3600)}:null;}
  private async request<T>(path:string,body?:unknown,token?:string):Promise<T>{
    const response=await this.fetcher('/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await response.json().catch(()=>null);if(!response.ok)throw new ApiError(response.status,data?.detail??'Account request failed.');return data as T;
  }
  getAccessToken=async():Promise<string|null>=>{
    if(!this.session)return null;
    if(this.session.expires_at>this.now()/1000+60)return this.session.access_token;
    if(this.refreshing)return this.refreshing;
    const generation=this.generation;const refresh_token=this.session.refresh_token;
    this.refreshing=(async()=>{
      try{const result=await this.request<{session:AuthSession}>('token',{grant_type:'refresh_token',refresh_token});
        if(generation!==this.generation)return null;if(!result.session)throw new ApiError(401,'Sign in again.');this.save(this.normalise(result.session));return this.session!.access_token;
      }catch(error){if(generation===this.generation&&error instanceof ApiError&&[400,401,403].includes(error.status))this.save(null);throw error;}
      finally{if(generation===this.generation)this.refreshing=undefined;}
    })();return this.refreshing;
  };
  async signUp(name:string,email:string,password:string){
    const generation=++this.generation;this.refreshing=undefined;
    const result=await this.request<{session:AuthSession|null}>('signup',{name,email,password});
    if(generation!==this.generation)return null;this.save(this.normalise(result.session));return this.session;
  }
  async signIn(email:string,password:string){
    const generation=++this.generation;this.refreshing=undefined;
    const result=await this.request<{session:AuthSession}>('token',{grant_type:'password',email,password});
    if(!result.session)throw new ApiError(401,'Sign in again.');if(generation!==this.generation)throw new Error('Account changed.');this.save(this.normalise(result.session));return this.session!;
  }
  /** Takes over a session issued by the standalone demo server, so a presenter never types a login. */
  adopt(session:AuthSession){this.generation++;this.save(this.normalise(session));}
  /** Keeps the signed-in session’s display name in step with a saved profile change. */
  rename(name:string){if(!this.session)return;this.save({...this.session,user:{...this.session.user,user_metadata:{...this.session.user.user_metadata,name}}});}
  async signOut(){const token=this.session?.access_token;++this.generation;this.refreshing=undefined;this.save(null);if(token)await this.request('logout',undefined,token);}
}
