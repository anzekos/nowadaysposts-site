# NowaDaysPosts — pravno stanje strani

Stanje po pregledu 8. 9. 2026. QA: `node qa-legal.mjs http://localhost:4322`,
**181 preverjanj, vse zeleno**, vključno z axe-core (WCAG 2.1 AA) na vseh
osmih straneh.

---

## ENA STVAR, KI JO MORAŠ NAREDITI TI

`src/site.config.mjs` → `contactEmail: ''`

Dokler je prazno, se na `/privacy` in `/terms` namesto naslova izriše rdečkasta
oznaka `[ contact email ]`. Nisem vpisal naslova, ki ga nisem preveril.

To ni kozmetika: 6. člen ZEPT zahteva neposreden in učinkovit stik s
ponudnikom, GDPR pa naslov, kamor gredo zahteve po vpogledu in izbrisu. Brez
njega politika zasebnosti ne stoji. Vpiši en naslov, ki ga res bereš, in
oznaki izgineta obe hkrati.

---

## Kaj je bilo narobe in je zdaj popravljeno

**Politika zasebnosti je govorila neresnico.** Pisalo je, da stran »ne zbira
osebnih podatkov kot so ime ali e-pošta« in da bo analitika morda dodana
»v prihodnosti«. Oboje je bilo že takrat napačno: obrazec za e-novice pošilja
naslove v Brevo, GA4 pa je tekel od prvega piksla. Napisana je na novo, po
13. členu GDPR, in opisuje, kar se dejansko dogaja.

**GA4 se je nalagal brez privolitve.** Kršitev člena 5(3) direktive o
zasebnosti in elektronskih komunikacijah. Zdaj je v `<head>` samo Consent Mode
v2 s privzetim `denied` (navaden inline stub, ne pošlje ničesar), `gtag.js` pa
se prenese šele, ko obiskovalec pritisne *Accept analytics*.

**Pisavi sta se vlekli z Googlovih strežnikov.** `fonts.googleapis.com` je
dobil obiskovalčev IP, še preden je ta karkoli izbral — natanko to, zaradi
česar so v Nemčiji padle sodbe proti vgrajenim Google Fonts. Zdaj sta
`@fontsource-variable/fraunces` in `.../inter`, servirani z naše domene.

**404 ni obstajala.** Cloudflare Pages brez `404.html` servira `index.html` s
statusom **200** na katerikoli neznan naslov. Google to vidi kot neskončno
množico podvojenih strani. Dodana je `src/pages/404.astro`.

**robots.txt ni obstajal.** Da je na živi strani vračal 200, je bila ista
soft-404 napaka. Dodan je `public/robots.txt` s kazalcem na sitemap.

**Prijava na e-novice ni povedala ničesar.** Zdaj tik ob gumbu piše, da
naslov hrani Brevo na strežnikih v EU, za kaj se uporablja in kako se odjaviš.
Privolitev je dana s pritiskom na gumb, obvestilo pa mora biti dano ob
zbiranju, ne šele na pravni strani.

**Kontrast je padel na 61 mestih.** `muted` je bil 3,97:1 na bež podlagi,
belo besedilo na terakoti 3,6:1. Paleta v `tailwind.config.mjs` je
popravljena, s komentarji, zakaj. Za besedilo na temni škatli je nov žeton
`terracotta-light`, ker tam temnejši odtenek pade na 2,4:1.

**Nove strani:** `/cookies` (vsak piškotek poimensko) in `/terms` (uporaba
strani, da nismo prodajalec, cene in razpoložljivost, odgovornost).

**Varnostne glave** v `public/_headers`: CSP, HSTS, X-Frame-Options,
Permissions-Policy poleg obstoječih dveh.

---

## Kar je bilo že prej v redu

Afiliatno razkritje je bilo dobro postavljeno in ostaja: kratka oblika v
junaku, v nogi in na `/disclosure`. Vse produktne povezave imajo
`rel="nofollow sponsored noopener"`, kar zahtevata Google in Amazonov
Operating Agreement. Slike imajo `alt`, `width`/`height` in `loading="lazy"`.

---

## Druga stvar, ki je samo v Cloudflare nadzorni plosci

**Izklopi Web Analytics** na Pages projektu (Pages → nowadaysposts →
Settings → Web Analytics → Off).

Cloudflare v vsako stran sam vbrizga `static.cloudflareinsights.com/beacon.min.js`.
Ker ga vbrizga platforma na strezniku, ga ni mogoce vezati na privolitev — ne
morem ga ustaviti iz kode. Tekel je torej brez privolitve, poleg GA4, in
meril isto stvar dvakrat.

Nova CSP ga zdaj blokira, kar je pravi rezultat glede zasebnosti, a pusti
napako v konzoli na vsaki strani. Ko ga izklopis v nadzorni plosci, napaka
izgine in `qa-legal.mjs` gre spet v celoti zeleno.

Ce ga vseeno hoces obdrzati, ga je treba **oboje**: dodati
`https://static.cloudflareinsights.com` v `script-src` in `connect-src` v
`public/_headers`, in ga popisati v `/privacy` in `/cookies` kot obdelovalca.
Takrat pa ne drzi vec stavek, da se pred privolitvijo ne nalozi nic — in ta
stavek je zdaj na obeh straneh.

---

## Kaj nastavi izven kode

- **GA4 hramba podatkov** na 14 mesecev (Admin → Data Settings → Data
  Retention). Politika zasebnosti to trdi.
- **Brevo**: preveri, da ima vsak e-mail delujočo enoklikovno odjavo. Politika
  obljublja izbris ob odjavi.
- Ko spremeniš pravna besedila, popravi `updated` na vrhu prizadete strani.

---

## Če dodaš novo zunanjo storitev

Vtičnik, pisava, piksel, vgrajen zemljevid — vsakega je treba dopisati v:

1. `src/pages/cookies.astro` → tabela `rows`, in `src/pages/privacy.astro`
2. `public/_headers` → ustrezna direktiva v CSP

Sicer ga bo CSP tiho blokiral, `qa-legal.mjs` pa bo javil kršitev.

---

## Kako preveriš

```bash
npm run build
node serve-dist.mjs 4322        # posnema Cloudflare Pages, vključno s 404
node qa-legal.mjs http://localhost:4322
```

`serve-dist.mjs` obstaja zato, ker `npx serve -s dist` na vsak neznan naslov
vrne `index.html` z 200 in s tem prikrije natanko tisto napako, ki jo lovimo.
