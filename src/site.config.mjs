// Centralna konfiguracija znamke — uredi tu in se posodobi povsod.
export const SITE = {
  name: 'NowaDaysPosts',
  tagline: 'Trending home decor finds, handpicked daily.',
  // Privzeti meta description. Tagline je prekratek: Google reze pri ~160
  // znakih, pod ~70 pa si sam napise izvlecek iz strani.
  description:
    'The home decor pieces trending on Pinterest right now, hand-picked daily and filtered to a 4.5 star rating or better on Amazon. New finds most days, no fluff.',
  // javni URL strani (Cloudflare Pages). Ob menjavi domene zamenjaj tu:
  url: 'https://nowadaysposts.pages.dev',
  // Google Analytics 4 Measurement ID (oblika 'G-XXXXXXXXXX'). Pusti prazno = GA izklopljen.
  // Prilepi svoj ID iz GA4 (Admin → Data streams → tvoj stream → Measurement ID).
  gaId: 'G-GMRJSJP144',
  disclosureShort: 'As an Amazon Associate I earn from qualifying purchases.',
  // Kontaktni e-naslov. Obvezen: 6. clen ZEPT zahteva neposreden in ucinkovit
  // stik, GDPR pa naslov, kamor gredo zahteve po vpogledu in izbrisu.
  // Pusti prazno = na pravnih straneh se izpise vidna oznaka namesto naslova.
  // NIKOLI ne vpisi naslova, ki ne obstaja.
  contactEmail: '',
  // navigacijske strani (poleg kategorij, ki se generirajo iz produktov)
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Disclosure', href: '/disclosure' },
  ],
};
