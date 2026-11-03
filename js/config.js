/* ==========================================================================
   LOWLIFE / PARTYLIFE — sadržaj i konfiguracija
   Sve što se menja kad stignu zvanične informacije je OVDE.
   Nijedan podatak ispod nije izmišljen: što nije potvrđeno, stoji kao null.
   ========================================================================== */

/* --------------------------------------------------------------------------
   festivalConfig
   state:  'announce'  → najava (sada)
           'lineup'    → lineup objavljen (artists sa status:'confirmed')
           'sale'      → prodaja aktivna (CTA postaje „Uzmi kartu“)
   Dok je date/venue null, sajt piše „uskoro“. Nema countdowna.
   -------------------------------------------------------------------------- */
export const festivalConfig = {
  state: 'announce',
  name: 'LOWLIFE',
  sub: 'PARTYLIFE',
  year: 2027,                      // ← GODINA SLEDEĆEG IZDANJA
  city: 'Kragujevac',
  tagline: 'Tvoja ekipa. Tvoj zvuk. Noć koja ostaje.',
  siteUrl: null,                   // npr. 'https://lowlife.rs/' (za canonical / OG)
  dates: null,                     // { start:'2027-08-20', end:'2027-08-21', label:'20–21. avgust 2027.' }
  venue: null,                     // { name:'…', address:'…', mapsUrl:'…', confirmed:true }
  ticketUrl: null,                 // ← OVDE ide zvanični ticketing URL (npr. Gigstix)
  contact: null,                   // { email:'…', phone:'…' }
  aftermovie: null,                // { src:'assets/aftermovie.mp4', poster:'assets/aftermovie.jpg', title:'Aftermovie', year:2025 }
  structuredData: false,           // true tek kad su datum + lokacija potvrđeni
};

/* --------------------------------------------------------------------------
   editions — prošla i buduća izdanja, jasno odvojena
   status: 'past' | 'upcoming'
   -------------------------------------------------------------------------- */
export const editions = [
  {
    year: 2025,
    status: 'past',
    label: '15–16. avgust 2025.',
    venue: 'Knežev arsenal, Kragujevac',
    facts: [
      'Prvo izdanje, dva večera',
      '30+ domaćih izvođača: hip-hop, trap, alternativa',
      'Nastupi od 20:30 do 05:00',
      'Oko 3.000 posetilaca (procena organizatora)',
    ],
    source: {
      label: 'Respublica 034',
      url: 'https://respublica034.rs/media-hub-kragujevac/low-life-festival-u-kragujevcu-okupio-izvodjace-nove-generacije/',
    },
  },
  {
    year: 2026,
    status: 'past',
    label: '20–21. avgust 2026.',
    venue: 'Knežev arsenal, Kragujevac',
    facts: [
      'Početak u 20:00 (prema zvaničnom profilu)',
      'Spisak izvođača 2026. nije proveren iz zvaničnog izvora',
    ],
    source: {
      label: 'Gigstix listing',
      url: 'https://new.gigstix.com/event/low-life-kragujevac-avgust-2026/',
    },
  },
  {
    year: 2027,
    status: 'upcoming',
    label: 'Datum objavljujemo uskoro.',
    venue: null,
    facts: ['Lineup: prva imena uskoro', 'Karte: informacije o prodaji uskoro'],
    source: null,
  },
];

/* --------------------------------------------------------------------------
   artists
   edition: godina izdanja · status: 'archive' | 'confirmed'
   day:     1 | 2 | null     · photo: putanja do fotografije ili null
   bio:     kratak PROVEREN opis ili null
   links:   { spotify, youtube, instagram, ... } samo provereni
   Izvor za 2025: Respublica 034 (vidi editions[0].source).
   „confirmed“ + edition 2027 se automatski prikazuje u bloku „Lineup 2027“.
   -------------------------------------------------------------------------- */
const a = (name, day, extra = {}) => ({
  id: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name, edition: 2025, status: 'archive', day,
  photo: null, bio: null, links: {}, ...extra,
});

export const artists = [
  // — Prvi dan (15. avgust 2025.)
  a('Rie', 1), a('Nina Todorović', 1), a('Biba', 1), a('Napoleon', 1),
  a('Corona', 1), a('Rimski', 1), a('100K', 1), a('Arafat', 1),
  a('Faberge', 1), a('Kza', 1), a('Vekac', 1), a('Surreal', 1), a('Tasha', 1),
  // — Drugi dan (16. avgust 2025.)
  a('Diamond Costi', 2), a('Mila', 2), a('Momica', 2), a('Tanatos', 2),
  a('Jowam', 2), a('Rouzi', 2), a('Elena Kitić', 2), a('Atlas Erotika', 2),
  a('KIMMV-u', 2), a('Yungkulovski', 2), a('Fox', 2), a('TNG', 2), a('Mimi Mercedez', 2),
];

/* --------------------------------------------------------------------------
   schedule — prazno dok organizator ne objavi raspored.
   { artistId, edition, day, start:'22:30', stage:'Main stage' }
   Kad se popuni, lineup dobija satnice i filter po danima iz rasporeda.
   -------------------------------------------------------------------------- */
export const schedule = [];

/* --------------------------------------------------------------------------
   gallery — svaki fajl ima godinu. year:null = ilustrativni demo kadar.
   Kad stignu prave fotografije: stavi src ('assets/g/2025-01.jpg'),
   w/h (za stabilan odnos stranica), alt, credit, illustrative:false.
   -------------------------------------------------------------------------- */
export const gallery = [
  { id: 'g1', scene: 'crowd',  seed: 11, tone: 'orange', ratio: '4/5', span: 'tall',  cat: 'Publika',   alt: 'Ilustracija: publika ispred bine, podignute ruke u svetlu reflektora', year: null, src: null, credit: null, illustrative: true },
  { id: 'g2', scene: 'stage',  seed: 23, tone: 'yellow', ratio: '16/10', span: 'wide', cat: 'Bina',      alt: 'Ilustracija: bina i snopovi svetla', year: null, src: null, credit: null, illustrative: true },
  { id: 'g3', scene: 'lights', seed: 31, tone: 'ink',    ratio: '1/1',  span: '',      cat: 'Svetla',    alt: 'Ilustracija: reflektori u dimu', year: null, src: null, credit: null, illustrative: true },
  { id: 'g4', scene: 'crowd',  seed: 47, tone: 'white',  ratio: '3/4',  span: '',      cat: 'Publika',   alt: 'Ilustracija: silueta publike u kontra svetlu', year: null, src: null, credit: null, illustrative: true },
  { id: 'g5', scene: 'arch',   seed: 5,  tone: 'orange', ratio: '4/5',  span: '',      cat: 'Prostor',   alt: 'Ilustracija: svodovi i kapija prostora noću', year: null, src: null, credit: null, illustrative: true },
  { id: 'g6', scene: 'stage',  seed: 61, tone: 'ink',    ratio: '16/10', span: 'wide', cat: 'Bina',      alt: 'Ilustracija: bina u crvenom svetlu', year: null, src: null, credit: null, illustrative: true },
  { id: 'g7', scene: 'crowd',  seed: 73, tone: 'yellow', ratio: '1/1',  span: '',      cat: 'Ekipa',     alt: 'Ilustracija: ekipa u gomili', year: null, src: null, credit: null, illustrative: true },
  { id: 'g8', scene: 'lights', seed: 89, tone: 'orange', ratio: '3/4',  span: 'tall',  cat: 'Svetla',    alt: 'Ilustracija: svetlosni snopovi', year: null, src: null, credit: null, illustrative: true },
  { id: 'g9', scene: 'arch',   seed: 97, tone: 'white',  ratio: '16/10', span: 'wide', cat: 'Prostor',   alt: 'Ilustracija: arhitektura prostora u kontrastu', year: null, src: null, credit: null, illustrative: true },
];

/* --------------------------------------------------------------------------
   tickets — SAMO potvrđene opcije. Prazno = „Sledeća runda stiže.“
   { id, name, price:'3.000 RSD' | null, day:'…' | null, perks:['…'], url:null|'…', soldOut:false }
   Nema izmišljenog broja preostalih karata.
   -------------------------------------------------------------------------- */
export const tickets = [];

/* --------------------------------------------------------------------------
   testimonials — samo odobrene izjave. Prazno = poziv „Tvoj LOWLIFE trenutak“.
   { quote, author:'ime ili @username', year:2025, photo:null }
   -------------------------------------------------------------------------- */
export const testimonials = [];

/* --------------------------------------------------------------------------
   info — praktične informacije; confirmed:false → „Detalji uskoro.“
   archive: činjenica iz prošlog izdanja, jasno označena.
   -------------------------------------------------------------------------- */
export const info = [
  { id: 'lokacija', title: 'Lokacija i dolazak', icon: 'pin', confirmed: false, value: null,
    archive: 'Izdanja 2025. i 2026.: Knežev arsenal, Kragujevac. Lokacija 2027. nije potvrđena.',
    link: { label: 'Knežev arsenal na mapi', url: 'https://www.google.com/maps/search/?api=1&query=Kne%C5%BEev+arsenal+Kragujevac' } },
  { id: 'vreme', title: 'Vreme otvaranja', icon: 'clock', confirmed: false, value: null,
    archive: 'Prošla izdanja: večernji program do ranih jutarnjih sati (2025: 20:30–05:00).' },
  { id: 'ulaz', title: 'Pravila ulaska', icon: 'door', confirmed: false, value: null, archive: null },
  { id: 'godine', title: 'Starosna ograničenja', icon: 'age', confirmed: false, value: null, archive: null },
  { id: 'predmeti', title: 'Dozvoljeni i zabranjeni predmeti', icon: 'bag', confirmed: false, value: null, archive: null },
  { id: 'pristupacnost', title: 'Pristupačnost', icon: 'access', confirmed: false, value: null, archive: null },
  { id: 'kontakt', title: 'Kontakt organizatora', icon: 'mail', confirmed: true,
    value: 'Za sada najbrži kanal je Instagram poruka na zvaničnom profilu.', archive: null,
    link: { label: '@lowlifepartylife', url: 'https://www.instagram.com/lowlifepartylife/' } },
];

export const faq = [
  { q: 'Kada je LOWLIFE 2027?', a: 'Datum još nije objavljen. Čim organizator potvrdi termin, biće prvo na zvaničnom Instagram profilu, a zatim i ovde.' },
  { q: 'Gde se održava?', a: 'Prethodna dva izdanja (2025. i 2026.) održana su u Kneževom arsenalu u Kragujevcu. Lokacija izdanja 2027. nije potvrđena.' },
  { q: 'Ko nastupa 2027?', a: 'Prva imena uskoro. Izvođači koje vidiš na ovom sajtu pripadaju izdanju 2025. i jasno su tako označeni.' },
  { q: 'Gde se kupuju karte?', a: 'Informacije o prodaji objavljujemo uskoro. Karte ćemo povezati direktno sa zvaničnim ticketing linkom, bez posrednika.' },
  { q: 'Kako da ne propustim najavu?', a: 'Prati zvanični Instagram profil @lowlifepartylife. Sajt ne prikuplja email adrese dok se ne poveže sa pravim servisom za obaveštenja.' },
  { q: 'Ima li ograničenja po godinama?', a: 'Starosna pravila za 2027. još nisu objavljena. Kad budu potvrđena, pojaviće se u delu Info.' },
  { q: 'Mogu li da pošaljem svoju fotografiju ili utisak?', a: 'Možeš. Označi zvanični profil ili pošalji poruku, a uz tvoju dozvolu možemo da ti objavimo kadar i ime.' },
];

export const socials = [
  { id: 'instagram', label: 'Instagram', handle: '@lowlifepartylife', url: 'https://www.instagram.com/lowlifepartylife/', primary: true },
];

/* Samo stvarno potvrđeni partneri. Prazno = blok se ne prikazuje. */
export const partners = [];

/* Linkovi ka zvaničnim izvorima koji su korišćeni za arhivu */
export const sources = [
  { label: 'Izdanje 2025 — Respublica 034', url: editions[0].source.url },
  { label: 'Izdanje 2026 — Gigstix listing', url: editions[1].source.url },
];
