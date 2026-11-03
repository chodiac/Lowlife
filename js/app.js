import * as C from './config.js';
import { scene, posterColors } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const hasG = !!(window.gsap && window.ScrollTrigger);
if (!hasG) root.classList.remove('js');
else gsap.registerPlugin(ScrollTrigger);

const F = C.festivalConfig;
const sale = F.state === 'sale';
const artists = C.artists;
const archive = artists.filter((x) => x.status === 'archive');
const confirmed27 = artists.filter((x) => x.status === 'confirmed' && x.edition === F.year);

/* ======================= scenes ======================= */
function paintScenes(scope = document) {
  $$('[data-scene]', scope).forEach((el) => {
    if (el.dataset.painted) return;
    el.dataset.painted = '1';
    el.insertAdjacentHTML('afterbegin', scene(el.dataset.scene, +el.dataset.seed || 1, el.dataset.tone || 'orange'));
  });
}

/* ======================= state-driven copy ======================= */
function applyState() {
  $$('[data-year]').forEach((n) => (n.textContent = F.year));
  const chip = $('[data-edition-chip]');
  chip.textContent = F.dates ? `Izdanje ${F.year} · ${F.dates.label}` : `Izdanje ${F.year} · Datum uskoro`;
  $$('[data-cta]').forEach((a) => {
    if (sale && F.ticketUrl) {
      a.firstChild.textContent = 'Uzmi kartu ';
      a.href = F.ticketUrl; a.target = '_blank'; a.rel = 'noopener';
    }
  });
  if (sale) $('#tixTitle').innerHTML = 'UZMI<br>KARTU.';
  if (F.siteUrl) {
    const l = document.createElement('link'); l.rel = 'canonical'; l.href = F.siteUrl; document.head.append(l);
  }
  if (F.structuredData && F.dates && F.venue?.confirmed) {
    const ld = {
      '@context': 'https://schema.org', '@type': 'MusicEvent', name: `LOWLIFE / PARTYLIFE ${F.year}`,
      startDate: F.dates.start, endDate: F.dates.end, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: F.venue.name, address: F.venue.address },
      ...(F.ticketUrl ? { offers: { '@type': 'Offer', url: F.ticketUrl } } : {}),
    };
    const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.append(s);
  }
}

/* ======================= editions ======================= */
function renderEditions() {
  $('#editions').innerHTML = C.editions.map((e) => `
    <article class="ed ${e.status === 'upcoming' ? 'ed--next' : ''}" data-reveal>
      <span class="mono ed__tag">${e.status === 'upcoming' ? 'Sledeće izdanje' : 'Arhiva'}</span>
      <h3 class="ed__y">${e.year}</h3>
      <p class="ed__lab">${esc(e.label)}${e.venue ? `<br><span style="font-weight:400;font-size:15px">${esc(e.venue)}</span>` : ''}</p>
      <ul>${e.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${e.source ? `<a href="${e.source.url}" target="_blank" rel="noopener">Izvor: ${esc(e.source.label)} ↗</a>` : ''}
    </article>`).join('');
}

/* ======================= lineup 2027 ======================= */
function renderLineup27() {
  if (!confirmed27.length) return;
  $('#lineup27Title').innerHTML = '<span class="mask"><span>LINEUP</span></span> <span class="mask"><span class="o">' + F.year + '</span></span>';
  const box = $('#lineup27List'); box.hidden = false;
  box.innerHTML = confirmed27.map((x) => `<li>${esc(x.name)}</li>`).join('<li aria-hidden="true">/</li>');
  $('.lineup27 .lead').textContent = 'Potvrđena imena izdanja ' + F.year + '. Raspored po danima i satnice stižu kad ih organizator objavi.';
}

/* ======================= archive list ======================= */
const favs = new Set(store.get('lowlife:fav', []));
const A = { day: 'all', fav: false, active: null, opener: null };
const alist = $('#alist');
const byId = (id) => artists.find((x) => x.id === id);
const dayLabel = (d) => (d === 1 ? 'Dan 1' : d === 2 ? 'Dan 2' : '');
const dayDate = (x) => { const m = { 2025: { 1: '15. avgust 2025.', 2: '16. avgust 2025.' } }; return m[x.edition]?.[x.day] || ''; };
const slot = (x) => C.schedule.find((s) => s.artistId === x.id && s.edition === x.edition);

function renderList() {
  alist.innerHTML = archive.map((x, i) => {
    const [pb, pf] = posterColors(i);
    const s = slot(x);
    return `<li data-id="${x.id}" data-day="${x.day ?? ''}"><button type="button" class="alist__btn" data-id="${x.id}" aria-haspopup="dialog">
      <span class="alist__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="alist__name">${esc(x.name)}</span>
      <span class="alist__meta"><span class="tag tag--y">${x.edition}</span>${x.day ? `<span class="tag">${dayLabel(x.day)}</span>` : ''}${s ? `<span class="tag">${esc(s.start)}</span>` : ''}</span>
      <span class="alist__fav" aria-hidden="true">${favs.has(x.id) ? '★' : ''}</span>
      <span class="alist__thumb" style="--pb:${pb};--pf:${pf}" aria-hidden="true">${x.photoSm ? `<img src="${x.photoSm}" alt="" width="62" height="78" loading="lazy" decoding="async">` : `<span>${esc(x.name[0])}</span>`}</span>
    </button></li>`;
  }).join('');
}

function applyFilter() {
  let shown = 0;
  $$('li', alist).forEach((li) => {
    const x = byId(li.dataset.id);
    const ok = (A.day === 'all' || String(x.day) === A.day) && (!A.fav || favs.has(x.id));
    li.classList.toggle('is-out', !ok);
    if (ok) shown++;
  });
  $('#favEmpty').hidden = !(A.fav && shown === 0);
  $('#favCount').textContent = favs.size;
  $$('.alist__fav', alist).forEach((n) => { n.textContent = favs.has(n.closest('li').dataset.id) ? '★' : ''; });
  ScrollTrigger?.refresh?.();
}

let pvTween;
function posterHTML(x, i, big = false) {
  const [pb, pf, pa] = posterColors(i);
  if (x.photo) return `<div class="poster poster--photo" style="--pb:${pb};--pf:${pf};--pa:${pa}"><img src="${x.photo}" srcset="${x.photoSm || x.photo} 320w, ${x.photo} 640w" sizes="(max-width:1000px) 100vw, 34vw" width="640" height="800" alt="${esc(x.name)}" loading="lazy" decoding="async">
    <div class="poster__tag"><span class="poster__tn">${esc(x.name)}</span><span class="poster__ty">LOWLIFE ${x.edition}${x.day ? ' · ' + dayLabel(x.day).toUpperCase() : ''}</span></div></div>`;
  return `<div class="poster" style="--pb:${pb};--pf:${pf};--pa:${pa}">
    <div class="poster__yr"><span>LOWLIFE ${x.edition}</span><span>${x.day ? dayLabel(x.day).toUpperCase() : ''}</span></div>
    <div class="poster__name">${esc(x.name)}</div>
    <div class="poster__sub">${dayDate(x) || 'Arhiva izdanja ' + x.edition}</div>
  </div>`;
}

function setPreview(id) {
  if (A.active === id) return;
  A.active = id;
  $$('.alist__btn', alist).forEach((b) => b.classList.toggle('is-act', b.dataset.id === id));
  const x = byId(id); if (!x) return;
  const host = $('#apreviewIn');
  const i = archive.indexOf(x);
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0';
  wrap.innerHTML = posterHTML(x, i);
  host.append(wrap);
  const olds = [...host.children].slice(0, -1);
  if (hasG && !root.classList.contains('rm')) {
    pvTween?.kill();
    gsap.fromTo(wrap, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.5, ease: 'power3.out', onComplete: () => olds.forEach((o) => o.remove()) });
  } else olds.forEach((o) => o.remove());
}

function bindList() {
  alist.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.alist__btn'); if (b) setPreview(b.dataset.id);
  });
  alist.addEventListener('focusin', (e) => { const b = e.target.closest('.alist__btn'); if (b) setPreview(b.dataset.id); });
  alist.addEventListener('click', (e) => { const b = e.target.closest('.alist__btn'); if (b) openArtist(b.dataset.id, b); });

  const bar = $('#archiveBar');
  const days = [...new Set(archive.map((x) => x.day).filter(Boolean))];
  if (days.length < 2) $('.seg', bar).hidden = true;
  $$('[data-day]', bar).forEach((b) => b.addEventListener('click', () => {
    A.day = b.dataset.day;
    $$('[data-day]', bar).forEach((n) => { const on = n === b; n.classList.toggle('is-on', on); n.setAttribute('aria-pressed', on); });
    applyFilter();
  }));
  const ft = $('#favToggle');
  ft.addEventListener('click', () => { A.fav = !A.fav; ft.setAttribute('aria-pressed', A.fav); applyFilter(); });
}

/* ======================= dialogs ======================= */
const lockScroll = (on) => root.classList.toggle('lock', on);
function bindDialog(dlg, onClose) {
  dlg.addEventListener('close', () => { lockScroll(false); onClose?.(); });
  dlg.addEventListener('click', (e) => {
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
}
const panel = $('#panel');
bindDialog(panel, () => { A.opener?.focus?.({ preventScroll: true }); });

function openArtist(id, opener) {
  const x = byId(id); if (!x) return;
  A.opener = opener;
  const i = archive.indexOf(x);
  const links = Object.entries(x.links || {}).filter(([, u]) => u);
  const LAB = { spotify: 'Spotify', youtube: 'YouTube', instagram: 'Instagram', apple: 'Apple Music', soundcloud: 'SoundCloud', tiktok: 'TikTok' };
  panel.innerHTML = `
    <button class="panel__close" type="button" aria-label="Zatvori panel" id="panelX">✕</button>
    <div class="panel__poster">${posterHTML(x, i)}</div>
    <div class="panel__body">
      <div class="panel__tags"><span class="tag">Izdanje ${x.edition}</span>${x.day ? `<span class="tag">${dayLabel(x.day)}</span>` : ''}${dayDate(x) ? `<span class="tag">${dayDate(x)}</span>` : ''}</div>
      <h2 id="panelName">${esc(x.name)}</h2>
      ${x.bio ? `<p class="lead">${esc(x.bio)}</p>` : `<p class="panel__note">Kratak provereni opis izvođača biće dodat kad ga potvrdimo. Nastup: LOWLIFE ${x.edition}${x.day ? ', ' + dayLabel(x.day).toLowerCase() : ''}.</p>`}
      ${links.length ? `<div class="panel__links">${links.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${LAB[k] || esc(k)} ↗</a>`).join('')}</div>` : `<p class="mono" style="color:var(--mid)">Provereni linkovi ka muzici uskoro</p>`}
      <button type="button" class="btn btn--ink" id="panelFav" aria-pressed="${favs.has(x.id)}">${favs.has(x.id) ? '★ U mom lineupu' : '☆ Dodaj u Moj lineup'}</button>
      <p class="mono" style="color:var(--mid)">Arhiva izdanja ${x.edition}. Ne odnosi se na program ${F.year}.</p>
    </div>`;
  $('#panelX', panel).addEventListener('click', () => panel.close());
  const fb = $('#panelFav', panel);
  fb.addEventListener('click', () => {
    favs.has(x.id) ? favs.delete(x.id) : favs.add(x.id);
    store.set('lowlife:fav', [...favs]);
    fb.setAttribute('aria-pressed', favs.has(x.id));
    fb.textContent = favs.has(x.id) ? '★ U mom lineupu' : '☆ Dodaj u Moj lineup';
    applyFilter();
  });
  lockScroll(true);
  panel.showModal();
  panel.scrollTop = 0;
}

/* ======================= gallery + lightbox ======================= */
const G = C.gallery;
function renderGallery() {
  $('#galGrid').innerHTML = G.map((g, i) => `<li><button type="button" class="gal__item" data-i="${i}" data-cap="${esc(g.cat)}${g.year ? ' · ' + g.year : ''}" aria-label="Otvori: ${esc(g.alt)}" aria-haspopup="dialog">
    ${g.src ? `<img src="${g.src}" alt="" loading="lazy" decoding="async" width="${g.w || ''}" height="${g.h || ''}">` : `<div data-scene="${g.scene}" data-seed="${g.seed}" data-tone="${g.tone}" data-par></div>`}
    ${g.illustrative ? '<span class="ill">ILUSTRATIVNO</span>' : ''}
  </button></li>`).join('');
  paintScenes($('#galGrid'));
}
const lb = $('#lightbox'); let lbI = 0, lbOpener = null;
function lbShow(i) {
  lbI = (i + G.length) % G.length;
  const g = G[lbI];
  const [a, b] = g.ratio.split('/').map(Number);
  $('#lbFig').innerHTML = `<div class="box" style="--r:${a / b}">${g.src ? `<img src="${g.src}" alt="${esc(g.alt)}">` : scene(g.scene, g.seed, g.tone)}</div>
    <figcaption>${esc(g.cat)}${g.year ? ' · ' + g.year : ''}${g.illustrative ? ' · ilustrativni kadar' : ''}${g.credit ? ' · foto: ' + esc(g.credit) : ''}</figcaption>`;
  if (!g.src) $('#lbFig').setAttribute('role', 'img'), $('#lbFig').setAttribute('aria-label', g.alt);
  $('#lbCount').textContent = `${String(lbI + 1).padStart(2, '0')} / ${String(G.length).padStart(2, '0')}`;
}
function bindLightbox() {
  $('#galGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.gal__item'); if (!b) return;
    lbOpener = b; lbShow(+b.dataset.i); lockScroll(true); lb.showModal();
  });
  bindDialog(lb, () => lbOpener?.focus?.({ preventScroll: true }));
  $('#lbClose').addEventListener('click', () => lb.close());
  $('#lbPrev').addEventListener('click', () => lbShow(lbI - 1));
  $('#lbNext').addEventListener('click', () => lbShow(lbI + 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { lbShow(lbI - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { lbShow(lbI + 1); e.preventDefault(); }
  });
  let sx = null, sy = 0;
  lb.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
  lb.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) lbShow(lbI + (dx < 0 ? 1 : -1));
  });
  lb.addEventListener('pointercancel', () => { sx = null; });
}

/* ======================= aftermovie ======================= */
function renderAftermovie() {
  const m = F.aftermovie, act = $('#afterAction');
  if (m?.src) {
    $('#afterEyebrow').textContent = `Aftermovie · ${m.year ?? ''}`.trim();
    $('#afterTitle').innerHTML = esc(m.title || 'Aftermovie').toUpperCase();
    $('#afterLead').textContent = 'Pusti zvuk samo ako želiš — video se pokreće tek na klik.';
    if (m.poster) $('.after__bg').innerHTML = `<img src="${m.poster}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
    act.innerHTML = `<button class="play" type="button" id="playBtn"><span class="play__ic"></span>Pusti aftermovie</button>`;
    const vm = $('#videoModal'), v = $('#vmVideo');
    const stop = () => { v.pause(); v.removeAttribute('src'); v.load(); };
    bindDialog(vm, () => { stop(); $('#playBtn').focus({ preventScroll: true }); });
    $('#playBtn').addEventListener('click', () => { v.src = m.src; if (m.poster) v.poster = m.poster; lockScroll(true); vm.showModal(); v.play().catch(() => {}); });
    $('#vmClose').addEventListener('click', () => vm.close());
  } else {
    act.innerHTML = `<span class="mono note-pill">Aftermovie: uskoro</span> <a class="btn btn--lg btn--ghost" href="#galerija" style="margin-left:8px">Pogledaj galeriju <i aria-hidden="true">↓</i></a>`;
  }
}

/* ======================= utisci ======================= */
function renderUtisci() {
  const T = C.testimonials, body = $('#utisciBody');
  if (T.length) {
    body.innerHTML = T.map((t) => `<figure class="quote" data-reveal><blockquote><q>${esc(t.quote)}</q></blockquote><figcaption><cite>${esc(t.author)}</cite> · <span class="mono">${t.year ?? ''}</span></figcaption></figure>`).join('');
  } else {
    body.innerHTML = `<div class="utisci__cta" data-reveal><h2 class="giant">TVOJ<br>LOWLIFE<br>TRENUTAK.</h2>
      <div style="display:grid;gap:18px;justify-items:start"><p class="lead">Imaš kadar, utisak ili priču iz Kneževog arsenala? Pošalji ili označi zvanični profil — uz tvoju dozvolu objavljujemo ime i fotografiju ovde.</p>
      <a class="btn btn--ink btn--lg" href="${C.socials[0].url}" target="_blank" rel="noopener">${esc(C.socials[0].handle)} ↗</a></div></div>`;
  }
}

/* ======================= karte ======================= */
function renderTickets() {
  const list = $('#tixList');
  if (!C.tickets.length) {
    list.innerHTML = `<article class="ticket ticket--o" data-reveal>
      <div class="ticket__main"><div class="mono">LOWLIFE / PARTYLIFE · Kragujevac</div>
        <div class="big">Izdanje<br>${F.year}</div>
        <div class="ticket__row"><div><span class="mono">Datum</span><b>${F.dates ? esc(F.dates.label) : 'Uskoro'}</b></div><div><span class="mono">Lokacija</span><b>${F.venue?.confirmed ? esc(F.venue.name) : 'Uskoro'}</b></div><div><span class="mono">Cena</span><b>Uskoro</b></div></div></div>
      <div class="ticket__stub"><div class="barcode" aria-hidden="true"></div><p style="font-weight:600">Informacije o ulaznicama objavljujemo uskoro.</p>
        <a class="btn btn--lg" data-cta href="#pratite">Prati najave <i aria-hidden="true">→</i></a></div></article>
      <p class="tix__fine">Ilustracija ulaznice, nije važeći dokument. Bez prodaje i bez rezervacija dok organizator ne objavi zvanične informacije.</p>`;
    return;
  }
  list.innerHTML = C.tickets.map((t, i) => {
    const url = t.url || F.ticketUrl;
    return `<article class="ticket ${i % 2 ? '' : 'ticket--o'}" data-reveal>
      <div class="ticket__main"><div class="mono">${esc(t.day || 'LOWLIFE / PARTYLIFE')}</div><div class="big">${esc(t.name)}</div>
        <div class="ticket__row">${t.price ? `<div><span class="mono">Cena</span><b>${esc(t.price)}</b></div>` : ''}<div><span class="mono">Izdanje</span><b>${F.year}</b></div></div>
        ${t.perks?.length ? `<ul class="ticket__perks">${t.perks.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>
      <div class="ticket__stub"><div class="barcode" aria-hidden="true"></div>
        ${t.soldOut === true ? '<span class="mono">Rasprodato</span>' : url ? `<a class="btn btn--lg" href="${esc(url)}" target="_blank" rel="noopener">Uzmi kartu <i aria-hidden="true">→</i></a>` : `<a class="btn btn--lg" href="#pratite">Prati najave <i aria-hidden="true">→</i></a>`}</div></article>`;
  }).join('');
}

/* ======================= follow / info / faq / footer ======================= */
function renderMisc() {
  $('#socials').innerHTML = C.socials.map((s) => `<a class="slink" href="${s.url}" target="_blank" rel="noopener"><div><span>${esc(s.label)}</span><b>${esc(s.handle)}</b></div><i aria-hidden="true">↗</i></a>`).join('');
  $('#footSocials').innerHTML = C.socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)} — ${esc(s.handle)} ↗</a></li>`).join('')
    + (F.contact?.email ? `<li><a href="mailto:${esc(F.contact.email)}">${esc(F.contact.email)}</a></li>` : '');
  if (C.partners.length) {
    $('#footPartners').hidden = false;
    $('#footPartnersList').innerHTML = C.partners.map((p) => `<li>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name)}</li>`).join('');
  }
  const IC = {
    pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    door: '<path d="M6 21V3h12v18M3 21h18"/><circle cx="14.5" cy="12" r=".8"/>',
    age: '<circle cx="12" cy="12" r="9"/><path d="M8 9l8 6M16 9l-8 6"/>',
    bag: '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    access: '<circle cx="12" cy="5" r="1.8"/><path d="M6 9h12M12 9v6M9 21l3-6 3 6"/>',
    mail: '<path d="M3 5h18v14H3z"/><path d="M3 6l9 7 9-7"/>',
  };
  $('#infoGrid').innerHTML = C.info.map((i) => `<article class="icard" data-reveal>
    <svg viewBox="0 0 24 24" aria-hidden="true">${IC[i.icon] || ''}</svg>
    <span class="st ${i.confirmed ? 'st--ok' : 'st--soon'}">${i.confirmed ? 'Potvrđeno' : 'Uskoro'}</span>
    <h3>${esc(i.title)}</h3>
    <p>${i.confirmed ? esc(i.value) : 'Detalji će biti objavljeni.'}</p>
    ${i.archive ? `<p class="arch"><span class="mono">Arhiva</span><br>${esc(i.archive)}</p>` : ''}
    ${i.link ? `<a href="${i.link.url}" target="_blank" rel="noopener">${esc(i.link.label)} ↗</a>` : ''}
  </article>`).join('');

  $('#faqList').innerHTML = C.faq.map((f, i) => `<div class="fq"><h4 style="margin:0;font:inherit"><button type="button" class="fq__q" id="fq${i}" aria-expanded="false" aria-controls="fa${i}">${esc(f.q)}</button></h4>
    <div class="fq__a" id="fa${i}" role="region" aria-labelledby="fq${i}"><div><p>${esc(f.a)}</p></div></div></div>`).join('');
  const qs = $$('.fq__q');
  qs.forEach((q, i) => {
    q.addEventListener('click', () => q.setAttribute('aria-expanded', q.getAttribute('aria-expanded') !== 'true'));
    q.addEventListener('keydown', (e) => {
      const k = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: qs.length - 1 }[e.key];
      if (k === undefined) return; e.preventDefault(); qs[(k + qs.length) % qs.length].focus();
    });
  });
}

/* ======================= nav + menu ======================= */
const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
let menuOpen = false;
function setMenu(open) {
  if (open === menuOpen) return; menuOpen = open;
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
  if (open) { menu.hidden = false; void menu.offsetWidth; menu.classList.add('is-open'); lockScroll(true); $('a', menu).focus({ preventScroll: true }); }
  else { menu.classList.remove('is-open'); lockScroll(false); setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 520); }
}
burger.addEventListener('click', () => setMenu(!menuOpen));
document.addEventListener('keydown', (e) => {
  if (!menuOpen) return;
  if (e.key === 'Escape') { setMenu(false); burger.focus(); }
  if (e.key === 'Tab') {
    const f = [burger, ...$$('a', menu)], first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
matchMedia('(min-width: 761px)').addEventListener('change', (e) => e.matches && setMenu(false));

/* anchor links */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href'); if (id.length < 2) { if (id === '#') return; }
  const t = id === '#top' ? document.body : $(id); if (!t) return;
  e.preventDefault();
  const wasOpen = menuOpen; if (wasOpen) setMenu(false);
  const go = () => {
    const y = id === '#top' ? 0 : t.getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: root.classList.contains('rm') ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
    if (id !== '#top') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  };
  wasOpen ? setTimeout(go, 60) : go();
});

function navTriggers() {
  const secs = $$('[data-nav]');
  const linkFor = { festival: '#festival', lineup: '#lineup', arhiva: '#lineup', atmosfera: '#atmosfera', info: '#info', karte: '#karte' };
  secs.forEach((s) => ScrollTrigger.create({
    trigger: s, start: 'top 40px', end: 'bottom 40px',
    onToggle: (st) => {
      if (!st.isActive) return;
      nav.dataset.theme = s.dataset.nav;
      $$('.nav__links a').forEach((a) => a.classList.toggle('is-cur', a.getAttribute('href') === linkFor[s.id]));
    },
  }));
  ScrollTrigger.create({ start: 30, onToggle: (st) => nav.classList.toggle('is-solid', st.isActive) });
  // donja traka na mobilnom: posle hero-a, skrivena dok je na ekranu sopstveni CTA (karte / prati)
  const dock = $('#dock'), hide = new Set(); let past = false;
  const upd = () => { dock.hidden = false; requestAnimationFrame(() => dock.classList.toggle('is-on', past && !hide.size)); };
  ScrollTrigger.create({ trigger: '#festival', start: 'top 85%', end: 'max', onToggle: (st) => { past = st.isActive; upd(); } });
  ['#karte', '#pratite'].forEach((sel) => ScrollTrigger.create({ trigger: sel, start: 'top 70%', end: 'bottom top', onToggle: (st) => { st.isActive ? hide.add(sel) : hide.delete(sel); upd(); } }));
}

/* ======================= hero ======================= */
function fitTitle() {
  const fit = $('#fit'), h = $('#heroTitle');
  fit.style.fontSize = '100px';
  const w = fit.getBoundingClientRect().width;
  const avail = h.clientWidth;
  if (w) fit.style.fontSize = (100 * avail / w) + 'px';
}

const collapse = (poly) => poly.replace(/(-?[\d.]+%)\s+(-?[\d.]+%)/g, (m, x) => `${x} 100%`);
const FULL = 'polygon(0% 0%,100% 0%,100% 60%,100% 60%,100% 100%,0% 100%,0% 12%,0% 0%)';
const prep = (els, v) => { els.forEach((e) => (e.style.transform = 'none')); gsap.set(els, v); };

const FORCE = new URLSearchParams(location.search).get('motion'); // dev: ?motion=full | ?motion=reduced
const Q_ANIM = FORCE === 'full' ? 'all' : FORCE === 'reduced' ? 'not all' : '(prefers-reduced-motion: no-preference)';
const Q_RM = FORCE === 'full' ? 'not all' : FORCE === 'reduced' ? 'all' : '(prefers-reduced-motion: reduce)';

function heroMotion() {
  const mm = gsap.matchMedia();
  const stage = $('#top'), photo = $('#heroPhoto'), inner = $('.stage__photo-in', photo), shade = $('#stageShade');
  mm.add({ anim: Q_ANIM, rm: Q_RM, mobile: '(max-width: 760px)' }, (ctx) => {
    const { anim, mobile } = ctx.conditions;
    if (!anim) {
      root.classList.add('rm'); stage.classList.add('is-static');
      return () => { root.classList.remove('rm'); stage.classList.remove('is-static'); };
    }
    root.classList.remove('rm');
    stage.classList.add('is-anim');
    const L = getComputedStyle(root).getPropertyValue('--L').trim();
    const chars = $$('.ch'), sloganM = $$('.hero__slogan .mask > span'), stmM = $$('.statement__title .mask > span');
    prep(chars, { yPercent: 108 }); prep(sloganM, { yPercent: 112 }); prep(stmM, { yPercent: 112 });
    const fade = $$('.hero__top, .hero__lead, .hero__cta, .hero__scroll, .statement__kick');
    gsap.set(fade, { opacity: 0, y: 18 }); gsap.set(photo, { clipPath: collapse(L) });
    gsap.set(inner, { scale: 1.25 });

    // 1) ulazni reveal — odmah, bez čekanja
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro.to(photo, { clipPath: L, duration: 1.1, ease: 'power3.inOut' }, 0.05)
      .to(inner, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0.05)
      .to(chars, { yPercent: 0, duration: 0.95, stagger: 0.055 }, 0.1)
      .to(sloganM, { yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.35)
      .to(fade.filter((n) => !n.classList.contains('statement__kick')), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.65);

    // 2) potpisni scroll prelaz
    const len = () => Math.round(innerHeight * (mobile ? 0.8 : 1.1));
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + len(), pin: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.fromTo(photo, { clipPath: L }, { clipPath: FULL, duration: 0.7, ease: 'power2.inOut', immediateRender: false }, 0.05)
      .fromTo(inner, { scale: 1 }, { scale: 1.12, duration: 1, immediateRender: false }, 0)
      .to($$('.hero__mid, .hero__top, .hero__scroll'), { opacity: 0, y: -50, duration: 0.25 }, 0)
      .to('#heroTitle', { yPercent: mobile ? -60 : -85, scale: mobile ? 0.8 : 0.88, opacity: 0, transformOrigin: '0 100%', duration: 0.45 }, 0.04)
      .to(shade, { opacity: 1, duration: 0.6 }, 0.25)
      .to($$('.stage__beams'), { opacity: 0, duration: 0.3 }, 0)
      .to($$('.statement__kick'), { opacity: 1, y: 0, duration: 0.2 }, 0.55)
      .to(stmM, { yPercent: 0, duration: 0.3, stagger: 0.1, ease: 'power3.out' }, 0.5);
    tl.to({}, { duration: 0.18 }); // kratko zadržavanje završnog kadra

    return () => {
      stage.classList.remove('is-anim');
      gsap.set([...chars, ...sloganM, ...stmM, ...fade, photo, inner, shade, '#heroTitle', '.hero__mid', '.stage__beams'], { clearProps: 'all' });
      chars.concat(sloganM, stmM).forEach((e) => (e.style.transform = ''));
    };
  });

  // reveal + parallax (samo kad je animacija dozvoljena)
  mm.add({ anim: Q_ANIM, desk: '(min-width: 761px)' }, (ctx) => {
    if (!ctx.conditions.anim) return;
    const outside = (el) => !el.closest('.stage');
    $$('[data-reveal]').filter(outside).forEach((el) => {
      el.style.transform = 'none'; gsap.set(el, { opacity: 0, y: 36 });
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    const groups = new Map();
    $$('.mask > span').filter(outside).forEach((s) => { const p = s.closest('.mask').parentElement; (groups.get(p) || groups.set(p, []).get(p)).push(s); });
    groups.forEach((spans, parent) => {
      prep(spans, { yPercent: 112 });
      gsap.to(spans, { yPercent: 0, duration: 1.05, stagger: 0.09, ease: 'power4.out', scrollTrigger: { trigger: parent, start: 'top 88%', once: true } });
    });
    if (ctx.conditions.desk) {
      $$('[data-parallax]').forEach((el) => {
        const v = +el.dataset.parallax;
        gsap.fromTo(el, { y: -v }, { y: v, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      $$('.gal__item [data-scene], .gal__item img').forEach((el) => {
        gsap.fromTo(el, { yPercent: -2.5 }, { yPercent: 2.5, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    return () => $$('[data-reveal],.mask>span,[data-parallax]').forEach((e) => (e.style.cssText = ''));
  });
}

/* ======================= footer pulse ======================= */
function footPulse() {
  const foot = $('#footer'), p = $('#footPulse');
  p.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"><polygon points="34,0 100,0 100,100 0,100 0,18" fill="none" stroke="#00ffd5" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>';
  Object.assign(p.style, { clipPath: 'none', background: 'none' });
  let raf = 0, x = 0;
  const move = (cx) => { x = cx; if (!raf) raf = requestAnimationFrame(() => { raf = 0; const r = foot.getBoundingClientRect(); p.style.setProperty('--px', Math.max(0, Math.min(r.width - p.offsetWidth, x - r.left - p.offsetWidth / 2)) + 'px'); foot.classList.add('is-pulse'); }); };
  foot.addEventListener('pointermove', (e) => move(e.clientX));
  foot.addEventListener('pointerdown', (e) => move(e.clientX));
  foot.addEventListener('pointerleave', () => foot.classList.remove('is-pulse'));
}

/* ======================= lifecycle / performance ======================= */
function lifecycle() {
  document.addEventListener('visibilitychange', () => root.classList.toggle('paused', document.hidden));
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)), { rootMargin: '80px' });
  ['#marquee .marquee__track', '.stage__beams', '.hero__scroll span'].forEach((s) => $$(s).forEach((n) => io.observe(n)));
}

/* ======================= init ======================= */
function init() {
  applyState();
  renderEditions(); renderLineup27();
  renderList(); bindList(); applyFilter();
  renderGallery(); bindLightbox();
  renderAftermovie(); renderUtisci(); renderTickets(); renderMisc();
  paintScenes();
  if (archive.length) setPreview(archive[0].id); else $('#arhiva').hidden = true;
  fitTitle();
  new ResizeObserver(() => fitTitle()).observe($('#heroTitle'));
  footPulse(); lifecycle();
  if (hasG) {
    heroMotion(); navTriggers();
    (document.fonts?.ready || Promise.resolve()).then(() => { fitTitle(); ScrollTrigger.refresh(); });
    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    root.classList.add('rm'); $('#top').classList.add('is-static');
    nav.classList.add('is-solid');
  }
}
init();
