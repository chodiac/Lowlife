/* Procedurally drawn ILLUSTRATIVE scenes (SVG). Not photographs — placeholders
   until real LOWLIFE photos are added via config.js (`src`). */

const TONES = {
  orange: { bg: '#FF4D24', bg2: '#C42A0B', beam: '#F2EEE7', ink: '#101010', accent: '#DFFF00' },
  yellow: { bg: '#DFFF00', bg2: '#A9C400', beam: '#F2EEE7', ink: '#101010', accent: '#FF4D24' },
  ink:    { bg: '#161616', bg2: '#050505', beam: '#FF4D24', ink: '#000000', accent: '#DFFF00' },
  white:  { bg: '#F2EEE7', bg2: '#CFC8BB', beam: '#FF4D24', ink: '#101010', accent: '#FF4D24' },
};

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

let uid = 0;
const W = 1200, H = 900;

function beams(r, c, n, op = [0.12, 0.38], spread = 1) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, x1 = x0 + (r() - 0.5) * 900 * spread, w = 40 + r() * 150;
    const o = op[0] + r() * (op[1] - op[0]);
    s += `<polygon points="${x0 - 5},-20 ${x0 + 5},-20 ${x1 + w},${H} ${x1 - w},${H}" fill="${c.beam}" opacity="${o.toFixed(2)}"/>`;
  }
  return s;
}

function person(x, y, s, r, ink, raised) {
  const head = 22 * s, bw = 46 * s;
  let g = `<circle cx="${x}" cy="${y}" r="${head}" fill="${ink}"/>`;
  g += `<path d="M${x - bw} ${y + 200 * s} Q${x - bw} ${y + head + 8 * s} ${x} ${y + head + 8 * s} Q${x + bw} ${y + head + 8 * s} ${x + bw} ${y + 200 * s}Z" fill="${ink}"/>`;
  if (raised) {
    const side = r() > 0.5 ? 1 : -1, two = r() > 0.5;
    const arm = (d) => `<path d="M${x + d * bw * 0.8} ${y + head + 30 * s} L${x + d * (bw + 30 * s)} ${y - 60 * s - r() * 50 * s}" stroke="${ink}" stroke-width="${12 * s}" stroke-linecap="round" fill="none"/>`;
    g += arm(side);
    if (two) g += arm(-side);
  }
  return g;
}

function crowd(r, c, base = 560) {
  let g = '';
  const rows = 4;
  for (let row = 0; row < rows; row++) {
    const s = 0.55 + row * 0.38, y = base + row * 92;
    const step = 78 * s;
    for (let x = -40 + r() * step; x < W + 40; x += step * (0.8 + r() * 0.5)) {
      g += person(x, y + (r() - 0.5) * 22, s, r, row === rows - 1 ? c.ink : c.ink, r() > 0.52);
    }
  }
  return `<g>${g}</g>`;
}

function sceneInner(kind, r, c) {
  switch (kind) {
    case 'stage': {
      let g = beams(r, c, 7, [0.14, 0.42]);
      g += `<rect x="0" y="70" width="${W}" height="26" fill="${c.ink}"/>`;
      for (let i = 0; i < 9; i++) g += `<circle cx="${70 + i * 132}" cy="104" r="14" fill="${c.beam}"/>`;
      g += `<rect x="90" y="300" width="150" height="360" fill="${c.ink}"/><rect x="${W - 240}" y="300" width="150" height="360" fill="${c.ink}"/>`;
      for (let i = 0; i < 4; i++) g += `<circle cx="165" cy="${360 + i * 80}" r="26" fill="none" stroke="${c.bg}" stroke-width="5" opacity=".5"/><circle cx="${W - 165}" cy="${360 + i * 80}" r="26" fill="none" stroke="${c.bg}" stroke-width="5" opacity=".5"/>`;
      g += `<rect x="0" y="640" width="${W}" height="260" fill="${c.ink}"/>`;
      g += person(W / 2, 470, 1.5, r, c.ink, true);
      g += crowd(r, c, 700);
      return g;
    }
    case 'lights': {
      let g = beams(r, c, 14, [0.1, 0.5], 1.3);
      for (let i = 0; i < 6; i++) g += `<circle cx="${r() * W}" cy="${r() * H * 0.6}" r="${60 + r() * 160}" fill="${c.beam}" opacity="${0.05 + r() * 0.1}"/>`;
      g += `<rect x="0" y="780" width="${W}" height="120" fill="${c.ink}"/>`;
      return g;
    }
    case 'arch': {
      let g = '';
      const n = 3, aw = 300, gap = 50, x0 = (W - (n * aw + (n - 1) * gap)) / 2;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * (aw + gap);
        g += `<path d="M${x} 900 V360 A${aw / 2} ${aw / 2} 0 0 1 ${x + aw} 360 V900Z" fill="${c.ink}"/>`;
        g += `<path d="M${x + 26} 900 V366 A${aw / 2 - 26} ${aw / 2 - 26} 0 0 1 ${x + aw - 26} 366 V900Z" fill="${c.beam}" opacity="${0.35 + r() * 0.5}"/>`;
      }
      g += beams(r, c, 3, [0.08, 0.2]);
      g += `<rect x="0" y="820" width="${W}" height="80" fill="${c.ink}"/>`;
      for (let i = 0; i < 20; i++) g += person(60 + i * 58 + r() * 20, 800, 0.55, r, c.ink, r() > 0.7);
      return g;
    }
    case 'crowd':
    default: {
      let g = `<circle cx="${W * (0.3 + r() * 0.4)}" cy="${240 + r() * 100}" r="${180 + r() * 80}" fill="${c.beam}" opacity=".25"/>`;
      g += beams(r, c, 6, [0.15, 0.4]);
      g += crowd(r, c, 520);
      return g;
    }
  }
}

/** Returns an SVG string; fills its container (slice). */
export function scene(kind = 'crowd', seed = 1, tone = 'orange', { grain = true } = {}) {
  const id = `s${++uid}`;
  const c = TONES[tone] || TONES.orange;
  const r = rng(seed * 7919 + kind.length);
  return `<svg class="scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient>
<pattern id="${id}p" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="7" cy="7" r="2.6" fill="${c.ink}"/></pattern>
<linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
<mask id="${id}k"><rect width="${W}" height="${H}" fill="url(#${id}m)"/></mask>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}g)"/>
<rect width="${W}" height="${H}" fill="url(#${id}p)" mask="url(#${id}k)" opacity=".16"/>
${sceneInner(kind, r, c)}
</svg>`;
}

/** Typographic poster used when an artist has no photo. */
const POSTER = [
  ['#FF4D24', '#101010'], ['#DFFF00', '#101010'], ['#F2EEE7', '#FF4D24'], ['#101010', '#DFFF00'],
];
export function posterColors(i) { return POSTER[i % POSTER.length]; }
