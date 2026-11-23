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
function photoImg(p, { pos = '50% 50%', sizes = '100vw' } = {}) {
  return `<img class="photo" src="${p.src}" srcset="${p.srcset}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="" style="object-position:${pos}" loading="lazy" decoding="async">`;
}
function paintScenes(scope = document) {
  $$('[data-photo]', scope).forEach((el) => {
    if (el.dataset.painted) return;
    const p = C.photos[el.dataset.photo];
    if (!p) { el.dataset.scene ||= 'crowd'; return; }   // nema fotografije -> ilustrativni fallback
    el.dataset.painted = '1';
    el.insertAdjacentHTML('afterbegin', photoImg(p, { pos: el.dataset.pos, sizes: el.dataset.sizes }));
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', p.alt);
  });
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
  const grid = $('#l27Grid'), slots = F.lineupSlots ?? 8;
  const on = confirmed27.map((x) => `<li class="l27__li"><button type="button" class="slot slot--on" data-id="${x.id}" aria-haspopup="dialog" aria-label="Otvori: ${esc(x.name)}">${posterHTML(x, artists.indexOf(x))}</button></li>`);
  const empty = Array.from({ length: Math.max(0, slots - confirmed27.length) }, (_, i) =>
    `<li class="l27__li" aria-hidden="true"><div class="slot slot--empty" style="--d:${(i * 0.55).toFixed(2)}s"><i class="slot__scan"></i><span class="slot__q">?</span><span class="slot__tag mono">Uskoro</span></div></li>`);
  grid.innerHTML = on.concat(empty).join('');
  if (confirmed27.length) {
    $('#lineup27Title').innerHTML = '<span class="mask"><span>LINEUP</span></span> <span class="mask"><span class="o">' + F.year + '</span></span>';
    $('.lineup27 .lead').textContent = 'Potvrđena imena izdanja ' + F.year + '. Nova imena stižu redom, a raspored po danima i satnice kad ih organizator objavi.';
  }
  grid.addEventListener('click', (e) => { const b = e.target.closest('.slot--on'); if (b) openArtist(b.dataset.id, b); });
  // blagi nagib prema kursoru (samo miš, samo animirani režim)
  if (FORCE !== 'reduced' && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let raf = 0, cur = null, px = 0, py = 0;
    const apply = () => { raf = 0; if (!cur) return; const r = cur.getBoundingClientRect(); const nx = (px - r.left) / r.width - 0.5, ny = (py - r.top) / r.height - 0.5; cur.style.setProperty('--ry', (nx * 14).toFixed(2) + 'deg'); cur.style.setProperty('--rx', (-ny * 14).toFixed(2) + 'deg'); };
    grid.addEventListener('pointermove', (e) => { const t = e.target.closest('.slot'); if (cur && cur !== t) { cur.style.setProperty('--rx', '0deg'); cur.style.setProperty('--ry', '0deg'); } cur = t; px = e.clientX; py = e.clientY; if (cur && !raf) raf = requestAnimationFrame(apply); });
    grid.addEventListener('pointerleave', () => { if (cur) { cur.style.setProperty('--rx', '0deg'); cur.style.setProperty('--ry', '0deg'); cur = null; } });
  }
}

/* odbrojavanje: radi samo kad config.countdown.target postoji (pravi datum); inače cifre ostaju „--“ */
function initCountdown() {
  const el = $('#l27Count'); if (!el) return;
  const cfg = F.countdown || {}, lab = $('#cdLab'), t = cfg.target ? Date.parse(cfg.target) : NaN;
  const set = (k, v) => { const b = $(`[data-u="${k}"]`, el); const s = String(v).padStart(2, '0'); if (b.textContent !== s) { b.textContent = s; b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick'); } };
  if (!Number.isFinite(t)) { lab.textContent = cfg.pending || 'Datum objave prvih imena: uskoro'; return; }
  let timer = 0, vis = true;
  const tick = () => {
    const ms = t - Date.now();
    if (ms <= 0) { el.dataset.state = 'done'; $$('.cd__u', el).forEach((n) => (n.hidden = true)); lab.textContent = cfg.doneLabel || 'Prva imena su objavljena.'; stop(); return; }
    const s = Math.floor(ms / 1000);
    set('d', Math.floor(s / 86400)); set('h', Math.floor(s % 86400 / 3600)); set('m', Math.floor(s % 3600 / 60)); set('s', s % 60);
    el.dataset.state = 'live'; lab.textContent = cfg.label || '';
  };
  const stop = () => { clearInterval(timer); timer = 0; };
  const go = () => { if (!timer && vis && !document.hidden) { tick(); timer = setInterval(tick, 1000); } };
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; vis ? go() : stop(); }).observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : go()));
  tick();
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
    <div class="poster__sub">${dayDate(x) || (x.status === 'archive' ? 'Arhiva izdanja ' + x.edition : 'Izdanje ' + x.edition)}</div>
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
  const i = artists.indexOf(x);
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
      <p class="mono" style="color:var(--mid)">${x.status === 'archive' ? `Arhiva izdanja ${x.edition}. Ne odnosi se na program ${F.year}.` : `Izdanje ${x.edition}. Potvrđeno.`}</p>
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
const GALL = C.gallery;
let G = GALL.slice();            // trenutno vidljive (po filteru)
const galGrid = $('#galCols');
const galEl = {};
const galN = () => (matchMedia('(max-width: 1000px)').matches ? 2 : 3);
function layoutGallery() {
  const n = galN(), cols = $$('.gal__col', galGrid), h = Array(n).fill(0);
  cols.forEach((c) => c.replaceChildren());
  G.forEach((g) => { const i = h.indexOf(Math.min(...h)); h[i] += g.h / g.w + 0.05; cols[i].append(galEl[g.id]); });
  ScrollTrigger?.refresh?.();
}
function renderGallery() {
  GALL.forEach((g, k) => {
    const li = document.createElement('li');
    li.className = 'gal__li'; li.dataset.id = g.id; li.dataset.cat = g.cat;
    li.innerHTML = `<button type="button" class="gal__item" data-v="${k % 4}" style="--ar:${g.w}/${g.h}" data-id="${g.id}" data-cap="${esc(g.cat)}${g.year ? ' · ' + g.year : ''}" aria-label="Otvori fotografiju: ${esc(g.alt)}" aria-haspopup="dialog">
      <img src="${g.src}" srcset="${g.srcset}" sizes="(max-width:1000px) 50vw, 33vw" alt="" loading="lazy" decoding="async" width="${g.w}" height="${g.h}">
      <span class="gal__no" aria-hidden="true">${String(k + 1).padStart(2, '0')}</span>
      ${g.illustrative ? '<span class="ill">ILUSTRATIVNO</span>' : ''}</button>`;
    galEl[g.id] = li;
  });
  layoutGallery();
  matchMedia('(max-width: 1000px)').addEventListener('change', layoutGallery);
  // filter po kategorijama: samo kad ima dovoljno stvarnog sadržaja
  const cats = [...new Set(GALL.map((g) => g.cat))].filter((k) => GALL.filter((g) => g.cat === k).length >= 2);
  const bar = $('#galFilter');
  if (cats.length >= 2) {
    bar.hidden = false;
    bar.innerHTML = ['Sve', ...cats].map((k, i) => `<button type="button" class="seg__b${i ? '' : ' is-on'}" data-cat="${i ? esc(k) : ''}" aria-pressed="${i ? 'false' : 'true'}">${esc(k)} <b>${i ? GALL.filter((g) => g.cat === k).length : GALL.length}</b></button>`).join('');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.seg__b'); if (!b) return;
      const cat = b.dataset.cat;
      $$('.seg__b', bar).forEach((n) => { n.classList.toggle('is-on', n === b); n.setAttribute('aria-pressed', n === b); });
      G = GALL.filter((g) => !cat || g.cat === cat);
      layoutGallery();
    });
  }
}

/* kursor-oznaka ("Otvori", "Pusti") nad galerijom i klipovima */
function cursorChip() {
  if (FORCE === 'reduced' || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const chip = document.createElement('div');
  chip.className = 'cur'; chip.setAttribute('aria-hidden', 'true'); document.body.append(chip);
  const bind = (root, sel, txt) => {
    if (!root) return;
    root.addEventListener('pointermove', (e) => {
      const t = e.target.closest(sel); chip.classList.toggle('on', !!t);
      if (t) { chip.textContent = txt; chip.style.transform = `translate3d(${e.clientX + 18}px,${e.clientY + 18}px,0)`; }
    });
    root.addEventListener('pointerleave', () => chip.classList.remove('on'));
  };
  bind($('#galCols'), '.gal__item', 'Otvori ↗');
  bind($('#clipsTrack'), '.clip__btn', 'Pusti ▶');
}

/* blagi 3D nagib prema kursoru (miš) */
function pointerTilt(root, sel, max = 6) {
  if (!root || FORCE === 'reduced' || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  let raf = 0, cur = null, px = 0, py = 0;
  const reset = (el) => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
  const apply = () => { raf = 0; if (!cur) return; const r = cur.getBoundingClientRect(); const nx = (px - r.left) / r.width - 0.5, ny = (py - r.top) / r.height - 0.5; cur.style.setProperty('--ry', (nx * max * 2).toFixed(2) + 'deg'); cur.style.setProperty('--rx', (-ny * max * 2).toFixed(2) + 'deg'); };
  root.addEventListener('pointermove', (e) => { const t = e.target.closest(sel); if (cur && cur !== t) reset(cur); cur = t; px = e.clientX; py = e.clientY; if (cur && !raf) raf = requestAnimationFrame(apply); });
  root.addEventListener('pointerleave', () => { if (cur) { reset(cur); cur = null; } });
}

const lb = $('#lightbox'); let lbI = 0, lbOpener = null;
function lbShow(i) {
  lbI = (i + G.length) % G.length;
  const g = G[lbI];
  $('#lbFig').innerHTML = `<div class="box" style="--r:${g.w / g.h}"><img src="${g.src}" srcset="${g.srcset}" sizes="94vw" alt="${esc(g.alt)}"></div>
    <figcaption>${esc(g.cat)}${g.year ? ' · ' + g.year : ''}${g.credit ? ' · foto: ' + esc(g.credit) : ''}</figcaption>`;
  $('#lbCount').textContent = `${String(lbI + 1).padStart(2, '0')} / ${String(G.length).padStart(2, '0')}`;
}
function bindLightbox() {
  galGrid.addEventListener('click', (e) => {
    const b = e.target.closest('.gal__item'); if (!b) return;
    lbOpener = b; lbShow(Math.max(0, G.findIndex((g) => g.id === b.dataset.id))); lockScroll(true); lb.showModal();
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

/* ======================= video prozor (sa zvukom) ======================= */
const vm = $('#videoModal'), vmV = $('#vmVideo'); let vmOpener = null;
function bindVideoModal() {
  bindDialog(vm, () => { vmV.pause(); vmV.removeAttribute('src'); vmV.load(); vmOpener?.focus?.({ preventScroll: true }); });
  $('#vmClose').addEventListener('click', () => vm.close());
}
function openVideo(src, poster, opener) {
  vmOpener = opener; vmV.src = src; vmV.poster = poster || ''; vmV.muted = false;
  lockScroll(true); vm.showModal(); vmV.play().catch(() => {});
}

/* ======================= aftermovie (samo kad postoji pravi snimak) ======================= */
function renderAftermovie() {
  const m = F.aftermovie, slot = $('#afterSlot');
  if (!slot || !m?.src) return;
  slot.innerHTML = `<div class="aftbanner">${m.poster ? `<img src="${m.poster}" alt="" loading="lazy">` : ''}
    <button class="play" type="button" id="playBtn"><span class="play__ic"></span>${esc(m.title || 'Aftermovie')}${m.year ? ' · ' + m.year : ''}</button></div>`;
  $('#playBtn').addEventListener('click', (e) => openVideo(m.src, m.poster, e.currentTarget));
}

/* ======================= klipovi (vertikalna traka) ======================= */
function renderClips() {
  const track = $('#clipsTrack'); if (!track || !C.clips.length) { $('#klipovi')?.setAttribute('hidden', ''); return; }
  track.innerHTML = C.clips.map((c, i) => `<li class="clip"><button type="button" class="clip__btn" data-i="${i}" aria-haspopup="dialog" aria-label="Pusti klip „${esc(c.title)}“ sa zvukom">
    <video muted loop playsinline preload="none" poster="${c.poster}" data-src="${c.src}" width="${c.w}" height="${c.h}" aria-hidden="true" tabindex="-1"></video>
    <span class="clip__no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="clip__tag"><b>${esc(c.title)}</b><i>▶ Sa zvukom</i></span></button></li>`).join('');
  track.addEventListener('click', (e) => {
    const b = e.target.closest('.clip__btn'); if (!b) return;
    const c = C.clips[+b.dataset.i]; openVideo(c.src, c.poster, b);
  });
  // vrti se samo ono što je na ekranu (i dok je tab vidljiv)
  const vis = new Set();
  const play = (v) => { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); };
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { vis.add(v); if (!document.hidden) play(v); } else { vis.delete(v); v.pause(); }
  }), { threshold: 0.5 });
  $$('video', track).forEach((v) => io.observe(v));
  document.addEventListener('visibilitychange', () => { document.hidden ? $$('video', track).forEach((v) => v.pause()) : vis.forEach(play); });
  // dugmad + prevlačenje mišem
  const step = () => (track.querySelector('.clip')?.getBoundingClientRect().width || 300) + 16;
  const prev = $('#clipsPrev'), next = $('#clipsNext');
  const sync = () => { prev.disabled = track.scrollLeft < 8; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; };
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
  let down = null, moved = false;
  track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, l: track.scrollLeft }; moved = false; });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); } track.scrollLeft = down.l - dx; });
  addEventListener('pointerup', () => { down = null; track.classList.remove('is-drag'); });
  track.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

/* ======================= utisci ======================= */
function renderUtisci() {
  const T = C.testimonials, body = $('#utisciBody');
  if (T.length) {
    body.innerHTML = `<h2 class="giant giant--md" data-reveal>UTISCI.</h2><div class="quotes">` + T.map((t) => `<figure class="quote" data-reveal><blockquote><q>${esc(t.quote)}</q></blockquote><figcaption><cite>${esc(t.author)}</cite>${t.year ? ' <span class="mono">' + t.year + '</span>' : ''}</figcaption></figure>`).join('') + '</div>';
    return;
  }
  const ig = C.socials[0];
  body.innerHTML = `<div class="ut">
    <div class="ut__copy" data-reveal>
      <h2 class="giant">TVOJ<br>LOWLIFE<br><span class="o">TRENUTAK.</span></h2>
      <p class="lead">Imaš kadar, utisak ili priču sa festivala? Pošalji ili označi zvanični profil - uz tvoju dozvolu objavljujemo ime i fotografiju ovde.</p>
      <div class="ut__cta"><a class="btn btn--ink btn--lg" href="${ig.url}" target="_blank" rel="noopener">${esc(ig.handle)} ↗</a><a class="btn btn--lg btn--ghost" href="#galerija">Pogledaj galeriju</a></div>
    </div>
    <div class="ut__stage" id="utStage" aria-hidden="true">
      <figure class="pol pol--1" style="--r:-7deg;--d:26"><div class="pol__img" data-photo="crowd-1" data-pos="62% 50%" data-sizes="(max-width:1000px) 60vw, 26vw"></div><figcaption class="mono">#lowlife</figcaption></figure>
      <figure class="pol pol--2" style="--r:5deg;--d:14"><div class="pol__img" data-photo="hat" data-pos="55% 40%" data-sizes="(max-width:1000px) 60vw, 26vw"></div><figcaption class="mono">tvoj kadar</figcaption>
        <span class="vf"><i></i><i></i><i></i><i></i><b class="mono">● Snima</b></span></figure>
      <figure class="pol pol--3" style="--r:-3deg;--d:36"><div class="pol__img" data-photo="crowd-2" data-pos="36% 40%" data-sizes="(max-width:1000px) 60vw, 24vw"></div><figcaption class="mono">ispred bine</figcaption></figure>
    </div>
  </div>`;
  const st = $('#utStage');
  if (FORCE !== 'reduced' && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let raf = 0, mx = 0, my = 0;
    st.parentElement.addEventListener('pointermove', (e) => {
      const r = st.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; st.style.setProperty('--mx', mx.toFixed(3)); st.style.setProperty('--my', my.toFixed(3)); });
    });
  }
}

/* ======================= karte ======================= */
function ticketHTML({ tag, big, rows, perks, cta, alt }) {
  return `<div class="tkt__wrap" data-reveal><article class="tkt${alt ? ' tkt--alt' : ''}">
    <div class="tkt__main"><i class="scan" aria-hidden="true"></i>
      <div class="mono">${tag}</div><div class="big">${big}</div>
      <div class="tkt__row">${rows.map(([l, v]) => `<div><span class="mono">${l}</span><b>${v}</b></div>`).join('')}</div>
      ${perks?.length ? `<ul class="tkt__perks">${perks.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>
    <div class="tkt__stub"><div class="barcode" aria-hidden="true"></div>${cta}</div></article></div>`;
}
function renderTickets() {
  const list = $('#tixList');
  if (!C.tickets.length) {
    list.innerHTML = ticketHTML({
      tag: 'LOWLIFE / PARTYLIFE · Kragujevac', big: `Izdanje<br>${F.year}`,
      rows: [['Datum', F.dates ? esc(F.dates.label) : 'Uskoro'], ['Lokacija', F.venue?.confirmed ? esc(F.venue.name) : 'Uskoro'], ['Cena', 'Uskoro']],
      cta: `<p class="tkt__msg">Informacije o ulaznicama objavljujemo uskoro.</p><a class="btn btn--lg" data-cta href="#pratite">Prati najave <i aria-hidden="true">→</i></a>`,
    }) + `<p class="tix__fine">Ilustracija ulaznice, nije važeći dokument. Bez prodaje i bez rezervacija dok organizator ne objavi zvanične informacije.</p>`;
  } else {
    list.innerHTML = C.tickets.map((t, i) => {
      const url = t.url || F.ticketUrl;
      return ticketHTML({
        alt: i % 2, tag: esc(t.day || 'LOWLIFE / PARTYLIFE'), big: esc(t.name),
        rows: [...(t.price ? [['Cena', esc(t.price)]] : []), ['Izdanje', F.year]], perks: t.perks,
        cta: t.soldOut === true ? '<span class="mono">Rasprodato</span>' : url ? `<a class="btn btn--lg" href="${esc(url)}" target="_blank" rel="noopener">Uzmi kartu <i aria-hidden="true">→</i></a>` : `<a class="btn btn--lg" data-cta href="#pratite">Prati najave <i aria-hidden="true">→</i></a>`,
      });
    }).join('');
  }
  pointerTilt(list, '.tkt', 5);
}

/* ======================= follow / info / faq / footer ======================= */
function renderMisc() {
  const s0 = C.socials[0], rest = C.socials.slice(1);
  $('#socials').innerHTML = `<a class="badge" href="${s0.url}" target="_blank" rel="noopener" aria-label="Prati ${esc(s0.handle)} na ${esc(s0.label)}u (otvara se u novom tabu)">
      <svg class="badge__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="bp" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"/></defs><text><textPath href="#bp" textLength="500" lengthAdjust="spacing">PRATI NAJAVE ✦ PRATI NAJAVE ✦ LOWLIFE / PARTYLIFE ✦ </textPath></text></svg>
      <span class="badge__disc"><i aria-hidden="true">↗</i></span></a>
    <p class="badge__h mono">${esc(s0.handle)}</p>`
    + (rest.length ? `<ul class="badge__more">${rest.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)} ${esc(s.handle)} ↗</a></li>`).join('')}</ul>` : '');
  $('#footSocials').innerHTML = C.socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)} - ${esc(s.handle)} ↗</a></li>`).join('')
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
  const linkFor = { festival: '#festival', lineup: '#lineup', arhiva: '#lineup', galerija: '#galerija', info: '#info', karte: '#karte' };
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

// Animacije su podrazumevano uključene (i kad OS traži smanjeno kretanje). ?motion=reduced daje mirnu verziju.
const FORCE = new URLSearchParams(location.search).get('motion') === 'reduced' ? 'reduced' : 'full';
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

    // 1) ulazni reveal - odmah, bez čekanja
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
    const tiles = $$('.l27__li');
    if (tiles.length) {
      tiles.forEach((t) => (t.style.transform = 'none'));
      gsap.set(tiles, { y: 80, opacity: 0 });
      gsap.to(tiles, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '#l27Grid', start: 'top 88%', once: true } });
    }
    const pols = $$('.pol');
    if (pols.length) {
      pols.forEach((p) => (p.style.transform = 'none'));
      gsap.set(pols, { y: 150, opacity: 0 });
      gsap.to(pols, { y: 0, opacity: 1, duration: 1, stagger: 0.14, ease: 'power3.out', scrollTrigger: { trigger: '.ut__stage', start: 'top 88%', once: true } });
    }
    const badge = $('.badge');
    if (badge) {
      gsap.set(badge, { scale: 0.6, rotate: -40, opacity: 0 });
      gsap.to(badge, { scale: 1, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(1.5)', scrollTrigger: { trigger: badge, start: 'top 90%', once: true } });
    }
    if (ctx.conditions.desk) {
      $$('.gal__col').forEach((col, i) => {
        const v = [-70, 90, -40][i] || 0;
        gsap.fromTo(col, { y: -v }, { y: v, ease: 'none', scrollTrigger: { trigger: '#galCols', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('.l27__year', { xPercent: 10 }, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: '#lineup', start: 'top bottom', end: 'bottom top', scrub: true } });
      $$('[data-parallax]').forEach((el) => {
        const v = +el.dataset.parallax;
        gsap.fromTo(el, { y: -v }, { y: v, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      $$('.gal__item img').forEach((el) => {
        gsap.fromTo(el, { yPercent: -2.5 }, { yPercent: 2.5, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    return () => $$('[data-reveal],.mask>span,[data-parallax],.l27__li,.l27__year,.pol,.badge,.gal__col').forEach((e) => (e.style.cssText = ''));
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

/* ======================= hero video ======================= */
function heroVideo() {
  const v = $('#heroVideo'); if (!v) return;
  const small = matchMedia('(max-width: 760px)').matches;
  v.src = small ? 'assets/video/hero-540.mp4' : 'assets/video/hero-1080.mp4';
  v.preload = 'auto';
  if (FORCE === 'reduced') return;                       // mirna verzija: samo poster
  v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });
  let inView = true;
  const sync = () => { (inView && !document.hidden) ? v.play().catch(() => {}) : v.pause(); };
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe($('#top'));
  document.addEventListener('visibilitychange', sync);
  sync();
}

/* ======================= lifecycle / performance ======================= */
function lifecycle() {
  document.addEventListener('visibilitychange', () => root.classList.toggle('paused', document.hidden));
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)), { rootMargin: '80px' });
  ['#marquee .marquee__track', '.stage__beams', '.hero__scroll span', '.tix__bg', '.follow__bg', '.badge__ring', '.l27__bg'].forEach((s) => $$(s).forEach((n) => io.observe(n)));
}

/* ======================= init ======================= */
function init() {
  applyState();
  renderEditions(); renderLineup27(); initCountdown();
  renderList(); bindList(); applyFilter();
  renderGallery(); bindLightbox(); bindVideoModal(); renderClips(); cursorChip();
  renderAftermovie(); renderUtisci(); renderTickets(); renderMisc();
  paintScenes();
  if (archive.length) setPreview(archive[0].id); else $('#arhiva').hidden = true;
  fitTitle();
  new ResizeObserver(() => fitTitle()).observe($('#heroTitle'));
  footPulse(); lifecycle(); heroVideo();
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
