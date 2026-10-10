import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Dependency-free Chromium review against a loopback build preview.
// The separate Vite server remains HTTPS for phone review.
const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const artifactRoot = resolve(appRoot, '../../docs/review');
await mkdir(artifactRoot, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.txt': 'text/plain', '.wasm':'application/wasm', '.task':'application/octet-stream', '.wav':'audio/wav' };
let fixtureConfigFailure=false;
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if((process.argv.includes('--home')||process.argv.includes('--current-drive'))&&pathname==='/api/auth/config'){response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({configured:false}));return;}
  if(process.argv.includes('--home')&&['/review/home-comparison.html','/review/home-figma.png','/review/home-current.png'].includes(pathname)){
    const filename=join(artifactRoot,pathname.split('/').at(-1));const bytes=await readFile(filename);response.writeHead(200,{'Content-Type':mime[extname(filename)]});response.end(bytes);return;
  }
  if(process.argv.includes('--integration')&&pathname.startsWith('/api/')){
    // Isolated HTTP fixtures: no database, credentials, geocoding or messages.
    let body='';for await(const chunk of request)body+=chunk;
    const input=body?JSON.parse(body):{};const first=(request.headers.authorization??'').includes('fixture-first');
    const car={id:'car-one',user_id:'first',make:'Perodua',model:'Myvi',year:2022,plate:'BUCKL 1'};
    const trip={id:'trip-one',car_id:car.id,user_id:'first',started_at:'2026-10-10T00:00:00Z',ended_at:'2026-10-10T00:10:00Z',distance_km:2.2,safety_score:92,passenger_mode:false,route_choice:'safer'};
    let value;
    if(pathname==='/api/auth/config'){if(fixtureConfigFailure){response.writeHead(503);response.end();return;}value={configured:true};}
    else if(pathname==='/api/auth/token'){const user=input.email==='first@example.test'?'first':'second';value={session:{access_token:'fixture-'+user,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:user,email:input.email,user_metadata:{name:user==='first'?'BUCKL Driver':'New Driver'}}}};}
    else if(pathname==='/api/auth/logout'){response.writeHead(204);response.end();return;}
    else if(pathname==='/api/cars')value=first?[car]:[];
    else if(pathname==='/api/cars/car-one/report'&&first)value={car_id:car.id,dashboard:null,startup:{id:'startup-one',crank_seconds:3,verdict:'Battery may be weak',urgency:'soon',urgency_label:'Book service soon',stub:true},brakes:{hard_stops_per_week:[],trend_per_week:0,urgency:'monitor',urgency_label:'Monitor',verdict:'No brake trend yet',score_source:'demo_rule'}};
    else if(pathname==='/api/trips')value=first?[trip]:[];
    else if(pathname==='/api/emergency-contacts')value=[];
    else if(pathname==='/api/patterns')value={slots:[{from_hour:12,tired_alerts:2}],late_night_share:0};
    else if(pathname==='/api/trips/trip-one/summary'&&first)value={trip_id:trip.id,passenger_mode:false,distance_km:2.2,duration_seconds:600,avg_speed_kmh:30,route_polyline:[[3,101.6],[3,101.61],[3,101.62]],events:[],hard_brake_count:2,safety_score:92,score_source:'demo_rule',trip_risk_lines:['2 hard brakes'],score_explanation:'Demo rule, not a model output.'};
    else {response.writeHead(404,{'Content-Type':'application/json'});response.end(JSON.stringify({detail:'Not in browser fixture'}));return;}
    response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(value));return;
  }
  const candidate = resolve(appRoot, 'dist', '.' + pathname);
  if (!candidate.startsWith(resolve(appRoot, 'dist') + '\\') && !candidate.startsWith(resolve(appRoot, 'dist') + '/')) {
    response.writeHead(400); response.end(); return;
  }
  const filename = extname(pathname) ? candidate : resolve(appRoot, 'dist/index.html');
  try { let bytes = await readFile(filename); if(process.argv.includes('--eyes-cpu')&&pathname.includes('model.worker-')){const source=bytes.toString();const altered=source.replace(/try\{[\w$]+=await [\w$]+\.createFromOptions\([\w$]+,[\w$]+\)\}catch/, 'try{self.ModuleFactory=undefined;throw new Error("Simulated GPU init failure")}catch');if(altered===source)throw new Error('CPU fallback fixture could not locate GPU init');bytes=Buffer.from(altered);} response.writeHead(200, { 'Content-Type': mime[extname(filename)] ?? 'application/octet-stream' }); response.end(bytes); }
  catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const candidates = [process.env.DORMATHON_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
let executable;
for (const candidate of candidates) { try { await access(candidate); executable = candidate; break; } catch {} }
if (!executable) { server.close(); throw new Error('Set DORMATHON_CHROME to a Chromium executable'); }
const profile = await mkdtemp(join(tmpdir(), 'dormathon-review-'));
const browser = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', ...((process.argv.includes('--car-camera')||process.argv.includes('--eyes')||process.argv.includes('--motion'))?['--use-fake-device-for-media-stream']:[]), 'about:blank'], { windowsHide: true });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chromium did not expose a debugging endpoint')), 15000);
    browser.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    browser.on('error', error => { clearTimeout(timer); reject(error); });
  });
  const debugOrigin = new URL(endpoint).origin.replace('ws:', 'http:');
  const protocol = await (await fetch(`${debugOrigin}/json/protocol`)).json();
  const target = await (await fetch(`${debugOrigin}/json/new?${encodeURIComponent(origin + '/components')}`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const runtimeErrors = [];
  const networkErrors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const item = pending.get(message.id); if (!item) return; clearTimeout(item.timer); pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
    if (message.method === 'Network.loadingFailed') networkErrors.push(message.params.errorText);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture:true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    const deadline = Date.now() + (process.argv.includes('--eyes')?45000:10000);
    while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); }
    const state=await evaluate("({path:location.pathname,text:document.body.innerText,camera:[...document.querySelectorAll('video')].map(v=>({width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,paused:v.paused})),streams:window.__reviewStreams?.map(s=>({active:s.active,tracks:s.getTracks().map(t=>t.readyState)}))})");
    throw new Error(`Condition not met: ${expression}\n${JSON.stringify({state,runtimeErrors,networkErrors})}`);
  };
  const settle = async () => evaluate("new Promise(resolve => setTimeout(() => document.fonts.ready.then(() => resolve(true)), 650))");
  const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
  const navigate = async path => {
    await send('Page.navigate', { url: origin + path });
    await until(path.startsWith('/review/') ? "document.querySelector('#live-toggle')" : "document.querySelector('#root')?.children.length > 0 && !document.querySelector('vite-error-overlay')");
    await settle();
  };
  const screenshot = async (filename, clip) => { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); await writeFile(join(artifactRoot, filename), Buffer.from(result.data, 'base64')); };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (process.argv.includes('--current-drive')) {
    const captured=[];
    const capture=async(name,path)=>{if(path)await navigate(path);await settle();await viewport(430,932);const state=await evaluate("({path:location.pathname,text:document.body.innerText,width:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),geometry:Object.fromEntries(['.readiness-result__icon','.readiness-chip','.drive-heading','.readiness-findings','.readiness-plan','.reading-ring','.reading-checks','.tap-test-progress','.tap-test-area','.readiness-loading__card','.passenger-icon','.passenger-why','.no-response-ring','.contact-alert-icon','.contact-alert-location','.summary-route','.summary-trip-stats','.summary-risk','.summary-chart','.drive-gauge','.drive-trip-stats','.drive-waze-card','.seatbelt-check','.app-frame__footer'].map(s=>{const e=document.querySelector(s);if(!e)return [s,null];const r=e.getBoundingClientRect();return [s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))})");assert.equal(state.width,430,name+' overflow');assert.deepEqual(state.broken,[],name+' broken images');captured.push({name,...state});await screenshot('drive-current-'+name+'.png',{x:0,y:0,width:430,height:932});};
    for(const [name,path] of [['home','/drive/home'],['before','/drive/before-you-drive'],['mount','/drive/mount-your-phone'],['lineup','/drive/line-up-your-face'],['quick','/drive/quick-eye-check'],['driving','/drive/driving'],['lost','/drive/cant-see-your-eyes'],['tired','/drive/getting-tired'],['alarm','/drive/microsleep-alarm'],['maps','/drive/waze-open-still-watching'],['tired-maps','/drive/tired-while-waze-is-open']])await capture(name,path);
    for(const [name,label] of [['safe','Safe to drive'],['caution','Caution'],['high','High risk'],['face','Face reading'],['tap','Tap test'],['working','Working out your result'],['route','Pick your route'],['passenger','Passenger mode'],['countdown','No response countdown'],['contact','Contact alerted'],['receipt','What Mum receives'],['summary','Trip summary']]){await navigate('/drive/home');await evaluate("(()=>{const b=document.querySelector('[aria-label=\"BUCKL logo\"]');b.click();b.click();b.click();})()");await until("document.querySelector('.drive-demo[open]')");await evaluate('[...document.querySelectorAll(".drive-demo button")].find(b=>b.textContent==='+JSON.stringify(label)+').click()');await capture(name);}
    await writeFile(join(artifactRoot,'drive-current-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),captured,runtimeErrors,networkErrors},null,2));assert.deepEqual(runtimeErrors,[]);console.log('Captured '+captured.length+' current Drive states.');
  } else if (process.argv.includes('--current-driving')) {
    await viewport(430,932);await navigate('/drive/driving');
    assert.equal(await evaluate("document.querySelectorAll('.drive-trip-bar').length"),1);
    assert.equal(await evaluate("document.querySelectorAll('.drive-trip-stats > div').length"),3);
    assert.equal(await evaluate("document.querySelector('.speed-stat')"),null);
    const gauge=await evaluate("document.querySelector('.drive-gauge').getBoundingClientRect().y");
    assert.ok(Math.abs(gauge-110)<=2,'Gauge should begin at y=110: '+gauge);
    await screenshot('driving-current.png',{x:0,y:0,width:430,height:932});
    for(const width of [390,360]){await viewport(width,844);await navigate('/drive/driving');assert.equal(await evaluate('document.documentElement.scrollWidth'),width);}
    assert.deepEqual(runtimeErrors,[]);console.log('Current Driving layout checks passed.');
  } else if (process.argv.includes('--home')) {
    await viewport(430,932); await navigate('/drive/home');
    await screenshot('home-current.png',{x:0,y:0,width:430,height:932});
    const text=await evaluate('document.body.innerText');
    assert.ok(text.includes('Stay awake on the road'));
    assert.ok(text.includes('Weak battery · brakes due for a check'));
    assert.ok(text.includes('PJ → UM'));
    assert.ok(!text.includes('database configuration'));
    const geometry=await evaluate(`Object.fromEntries(['.drive-home__top','.drive-car-hero','.drive-home__pitch','.drive-home-attention','.drive-recent','.drive-recent__card','.tab-bar'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))`);
    const expected={'.drive-home__top':[20,66,390,40.8],'.drive-car-hero':[20,126.8,390,199],'.drive-home__pitch':[20,345.8,390,192],'.drive-home-attention':[20,557.8,390,74],'.drive-recent':[20,651.8,390,113],'.drive-recent__card':[20,690.8,390,74],'.tab-bar':[85,832,260,66]};
    for(const [selector,bounds] of Object.entries(expected))for(const [index,key] of ['x','y','width','height'].entries())assert.ok(Math.abs(geometry[selector][key]-bounds[index])<=2,selector+' '+key+': '+geometry[selector][key]);
    for(const width of [390,360]){await viewport(width,844);await navigate('/drive/home');const layout=await evaluate("({width:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)})");assert.equal(layout.width,width);assert.deepEqual(layout.broken,[]);await screenshot('home-'+width+'.png',{x:0,y:0,width,height:844});}
    await viewport(430,932);await navigate('/drive/home');await evaluate("document.querySelector('.drive-start-button').click()");await settle();assert.equal(await evaluate('location.pathname'),'/onboarding/welcome');
    assert.deepEqual(runtimeErrors,[]);await writeFile(join(artifactRoot,'home-fidelity-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),figmaNode:'28:2',geometry,checkedWidths:[430,390,360],previewStartRoutesToSetup:true,runtimeErrors},null,2));
    await writeFile(join(artifactRoot,'home-figma.png'),await readFile(join(appRoot,'design/home-current-reference.png')));
    await writeFile(join(artifactRoot,'home-comparison.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><title>BUCKL Home comparison</title><style>body{margin:0;padding:24px;font:16px system-ui;background:#e8eaed;color:#282828}main{display:flex;gap:24px}figure{margin:0}figcaption{margin:0 0 12px}img{display:block;width:430px;height:932px}</style><main><figure><figcaption>Figma · 01 Home · 28:2</figcaption><img src="home-figma.png" alt="Current Figma Home frame"></figure><figure><figcaption>Running app · 430 × 932</figcaption><img src="home-current.png" alt="Browser screenshot of the corrected Home screen"></figure></main></html>');
    await viewport(932,1020);await send('Page.navigate',{url:origin+'/review/home-comparison.html'});await until("document.images.length===2&&[...document.images].every(i=>i.complete&&i.naturalWidth)");await screenshot('home-side-by-side.png',{x:0,y:0,width:932,height:1020});console.log('Home fidelity checks passed.');
  } else if (process.argv.includes('--integration')) {
    await viewport(430,932);
    const click=async label=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);await settle();};
    const fill=async (selector,value)=>evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const login=async email=>{await navigate('/onboarding/sign-up?mode=signin');await fill('input[type=email]',email);await fill('input[type=password]','fixture-password');await click('Sign in');await until("location.pathname==='/drive/home'||location.pathname==='/onboarding/whats-your-car'");await settle();};
    await navigate('/drive/home');assert.ok((await evaluate('document.body.innerText')).includes('Set up your car'));assert.ok(!(await evaluate('document.body.innerText')).includes('PJ → UM'));
    fixtureConfigFailure=true;await navigate('/drive/home');await until("document.body.innerText.includes('Couldn’t load account settings')");assert.ok(!(await evaluate('document.body.innerText')).includes('PJ → UM'));fixtureConfigFailure=false;
    await login('first@example.test');await until("document.body.innerText.includes('2.2 km trip')&&document.body.innerText.includes('Battery may be weak')");assert.ok(!(await evaluate('document.body.innerText')).includes('PJ → UM'));await screenshot('home-authenticated.png',{x:0,y:0,width:430,height:932});
    await evaluate("document.querySelector('.drive-home-attention').click()");await settle();await until("document.body.innerText.includes('Battery may be weak')");assert.ok(!(await evaluate('document.body.innerText')).includes('Scratch on rear bumper'));await screenshot('home-authenticated-report.png',{x:0,y:0,width:430,height:932});
    await navigate('/profile');assert.ok((await evaluate('document.body.innerText')).includes('first@example.test'));
    await navigate('/trips');await until("document.querySelector('.trips-row')");await evaluate("document.querySelector('.trips-row').click()");await settle();await until("document.body.innerText.includes('92 / 100')");
    assert.ok((await evaluate('document.body.innerText')).includes('Demo rule'));assert.ok(await evaluate("document.querySelector('svg[aria-label=\"Recorded trip route\"]')!==null"));await screenshot('integration-trip-summary.png');
    await navigate('/drive/before-you-drive');await evaluate("document.querySelector('.readiness-question button').click()");assert.equal(await evaluate("document.querySelector('.readiness-question button').getAttribute('aria-pressed')"),'true');
    await navigate('/drive/line-up-your-face');assert.equal(await evaluate("document.querySelector('.app-frame__footer button').disabled"),true);
    await navigate('/profile');await click('Sign out');await until("location.pathname==='/onboarding/welcome'");assert.equal(await evaluate("sessionStorage.getItem('buckl.session.v1')"),null);
    await login('second@example.test');assert.equal(await evaluate('location.pathname'),'/onboarding/whats-your-car');await navigate('/drive/home');assert.ok(!(await evaluate('document.body.innerText')).includes('BUCKL 1'));await navigate('/trips');await until("document.body.innerText.includes('Your first trip starts here')");assert.equal(await evaluate("document.querySelectorAll('.trips-row').length"),0);await screenshot('integration-trips-empty.png');
    const pages=['/drive/home','/drive/check-result','/drive/pick-your-route','/profile/emergency-contact','/profile/my-cars','/profile/add-a-car','/profile/driving-stats','/profile/privacy-and-legal','/trips/when-you-get-tired','/onboarding/emergency-contact','/onboarding/allow-access'];
    const geometry=[];for(const width of [430,390,360]){await viewport(width,932);for(const path of pages){await navigate(path);const dimensions=await evaluate("({width:document.documentElement.scrollWidth,viewport:innerWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)})");assert.equal(dimensions.width,width,path+' overflows');assert.deepEqual(dimensions.broken,[],path+' has broken assets');geometry.push({path,...dimensions});}}
    assert.deepEqual(runtimeErrors,[]);await writeFile(join(artifactRoot,'integration-browser-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),mode:'isolated fake HTTP; no external services',passed:['sign in through account form','authenticated car/history/profile','trip summary and demo-rule disclosure','readiness selection','seatbelt/camera gate','sign out clears session','second account has empty history','430/390/360px pages and assets','no runtime exceptions'],geometry},null,2));console.log('Integration browser checks passed.');
  } else if (process.argv.includes('--api-docs')) {
    await viewport(1100,1000);
    await send('Page.navigate',{url:'http://127.0.0.1:8000/docs'});
    await until("document.querySelector('.swagger-ui .opblock')");
    assert.ok((await evaluate("document.querySelector('.swagger-ui .info .title').textContent")).includes('BUCKL API'));
    const schema=await evaluate("fetch('openapi.json').then(r=>r.json())");
    assert.equal(schema.info.version,'0.4c');
    assert.equal(schema.servers[0].url,'.');
    assert.ok(schema.paths['/trips/{trip_id}/summary'] && schema.paths['/route-options']);
    assert.ok(schema.paths['/trips/{trip_id}/emergency'].post.parameters.some(p=>p.name==='idempotency-key'&&p.required));
    assert.deepEqual(runtimeErrors,[]);
    await screenshot('catch-up-api-docs.png',{x:0,y:0,width:1100,height:1000});
    console.log('API docs browser check passed: Swagger loaded, relative OpenAPI/server paths and emergency episode header.');
  } else if (process.argv.includes('--motion')) {
    await send('Browser.grantPermissions', { origin, permissions: ['audioCapture'] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.__motionStreams=[];window.__motionAudioCloses=0;window.__motionSamples=0;
      const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia=async options=>{const stream=await get(options);window.__motionStreams.push(stream);return stream;};
      const close=AudioContext.prototype.close;AudioContext.prototype.close=function(){window.__motionAudioCloses++;return close.call(this);};
      const sample=AnalyserNode.prototype.getFloatTimeDomainData;AnalyserNode.prototype.getFloatTimeDomainData=function(data){sample.call(this,data);window.__motionSamples++;if(window.__testMicrophoneLevel!==undefined)data.fill(window.__testMicrophoneLevel);};
    ` });
    const pause = ms => evaluate(`new Promise(resolve=>setTimeout(()=>resolve(true),${ms}))`);
    const click = label => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    await viewport(430, 932); await navigate('/components');
    assert.equal(await evaluate('document.querySelectorAll("#buttons .button").length'), 10);
    assert.equal(await evaluate('document.querySelectorAll("#buttons [data-button-state=Pressed]").length'), 5);
    const dimensions = await evaluate(`['.button','.icon-button','.tab-bar','.motion-ring--scan','.motion-ring--countdown','.waveform','.tap-dot'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [selector,r.width,r.height]})`);
    assert.deepEqual(dimensions, [['.button',390,56],['.icon-button',40,40],['.tab-bar',260,66],['.motion-ring--scan',300,300],['.motion-ring--countdown',160,160],['.waveform',330,48],['.tap-dot',150,150]]);
    const pressedFills = await evaluate(`[...document.querySelectorAll('#buttons [data-button-state=Pressed]')].map(e=>getComputedStyle(e).backgroundColor)`);
    assert.deepEqual(pressedFills, ['rgb(16, 28, 56)','rgb(242, 243, 245)','rgb(233, 236, 242)','rgb(242, 243, 245)','rgb(12, 20, 36)']);
    await evaluate("document.querySelector('#buttons .button').scrollIntoView({block:'center'})"); await pause(300);
    const point = await evaluate("(()=>{const r=document.querySelector('#buttons .button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});
    await until("getComputedStyle(document.querySelector('#buttons .button')).backgroundColor==='rgb(16, 28, 56)'");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#buttons .button')).backgroundColor"), pressedFills[0]);
    assert.ok((await evaluate("document.querySelector('#buttons .button').getBoundingClientRect().width")) < 390);
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...point}); await pause(180);
    assert.equal(await evaluate("document.querySelector('#buttons .button').getBoundingClientRect().width"), 390);
    await evaluate("document.querySelector('#motion').scrollIntoView()");
    const dots = [];
    for(let i=0;i<10;i++){dots.push(await evaluate("[...document.querySelectorAll('.loading-dots:first-of-type > span')].map(e=>getComputedStyle(e).transform).join('|')"));await pause(100);}
    assert.ok(new Set(dots).size > 2, 'LoadingDots must visibly traverse a complete loop');
    await click('Replay progress'); await pause(400);
    const partial = await evaluate("new DOMMatrix(getComputedStyle(document.querySelector('.motion-progress > span')).transform).a");
    assert.ok(partial > .05 && partial < 1);
    await pause(2000); assert.equal(await evaluate("new DOMMatrix(getComputedStyle(document.querySelector('.motion-progress > span')).transform).a"), 1);
    await click('Start countdown'); await pause(1200); assert.equal(await evaluate("document.querySelector('.motion-countdown-number').textContent"), '7'); await click('Cancel countdown');
    await click('Show tap dot'); await pause(200); assert.equal(await evaluate("document.querySelector('.tap-dot button').disabled"), false);
    await evaluate("document.querySelector('.tap-dot button').click()"); assert.ok((await evaluate("document.querySelector('[data-tap-result]').textContent")).startsWith('Tapped in '));
    await click('Show tap dot'); await pause(1100); assert.equal(await evaluate("document.querySelector('.tap-dot button').disabled"), true);
    assert.equal(await evaluate("document.querySelector('[data-tap-result]').textContent"), 'Dot expired');
    await evaluate("document.querySelector('.motion-alarm-sample').scrollIntoView({block:'center'})");
    const flash = [];for(let i=0;i<40;i++){flash.push(await evaluate("Number(getComputedStyle(document.querySelector('.alarm-flash')).opacity)"));await pause(40);}
    assert.ok(Math.max(...flash) > .15 && Math.max(...flash) <= .18001 && Math.min(...flash) < .03, `Alarm opacity samples: ${JSON.stringify(flash)}`);
    await click('Start microphone preview'); await until("document.querySelector('.waveform').dataset.waveformSource==='microphone'");
    await evaluate('window.__testMicrophoneLevel=0'); await pause(200);
    assert.equal(await evaluate("document.querySelector('.waveform > span').getBoundingClientRect().height"), 6);
    await evaluate('window.__testMicrophoneLevel=.25'); await pause(200);
    assert.ok((await evaluate("document.querySelector('.waveform > span').getBoundingClientRect().height")) > 6);
    await click('Stop microphone preview'); await until("window.__motionStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    assert.ok(await evaluate('window.__motionSamples>0 && window.__motionAudioCloses>0'));
    assert.equal(await evaluate("document.querySelector('.waveform').dataset.waveformSource"), 'fallback');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(300);
    const still = await evaluate("getComputedStyle(document.querySelector('.scan-line__sweep')).transform");await pause(500);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.scan-line__sweep')).transform"),still);
    await click('Show tap dot');await pause(200);assert.equal(await evaluate("getComputedStyle(document.querySelector('.tap-dot button')).transform"),'none');
    await send('Emulation.setEmulatedMedia',{features:[]});await pause(300);
    await evaluate("document.querySelector('#motion').scrollIntoView()");
    const clip=await evaluate("(()=>{const r=document.querySelector('#motion').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
    await screenshot('catch-up-motion-gallery.png',clip);
    for(const width of [390,360]){await viewport(width,844);assert.equal(await evaluate('document.documentElement.scrollWidth'),width);}
    await viewport(430,932);await click('Start microphone preview');await until("document.querySelector('.waveform').dataset.waveformSource==='microphone'");
    await click('Push · 0.45 s');await until("location.pathname==='/components/preview/push'");
    await until("window.__motionStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    await navigate('/components');
    await evaluate("window.__originalCapture=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError')}");
    await click('Start microphone preview');await until("document.querySelector('[data-microphone-status]').textContent.includes('unavailable')");
    assert.equal(await evaluate("document.querySelector('.waveform').dataset.waveformSource"),'fallback');
    await evaluate("navigator.mediaDevices.getUserMedia=async options=>{const stream=await window.__originalCapture(options);return new Promise(resolve=>window.__releaseCapture=()=>resolve(stream))}");
    await click('Start microphone preview');await until('window.__releaseCapture');
    await click('Push · 0.45 s');await until("location.pathname==='/components/preview/push'");
    await evaluate('window.__releaseCapture()');
    await until("window.__motionStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    await navigate('/components/canvas');
    assert.equal(await evaluate('document.querySelectorAll(".canvas-buttons .button").length'),10);
    assert.deepEqual(runtimeErrors,[]);
    await writeFile(join(artifactRoot,'catch-up-motion-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),dimensions,pressedFills,passed:['10 button variants and held/released state','loading loop and 2.2 s progress','seconds-driven countdown','tap response and expiry','alarm flash bounds','real microphone analysis with silence/loud input','stream/context cleanup on stop and navigation','permission denial uses fallback','late microphone permission releases stream after navigation','reduced-motion movement replaced by fades','360/390/430 px widths','no runtime errors']},null,2));
    console.log('Motion browser checks passed: button states, timing, props, microphone analysis and cleanup, reduced motion, phone widths.');
  } else
  if(process.argv.includes('--eyes')) {
    await send('Browser.grantPermissions',{origin,permissions:['videoCapture']});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`
      window.__eyeStreams=[];const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia=async options=>{const stream=await get(options);window.__eyeStreams.push(stream);for(const track of stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{(window.__eyeTrackStops??=[]).push(new Error().stack);stop();};}return stream;};
      navigator.geolocation.watchPosition=()=>77;navigator.geolocation.clearWatch=()=>{window.__gpsCleared=true;};
    `});
    await viewport(430,932);await navigate('/test-eyes');
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Start eye watch').click()");
    await until("document.body.innerText.includes('Eye watch: lost') || document.body.innerText.includes('Eye watch unavailable')");
    const result=await evaluate("({text:document.body.innerText,worker:performance.getEntriesByType('resource').map(r=>r.name),tracks:window.__eyeStreams.map(s=>s.getTracks().map(t=>t.readyState)),stops:window.__eyeTrackStops})");
    console.log(JSON.stringify(result));
    assert.ok(result.text.includes('Eye watch: lost'),'Real local model must initialise and detect absent face');
    await until("[...document.querySelectorAll('dt')].find(e=>e.textContent==='FPS')?.nextElementSibling?.textContent !== '0.0'");
    await screenshot('eye-watch-real-model.png');
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Stop eye watch').click()");
    await until("window.__eyeStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    assert.equal(await evaluate('window.__gpsCleared'),true);
    assert.deepEqual(runtimeErrors,[]);
    console.log('Eye watch real model start/lost/stop passed.');
    if(process.argv.includes('--eyes-cpu'))assert.ok(result.text.includes('Model\nCPU'),'GPU failure must boot real CPU model');
    else {
    await until("navigator.serviceWorker.controller");
    await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await navigate('/test-eyes');
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Start eye watch').click()");
    await until("document.body.innerText.includes('Eye watch: lost')");
    await until("Number([...document.querySelectorAll('dt')].find(e=>e.textContent==='FPS')?.nextElementSibling?.textContent)>0");
    assert.ok((await evaluate('document.body.innerText')).includes('Offline voice files ready'));
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Stop eye watch').click()");
    await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    console.log('Offline reload, real local GPU inference and voice files passed.');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`
      window.__eyeSignal={eyeClosed:.1,jawOpen:0,faceVisible:true,eyesVisible:true,goodDistance:true};window.__oscillators=0;window.__oscillatorStops=0;window.__workerStops=0;window.__wakeReleases=0;
      const nativeWorker=window.Worker;
      window.Worker=class {constructor(url,options){if(!String(url).includes('model.worker'))return new nativeWorker(url,options);}postMessage(data){if(data.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready',delegate:'GPU fixture'}}));if(data.type==='frame'){data.bitmap.close();queueMicrotask(()=>{window.__lastEyeSignal={...window.__eyeSignal};this.onmessage?.({data:window.__workerFault?{type:'error',message:'Synthetic worker fault'}:{type:'signal',t:data.t,...window.__eyeSignal}});});}}terminate(){window.__workerStops++;}};
      const oscillator=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){const node=oscillator.call(this);const start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...a)=>{window.__oscillators++;return start(...a);};node.stop=(...a)=>{window.__oscillatorStops++;return stop(...a);};return node;};
      Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{const lock=new EventTarget();lock.released=false;lock.release=async()=>{lock.released=true;window.__wakeReleases++;lock.dispatchEvent(new Event('release'));};return lock;}}});
    `});
    await navigate('/test-eyes');
    const click=async label=>evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    const pause=async ms=>evaluate(`new Promise(r=>setTimeout(()=>r(true),${ms}))`);
    const signal=async values=>evaluate(`Object.assign(window.__eyeSignal,${JSON.stringify(values)})`);
    await click('Start eye watch');await until("document.body.innerText.includes('Eye watch: alert')");
    await click('Calibrate eyes');await until("document.body.innerText.includes('Blink twice: 0 / 2')");
    for(let i=0;i<2;i++){await signal({eyeClosed:.9});await pause(250);await signal({eyeClosed:.1});await pause(250);}
    await until("document.body.innerText.includes('Eye check saved')");await click('Resume test');
    await signal({eyeClosed:.9});await until("document.querySelector('[data-eye-state]').textContent==='microsleep'");
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>b.textContent==="I'm awake")`),false,'Stationary closure must not alarm');
    assert.equal(await evaluate('window.__oscillators'),0);
    await signal({eyeClosed:.1});await pause(200);
    await evaluate(`for(let i=0;i<3;i++)document.querySelector('button[aria-label="Dormathon logo"]').click()`);
    await until("document.querySelector('dialog[open]')");
    await evaluate("document.querySelector('dialog input[type=checkbox]').click()");
    await evaluate("document.querySelector('dialog button[aria-label=Close]').click()");
    await click('Use Drive screens');await until("location.pathname==='/drive/driving'");
    await signal({faceVisible:false});await until("location.pathname==='/drive/cant-see-your-eyes'");
    await signal({faceVisible:true});await until("location.pathname==='/drive/driving'");
    for(let i=0;i<3;i++){await signal({jawOpen:.9});await pause(1750);await signal({jawOpen:0});await pause(150);}
    await until("location.pathname==='/drive/getting-tired'");await click('Remind me in 10 min');await until("location.pathname==='/drive/driving'");
    await signal({eyeClosed:.9});await until("location.pathname==='/drive/microsleep-alarm'");
    assert.equal(await evaluate('window.__oscillators'),1);
    await signal({eyeClosed:.1});await until('window.__lastEyeSignal?.eyeClosed===.1');await pause(100);assert.equal(await evaluate('window.__oscillatorStops'),0,'Alarm stays latched after eyes reopen');
    await click("I'm awake");await until("location.pathname==='/drive/driving'");assert.equal(await evaluate('window.__oscillatorStops'),1);
    await signal({eyeClosed:.9});await until("location.pathname==='/drive/microsleep-alarm'");await click("I'm awake");await pause(1700);assert.equal(await evaluate('window.__oscillators'),2,'Acknowledgement waits for reopening');
    await signal({eyeClosed:.1});await until("window.__lastEyeSignal?.eyeClosed===.1 && document.querySelector('.drive-gauge__title')?.textContent!=='Eyes closed'");await signal({eyeClosed:.9});await until("location.pathname==='/drive/microsleep-alarm'");
    await evaluate('window.__workerFault=true');await pause(200);assert.equal(await evaluate('window.__oscillatorStops'),2,'Worker failure must keep alarm sounding');
    await click("I'm awake");await until("location.pathname==='/drive/driving'");assert.equal(await evaluate('window.__oscillatorStops'),3);
    assert.ok((await evaluate('document.body.innerText')).includes('Restart eye watch'));assert.ok(!(await evaluate('document.body.innerText')).includes('Alarm on'));
    await evaluate('window.__workerFault=false');await click('Restart eye watch');await until("document.body.innerText.includes('Eyes tracked')");
    await click('End drive');await until("location.pathname==='/drive/trip-summary'");
    await until("window.__eyeStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    assert.equal(await evaluate('window.__workerStops'),2);assert.equal(await evaluate('window.__wakeReleases'),2);assert.equal(await evaluate('window.__gpsCleared'),true);
    assert.deepEqual(runtimeErrors,[]);
    console.log('Synthetic calibration, stationary gate, hidden moving switch, lost/recovery, tired/reminder, latched alarm, acknowledgement and End drive cleanup passed.');
    await navigate('/test-eyes');
    await evaluate(`window.__normalFrontCamera=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Camera permission denied','NotAllowedError');}`);
    await click('Start eye watch');await until("document.body.innerText.includes('Camera permission denied')");
    await evaluate(`navigator.mediaDevices.getUserMedia=async options=>{const stream=await window.__normalFrontCamera(options);await new Promise(resolve=>{window.__releaseFrontCamera=resolve;});return stream;}`);
    await click('Start eye watch');await until('window.__releaseFrontCamera');await click('Stop eye watch');await evaluate('window.__releaseFrontCamera()');
    await until("window.__eyeStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))");
    assert.deepEqual(runtimeErrors,[]);console.log('Denied permission, retry and late camera cleanup passed.');
    }


  } else if (['--comparison','--onboarding-comparison','--car-comparison','--trips-comparison','--profile-comparison'].some(flag=>process.argv.includes(flag))) {
    const [page,count,frame,name] = process.argv.includes('--profile-comparison') ? ['profile',5,'.profile-frame','profile']
      : process.argv.includes('--trips-comparison') ? ['trips',3,'.trips-frame','trips']
      : process.argv.includes('--car-comparison') ? ['car-check',7,'.car-frame','car']
      : process.argv.includes('--onboarding-comparison') ? ['onboarding',13,'.ob-frame','onboarding']
      : ['drive-watch',11,'.drive-frame','drive'];
    await viewport(1000,1200); await navigate('/review/'+page+'.html');
    await evaluate("[...document.images].forEach(i=>i.loading='eager')");
    await until("[...document.images].every(i=>i.complete&&i.naturalWidth>0)");
    assert.equal(await evaluate('document.querySelectorAll("section").length'),count);
    await evaluate("document.querySelector('#live-toggle').click()");
    await until("document.querySelector('iframe')?.contentDocument?.querySelector('"+frame+"')");
    assert.equal(await evaluate("document.querySelector('#live-toggle').getAttribute('aria-pressed')"),'true');
    await settle(); await screenshot(name+'-comparison-page.png',{x:0,y:0,width:1000,height:1200});
    if(name==='trips'||name==='profile'){
      await evaluate("document.querySelector('#live-toggle').click()");
      for(let i=1;i<=count;i++){
        const prefix=name==='trips'?'t':'p';
        const y=await evaluate(`document.querySelector('#${prefix}${i}').offsetTop`);
        await screenshot(name+'-comparison-'+prefix+i+'.png',{x:0,y,width:1000,height:1100});
      }
    }
    assert.deepEqual(runtimeErrors,[]);
    console.log(name+' comparison passed: '+count+' source/app pairs and live toggle.');
  } else if (process.argv.includes('--profile')) {
    const routes=['profile','driving-stats','my-cars','add-a-car','privacy-and-legal'];
    const reviews=[];
    for(let i=0;i<routes.length;i++){
      await viewport(430,932);await navigate('/profile/'+routes[i]);
      await until("[...document.images].every(i=>i.complete&&i.naturalWidth>0)");
      const review=await evaluate("({path:location.pathname,text:document.body.innerText,width:document.documentElement.scrollWidth,geometry:[...document.querySelectorAll('.profile-content>*')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height}})})");
      assert.equal(review.path,'/profile/'+routes[i]);assert.equal(review.width,430);assert.ok(!/[â�]/.test(review.text));assert.ok(!review.text.includes('Demo:'));
      if(i>0)assert.ok(await evaluate("(()=>{const b=document.querySelector('button[aria-label=Back]'),r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b})()"),'Back obscured');
      await screenshot('profile-p'+(i+1)+'.png',{x:0,y:0,width:430,height:932});reviews.push(review);
      await viewport(390,844);await settle();assert.equal(await evaluate('document.documentElement.scrollWidth'),390,routes[i]+': overflow');
      if(await evaluate("Boolean(document.querySelector('.app-frame__footer'))")){
        assert.equal(await evaluate("innerHeight-document.querySelector('.app-frame__footer').getBoundingClientRect().bottom"),34);
        await evaluate('scrollTo(0,document.documentElement.scrollHeight)');await settle();
        assert.ok(await evaluate("document.querySelector('.profile-content').getBoundingClientRect().bottom<=document.querySelector('.app-frame__footer').getBoundingClientRect().top+2"),routes[i]+': obscured content');
      }
      if(i===1)assert.ok(await evaluate("[...document.querySelectorAll('.profile-chart')].every(e=>{const a=e.querySelector('img').getBoundingClientRect(),b=e.getBoundingClientRect();return Math.abs(a.width-b.width)<1&&a.bottom<=b.bottom+1})"),'chart clipping');
      await screenshot('profile-p'+(i+1)+'-390.png',{x:0,y:0,width:390,height:844});
    }
    await writeFile(join(artifactRoot,'profile-geometry.json'),JSON.stringify(reviews,null,2));
    const click=async label=>{await evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')];const label=${JSON.stringify(label)};const target=buttons.find(b=>b.getAttribute('aria-label')===label)||buttons.find(b=>b.textContent.includes(label));target.click()})()`);await settle();};
    const path=()=>evaluate('location.pathname');
    await viewport(430,932);await navigate('/profile');const index=await evaluate('history.state.idx');
    assert.equal(await evaluate("document.querySelector('.tab-bar button[aria-current]').getAttribute('aria-label')"),'Profile');
    await click('See stats');assert.equal(await path(),'/profile/driving-stats');assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'push');
    await click('Back');assert.equal(await path(),'/profile');assert.equal(await evaluate('history.state.idx'),index);assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'-1');
    await click('Perodua Myvi');assert.equal(await path(),'/profile/my-cars');await click('Add a car');assert.equal(await path(),'/profile/add-a-car');
    await evaluate("const input=document.querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'axia');input.dispatchEvent(new Event('input',{bubbles:true}))");await settle();
    assert.equal(await evaluate("document.querySelectorAll('.profile-popular-car').length"),1);await click('Perodua Axia');assert.equal(await path(),'/profile/my-cars');assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'-1');
    await navigate('/profile/profile');await click('Add a car');assert.equal(await path(),'/profile/add-a-car');await click('Back');assert.equal(await path(),'/profile/my-cars');
    for(const route of ['driving-stats','my-cars','privacy-and-legal']){await navigate('/profile/'+route);await click('Back');assert.equal(await path(),'/profile/profile');}
    await navigate('/profile/add-a-car');await click('Back');assert.equal(await path(),'/profile/my-cars');
    for(const [label,target] of [['Maps app','/onboarding/which-maps-app'],['Eye profile','/onboarding/face-scan-intro'],['Privacy and legal','/profile/privacy-and-legal']]){
      await navigate('/profile');await click(label);assert.equal(await path(),target);assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'push');
    }
    for(const [label,target] of [['Home','/drive/home'],['Trips','/trips/trips'],['Car','/car/car-check']]){
      await navigate('/profile');await click(label);assert.equal(await path(),target);assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'tab');
    }
    let safeAreaVerified=false;
    if(protocol.domains.find(d=>d.domain==='Emulation')?.commands.some(c=>c.name==='setSafeAreaInsetsOverride')){
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:59,left:0,right:0,bottom:50}});
      await navigate('/profile/my-cars');assert.equal(await evaluate("document.querySelector('.profile-topbar').getBoundingClientRect().top"),67);
      assert.equal(await evaluate("innerHeight-document.querySelector('.app-frame__footer').getBoundingClientRect().bottom"),50);
      await navigate('/profile');assert.equal(await evaluate("document.querySelector('.profile-person').getBoundingClientRect().top"),71);
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:0,right:0,bottom:0}});safeAreaVerified=true;
    }
    assert.deepEqual(runtimeErrors,[]);
    await writeFile(join(artifactRoot,'profile-browser-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),screens:5,widths:[430,390],safeAreaVerified,passed:['original assets and chart scaling','Figma prototype links','history Back and direct entry','search filtering','34px footer clearance','responsive scrolling','no runtime exceptions']},null,2));
    console.log('Profile passed: five screens, responsive layouts, original SVGs, search, Figma links, Back, safe areas and footer clearance.');
  } else if (process.argv.includes('--trips')) {
    const routes=['trips','when-you-get-tired','late-drive-heads-up'];
    const reviews=[];
    for(let i=0;i<routes.length;i++){
      await viewport(430,932);await navigate('/trips/'+routes[i]);
      await until("[...document.images].every(i=>i.complete&&i.naturalWidth>0)");
      const review=await evaluate("({path:location.pathname,text:document.body.innerText,width:document.documentElement.scrollWidth,geometry:[...document.querySelectorAll('.trips-content>*')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height}})})");
      assert.equal(review.path,'/trips/'+routes[i]);assert.equal(review.width,430);assert.ok(!review.text.includes('Demo:'));assert.ok(!/[â�]/.test(review.text));
      if(i>0)assert.ok(await evaluate("(()=>{const b=document.querySelector('button[aria-label=Back]'),r=b.getBoundingClientRect();return getComputedStyle(b).visibility==='visible'&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b})()"),'Back button obscured');
      await screenshot('trips-t'+(i+1)+'.png',{x:0,y:0,width:430,height:932});reviews.push(review);
      await viewport(390,844);await settle();assert.equal(await evaluate('document.documentElement.scrollWidth'),390);
      assert.equal(await evaluate("innerHeight-document.querySelector('.app-frame__footer').getBoundingClientRect().bottom"),34);
      await evaluate('scrollTo(0,document.documentElement.scrollHeight)');await settle();
      assert.ok(await evaluate("document.querySelector('.trips-content').getBoundingClientRect().bottom<=document.querySelector('.app-frame__footer').getBoundingClientRect().top+2"),routes[i]+': obscured content');
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),routes[i]+': horizontal overflow');
    }
    await writeFile(join(artifactRoot,'trips-geometry.json'),JSON.stringify(reviews,null,2));
    const click=async label=>{await evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')];const label=${JSON.stringify(label)};const target=buttons.find(b=>b.getAttribute('aria-label')===label)||buttons.find(b=>b.textContent.startsWith(label));target.click()})()`);await settle();};
    const path=()=>evaluate('location.pathname');
    await viewport(430,932);await navigate('/trips');
    assert.equal(await evaluate("document.querySelector('.tab-bar button[aria-current]').getAttribute('aria-label')"),'Trips');
    const originalIndex=await evaluate('history.state.idx');await click('Your pattern');assert.equal(await path(),'/trips/when-you-get-tired');
    await click('Back');assert.equal(await path(),'/trips');assert.equal(await evaluate('history.state.idx'),originalIndex);
    await click('Your pattern');await click('Turn on night reminders');assert.equal(await path(),'/trips');assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'-1');
    for(const title of ['PJ → Seremban','UM → Home','Home → Mid Valley','Home → UM','Sunway → Home']){
      await navigate('/trips/trips');await click(title);assert.equal(await path(),'/drive/trip-summary');
    }
    await navigate('/trips/when-you-get-tired');await click('Back');assert.equal(await path(),'/trips/trips');
    await navigate('/trips/late-drive-heads-up');await click('Back');assert.equal(await path(),'/trips/when-you-get-tired');assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'push');assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'-1');
    await navigate('/trips/late-drive-heads-up');await click('Not tonight');assert.equal(await path(),'/drive/home');assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'tab');
    await navigate('/trips/late-drive-heads-up');await click('Start with the plan');assert.equal(await path(),'/drive/mount-your-phone');assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'push');assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'1');
    await navigate('/drive/home');await evaluate("document.querySelector('.drive-logo').click();document.querySelector('.drive-logo').click();document.querySelector('.drive-logo').click()");
    await until("document.querySelector('.drive-demo')?.open");await click('Demo: start a drive at 11:20 pm');assert.equal(await path(),'/trips/late-drive-heads-up');assert.equal(await evaluate("Boolean(document.querySelector('.drive-demo'))"),false);
    for(const [tab,target] of [['Home','/drive/home'],['Car','/car/car-check'],['Profile','/profile']]){
      await navigate('/trips/trips');await click(tab);assert.equal(await path(),target);assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"),'tab');
    }
    let safeAreaVerified=false;
    if(protocol.domains.find(d=>d.domain==='Emulation')?.commands.some(c=>c.name==='setSafeAreaInsetsOverride')){
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:59,left:0,right:0,bottom:50}});
      await navigate('/trips/when-you-get-tired');assert.equal(await evaluate("document.querySelector('.trips-topbar').getBoundingClientRect().top"),67);
      assert.equal(await evaluate("innerHeight-document.querySelector('.app-frame__footer').getBoundingClientRect().bottom"),50);
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:0,right:0,bottom:0}});safeAreaVerified=true;
    }
    assert.deepEqual(runtimeErrors,[]);
    await writeFile(join(artifactRoot,'trips-browser-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),screens:3,widths:[430,390],safeAreaVerified,passed:['prototype destinations','history Back and direct-entry fallback','hidden late-drive demo','original SVGs and chart scaling','34px footer clearance','responsive scrolling','tab transitions','no runtime exceptions']},null,2));
    console.log('Trips passed: three screens, original SVG charts, prototype destinations, hidden demo, responsive layouts, Back, safe areas and footer clearance.');
  } else if (process.argv.includes('--car')) {
    // Direct-entry check for the current Car check frames. Sample content comes from ?preview, never from the account.
    const routes=[['car-check','Car check'],['scan-a-warning-light?preview=1','Scan a warning light'],['reading-the-light?preview=1','Reading the light'],['warning-light-result','No light scanned yet'],['couldnt-read-the-light','Couldn’t read that light'],['engine-sound-check?preview=1','Start-up battery check'],['checking-the-sound?preview=1','Checking the start-up sound'],['didnt-hear-the-engine','We didn’t hear the engine'],['car-report','No report yet'],['brake-check','No brake data yet'],['workshops-near-you','Workshops near you']];
    const widths=[430,390,360];
    for(const width of widths)for(const [route,text] of routes){
      await viewport(width,932);await navigate('/car/'+route);await settle();
      assert.ok(await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`),`${route} at ${width}px should show “${text}”`);
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),`${route} overflows at ${width}px`);
      assert.equal(await evaluate('[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length'),0,`${route} has a broken image`);
    }
    for(const old of ['first-check','photo-walk-around','scratch-detail','belt-squeal-trend']){await navigate('/car/'+old);await settle();assert.equal(await evaluate('location.pathname'),'/components','removed route '+old+' must not render');}
    assert.deepEqual(runtimeErrors,[]);
    await writeFile(join(artifactRoot,'car-browser-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),routes:routes.length,widths,passed:['current Car check frames render','no horizontal overflow','no broken images','removed walk-around routes stay removed']},null,2));
    console.log('Car check passed: current frames at 430, 390 and 360 px.');
  } else if (process.argv.includes('--onboarding')) {
    const routes = ['splash','loading','welcome','sign-up','whats-your-car','perodua-myvi-sheet','car-details','service-and-condition','how-you-drive','which-maps-app','face-scan-intro','face-scan','all-set'];
    const reviews = [];
    for (let i=0;i<routes.length;i++) {
      const route=routes[i]; await viewport(430,932); await navigate('/onboarding/'+route+'?preview=1');
      await until("[...document.images].every(i=>i.complete&&i.naturalWidth>0)");
      const review=await evaluate(`({path:location.pathname,text:document.body.innerText,width:document.documentElement.scrollWidth,images:[...document.images].map(i=>{const r=i.getBoundingClientRect();return {file:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,x:r.x,y:r.y,width:r.width,height:r.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight}}),geometry:[...document.querySelectorAll('.ob-content>*,.ob-car-sheet>*')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height}})})`);
      assert.equal(review.path,'/onboarding/'+route); assert.equal(review.width,430);
      assert.ok(!/[â�]/.test(review.text),route+': corrupted typography');
      assert.ok(!review.text.includes('Demo:')); await screenshot('onboarding-o'+(i+1)+'.png',{x:0,y:0,width:430,height:932}); reviews.push({screen:i+1,...review});
      await viewport(390,844); await settle(); assert.equal(await evaluate('document.documentElement.scrollWidth'),390,route+': horizontal overflow');
      if (await evaluate("Boolean(document.querySelector('.app-frame__footer'))")) {
        const footer=await evaluate("(()=>{const r=document.querySelector('.app-frame__footer').getBoundingClientRect();return {bottom:innerHeight-r.bottom,width:r.width}})()");
        assert.equal(footer.bottom,34); assert.equal(footer.width,350);
        await evaluate('scrollTo(0,document.documentElement.scrollHeight)'); await settle();
        assert.ok(await evaluate("document.querySelector('.ob-content').getBoundingClientRect().bottom<=document.querySelector('.app-frame__footer').getBoundingClientRect().top+2"),route+': obscured content');
      }
    }
    await writeFile(join(artifactRoot,'onboarding-geometry.json'),JSON.stringify(reviews,null,2));
    const clickText=async label=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith(${JSON.stringify(label)})).click()`);await settle();};
    const path=()=>evaluate('location.pathname');
    await viewport(430,932); await navigate('/onboarding/splash');
    await until("location.pathname==='/onboarding/welcome'"); await settle();
    await clickText('Sign up with email'); assert.equal(await path(),'/onboarding/sign-up');
    await evaluate("(()=>{const e=document.querySelector('input[aria-label=\"Full name\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Jamie');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await clickText('Continue'); assert.equal(await path(),'/onboarding/whats-your-car');
    await evaluate("document.querySelector('button.ob-car-row').click()");await settle(); assert.equal(await path(),'/onboarding/perodua-myvi-sheet');
    assert.equal(await evaluate("document.querySelector('.ob-sheet-dialog').open"),true);
    assert.equal(await evaluate("document.body.style.overflow"),'hidden');
    await clickText('1.5 H');
    assert.equal(await evaluate("[...document.querySelectorAll('.ob-car-sheet .option')].filter(b=>b.getAttribute('aria-pressed')==='true').length"),1);
    await send('Page.bringToFront'); await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await settle();
    assert.equal(await path(),'/onboarding/whats-your-car'); assert.equal(await evaluate("document.body.style.overflow"),'');
    await evaluate("document.querySelector('button.ob-car-row').click()");await settle(); await clickText('This is my car'); assert.equal(await path(),'/onboarding/car-details');
    await evaluate("document.querySelector('button[aria-label=\"Red\"]').click()");
    await clickText('Edit'); assert.equal(await evaluate("document.querySelectorAll('.ob-spec input').length"),3); await clickText('Done');
    await clickText('Continue'); await clickText('Yes, it’s modified'); await clickText('No, it’s clean'); await clickText('Continue');
    await clickText('Daily commute'); await clickText('Late nights or early mornings');await clickText('Continue');
    await clickText('Google Maps'); await clickText('Continue'); await clickText('Start face scan');
    assert.equal(await path(),'/onboarding/face-scan'); await until("location.pathname==='/onboarding/all-set'"); await settle();
    assert.ok(await evaluate("document.querySelector('h1').textContent.includes('Jamie')"));
    assert.ok(await evaluate("document.querySelector('.ob-summary').textContent.includes('1.5 H')&&document.querySelector('.ob-summary').textContent.includes('Red')&&document.querySelector('.ob-summary').textContent.includes('Google Maps')"));
    await clickText('Go to home'); assert.equal(await path(),'/drive/home');
    await navigate('/onboarding/sign-up');await clickText('Continue');await evaluate("document.querySelector('button.ob-car-row').click()");await settle();
    const beforeDismiss=await evaluate('history.state.idx');
    await evaluate("document.querySelector('.ob-sheet-backdrop').click();document.querySelector('.ob-sheet-backdrop')?.click()");await settle();
    assert.equal(await path(),'/onboarding/whats-your-car');assert.equal(await evaluate('history.state.idx'),beforeDismiss-1);
    await evaluate("document.querySelector('button.ob-car-row').click()");await settle();await clickText('1.3 G');await clickText('This is my car');await clickText('Edit');
    assert.equal(await evaluate("document.querySelector('input[aria-label=\"engine\"]').value"),'1.3 L');
    await evaluate("(()=>{const e=document.querySelector('input[aria-label=\"engine\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'1.4 L');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await clickText('Done');assert.equal(await evaluate("document.querySelector('.ob-spec .text-body-strong').textContent"),'1.4 L');
    await navigate('/onboarding/perodua-myvi-sheet'); await evaluate("document.querySelector('.ob-sheet-backdrop').click()");await settle();assert.equal(await path(),'/onboarding/whats-your-car');
    await navigate('/onboarding/car-details'); await evaluate("document.querySelector('.icon-button').click()");await settle();assert.equal(await path(),'/onboarding/whats-your-car');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"),'-1');
    const safeAreaCommand = protocol.domains.find(d=>d.domain==='Emulation')?.commands.find(c=>c.name==='setSafeAreaInsetsOverride');
    let safeAreaVerified=false;
    if(safeAreaCommand) {
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:47,left:0,right:0,bottom:34}});
      await navigate('/onboarding/sign-up');assert.equal(await evaluate("document.querySelector('.ob-content>.icon-button').getBoundingClientRect().top"),62);
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:59,left:0,right:0,bottom:50}});await settle();
      assert.equal(await evaluate("document.querySelector('.ob-content>.icon-button').getBoundingClientRect().top"),67);
      assert.equal(await evaluate("innerHeight-document.querySelector('.app-frame__footer').getBoundingClientRect().bottom"),50);
      await send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,left:0,right:0,bottom:0}});safeAreaVerified=true;
    }
    assert.deepEqual(runtimeErrors,[]);
    await writeFile(join(artifactRoot,'onboarding-browser-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),screens:13,widths:[430,390],workflow:true,timers:true,sheetDismissal:true,doubleDismissal:true,engineEditing:true,draftPersistence:true,safeAreaVerified,runtimeErrors},null,2));
    console.log('Onboarding passed: 13 screens, 390/430px widths, timers, editable draft, choices, sheet dismissal and complete workflow.');
  } else if (process.argv.includes('--keyboard')) {
    await viewport(430,932); await navigate('/drive/home');
    await evaluate("document.querySelector('.drive-logo').focus();window.reviewKeyEvents=[];document.querySelector('.drive-logo').addEventListener('click',()=>window.reviewKeyEvents.push('click'));document.querySelector('.drive-logo').addEventListener('keydown',e=>window.reviewKeyEvents.push(e.key))");
    console.log('Before native events:',await evaluate("({focus:document.hasFocus(),active:document.activeElement.className,hidden:document.hidden})"));
    await send('Page.bringToFront');
    for (let i=0;i<3;i++) { await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'}); await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); }
    console.log('After native events:',await evaluate("({focus:document.hasFocus(),events:window.reviewKeyEvents,open:document.querySelector('.drive-demo')?.open})"));
    assert.equal(await evaluate("document.querySelector('.drive-demo')?.open"),true);
  } else if (process.argv.includes('--drive')) {
    const screens = [
      ['01-home', '/drive/home'], ['02-mount', '/drive/mount-your-phone'], ['03-lineup', '/drive/line-up-your-face'],
      ['04-check', '/drive/quick-eye-check'], ['05-driving', '/drive/driving'], ['06-lost', '/drive/cant-see-your-eyes'],
      ['07-tired', '/drive/getting-tired'], ['08-alarm', '/drive/microsleep-alarm'], ['09-summary', '/drive/trip-summary'],
      ['05a-waze', '/drive/waze-open-still-watching'], ['05b-waze-tired', '/drive/tired-while-waze-is-open'],
    ];
    const reviews = [];
    for (const [name, path] of screens) {
      await viewport(430, 932); await navigate(path);
      const review = await evaluate(`({path:location.pathname,text:document.querySelector('.drive-frame').innerText,width:document.documentElement.scrollWidth,fonts:document.fonts.check('18px Inter'),images:[...document.images].map(i=>{const r=i.getBoundingClientRect();return {file:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:r.width,height:r.height,x:r.x,y:r.y}}),geometry:[...document.querySelectorAll('.drive-content>*')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,x:r.x,y:r.y,width:r.width,height:r.height}})})`);
      assert.equal(review.path, path); assert.equal(review.width, 430); assert.equal(review.fonts, true);
      assert.ok(review.images.every(i => i.loaded), `${name}: missing local image`);
      assert.ok(!review.text.includes('Demo:'), `${name}: demo shortcut exposed`);
      await screenshot(`drive-${name}.png`, {x:0,y:0,width:430,height:932});
      reviews.push({name, ...review});
      await viewport(390, 844); await settle();
      assert.equal(await evaluate('document.documentElement.scrollWidth'), 390, `${name}: horizontal overflow`);
      if (!name.includes('waze')) {
        const footer = await evaluate("(()=>{const r=document.querySelector('.app-frame__footer').getBoundingClientRect();return {bottom:innerHeight-r.bottom,width:r.width}})()");
        assert.equal(footer.bottom, 34); assert.equal(footer.width, 350);
        await evaluate('scrollTo(0,document.documentElement.scrollHeight)'); await settle();
        const clear = await evaluate("document.querySelector('.drive-content').getBoundingClientRect().bottom <= document.querySelector('.app-frame__footer').getBoundingClientRect().top + 2");
        assert.equal(clear, true, `${name}: content obscured by bottom action after scrolling`);
      }
    }
    await writeFile(join(artifactRoot, 'drive-geometry.json'), JSON.stringify(reviews, null, 2));
    const clickText = async label => {
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith(${JSON.stringify(label)})).click()`);
      await settle();
    };
    await viewport(430,932); await navigate('/drive/home');
    await clickText('Start drive watch'); assert.equal(await evaluate('location.pathname'), '/drive/mount-your-phone');
    await evaluate("history.replaceState(history.state,'','?preview=1')");
    await clickText('My phone is mounted'); assert.equal(await evaluate('location.pathname'), '/drive/line-up-your-face');
    await clickText('Waiting for both eyes'); assert.equal(await evaluate('location.pathname'), '/drive/quick-eye-check');
    await clickText('Start driving'); assert.equal(await evaluate('location.pathname'), '/drive/driving');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"), 'fade');
    await clickText('Open Waze'); assert.equal(await evaluate('location.pathname'), '/drive/waze-open-still-watching');
    await evaluate("document.querySelector('.drive-map-bubble').click()"); await settle(); await settle();
    assert.equal(await evaluate('location.pathname'), '/drive/driving');
    await clickText('End drive'); assert.equal(await evaluate('location.pathname'), '/drive/trip-summary');
    await clickText('Done'); assert.equal(await evaluate('location.pathname'), '/drive/home');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"), '-1');
    await evaluate("document.querySelector('.drive-logo').click();document.querySelector('.drive-logo').click()");
    assert.equal(await evaluate("Boolean(document.querySelector('.drive-demo'))"), false);
    await evaluate("document.querySelector('.drive-logo').click()"); await until("document.querySelector('.drive-demo')?.open");
    assert.equal(await evaluate("document.body.style.overflow"), 'hidden');
    await screenshot('drive-demo-panel.png', {x:0,y:0,width:430,height:932});
    await clickText('Demo: getting tired');
    assert.equal(await evaluate('location.pathname'), '/drive/getting-tired');
    assert.equal(await evaluate("document.body.style.overflow"), '');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"), 'fade');
    await clickText('Remind me in 10 min'); assert.equal(await evaluate('location.pathname'), '/drive/driving');
    await navigate('/drive/cant-see-your-eyes'); await clickText('OK'); assert.equal(await evaluate('location.pathname'), '/drive/driving');
    await navigate('/drive/microsleep-alarm'); await clickText("I'm awake"); assert.equal(await evaluate('location.pathname'), '/drive/driving');
    await navigate('/drive/tired-while-waze-is-open'); await clickText('I’m OK'); assert.equal(await evaluate('location.pathname'), '/drive/waze-open-still-watching');
    await navigate('/drive/home'); await clickText('Start drive watch');
    await evaluate("document.querySelector('button[aria-label=Back]').click()"); await settle();
    assert.equal(await evaluate('location.pathname'), '/drive/home');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.direction"), '-1');
    await clickText('Start drive watch'); await evaluate('history.back()'); await settle();
    assert.equal(await evaluate('location.pathname'), '/drive/home');
    await navigate('/drive/home');
    const homeIndex = await evaluate('history.state.idx');
    await clickText('Start drive watch');
    await evaluate("document.querySelector('button[aria-label=Back]').click()"); await settle();
    assert.equal(await evaluate('history.state.idx'), homeIndex, 'UI Back must return through history');
    await navigate('/drive/quick-eye-check');
    await evaluate("document.querySelector('button[aria-label=Back]').click()"); await settle();
    assert.equal(await evaluate('location.pathname'), '/drive/line-up-your-face');
    assert.equal(await evaluate("document.querySelector('.route-page').dataset.transition"), 'push');
    const safeAreaCommand = protocol.domains.find(domain=>domain.domain==='Emulation')?.commands.find(command=>command.name==='setSafeAreaInsetsOverride');
    let safeAreaVerified = false;
    if (safeAreaCommand) {
      await send('Emulation.setSafeAreaInsetsOverride', {insets:{top:47,left:0,right:0,bottom:34}});
      await navigate('/drive/mount-your-phone');
      assert.equal(await evaluate("document.querySelector('.drive-content').getBoundingClientRect().top"), 0);
      assert.equal(await evaluate("document.querySelector('.drive-content>.icon-button').getBoundingClientRect().top"), 62);
      await send('Emulation.setSafeAreaInsetsOverride', {insets:{top:59,left:0,right:0,bottom:34}}); await settle();
      assert.equal(await evaluate("document.querySelector('.drive-content>.icon-button').getBoundingClientRect().top"), 67);
      await send('Emulation.setSafeAreaInsetsOverride', {insets:{top:0,left:0,right:0,bottom:0}});
      safeAreaVerified = true;
    }
    await navigate('/drive/home');
    await evaluate("document.querySelector('.drive-logo').focus()");
    await send('Page.bringToFront');
    for (let i=0;i<3;i++) { await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'}); await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); }
    await until("document.querySelector('.drive-demo')?.open");
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await until("!document.querySelector('.drive-demo')");
    await navigate('/drive/getting-tired'); await clickText('Go to rest stop'); assert.equal(await evaluate('location.pathname'), '/drive/trip-summary');
    await navigate('/drive/microsleep-alarm'); await clickText('Go to rest stop'); assert.equal(await evaluate('location.pathname'), '/drive/trip-summary');
    await navigate('/drive/tired-while-waze-is-open'); await clickText('Go to rest stop'); assert.equal(await evaluate('location.pathname'), '/drive/waze-open-still-watching');
    await navigate('/drive/home');
    for (const tab of ['Trips','Car','Profile']) {
      await evaluate(`document.querySelector('.tab-bar button[aria-label=${tab}]').click()`); await settle();
      assert.equal(await evaluate('location.pathname'), `/${tab.toLowerCase()}`);
      assert.ok(await evaluate(tab==='Car'?"document.querySelector('.car-heading h1').textContent==='Car check'":tab==='Trips'?"document.querySelector('.trips-heading h1').textContent==='Trips'":"document.querySelector('.profile-person h1').textContent==='Michael Jackson'"));
      await evaluate("document.querySelector('.tab-bar button[aria-label=Home]').click()"); await settle();
    }
    assert.deepEqual(runtimeErrors, []);
    await writeFile(join(artifactRoot, 'drive-browser-verification.json'), JSON.stringify({checkedAt:new Date().toISOString(),safeAreaVerified,passed:['all eleven routes','430/390px widths','local image and font loads','hidden demo trigger','setup and trip flow','warning and alarm recovery','maps return','UI back uses history','direct-entry back fallback','pending section destinations','34px footer placement','scrolling reveals all content','no runtime exceptions'],reviews},null,2));
    console.log('Drive browser checks passed; eleven screenshots and geometry saved.');
  } else {
  await viewport(430, 932); await navigate('/components');
  const initial = await evaluate(`({title:document.querySelector('h1').textContent,secure:window.isSecureContext,width:document.documentElement.scrollWidth,viewport:innerWidth,fonts:document.fonts.check('18px Inter'),brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).length})`);
  assert.equal(initial.title, 'Components'); assert.equal(initial.secure, true); assert.equal(initial.width, 430); assert.equal(initial.fonts, true); assert.equal(initial.brokenImages, 0);
  await screenshot('components-phone.png');
  await screenshot('components-phone-top.png', {x:0,y:0,width:430,height:932});
  await evaluate("document.querySelector('a[href=\"#inputs\"]').click()");
  await settle();
  const anchorTop = await evaluate("document.querySelector('#inputs').getBoundingClientRect().top");
  assert.ok(anchorTop >= -1 && anchorTop < 100, `Input anchor missed target: ${anchorTop}`);
  await navigate('/components');
  await evaluate("document.querySelector('.option').click()");
  assert.equal(await evaluate("document.querySelector('.option').getAttribute('aria-pressed')"), 'true');
  await evaluate("document.querySelector('.option').click()");
  assert.equal(await evaluate("document.querySelector('.option').getAttribute('aria-pressed')"), 'false');
  await evaluate("document.querySelector('.tab-bar button[aria-label=Car]').click()");
  assert.equal(await evaluate("document.querySelector('.tab-bar button[aria-current]').getAttribute('aria-label')"), 'Car');
  await evaluate("var reviewInput=document.querySelector('input'); reviewInput.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(reviewInput,'Myvi'); reviewInput.dispatchEvent(new Event('input',{bubbles:true}))");
  assert.equal(await evaluate("document.querySelector('input').value"), 'Myvi');
  assert.equal(await evaluate("document.querySelector('input').classList.contains('input--focused')"), true);
  await evaluate("document.querySelector('.button--primary').click()");
  await until("document.querySelector('.gallery__feedback')?.textContent.includes('Primary button pressed')");
  await viewport(390, 844); await settle();
  assert.equal(await evaluate('document.documentElement.scrollWidth'), 390);
  await viewport(430, 932);

  for (const [label, kind, heading] of [['Push · 0.45 s', 'push', 'Push'], ['Fade · 0.3 s', 'fade', 'Cross-fade'], ['Tab · 0.2 s', 'tab', 'Tab fade']]) {
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    await until(`location.pathname.endsWith('/${kind}')`); await settle();
    assert.equal(await evaluate("document.querySelector('h1').textContent"), heading);
    if (kind === 'tab') {
      await evaluate("document.querySelector('.preview__tab button[aria-label=Car]').click()");
      await until("document.querySelector('.preview__tab p')?.textContent==='Car'");
    }
    const footer = await evaluate("(()=>{const r=document.querySelector('.app-frame__footer').getBoundingClientRect();return {width:r.width,bottom:innerHeight-r.bottom}})()");
    assert.equal(footer.width, 390); assert.equal(footer.bottom, 34);
    await evaluate('history.back()'); await until("location.pathname==='/components'"); await settle();
  }
  await evaluate("document.querySelector('.gallery__section:nth-of-type(8)')?.scrollIntoView()");
  const scrollBefore = await evaluate('scrollY');
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Sheet · 0.5 s').click()");
  await until("document.querySelector('dialog')?.open"); await settle();
  assert.equal(await evaluate("document.body.style.overflow"), 'hidden');
  assert.equal(await evaluate("document.querySelector('.gallery')!==null"), true);
  await screenshot('components-sheet.png');
  await evaluate("document.querySelector('dialog button[aria-label=Close]').click()");
  await until("!document.querySelector('dialog')");
  assert.equal(await evaluate('scrollY'), scrollBefore);
  assert.equal(await evaluate("document.body.style.overflow"), '');

  await viewport(1648, 1200); await navigate('/components/canvas');
  const geometry = await evaluate(`(()=>{const canvas=document.querySelector('.figma-canvas').getBoundingClientRect(); return [...document.querySelectorAll('.figma-canvas .button,.figma-canvas .tab-bar,.figma-canvas .input,.figma-canvas .option,.figma-canvas .illustration,.figma-canvas .brand-mark')].map(e=>{const r=e.getBoundingClientRect(); return {class:e.className,width:r.width,height:r.height,x:r.x-canvas.x,y:r.y-canvas.y}})})()`);
  assert.equal(geometry[0].width, 390); assert.equal(geometry[0].height, 56); assert.equal(geometry[0].x, 48); assert.equal(geometry[0].y, 48);
  const canvas = await evaluate("(()=>{const r=document.querySelector('.figma-canvas').getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()");
  await screenshot('components-canvas.png', canvas);
  assert.deepEqual(runtimeErrors, []);
  await writeFile(join(artifactRoot, 'browser-verification.json'), JSON.stringify({checkedAt:new Date().toISOString(), initial, phoneWidths:[390,430], passed:['gallery section anchor navigation','option toggling','tab selection','input focus and editing','button feedback','push/fade/tab route navigation and browser back','animated tab content changes','34px pinned footer','modal sheet with retained background and scroll','local font and image loads','no runtime exceptions'],geometry},null,2));
  console.log('Browser checks passed: phone widths, interactive controls, all transition routes, sheet scroll retention, footer placement, fonts and SVGs.');
  console.log(`Review screenshots: ${artifactRoot}`);
  }
} finally { socket?.close(); browser.kill(); server.close(); }
