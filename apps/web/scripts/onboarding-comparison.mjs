import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app=resolve(fileURLToPath(new URL('..',import.meta.url)));
const docs=resolve(app,'../../docs/review');
const screens=[
 ['Splash','splash','Wordmark baseline corrected; original logo and wordmark SVGs.'],
 ['Loading','loading','Original 72px logo, 200 × 6px progress track and 65% default.'],
 ['Welcome','welcome','Hero at y70, heading at y434, original halo/logo/car assets.'],
 ['Sign up','sign-up','Fields at y206; consent and bottom action spacing corrected.'],
 ['What’s your car','whats-your-car','List rows corrected to 64px; manual row at y767. Popular/manual rows have no prototype destinations.'],
 ['Perodua Myvi sheet','perodua-myvi-sheet','Sheet at y289; original 288 × 112px car; 45% dimming; dismisses to O5.'],
 ['Car details','car-details','Filled fields restored; original swatches; specification edits persist.'],
 ['Service and condition','service-and-condition','Condition choices and 551px form height corrected.'],
 ['How you drive','how-you-drive','77/75px choices with 12px gaps; multiple selections persist.'],
 ['Which maps app','which-maps-app','Original step-bar artwork; options at y309 and tip at y620, 113px tall.'],
 ['Face scan intro','face-scan-intro','Original face/eye assets; tips padding corrected, y532, 156px tall.'],
 ['Face scan','face-scan','300px ring at y220; 70% default at y540; checks at y600; original SVG track also masks configurable progress.'],
 ['All set','all-set','Success mark at y126; summary at y348; form choices appear in the summary.'],
];
const style='body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#eef1f7;color:#282828}header{max-width:900px}p{line-height:1.5}h1{margin:0 0 12px}nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}a{color:#1b2a4e}section{margin:40px 0}.pair{display:flex;gap:24px;overflow-x:auto;padding-bottom:12px}figure{flex:0 0 430px;margin:0}figcaption{font-weight:600;margin-bottom:10px}img,iframe{display:block;width:430px;height:932px;border:0;border-radius:12px;background:#fcfcfe}.note{max-width:900px}button{font:inherit;padding:10px 14px;background:white;border:1px solid #1b2a4e;border-radius:10px;color:#1b2a4e;cursor:pointer}.live{display:none}body.live-mode .live{display:block}body.live-mode .snapshot{display:none}';
function html(local){
 const nav=screens.map(([title],i)=>'<a href="#o'+(i+1)+'">O'+(i+1)+' '+title+'</a>').join('');
 const sections=screens.map(([title,route,note],i)=>{
  const n=i+1;const source=local?'../../apps/web/design/onboarding/o'+n+'.png':'onboarding/o'+n+'-figma.png';
  const rendered=local?'onboarding-o'+n+'.png':'onboarding/o'+n+'-app.png';
  return '<section id="o'+n+'"><h2>O'+n+' '+title+'</h2><p class="note">'+note+'</p><div class="pair"><figure><figcaption>Figma reference</figcaption><img loading="lazy" alt="O'+n+' Figma reference" src="'+source+'"></figure><figure><figcaption>Running app '+(local?'':'<a target="_blank" href="/onboarding/'+route+'">Open page</a>')+'</figcaption><img class="snapshot" loading="lazy" alt="O'+n+' rendered app" src="'+rendered+'">'+(local?'':'<iframe class="live" loading="lazy" title="O'+n+' '+title+' live" src="/onboarding/'+route+'?preview=1"></iframe>')+'</figure></div></section>';
 }).join('');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dormathon Onboarding comparison</title><style>'+style+'</style><body><header><h1>Onboarding comparison</h1><p>Figma at left; browser rendering at right. Both use 430 × 932 pixels. On a phone, swipe each pair sideways.</p><p>All 13 frames reviewed. Spacing corrections are listed below. The app omits the fake status bar and retains visible keyboard focus during interaction. Source and browser font rendering may differ slightly.</p><p>These are UI prototypes: authentication and camera processing come later. Preview links pause Figma timers; the normal flow uses its 1.2s, 1.5s and 2.5s delays. Form data lasts for the current session.</p>'+(local?'':'<p><a href="/onboarding/splash">Start the full Onboarding flow</a></p><button id="live-toggle" aria-pressed="false">Show live pages</button>')+'</header><nav>'+nav+'</nav>'+sections+(local?'':'<script>document.querySelector("#live-toggle").onclick=function(){const active=document.body.classList.toggle("live-mode");this.setAttribute("aria-pressed",String(active));this.textContent=active?"Show verified screenshots":"Show live pages"}</script>')+'</body></html>';
}
for(const folder of ['public','dist']){
 const root=join(app,folder,'review');await mkdir(join(root,'onboarding'),{recursive:true});
 for(let n=1;n<=13;n++){
  await copyFile(join(app,'design/onboarding/o'+n+'.png'),join(root,'onboarding/o'+n+'-figma.png'));
  await copyFile(join(docs,'onboarding-o'+n+'.png'),join(root,'onboarding/o'+n+'-app.png'));
 }
 await writeFile(join(root,'onboarding.html'),html(false));
}
await writeFile(join(docs,'onboarding-comparison.html'),html(true));
console.log('13 Onboarding comparison pairs generated in public, dist and docs.');
