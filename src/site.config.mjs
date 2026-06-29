// Centralna konfiguracija znamke — uredi tu in se posodobi povsod.
export const SITE = {
  name: 'NowaDaysPosts',
  tagline: 'Trending home decor finds, handpicked daily.',
  // javni URL strani (Cloudflare Pages). Ob menjavi domene zamenjaj tu:
  url: 'https://nowadaysposts.pages.dev',
  // Google Analytics 4 Measurement ID (oblika 'G-XXXXXXXXXX'). Pusti prazno = GA izklopljen.
  // Prilepi svoj ID iz GA4 (Admin → Data streams → tvoj stream → Measurement ID).
  gaId: 'G-GMRJSJP144',
  disclosureShort: 'As an Amazon Associate I earn from qualifying purchases.',
  // navigacijske strani (poleg kategorij, ki se generirajo iz produktov)
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Disclosure', href: '/disclosure' },
  ],
};
