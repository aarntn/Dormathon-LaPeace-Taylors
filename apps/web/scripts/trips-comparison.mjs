import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(fileURLToPath(new URL('..', import.meta.url)));
const docs = resolve(app, '../../docs/review');
const screens = [
  ['Trips', 'trips', 'Header at y66; pattern card at y142; five history rows and the shared Trips tab bar.'],
  ['When you get tired', 'when-you-get-tired', 'Original time-of-day chart, facts at y405 and night-reminder panel at y549. The source Demo link lives in the hidden triple-tap-logo panel.'],
  ['Late drive heads-up', 'late-drive-heads-up', 'Original moon and bullet SVGs, 72px icon, reasons at y281 and plan at y456. Start with the plan opens Mount your phone.'],
];
const css = 'body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#eef1f7;color:#282828}header,.note{max-width:900px}p{line-height:1.5}h1{margin:0 0 12px}nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}a{color:#1b2a4e}section{margin:40px 0}.pair{display:flex;gap:24px;overflow-x:auto;padding-bottom:12px}figure{flex:0 0 430px;margin:0}figcaption{font-weight:600;margin-bottom:10px}img,iframe{display:block;width:430px;height:932px;border:0;border-radius:12px;background:#fcfcfe}button{font:inherit;padding:10px 14px;background:white;border:1px solid #1b2a4e;border-radius:10px;color:#1b2a4e;cursor:pointer}.live{display:none}body.live-mode .live{display:block}body.live-mode .snapshot{display:none}';
function html(local) {
  const nav = screens.map(([title], i) => `<a href="#t${i + 1}">T${i + 1} ${title}</a>`).join('');
  const sections = screens.map(([title, route, note], i) => {
    const n = i + 1;
    const source = local ? `figma-t${n}.png` : `trips/t${n}-figma.png`;
    const rendered = local ? `trips-t${n}.png` : `trips/t${n}-app.png`;
    return `<section id="t${n}"><h2>T${n} ${title}</h2><p class="note">${note}</p><div class="pair"><figure><figcaption>Figma reference</figcaption><img loading="lazy" alt="T${n} Figma reference" src="${source}"></figure><figure><figcaption>Running app ${local ? '' : `<a target="_blank" href="/trips/${route}">Open page</a>`}</figcaption><img class="snapshot" loading="lazy" alt="T${n} rendered app" src="${rendered}">${local ? '' : `<iframe class="live" loading="lazy" title="T${n} ${title} live" src="/trips/${route}"></iframe>`}</figure></div></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dormathon Trips comparison</title><style>${css}</style><body><header><h1>Trips comparison</h1><p>Figma at left; browser rendering at right. Both use 430 × 932 pixels. On a phone, swipe each pair sideways.</p><p>The app omits the fake status bar, hides the Demo link and reuses the shared 40px icon buttons, 56px buttons and tab bar. Actions sit 34px above the bottom edge. Text antialiasing can differ from Figma.</p><p>Trips, charts and risk reasons use Figma sample values. Night-reminder choice is held for this session; scheduled reminders, risk prediction and the more sensitive alarm come in later phases.</p>${local ? '' : '<p><a href="/trips/trips">Open Trips</a></p><button id="live-toggle" aria-pressed="false">Show live pages</button>'}</header><nav>${nav}</nav>${sections}${local ? '' : '<script>document.querySelector("#live-toggle").onclick=function(){const active=document.body.classList.toggle("live-mode");this.setAttribute("aria-pressed",String(active));this.textContent=active?"Show verified screenshots":"Show live pages"}</script>'}</body></html>`;
}
for (const folder of ['public', 'dist']) {
  const root = join(app, folder, 'review');
  await mkdir(join(root, 'trips'), { recursive: true });
  for (let n = 1; n <= 3; n++) {
    await copyFile(join(docs, `figma-t${n}.png`), join(root, `trips/t${n}-figma.png`));
    await copyFile(join(docs, `trips-t${n}.png`), join(root, `trips/t${n}-app.png`));
  }
  await writeFile(join(root, 'trips.html'), html(false));
}
await writeFile(join(docs, 'trips-comparison.html'), html(true));
console.log('Three Trips comparison pairs generated.');
