/**
 * Pravni in tehnicni QA za NowaDaysPosts.
 *   npm run build && npx serve -s dist -l 4322
 *   node qa-legal.mjs http://localhost:4322
 *
 * Preverja privolitev pred sledenjem, pravne strani, meta podatke,
 * kanonicne naslove, alt besedila, afiliatna razkritja, 404, dostopnost
 * in mobilno razlicico.
 */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

const base = process.argv[2] ?? 'http://localhost:4322';
const b = await chromium.launch({ channel: 'chrome' });

let fails = 0;
let checks = 0;
const ok = (name, pass, extra = '') => {
  checks++;
  console.log(`${pass ? '  ok  ' : '  FAIL'} ${name}${extra ? '   ' + extra : ''}`);
  if (!pass) fails++;
};
const head = (t) => console.log(`\n---- ${t} ----`);

const ROUTES = ['/', '/shop', '/blog', '/about', '/disclosure', '/privacy', '/cookies', '/terms'];
const TRACKERS = /googletagmanager|google-analytics|analytics\.google|doubleclick|fonts\.googleapis|fonts\.gstatic/i;

/* ------------------------------------------- 1. privolitev pred sledenjem */
head('1. Privolitev pred sledenjem (GDPR / ePrivacy)');
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const tracker = [];
  p.on('request', (r) => TRACKERS.test(r.url()) && tracker.push(r.url()));

  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  ok('pasica se pokaze ob prvem obisku', await p.getByRole('dialog', { name: /cookies/i }).isVisible());
  ok('pred izbiro nic ne sledi in ni Google Fonts', tracker.length === 0, tracker.slice(0, 2).join(', '));

  const before = await ctx.cookies();
  ok('pred izbiro ni piskotkov', before.length === 0, before.map((c) => c.name).join(', '));

  await p.goto(`${base}/shop`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  ok('tudi na drugi strani brez izbire nic ne sledi', tracker.length === 0, tracker.slice(0, 2).join(', '));

  await p.goto(base, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  const accept = p.getByRole('button', { name: 'Accept analytics' });
  const reject = p.getByRole('button', { name: 'Only necessary' });
  const [ba, br] = [await accept.boundingBox(), await reject.boundingBox()];
  ok('oba gumba sta priblizno enako velika',
     !!ba && !!br && Math.abs(ba.width - br.width) < 12 && Math.abs(ba.height - br.height) < 4,
     ba && br ? `${Math.round(ba.width)}x${Math.round(ba.height)} vs ${Math.round(br.width)}x${Math.round(br.height)}` : '');

  await reject.click();
  await p.waitForTimeout(1200);
  ok('po zavrnitvi pasica izgine', await p.getByRole('dialog', { name: /cookies/i }).isHidden());
  ok('po zavrnitvi se vedno nic ne sledi', tracker.length === 0, tracker.slice(0, 2).join(', '));
  ok('po zavrnitvi ni piskotkov', (await ctx.cookies()).length === 0);

  await p.goto(`${base}/cookies`, { waitUntil: 'domcontentloaded' });
  await p.getByRole('button', { name: /cookie settings/i }).first().click();
  await p.waitForTimeout(400);
  ok('gumb znova odpre plosco', await p.getByRole('dialog', { name: /cookies/i }).isVisible());
  await p.getByRole('button', { name: 'Accept analytics' }).click();
  await p.waitForTimeout(2500);
  ok('po privolitvi se GA nalozi', tracker.some((u) => /googletagmanager/i.test(u)), String(tracker.length));

  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  ok('izbira se pomni po osvezitvi', await p.getByRole('dialog', { name: /cookies/i }).isHidden());
  await ctx.close();
}

/* --------------------------------------------------------- 2. meta podatki */
head('2. Meta podatki, kanonicni naslovi, alt besedila');
const links = new Set();
const titles = [];
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  for (const route of ROUTES) {
    const res = await p.goto(base + route, { waitUntil: 'domcontentloaded' });
    const info = await p.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content ?? '',
      h1: [...document.querySelectorAll('h1')].length,
      imgNoAlt: [...document.querySelectorAll('img')].filter((i) => i.getAttribute('alt') === null).length,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
      lang: document.documentElement.lang,
      icon: !!document.querySelector('link[rel~="icon"]'),
      // Samo afiliatne povezave (imajo tag=) rabijo nofollow sponsored.
      // Navadna povezava na Amazonovo politiko zasebnosti je ne sme imeti.
      badRel: [...document.querySelectorAll('a[href*="amazon."]')]
        .filter((a) => /[?&]tag=/.test(a.href))
        .filter((a) => !/sponsored/.test(a.rel) || !/nofollow/.test(a.rel)).length,
    }));
    info.links.forEach((l) => links.add(l));
    titles.push(info.title);

    const label = route.padEnd(12);
    ok(`${label} status 200`, res.status() === 200, String(res.status()));
    ok(`${label} title 10-65 znakov`, info.title.length >= 10 && info.title.length <= 65, `${info.title.length}`);
    ok(`${label} description 70-165`, info.desc.length >= 70 && info.desc.length <= 165, `${info.desc.length}`);
    ok(`${label} kanonicni je lasten`, info.canonical.replace(/\/$/, '').endsWith(route.replace(/\/$/, '')), info.canonical);
    ok(`${label} natanko en h1`, info.h1 === 1, String(info.h1));
    ok(`${label} vsaka slika ima alt`, info.imgNoAlt === 0, String(info.imgNoAlt));
    ok(`${label} amazon povezave so nofollow sponsored`, info.badRel === 0, `${info.badRel} brez`);
    ok(`${label} lang, favicon, og`, info.lang === 'en' && info.icon && !!info.ogTitle);
  }
  ok('vsi naslovi so razlicni', new Set(titles).size === titles.length);
  await ctx.close();
}

/* ------------------------------------------------- 3. 404, robots, sitemap */
head('3. 404, robots.txt, sitemap, varnostne glave');
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();

  const nf = await p.goto(`${base}/ta-stran-ne-obstaja`);
  const nfInfo = await p.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent ?? '',
    robots: document.querySelector('meta[name="robots"]')?.content ?? '',
    home: !!document.querySelector('a[href="/"]'),
  }));
  ok('404 je lastna stran, ne domaca', /out of stock/i.test(nfInfo.h1), nfInfo.h1.slice(0, 40));
  ok('404 je noindex', /noindex/.test(nfInfo.robots), nfInfo.robots);
  ok('404 ponuja pot nazaj', nfInfo.home);

  const robots = await (await p.goto(`${base}/robots.txt`)).text();
  ok('robots.txt kaze na sitemap', /Sitemap:/i.test(robots), robots.split('\n')[0]);

  const sm = await p.goto(`${base}/sitemap-index.xml`);
  ok('sitemap obstaja', sm.status() === 200, String(sm.status()));
  await ctx.close();
}

/* ---------------------------------------------- 4. konzola, CSP, povezave */
head('4. Napake v konzoli in pokvarjene notranje povezave');
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push(String(e)));
  for (const route of ROUTES) {
    await p.goto(base + route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(250);
  }
  const csp = errs.filter((e) => /Content Security Policy|Refused to/i.test(e));
  ok('nobene krsitve CSP', csp.length === 0, csp.slice(0, 2).join(' | '));
  ok('nobene napake v konzoli', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();

  const internal = [...links].filter((u) => u.startsWith(base));
  const seen = new Set();
  for (const u of internal) {
    const clean = u.split('#')[0];
    if (seen.has(clean)) continue;
    seen.add(clean);
    const r = await fetch(clean);
    ok(`notranja ${clean.replace(base, '') || '/'}`, r.status === 200, String(r.status));
  }
}

/* ------------------------------------------ 5. razkritje in prijava na list */
head('5. Afiliatno razkritje in prijava na e-novice');
{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'domcontentloaded' });
  await p.getByRole('button', { name: 'Only necessary' }).click();
  await p.waitForTimeout(400);

  const disc = await p.getByText(/As an Amazon Associate/i).count();
  ok('razkritje je na domaci strani', disc > 0, `${disc} pojavitev`);

  const brevo = await p.getByText(/stored with/i).count();
  ok('prijava pove, kdo obdeluje naslov', brevo > 0);
  const privLink = await p.locator('form#newsletter-form ~ p a[href="/privacy"], a[href="/privacy"]').count();
  ok('povezava na politiko zasebnosti je ob obrazcu', privLink > 0);

  // razkritje mora biti na vsaki strani z izdelki
  for (const r of ['/shop', '/blog']) {
    await p.goto(base + r, { waitUntil: 'domcontentloaded' });
    ok(`${r.padEnd(7)} ima razkritje`, (await p.getByText(/As an Amazon Associate/i).count()) > 0);
  }
  await ctx.close();
}

/* -------------------------------------------- 6. dostopnost in mobilna slika */
head('6. Dostopnost (axe-core) in mobilna razlicica');
{
  for (const route of ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 780 } });
    const p = await ctx.newPage();
    await p.goto(base + route, { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Only necessary' }).click().catch(() => {});
    await p.waitForTimeout(500);

    await p.addScriptTag({ content: axeSource });
    const res = await p.evaluate(async () =>
      await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }));
    const v = res.violations;
    ok(`${route.padEnd(12)} axe brez krsitev`, v.length === 0,
       v.map((x) => `${x.id}(${x.nodes.length})`).join(', '));

    const overflow = await p.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    ok(`${route.padEnd(12)} brez vodoravnega drsenja`, overflow <= 1, `${overflow}px`);
    await ctx.close();
  }
}

console.log(`\n${fails === 0 ? 'VSE OK' : fails + ' NAPAK'} od ${checks} preverjanj`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
