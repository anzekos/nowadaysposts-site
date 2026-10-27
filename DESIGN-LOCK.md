# DESIGN LOCK - NowaDaysPosts

Zaklenjeno: 2026-10-27. Vsaka sprememba tukaj, preden se spremeni koda.

## Design read
Berem kot: affiliate "shoppable" home-decor revija za ameriško Pinterest občinstvo (večinoma
mobilno), topel uredniški a praktičen jezik, nagnjeno k fotografiji izdelka v prostoru + mirnemu UI.

## Estetika
AKTIVEN PRESET: noben
Osnova: design-taste-frontend (velja vedno)

IZKLJUČENO za ta projekt:
- high-end-visual-design
- minimalist-ui
- industrial-brutalist-ui
- gpt-taste

Razlog: konverzija in zaupanje pred vtisom. Fotografije izdelkov nosijo videz; preseti bi dodali
prostor in efekte, ki zmanjšajo število izdelkov na zaslon.

## Dials
DESIGN_VARIANCE: 5   (obstoječa ~3 simetrična; +2 = split hero, asimetrična polica)
MOTION_INTENSITY: 4  (obstoječa ~2; CSS prehodi na hover/press/overlay, brez scroll animacij)
VISUAL_DENSITY: 5    (obstoječa ~3; odstopanje navzgor, glej spodaj)

## Tokeni
Display:  Playfair Display Variable, 600-700, tracking -0.01em (samo naslovi H1-H3)
Body:     Plus Jakarta Sans Variable, 400-700 (UI, kartice, gumbi, besedilo)
Mono:     -
Tema:     light
Ozadje:   #f5f6f7  (canvas, hladno skoraj-belo)
Površina: #fdfdfd  (kartice, paneli)
Črta:     #e2e5e9
Besedilo: #1d232b / #556170 (sekundarno, 5,9:1 na ozadju)
Akcent:   #9c5438  (terakota, edini akcent; hover #7f4229; nežna podlaga #f4e9e3)
Radiji:   interaktivno (gumbi, čipi, vnosna polja) = pill; slike in kartice = 12 px (rounded-xl)
Sence:    samo kartica na hover: 0 10px 30px rgb(29 35 43 / 0.10); sicer brez
Sekcije:  py-14 (mobilno) / py-20 (namizje)

## Motion
Press 140ms / UI 200ms / Overlay 260ms / Reveal - (ni scroll revealov)
Easing: cubic-bezier(0.23, 1, 0.32, 1) za vstope; nikoli ease-in
Press: scale(0.97) na :active
Reduced motion: vsi prehodi -> 0 ms, slika na hover se ne poveča

## Reference
- Pinterest (mreža v 2 stolpcih, slika = vstopna točka): način brskanja občinstva
- Lastne Flow scene v ai-assets/: vizualni jezik strani je ta fotografija

## Odstopanja od skupnih pravil
- **VISUAL_DENSITY 5 namesto "ujemi obstoječe" (3):** več izdelkov na zaslon je glavni
  konverzijski vzvod (obstoječa stran: 1 izdelek na mobilni zaslon).
- **Serif (Playfair Display):** stran je dnevna uredniška "edit" revija za home decor; serif je
  žanrski signal kuratorstva. Fraunces (prejšnja) je prepovedan kot privzet, zato zamenjava.
- **Pomišljaji v vsebini:** blog markdown (piše dnevna rutina) in pravna besedila ostanejo
  nedotaknjena (§11.F); pravilo "brez pomišljajev" velja za ves UI tekst, ki ga piše prenova.
- **Stack ostane Astro 4 + Tailwind 3** (razlog v BRIEF.md).
- **Ikone:** Phosphor (`@phosphor-icons/core`, regular, uvoz kot raw SVG).
