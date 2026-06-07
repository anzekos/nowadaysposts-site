# The Cozy Nest — affiliate stran (Astro + Tailwind)

Statična home-decor affiliate stran, ki prikazuje iste Amazon produkte kot
Pinterest pipeline (`../winners.json`), z affiliate linki. **Brez prikaza cen**
(Amazon compliance) in z **lastnimi self-hostanimi slikami** (ne hotlinkamo
Amazon CDN-ja).

## Stack
- **Astro** (statičen output, top SEO/Core Web Vitals)
- **Tailwind CSS** (oblikovanje)
- Hosting: **Netlify** (free tier; statična stran)

## Struktura
```
site/
  build_site_data.py     # ../winners.json -> src/data/products.json + public/img/*.jpg
  src/
    site.config.mjs      # ime znamke, URL, disclosure (uredi tu)
    layouts/Layout.astro
    components/           # Header, Footer, ProductCard
    pages/
      index.astro        # hero + trending grid
      [category].astro   # kategorijske strani (Mirrors, Curtains, Rugs, ...)
      disclosure.astro   # OBVEZNO (Amazon Associates)
      about.astro
      privacy.astro
    data/products.json   # GENERIRANO (build_site_data.py)
  public/
    img/*.jpg            # GENERIRANE web kartice
    favicon.svg
```

## Lokalni razvoj
```bash
cd site
npm install                 # enkratno
python build_site_data.py   # zgradi products.json + slike iz ../winners.json
npm run dev                 # http://localhost:4321
```
`npm run build` zgradi v `dist/` (statične datoteke za deploy).

## Posodobitev vsebine
Ko Pinterest pipeline izbere nove produkte (`../winners.json`), samo poženi:
```bash
python build_site_data.py   # (ali: npm run data)
```
in stran ima nove produkte. Affiliate linki + kategorije se zgradijo samodejno.
Kategorijo per ASIN nastaviš v `build_site_data.py` (slovar `CATEGORY`); če manjka,
se ugane iz naslova.

## Deploy na Netlify (kasneje)
1. **Domena/branding:** v `src/site.config.mjs` in `astro.config.mjs` zamenjaj
   `https://cozy-nest.netlify.app` z dejansko domeno; po želji preimenuj znamko.
2. **(SEO) sitemap:** dodaj nazaj `@astrojs/sitemap` z združljivo verzijo:
   `npm i @astrojs/sitemap@latest` → v `astro.config.mjs` dodaj `sitemap()` v `integrations`.
3. **Netlify nastavitve** (Site settings → Build & deploy):
   - Base directory: `site`
   - Build command: `npm run build`  *(opcijsko: `python build_site_data.py && npm run build`,
     a Netlify build okolje rabi Python + dostop do `../winners.json` — enostavneje je
     `products.json` + `public/img/` **commitati** in graditi samo `npm run build`.)*
   - Publish directory: `site/dist`
4. **Git deploy:** poveži repo na Netlify → auto-build ob `git push`.
   Ali ročno: `npx netlify deploy --dir=dist --prod`.
5. **Amazon Associates:** dodaj URL strani v svoj Associates račun (seznam spletnih
   mest) in počakaj na odobritev. Disclosure stran je obvezna (že vključena).

## Compliance opombe (pomembno)
- **Cene:** ne prikazujemo jih (Amazon dovoli prikaz cen le prek PA-API, sveže ≤24h).
  Gumbi vodijo na *"Check price on Amazon"*.
- **Slike:** generiramo lastne kartice; ko pridobiš PA-API (po 3 prodajah v 180 dneh),
  razmisli o uradnih PA-API/SiteStripe slikah.
- **Affiliate linki** imajo `rel="nofollow sponsored"` (Google + Amazon zahteva).
- **Obvezne strani:** Disclosure, Privacy, About — vse vključene.
