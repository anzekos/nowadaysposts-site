// Skupna logika za izdelke na strani (prenova 2026-10-27).
import products from '../data/products.json';
import photos from '../data/photos.json';

export { products };

// Najnovejši najprej; products.json je že tako urejen, a ga ne predpostavljamo.
export const byNewest = (a, b) => String(b.addedAt ?? '').localeCompare(String(a.addedAt ?? ''));

/**
 * Kratko ime za kartico. Naslovi so pisani za Pinterest ("Christmas Tree Ideas 2026: 6 Snow
 * Flocked Mini Trees ..."), na strani pa kupec išče izdelek, zato vzamemo del za dvopičjem.
 */
export function displayName(title = '') {
  const i = title.indexOf(':');
  if (i > 0) {
    const rest = title.slice(i + 1).trim();
    if (rest.split(/\s+/).length >= 3) return rest;
  }
  return title.trim();
}

/** Slika za mrežo: WebP iz manifesta, sicer stara kartica. */
export function photoFor(p) {
  const m = photos[p.slug];
  if (m) return m;
  return { src: p.image, kind: 'cutout', w: 1080, h: 1080 };
}

export function isNew(p, days = 10) {
  if (!p.addedAt) return false;
  return (Date.now() - new Date(p.addedAt).getTime()) / 86400000 <= days;
}

/** Kategorije s številom izdelkov in zadnjo sceno (za ploščice), največje najprej. */
export function categories() {
  const map = new Map();
  for (const p of [...products].sort(byNewest)) {
    const c = map.get(p.categorySlug) ?? { slug: p.categorySlug, name: p.category, count: 0, photo: null };
    c.count++;
    const ph = photoFor(p);
    if (!c.photo && ph.kind === 'scene') c.photo = ph;
    map.set(p.categorySlug, c);
  }
  return [...map.values()]
    .map((c) => ({ ...c, photo: c.photo ?? photoFor(products.find((p) => p.categorySlug === c.slug)) }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Sezonska polica: vrne {title, items} ali null. Okna so namenoma zgodnja, ker Pinterest
 * publika načrtuje 4-8 tednov vnaprej (analiza 2026-10-27, PIN_SEO.md).
 */
const SEASONS = [
  { from: '10-15', to: '12-26', title: 'Christmas, before the rush',
    rx: /christmas|xmas|ornament|santa|nutcracker|advent|gingerbread|snow ?flocked|tree topper|tree skirt|tree collar|stocking/i },
  { from: '09-01', to: '10-31', title: 'Halloween, the stylish way',
    rx: /halloween|spooky|ghost|skeleton|witch|spider|tombstone|cauldron|skull|haunted/i },
  { from: '08-15', to: '11-27', title: 'Fall and Thanksgiving table',
    rx: /\bfall\b|autumn|pumpkin|harvest|thanksgiving|maple leaf/i },
];

export function seasonalShelf({ today = new Date(), exclude = new Set() } = {}) {
  const md = today.toISOString().slice(5, 10);
  for (const s of SEASONS) {
    if (md < s.from || md > s.to) continue;
    const all = [...products].sort(byNewest).filter((p) => s.rx.test(p.title) && !exclude.has(p.asin));
    // Polne vrste na namizju (5 na vrsto): 10 ali 5, sicer police ni.
    const n = all.length >= 10 ? 10 : all.length >= 5 ? 5 : 0;
    if (n) return { title: s.title, items: all.slice(0, n) };
  }
  return null;
}
