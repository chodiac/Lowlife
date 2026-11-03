# LOWLIFE / PARTYLIFE — sajt izdanja 2027

Statičan sajt (HTML + CSS + ES moduli, GSAP/ScrollTrigger sa cdnjs). Bez build koraka, bez backenda.

```bash
python tools/serve.py 5230     # http://localhost:5230
```
Dev flagovi: `?motion=full` (forsira animirani režim), `?motion=reduced` (mirna verzija).

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
| Boje / tipografija | `:root` u `css/style.css` — paleta #020008 · #190526 · #5a1b9a · #28f0ff · #ff3cf0 |
| Logo / favicon | `assets/logo.svg` (vektorizovan iz dostavljenog PNG-a), `assets/favicon.svg`, `apple-touch-icon.png` |

## Šta je ilustrativno
Nema stvarnih LOWLIFE fotografija u projektu. Svi „kadrovi“ su proceduralne SVG ilustracije (`js/art.js`), označene kao
ilustrativne. Zamenjuju se postavljanjem `src` u `gallery[]` i `photo` kod izvođača.
Open Graph slika `assets/og.jpg` je privremena grafika, zameniti.

## Izvori za arhivu
- 2025: Respublica 034 (datumi, mesto, lista izvođača, nastupi 20:30–05:00).
- 2026: Gigstix listing i bio zvaničnog Instagram profila (20–21. avgust 2026, Knežev arsenal). Lineup 2026 nije proveren.
