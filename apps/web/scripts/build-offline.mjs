import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../dist',import.meta.url)));
const paths=[];
// Cache runtime assets, including local model/voice, but omit review images
// and unused classic WASM variants to limit the phone's offline download.
async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const full=resolve(directory,entry.name);const path='/'+relative(root,full).replaceAll('\\','/');if(path.startsWith('/review/'))continue;if(entry.isDirectory())await walk(full);else if(!path.endsWith('/sw.js') && !path.endsWith('.md') && (!path.startsWith('/eyewatch/wasm/') || path.includes('_module_')))paths.push(path);}}
await walk(root);
const hash=createHash('sha256');for(const path of paths.sort()){hash.update(path);hash.update(await readFile(root+path));}
// Content changes create a new cache. Installation completes only after the
// entire manifest is available, keeping offline launches on a coherent build.
const name='dormathon-'+hash.digest('hex').slice(0,16);
await writeFile(root+'/sw.js',`const CACHE=${JSON.stringify(name)},FILES=${JSON.stringify(paths)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dormathon-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
if(!FILES.includes(url.pathname))return;event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(request)));});
`);
console.log('Offline app/model cache manifest:',paths.length,'files,',name);
