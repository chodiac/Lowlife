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
| Kategorije i cene karata | `tickets[]` (prazno = „Uskoro“) |
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

## Fotografije, klipovi i hero video
- **Galerija:** `assets/photos/<id>.webp` (+ `-sm`), registar `gallery[]` u `config.js` (kategorija, alt, `year`/`credit` = null dok se ne potvrde). Filter po kategorijama se prikazuje sam kad ima bar 2 kategorije sa bar 2 fotografije.
- **Klipovi:** `clips[]` u `config.js`, vertikalni 720×1280 sa zvukom (`assets/video/klip-N.mp4`). U traci se vrte bez zvuka samo dok su na ekranu; klik otvara prozor sa zvukom.
- **Hero video:** `assets/video/hero-1080.mp4` (desktop) i `hero-540.mp4` (telefon, zapravo 720p), isečak 1:07–1:21 iz DJI_0019.MP4 (original nije u repou).

## Lineup 2027 i odbrojavanje
- **Novo ime:** u `artists[]` dodaj `a('Ime', 1, { edition: 2027, status: 'confirmed', photo: 'assets/artists/ime.webp' })` (fotografija je opciona, bez nje ide tipografski poster). Ime zauzima prvo prazno mesto, a prazna mesta (`festivalConfig.lineupSlots`, samo vizuelno) se smanjuju. Naslov postaje „LINEUP 2027".
- **Odbrojavanje:** `festivalConfig.countdown.target` = ISO datum objave (npr. `'2027-02-01T20:00:00+01:00'`). Dok je `null`, cifre ostaju „--" (nema izmišljenog datuma). Kad datum prođe, prikazuje se `doneLabel`.
