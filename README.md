# LOWLIFE / PARTYLIFE — sajt izdanja 2027

Statičan sajt (HTML + CSS + ES moduli, GSAP/ScrollTrigger sa cdnjs). Bez build koraka, bez backenda.

```bash
python tools/serve.py 5230     # http://localhost:5230
```
Animacije su uvek uključene (i kad OS traži smanjeno kretanje). `?motion=reduced` daje mirnu verziju bez pina i reveal-a.

## Gde se šta menja — `js/config.js`
| Šta | Gde |
|---|---|
| Godina izdanja | `festivalConfig.year` |
| Datum / lokacija | `festivalConfig.dates`, `festivalConfig.venue` (+ `structuredData: true` za Event JSON-LD) |
| Faza sajta | `festivalConfig.state`: `announce` → `lineup` → `sale` |
| Ticketing link | `festivalConfig.ticketUrl` (CTA postaje „Uzmi kartu“ kad je `state:'sale'`) |
| Kategorije i cene karata | `tickets[]` (prazno = „Sledeća runda stiže“) |
| Izvođači 2027 | `artists[]` sa `edition: 2027, status: 'confirmed'` |
| Fotografije izvođača, opisi, linkovi | `artist.photo`, `artist.bio`, `artist.links` |
| Raspored / satnice | `schedule[]` |
| Galerija | `gallery[]` (`src`, `w`, `h`, `year`, `illustrative:false`) |
| Aftermovie | `festivalConfig.aftermovie` |
| Utisci publike | `testimonials[]` (samo odobreni) |
| Info, FAQ, kanali, partneri | `info[]`, `faq[]`, `socials[]`, `partners[]` |
| Boje / tipografija | `:root` u `css/style.css` — paleta #04010a · #1f0933 · #7c2cff · #00ffd5 · #f5f5ff |
| Logo / favicon | `assets/logo.svg` (vektorizovan iz dostavljenog PNG-a), `assets/favicon.svg`, `apple-touch-icon.png` |

## Fotografije izvođača
`assets/artists/<id>.webp` (640×800, 4:5) + `<id>-320.webp`, svi isti duotone u paleti sajta (crna → violet → bela). Registar je `PHOTOS` u `config.js`. Originali su u `assets/_originals/` (nisu u repou). Rie i Napoleon su niske rezolucije, pa su malo zrnasti; zameniti većim fajlovima ako postoje.

## Šta je ilustrativno
Nema stvarnih LOWLIFE fotografija u projektu. Svi „kadrovi“ su proceduralne SVG ilustracije (`js/art.js`), označene kao
ilustrativne. Zamenjuju se postavljanjem `src` u `gallery[]` i `photo` kod izvođača.
Open Graph slika `assets/og.jpg` je privremena grafika, zameniti.

## Izvori za arhivu
- 2025: Respublica 034 (datumi, mesto, lista izvođača, nastupi 20:30–05:00).
- 2026: Gigstix listing i bio zvaničnog Instagram profila (20–21. avgust 2026, Knežev arsenal). Lineup 2026 nije proveren.
