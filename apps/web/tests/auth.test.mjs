import test from 'node:test';
import assert from 'node:assert/strict';

const { AuthClient } = await import('../src/integration/auth.ts').catch(() => ({}));
const storage = () => {const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const session = (token, expires=100) => ({access_token:token,refresh_token:'refresh-'+token,expires_at:expires,user:{id:'owner',user_metadata:{name:'Aaron'}}});

test('concurrent API requests refresh an expired session once and use the rotated token', async () => {
  assert.ok(AuthClient, 'AuthClient implementation is missing');
  let count=0; const disk=storage();disk.setItem('buckl.session.v1',JSON.stringify(session('old')));
  const auth=new AuthClient({storage:disk,now:()=>200000,fetcher:async (url,init)=>{
    count++;assert.equal(url,'/api/auth/token');assert.deepEqual(JSON.parse(init.body),{grant_type:'refresh_token',refresh_token:'refresh-old'});
    await new Promise(r=>setTimeout(r,10));return Response.json({session:session('new',3600)});
  }});
  assert.deepEqual(await Promise.all([auth.getAccessToken(),auth.getAccessToken()]),['new','new']);assert.equal(count,1);
  assert.equal(JSON.parse(disk.getItem('buckl.session.v1')).access_token,'new');
});

test('confirmation-required signup does not invent a session or store credentials', async () => {
  assert.ok(AuthClient, 'AuthClient implementation is missing');
  const disk=storage();const auth=new AuthClient({storage:disk,fetcher:async()=>Response.json({session:null,confirmation_required:true})});
  assert.equal(await auth.signUp('Aaron','a@example.com','private-password'),null);
  assert.equal(auth.getSnapshot(),null);assert.equal(disk.getItem('buckl.session.v1'),null);
});

test('invalid refresh clears the session while a temporary network failure retains it for retry', async () => {
  assert.ok(AuthClient, 'AuthClient implementation is missing');
  for(const rejected of [false,true]){
    const disk=storage();disk.setItem('buckl.session.v1',JSON.stringify(session('old')));
    const auth=new AuthClient({storage:disk,now:()=>200000,fetcher:async()=>{if(!rejected)throw new TypeError('offline');return Response.json({detail:'Invalid refresh token'},{status:400});}});
    await assert.rejects(auth.getAccessToken());assert.equal(auth.getSnapshot()===null,rejected);
  }
});

test('signing out during refresh cannot resurrect the previous account', async () => {
  assert.ok(AuthClient, 'AuthClient implementation is missing');
  const disk=storage();disk.setItem('buckl.session.v1',JSON.stringify(session('old')));let release;
  const auth=new AuthClient({storage:disk,now:()=>200000,fetcher:async url=>url.endsWith('logout')?new Response(null,{status:204}):await new Promise(r=>release=()=>r(Response.json({session:session('late',3600)})))});
  const pending=auth.getAccessToken();await auth.signOut();release();
  assert.equal(await pending,null);assert.equal(auth.getSnapshot(),null);assert.equal(disk.getItem('buckl.session.v1'),null);
});

test('renaming updates the signed-in name and is saved with the session', () => {
  const values = new Map(); const disk = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  values.set('buckl.session.v1', JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: 9999999999, user: { id: 'u1', email: 'x@example.test', user_metadata: { name: 'Old' } } }));
  const auth = new AuthClient({ storage: disk, fetcher: async () => Response.json({}) }); let notified = 0; auth.subscribe(() => notified++);
  auth.rename('Aiman');
  assert.equal(auth.getSnapshot().user.user_metadata.name, 'Aiman');
  assert.equal(JSON.parse(values.get('buckl.session.v1')).user.user_metadata.name, 'Aiman');
  assert.equal(notified, 1);
  const empty = new AuthClient({ storage: { getItem: () => null, setItem() {}, removeItem() {} }, fetcher: async () => Response.json({}) });
  assert.doesNotThrow(() => empty.rename('Nobody'));
});
