# BRIEF - NowaDaysPosts prenova (2026-10-27)

## Kaj je stran
Lastna affiliate stran (ne stranka): dnevno izbrani home-decor izdelki z Amazona, blog "edit"
vsak dan, newsletter (Brevo). Obiskovalci so ameriški, večinoma z mobilnih naprav, pridejo s
Pinteresta, iz newsletterja in z Googla. Edina konverzija = klik na Amazon (affiliate tag).

- Namen: **redesign - prenova vizualnega sloja** za več klikov na Amazon
- Način: **PRODUKCIJA** (pravi podatki, 563 izdelkov, 85 blog objav)
- Jezik strani: angleščina (ostane)
- Funkcionalnosti: statika + Cloudflare Pages Function `/subscribe` (Brevo). Nič novega na strežniku.

## Kaj se NE spreminja (redesign pravila, design-taste-frontend §11.F)
- URL-ji: `/`, `/shop`, `/<kategorija>`, `/blog`, `/blog/<slug>`, pravne strani, 404
- Imena v navigaciji: Home, Shop, Blog, About
- Pravna besedila (privacy, cookies, terms, disclosure) in besedilo ob prijavi na newsletter
- Logika privolitve (Consent Mode v2, nič pred izbiro, `ndp_consent` v localStorage, verzija 1)
- Imena gumbov `Only necessary` / `Accept analytics`, ime dialoga z besedo "cookies" (qa-legal.mjs)
- Obrazec za newsletter (`#newsletter-form`, polje `email`, POST na `/subscribe`)
- Vsebina blogov (markdown) in polja frontmatterja (dnevna rutina jih piše)
- `rel="nofollow sponsored noopener"` na vseh Amazon povezavah

## Stack
Ostane **Astro 4.16 + Tailwind 3.4** (odstopanje od web-studio Faza 2 "vedno Astro 7 + Tailwind v4").
Razlog: produkcijski cevovod (build_site_data.py, dnevni avtomatski git push bloga, Pages build,
`@astrojs/sitemap` zaklenjen na 3.2.1, qa-legal.mjs). Migracija je ločena naloga z lastnim tveganjem.

## Kaj pravi analiza obstoječe strani (posnetki 2026-10-27)
- Piškotna pasica pokrije ~65 % mobilnega zaslona in ~50 % namizja.
- Prvi izdelek je na telefonu šele po ~1.800 px (besedilni hero, nato 9 velikih kategorij).
- Kartica izdelka: 1 na zaslon na telefonu, "kartica v kartici" (okvir je zapečen v JPG).
- Stran kaže Amazonove fotke na belem; 279/563 izdelkov ima naše Flow lifestyle slike (iste kot pin).
- Blog objava: naslov 6 vrstic, datum dvakrat, izdelki šele na dnu.
- Paleta krem + bež + espresso + zlata = najbolj prepoznaven AI podpis (design-taste §4.2).

## Konverzijska načela (research 2026-10-27, večinoma praktični testi, ne trdne študije)
1. Izdelki in CTA na prvem mobilnem zaslonu (affiliate CRO testi: product box above the fold).
2. Ista lifestyle slika kot na Pinterestu (vizualna kontinuiteta), razmerje 3:4.
3. Mreža v 2 stolpcih na telefonu (Pinterestov način brskanja), 4 na namizju.
4. CTA vedno pove cilj: **"Shop on Amazon"** (ena oznaka za ta namen na celi strani).
5. Blog: "Shop this edit" vrsta izdelkov takoj pod naslovom, polne kartice na koncu.
6. Sezonska polica (zdaj božič) na domači strani, ker se sezonsko iskanje dviga.
7. Kategorije kot kompaktni čipi, ne 9 velikih ploščic.
8. Kratko ime izdelka na kartici (del naslova za dvopičjem), poln naslov v alt.
9. Piškotna pasica kompaktna; "Only necessary" enako vidna kot "Accept analytics" (EDPB taskforce).
10. Hitrost: WebP 600 px, `width`/`height`, lazy pod pregibom, /shop z "Show more".

## [PREDPOSTAVKA]
- Brez dark mode: e-trgovinska norma, fotke izdelkov na belem in Amazon sta svetla; ena tema.
- Brez novih URL-jev (sezonska polica živi na domači strani, ne na lastni poti).
- Ocen ni nikjer (Associates §2(t)); razvrščanje po datumu, ne po oceni.
