import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(fileURLToPath(new URL('..', import.meta.url)));
const docs = resolve(app, '../../docs/review');
const screens = [
  ['Profile', 'profile', '60px avatar, stats card at y142/h177, current car at y362 and settings at y487. Shared Profile tab bar.'],
  ['Driving stats', 'driving-stats', 'Original monthly and hourly chart SVGs. Cards at y209/h248 and y477/h156; insights at y653. The source shows Month selected.'],
  ['My cars', 'my-cars', 'Original exported car illustration, 156px selected card and 154px second card. Add a car opens P4.'],
  ['Add a car', 'add-a-car', 'Shared search input with original search icon. Popular model filtering works; selecting a model follows the source return to My cars.'],
  ['Privacy and legal', 'privacy-and-legal', 'Source driving-aid notice, Your data and Legal groups with original icons. Data and legal actions are static in this UI phase.'],
];
const css = 'body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#eef1f7;color:#282828}header,.note{max-width:900px}p{line-height:1.5}h1{margin:0 0 12px}nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}a{color:#1b2a4e}section{margin:40px 0}.pair{display:flex;gap:24px;overflow-x:auto;padding-bottom:12px}figure{flex:0 0 430px;margin:0}figcaption{font-weight:600;margin-bottom:10px}img,iframe{display:block;width:430px;height:932px;border:0;border-radius:12px;background:#fcfcfe}button{font:inherit;padding:10px 14px;background:white;border:1px solid #1b2a4e;border-radius:10px;color:#1b2a4e;cursor:pointer}.live{display:none}body.live-mode .live{display:block}body.live-mode .snapshot{display:none}';
function html(local) {
  const nav = screens.map(([title], i) => `<a href="#p${i + 1}">P${i + 1} ${title}</a>`).join('');
  const sections = screens.map(([title, route, note], i) => {
    const n = i + 1;
    const source = local ? `figma-p${n}.png` : `profile/p${n}-figma.png`;
    const rendered = local ? `profile-p${n}.png` : `profile/p${n}-app.png`;
    return `<section id="p${n}"><h2>P${n} ${title}</h2><p class="note">${note}</p><div class="pair"><figure><figcaption>Figma reference</figcaption><img loading="lazy" alt="P${n} Figma reference" src="${source}"></figure><figure><figcaption>Running app ${local ? '' : `<a target="_blank" href="/profile/${route}">Open page</a>`}</figcaption><img class="snapshot" loading="lazy" alt="P${n} rendered app" src="${rendered}">${local ? '' : `<iframe class="live" loading="lazy" title="P${n} ${title} live" src="/profile/${route}"></iframe>`}</figure></div></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dormathon Profile comparison</title><style>${css}</style><body><header><h1>Profile comparison</h1><p>Figma at left; browser rendering at right. Both use 430 × 932 pixels. On a phone, swipe each pair sideways.</p><p>The app omits the fake status bar and reuses shared 40px icon buttons, 56px buttons and the tab bar. Footer controls sit 34px above the bottom edge, respecting safe areas. Text antialiasing can differ from Figma.</p><p>Profile and car data use the source sample values. Prototype links work. Controls without Figma actions, including account edits, alarm settings, car switching, plate scanning and legal/data operations, remain static. Month is the source stats period.</p>${local ? '' : '<p><a href="/profile/profile">Open Profile</a></p><button id="live-toggle" aria-pressed="false">Show live pages</button>'}</header><nav>${nav}</nav>${sections}${local ? '' : '<script>document.querySelector("#live-toggle").onclick=function(){const active=document.body.classList.toggle("live-mode");this.setAttribute("aria-pressed",String(active));this.textContent=active?"Show verified screenshots":"Show live pages"}</script>'}</body></html>`;
}
for (const folder of ['public', 'dist']) {
  const root = join(app, folder, 'review');
  await mkdir(join(root, 'profile'), { recursive: true });
  for (let n = 1; n <= 5; n++) {
    await copyFile(join(docs, `figma-p${n}.png`), join(root, `profile/p${n}-figma.png`));
    await copyFile(join(docs, `profile-p${n}.png`), join(root, `profile/p${n}-app.png`));
  }
  await writeFile(join(root, 'profile.html'), html(false));
}
await writeFile(join(docs, 'profile-comparison.html'), html(true));
console.log('Five Profile comparison pairs generated.');
