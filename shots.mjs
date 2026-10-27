/**
 * Posnetki zaslona na več širinah + lovljenje napak v konzoli.
 *
 * Namestitev v projekt:
 *   npm i -D playwright
 *   (uporablja nameščen Chrome prek channel:'chrome' - ne prenaša brskalnika)
 *
 * Uporaba:
 *   node shots.mjs                          # http://localhost:4321, 380/768/1440
 *   node shots.mjs http://localhost:4321/kontakt
 *   node shots.mjs http://localhost:4321 380,1440
 *
 * POMEMBNO: po vsakem `npm i` ponovno zaženi dev server, sicer Vite optimizer
 * cache razpade in posnameš stran z napako namesto strani.
 *
 * Za koncno preverjanje snemaj `npm run preview` (produkcijski build), ne `astro dev`.
 * Dev server prilepi Astrovo orodno vrstico - temen oval, ki se na fullPage posnetku
 * pojavi sredi strani in izgleda kot napaka v postavitvi.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:4321';
const widths = (process.argv[3] ?? '380,768,1440').split(',').map(Number);
const slug = new URL(url).pathname.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'index';

await mkdir('shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];

  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`[404/failed] ${r.url()}`));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Preskrolaj do dna in nazaj, da se sprozijo scroll-reveal animacije in lazy
  // slike. Brez tega fullPage posnetek pokaze prazne sekcije - IntersectionObserver
  // se sprozi glede na resnicni viewport, ne glede na razsirjeni posnetek.
  await page.evaluate(async () => {
    // scroll-behavior: smooth bi gladko animiral vsak skok in ob 120ms koraku
    // stran nikoli ne bi prisla do dna. Za cas sweepa ga izklopimo.
    const prej = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const korak = Math.round(window.innerHeight * 0.8);
    const dno = () =>
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    for (let y = 0; y < dno(); y += korak) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 250));

    document.documentElement.style.scrollBehavior = prej;
  });
  await page.waitForLoadState('networkidle');

  // vodoravni preliv je najpogostejsa mobilna napaka in se na posnetku slabo vidi
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );

  const path = `shots/${slug}-${width}.png`;
  await page.screenshot({ path, fullPage: true });

  console.log(`\n${width}px  ->  ${path}`);
  if (overflow) {
    console.log('  ! VODORAVNI PRELIV - stran je širša od viewporta');
    problems++;
  }
  for (const e of errors) {
    console.log(`  ! ${e}`);
    problems++;
  }
  if (!overflow && errors.length === 0) console.log('  cisto');

  await page.close();
}

await browser.close();
console.log(problems ? `\n${problems} tezav. Popravi in ponovi.` : '\nBrez tezav.');
process.exit(problems ? 1 : 0);
