import {copyFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const app=resolve(fileURLToPath(new URL('..',import.meta.url)));const docs=resolve(app,'../../docs/review');
const screens=[
 ['Car check','car-check','Original 275 × 107px car; 91px check rows with 12px gaps; last report at y503.'],
 ['First check','first-check','Original top-view car and eight numbered stops; guide at y439; steps card at y545.'],
 ['Photo walk-around','photo-walk-around','Original car, corner and shutter SVGs. Preview shows the Figma sample; normal entry requests the rear camera. Sample findings and quality ticks are hidden over live video.'],
 ['Engine sound check','engine-sound-check','220px original ring and exported waveform. Heading wrapping, ring position and 74px findings match the reference. Values remain default props.'],
 ['Car report','car-report','Original top-view car and six layered spots; repair prices centred vertically; 74px finding rows.'],
 ['Scratch detail','scratch-detail','Original cropped car artwork, 220px photo, 200px details and 73px success panel.'],
 ['Belt squeal trend','belt-squeal-trend','Original chart vectors and points. The chart scales as a group on narrow phones so labels remain visible. Two-week reminder downloads a local calendar event.'],
];
const css='body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#eef1f7;color:#282828}header,.note{max-width:900px}p{line-height:1.5}h1{margin:0 0 12px}nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}a{color:#1b2a4e}section{margin:40px 0}.pair{display:flex;gap:24px;overflow-x:auto;padding-bottom:12px}figure{flex:0 0 430px;margin:0}figcaption{font-weight:600;margin-bottom:10px}img,iframe{display:block;width:430px;height:932px;border:0;border-radius:12px;background:#fcfcfe}button{font:inherit;padding:10px 14px;background:white;border:1px solid #1b2a4e;border-radius:10px;color:#1b2a4e;cursor:pointer}.live{display:none}body.live-mode .live{display:block}body.live-mode .snapshot{display:none}';
function html(local){
 const nav=screens.map(([title],i)=>`<a href="#c${i+1}">C${i+1} ${title}</a>`).join('');
 const sections=screens.map(([title,route,note],i)=>{const n=i+1;const source=local?`../../apps/web/design/car/c${n}.png`:`car/c${n}-figma.png`;const rendered=local?`car-c${n}.png`:`car/c${n}-app.png`;return `<section id="c${n}"><h2>C${n} ${title}</h2><p class="note">${note}</p><div class="pair"><figure><figcaption>Figma reference</figcaption><img loading="lazy" alt="C${n} Figma reference" src="${source}"></figure><figure><figcaption>Running app ${local?'':`<a target="_blank" href="/car/${route}">Open page</a>`}</figcaption><img class="snapshot" loading="lazy" alt="C${n} rendered app" src="${rendered}">${local?'':`<iframe class="live" loading="lazy" title="C${n} ${title} live" src="/car/${route}?preview=1"></iframe>`}</figure></div></section>`;}).join('');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dormathon Car check comparison</title><style>${css}</style><body><header><h1>Car check comparison</h1><p>Figma at left; browser rendering at right. Both use 430 × 932 pixels. On a phone, swipe each pair sideways.</p><p>All seven frames reviewed. The app omits the fake status bar and reuses the shared 40px icon buttons, 56px buttons and tab bar. Actions sit 34px above the bottom edge. Font antialiasing can differ from Figma.</p><p>Reports and engine readings are UI defaults; analysis comes later. Camera captures stay in browser memory. Camera permission, capture and cleanup were tested with synthetic video; a physical phone camera still needs review. Preview links keep the original Figma camera artwork and do not request camera access.</p>${local?'':'<p><a href="/car/car-check">Start Car check</a></p><button id="live-toggle" aria-pressed="false">Show live pages</button>'}</header><nav>${nav}</nav>${sections}${local?'':'<script>document.querySelector("#live-toggle").onclick=function(){const active=document.body.classList.toggle("live-mode");this.setAttribute("aria-pressed",String(active));this.textContent=active?"Show verified screenshots":"Show live pages"}</script>'}</body></html>`;
}
for(const folder of ['public','dist']){
 const root=join(app,folder,'review');await mkdir(join(root,'car'),{recursive:true});
 for(let n=1;n<=7;n++){await copyFile(join(app,`design/car/c${n}.png`),join(root,`car/c${n}-figma.png`));await copyFile(join(docs,`car-c${n}.png`),join(root,`car/c${n}-app.png`));}
 await writeFile(join(root,'car-check.html'),html(false));
}
await writeFile(join(docs,'car-comparison.html'),html(true));console.log('Seven Car check comparison pairs generated.');
