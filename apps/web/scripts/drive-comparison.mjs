import { copyFile, mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(fileURLToPath(new URL('..', import.meta.url)));
const docs = resolve(app, '../../docs/review');
const publicReview = join(app, 'public/review/drive-watch');
await mkdir(publicReview, {recursive:true});
const screens = [
  ['01-home','01 Home','home'], ['02-mount','02 Mount your phone','mount-your-phone'],
  ['03-lineup','03 Line up your face','line-up-your-face'], ['04-check','04 Quick eye check','quick-eye-check'],
  ['05-driving','05 Driving','driving'], ['06-lost','06 Can’t see your eyes','cant-see-your-eyes'],
  ['07-tired','07 Getting tired','getting-tired'], ['08-alarm','08 Microsleep alarm','microsleep-alarm'],
  ['09-summary','09 Trip summary','trip-summary'], ['05a-waze','05a Waze open · still watching','waze-open-still-watching'],
  ['05b-waze-tired','05b Tired while Waze is open','tired-while-waze-is-open'],
];
for (const [name] of screens) {
  await copyFile(join(app, `design/drive/${name}.png`), join(publicReview, `${name}-figma.png`));
  await copyFile(join(docs, `drive-${name}.png`), join(publicReview, `${name}-app.png`));
}
const style = `body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#eef1f7;color:#282828}header{max-width:900px}h1{margin:0 0 12px}p{line-height:1.5}a{color:#1b2a4e}nav{display:flex;gap:14px;flex-wrap:wrap;margin:24px 0}section{margin:40px 0}.pair{display:flex;gap:24px;overflow-x:auto;padding-bottom:12px}figure{margin:0;flex:0 0 430px}figcaption{margin-bottom:10px;font-weight:600}img{width:430px;height:932px;border-radius:12px;display:block}.note{max-width:850px}.approved{padding:12px 16px;background:#fff;border-radius:12px}iframe{border:0;width:430px;height:932px;border-radius:12px;background:#fcfcfe}button{font:inherit;padding:10px 14px;border:1px solid #1b2a4e;border-radius:10px;background:white;color:#1b2a4e;cursor:pointer}.live{display:none}body.live-mode .live{display:block}body.live-mode .snapshot{display:none}`;
function html({local}) {
  const nav = screens.map(([name,title])=>`<a href="#${name}">${title}</a>`).join('');
  const sections = screens.map(([name,title,route])=>{
    const source = local ? `../../apps/web/design/drive/${name}.png` : `drive-watch/${name}-figma.png`;
    const rendered = local ? `drive-${name}.png` : `drive-watch/${name}-app.png`;
    const approved = name==='07-tired' ? '<p class="note approved">Approved difference: the app displays the existing warning Content layers that are hidden in this Figma frame. Their spacing, text and assets come from node 39:973.</p>' : '';
    const iframe = local ? '' : `<iframe class="live" loading="lazy" title="${title} running page" src="/drive/${route}"></iframe>`;
    return `<section id="${name}"><h2>${title}</h2>${approved}<div class="pair"><figure><figcaption>Figma reference</figcaption><img loading="lazy" alt="${title} Figma screenshot" src="${source}"></figure><figure><figcaption>Running app ${local ? '' : `<a href="/drive/${route}" target="_blank">Open page</a>`}</figcaption><img class="snapshot" loading="lazy" alt="${title} rendered page" src="${rendered}">${iframe}</figure></div></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dormathon Drive watch comparison</title><style>${style}</style><body><header><h1>Drive watch comparison</h1><p>Figma at left; browser rendering at right. Both use 430 × 932 pixels. On a phone, swipe each pair sideways. The app omits fake status bars and moves demo shortcuts behind three logo taps.</p><p>Corrected during review: static Inter optical sizing, maps caption, lost-eye footer text style, driving stats divider and Waze card padding. Browser checks cover 390/430px widths, navigation, local assets, footer position and safe areas.</p>${local ? '' : '<button id="live-toggle" aria-pressed="false">Show live pages</button>'}</header><nav>${nav}</nav>${sections}${local ? '' : '<script>document.querySelector("#live-toggle").onclick=function(){const live=document.body.classList.toggle("live-mode");this.setAttribute("aria-pressed",String(live));this.textContent=live?"Show verified screenshots":"Show live pages"}</script>'}</body></html>`;
}
await writeFile(join(docs,'drive-comparison.html'),html({local:true}));
await writeFile(join(app,'public/review/drive-watch.html'),html({local:false}));
const results = JSON.parse(await readFile(join(docs,'drive-browser-verification.json'),'utf8'));
console.log(`Comparison generated from verified screenshots (${results.checkedAt}); safe areas checked: ${results.safeAreaVerified}.`);
