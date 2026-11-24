// Procedural drawing: krathong sprites, flowers, lanterns, glows and flames.

export const STYLE_COUNT = 5;

export const FLOWER = [
  { main: '#ff9f1c', light: '#ffd166', dark: '#c45f00', center: '#8a3b00' }, // marigold
  { main: '#e63946', light: '#ff8fa3', dark: '#8d0b1a', center: '#ffd166' }, // red rose
  { main: '#ff6fae', light: '#ffc6de', dark: '#c2185b', center: '#ffe08a' }, // pink
  { main: '#f2f4f6', light: '#ffffff', dark: '#b9c6cf', center: '#ffe29a' }, // jasmine
  { main: '#a066e8', light: '#d8baff', dark: '#5b21a6', center: '#ffd6f0' }, // globe amaranth
  { main: '#ffd60a', light: '#fff3b0', dark: '#b88600', center: '#a35a00' }, // gold
];

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/* ---------------- Flowers ---------------- */

function ellipse(ctx, x, y, rx, ry, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
}

export function drawFlower(ctx, x, y, r, pal, rand) {
  const squash = 0.82;
  const n = 7 + Math.floor(rand() * 3);
  const rot = rand() * Math.PI;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ellipse(ctx, x + r * 0.08, y + r * 0.18, r * 1.02, r * 0.86 * squash, 0);
  ctx.fill();
  // outer petals
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const px = x + Math.cos(a) * r * 0.52;
    const py = y + Math.sin(a) * r * 0.52 * squash;
    const g = ctx.createRadialGradient(x, y, r * 0.1, px, py, r * 0.62);
    g.addColorStop(0, pal.dark);
    g.addColorStop(0.55, pal.main);
    g.addColorStop(1, pal.light);
    ctx.fillStyle = g;
    ellipse(ctx, px, py, r * 0.5, r * 0.32, a);
    ctx.fill();
  }
  // inner petals
  for (let i = 0; i < n - 2; i++) {
    const a = rot + 0.4 + (i / (n - 2)) * Math.PI * 2;
    const px = x + Math.cos(a) * r * 0.26;
    const py = y + Math.sin(a) * r * 0.26 * squash;
    ctx.fillStyle = pal.main;
    ellipse(ctx, px, py, r * 0.32, r * 0.22, a);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ellipse(ctx, px - r * 0.04, py - r * 0.05, r * 0.16, r * 0.09, a);
    ctx.fill();
  }
  // center
  const cg = ctx.createRadialGradient(x - r * 0.05, y - r * 0.05, 0, x, y, r * 0.24);
  cg.addColorStop(0, '#fff6c8');
  cg.addColorStop(1, pal.center);
  ctx.fillStyle = cg;
  ellipse(ctx, x, y, r * 0.2, r * 0.18, 0);
  ctx.fill();
}

function drawLeaf(ctx, x, y, len, ang, light, dark) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, dark);
  g.addColorStop(1, light);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(len * 0.08, 0);
  ctx.lineTo(len * 0.9, 0);
  ctx.stroke();
  ctx.restore();
}

/* ---------------- Krathong parts ---------------- */

// Pointed folded banana-leaf petal (กลีบใบตอง)
function leafPetal(ctx, bx, by, w, h, tilt, c1, c2, edge) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(0, 0, 0, -h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.bezierCurveTo(-w * 0.52, -h * 0.45, -w * 0.18, -h * 0.82, 0, -h);
  ctx.bezierCurveTo(w * 0.18, -h * 0.82, w * 0.52, -h * 0.45, w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // fold line
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.08);
  ctx.lineTo(0, -h * 0.9);
  ctx.stroke();
  ctx.restore();
}

// Rounded scallop petal (bread / banana trunk)
function roundPetal(ctx, bx, by, w, h, tilt, c1, c2, edge) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(0, 0, 0, -h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.bezierCurveTo(-w * 0.6, -h * 0.7, -w * 0.3, -h, 0, -h);
  ctx.bezierCurveTo(w * 0.3, -h, w * 0.6, -h * 0.7, w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

// Lotus petal
function lotusPetal(ctx, bx, by, w, h, tilt, pal) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(0, 0, 0, -h);
  g.addColorStop(0, '#fffaf2');
  g.addColorStop(0.45, pal.light);
  g.addColorStop(1, pal.main);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-w * 0.75, -h * 0.25, -w * 0.55, -h * 0.8, 0, -h);
  ctx.bezierCurveTo(w * 0.55, -h * 0.8, w * 0.75, -h * 0.25, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexA(pal.dark, 0.55);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.12);
  ctx.quadraticCurveTo(-w * 0.06, -h * 0.55, 0, -h * 0.9);
  ctx.stroke();
  ctx.restore();
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function bodyBand(ctx, cx, cy, rx, ry, depth, cTop, cBot, edge) {
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + depth + ry);
  g.addColorStop(0, cTop);
  g.addColorStop(1, cBot);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy);
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx, cy);
  ctx.bezierCurveTo(cx + rx * 0.98, cy + depth * 0.9, cx + rx * 0.55, cy + depth + ry, cx, cy + depth + ry);
  ctx.bezierCurveTo(cx - rx * 0.55, cy + depth + ry, cx - rx * 0.98, cy + depth * 0.9, cx - rx, cy);
  ctx.closePath();
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

function flowerMound(ctx, cx, cy, spread, height, pal, rand, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const v = Math.sqrt(rand());
    const x = cx + u * spread * (1 - v * 0.45);
    const y = cy - v * height * (1 - u * u * 0.55) + rand() * 4;
    pts.push({ x, y, r: 12 + rand() * 6 });
  }
  pts.sort((a, b) => a.y - b.y);
  // leaves peeking between flowers
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    drawLeaf(ctx, cx + side * (spread * (0.35 + rand() * 0.5)), cy - rand() * height * 0.5, 22 + rand() * 10, side > 0 ? -0.3 - rand() * 0.6 : Math.PI + 0.3 + rand() * 0.6, '#8fd16a', '#2e7d32');
  }
  for (const p of pts) drawFlower(ctx, p.x, p.y, p.r, pal, rand);
}

function candleAndIncense(ctx, cx, topY, baseY) {
  // candle
  const w = 13;
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, '#e8d7a8');
  g.addColorStop(0.45, '#fff6dc');
  g.addColorStop(1, '#cdb37a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.lineTo(cx - w / 2, topY + 3);
  ctx.ellipse(cx, topY + 3, w / 2, 3, 0, Math.PI, 0, false);
  ctx.lineTo(cx + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
  // drips
  ctx.fillStyle = '#fff3d0';
  ctx.beginPath();
  ctx.ellipse(cx - 3, topY + 9, 1.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // wick
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, topY + 2);
  ctx.lineTo(cx + 0.5, topY - 4);
  ctx.stroke();

  // incense sticks
  const tips = [
    { x: cx + 19, y: topY - 22 },
    { x: cx + 27, y: topY - 17 },
    { x: cx + 11, y: topY - 19 },
  ];
  const root = { x: cx + 18, y: baseY - 2 };
  ctx.lineCap = 'round';
  for (const t of tips) {
    ctx.strokeStyle = '#7a3b1c';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(root.x, root.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    // burnt grey tip
    ctx.strokeStyle = '#6f6a66';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    const dx = t.x - root.x;
    const dy = t.y - root.y;
    ctx.moveTo(t.x - dx * 0.06, t.y - dy * 0.06);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
  }
  // red paper band
  ctx.fillStyle = '#c62828';
  ctx.fillRect(root.x - 3.5, root.y - 22, 9, 6);
  ctx.lineCap = 'butt';
  return tips;
}

/* ---------------- Krathong sprite ---------------- */

const SPRITE = 256;
const spriteCache = new Map();

// Returns { canvas, flame: {x,y}, incense: [{x,y}], water: y } in sprite pixels
export function krathongSprite(style, color) {
  const s = ((style % STYLE_COUNT) + STYLE_COUNT) % STYLE_COUNT;
  const c = ((color % FLOWER.length) + FLOWER.length) % FLOWER.length;
  const key = s * 10 + c;
  const hit = spriteCache.get(key);
  if (hit) return hit;

  const cv = makeCanvas(SPRITE, SPRITE);
  const ctx = cv.getContext('2d');
  const pal = FLOWER[c];
  const rand = rng(1009 + key * 7919);
  const cx = 128;
  const cy = 168;
  let flame;
  let incense;
  const water = 190;

  if (s === 2) {
    // Lotus: lily pad, three rows of petals
    ctx.fillStyle = '#1f6b2c';
    ellipse(ctx, cx, cy + 20, 100, 20, 0);
    ctx.fill();
    ctx.fillStyle = '#2f8a3c';
    ellipse(ctx, cx, cy + 17, 94, 16, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,230,140,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.05 + (i / 8) * 0.9);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 17);
      ctx.lineTo(cx + Math.cos(a) * 92, cy + 17 + Math.sin(a) * 15);
      ctx.stroke();
    }
    const rowBack = 7;
    for (let i = 0; i < rowBack; i++) {
      const t = i / (rowBack - 1) - 0.5;
      lotusPetal(ctx, cx + t * 70, cy + 6, 44, 82 - Math.abs(t) * 30, t * 1.7, pal);
    }
    const rowMid = 5;
    for (let i = 0; i < rowMid; i++) {
      const t = i / (rowMid - 1) - 0.5;
      lotusPetal(ctx, cx + t * 56, cy + 10, 40, 74 - Math.abs(t) * 22, t * 1.15, pal);
    }
    // seed pod
    const pg = ctx.createLinearGradient(0, cy - 30, 0, cy);
    pg.addColorStop(0, '#fff3a8');
    pg.addColorStop(1, '#d9a72b');
    ctx.fillStyle = pg;
    ellipse(ctx, cx, cy - 18, 22, 8, 0);
    ctx.fill();
    ctx.fillStyle = '#b67f12';
    for (let i = 0; i < 7; i++) {
      ellipse(ctx, cx - 14 + i * 4.6, cy - 18 + Math.sin(i) * 2, 1.6, 1.2, 0);
      ctx.fill();
    }
    incense = candleAndIncense(ctx, cx, cy - 74, cy - 16);
    flame = { x: cx + 0.5, y: cy - 78 };
    const rowFront = 4;
    for (let i = 0; i < rowFront; i++) {
      const t = i / (rowFront - 1) - 0.5;
      lotusPetal(ctx, cx + t * 84, cy + 16, 46, 58 - Math.abs(t) * 10, t * 2.3, pal);
    }
    lotusPetal(ctx, cx, cy + 18, 40, 54, 0, pal);
  } else {
    const looks = {
      0: { top: '#dcebb4', bot: '#7fa35a', edge: '#5b7f3c', face: '#eef5d6', back: ['#2a6a31', '#5a9a45'], front: ['#3f9e48', '#a8d86e'], inner: ['#5db552', '#c7ea8f'], edgeP: '#245a29', petal: 'leaf' },
      1: { top: '#f2c27e', bot: '#9c5a25', edge: '#7a4319', face: '#f7d29a', back: ['#b8732f', '#e9b06a'], front: ['#c98436', '#f4c987'], inner: ['#d99a4c', '#fbd9a0'], edgeP: '#7a4319', petal: 'round' },
      3: { top: '#f4f1d8', bot: '#a9c27a', edge: '#8aa35e', face: '#fbf8e6', back: ['#7fb05a', '#c5e59a'], front: ['#8cc063', '#d7efb0'], inner: ['#a6d27a', '#eaf7cf'], edgeP: '#5f8a3c', petal: 'round' },
      4: { top: '#7a4c2b', bot: '#2e1a0c', edge: '#1f1108', face: '#cfa57b', back: ['#2a6a31', '#5a9a45'], front: ['#3f9e48', '#9fd36a'], inner: ['#5db552', '#bfe58a'], edgeP: '#245a29', petal: 'leaf' },
    }[s];
    const rx = 90;
    const ry = 19;

    // back petals (behind the flowers)
    const nb = 7;
    for (let i = 0; i < nb; i++) {
      const t = i / (nb - 1) - 0.5;
      const px = cx + t * rx * 1.7;
      const py = cy - ry * 0.55 * Math.cos(t * Math.PI) + 2;
      const fn = looks.petal === 'leaf' ? leafPetal : roundPetal;
      fn(ctx, px, py, 34, looks.petal === 'leaf' ? 54 : 38, t * 1.2, looks.back[0], looks.back[1], looks.edgeP);
    }

    // body
    if (s === 4) {
      // coconut shell
      bodyBand(ctx, cx, cy, rx, ry, 30, looks.top, looks.bot, looks.edge);
      ctx.strokeStyle = 'rgba(255,220,170,0.16)';
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 26; i++) {
        const x = cx - rx + 8 + (i / 25) * (rx * 2 - 16);
        ctx.beginPath();
        ctx.moveTo(x, cy + 4);
        ctx.quadraticCurveTo(x + (x - cx) * 0.05, cy + 22, x - (x - cx) * 0.25, cy + 40 - Math.abs(x - cx) * 0.2);
        ctx.stroke();
      }
      ctx.fillStyle = looks.face;
      ellipse(ctx, cx, cy, rx, ry, 0);
      ctx.fill();
      ctx.strokeStyle = '#5a3620';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      bodyBand(ctx, cx, cy, rx, ry, 24, looks.top, looks.bot, looks.edge);
      if (s === 1) {
        // bread crust speckles
        const r2 = rng(77 + c);
        ctx.fillStyle = 'rgba(110,55,15,0.35)';
        for (let i = 0; i < 40; i++) {
          const a = r2() * Math.PI;
          const rr = r2();
          ellipse(ctx, cx + Math.cos(a) * rx * 0.95 * rr, cy + 8 + Math.sin(a) * (ry + 18) * rr, 1.6, 1, 0);
          ctx.fill();
        }
      }
      if (s === 3) {
        // banana trunk cross-section rings
        ctx.strokeStyle = 'rgba(140,170,100,0.45)';
        ctx.lineWidth = 1;
        for (let k = 1; k < 4; k++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + 14, rx * (1 - k * 0.07), ry + 6, 0, 0.15, Math.PI - 0.15);
          ctx.stroke();
        }
      }
      ctx.fillStyle = looks.face;
      ellipse(ctx, cx, cy, rx, ry, 0);
      ctx.fill();
    }

    // flowers, candle, incense
    flowerMound(ctx, cx, cy - 10, 66, 40, pal, rand, s === 4 ? 14 : 16);
    incense = candleAndIncense(ctx, cx, cy - 82, cy - 26);
    flame = { x: cx + 0.5, y: cy - 86 };

    // front petal rows
    const fn = looks.petal === 'leaf' ? leafPetal : roundPetal;
    const nf = 9;
    const order = [];
    for (let i = 0; i < nf; i++) order.push(i);
    order.sort((a, b) => Math.abs(b - (nf - 1) / 2) - Math.abs(a - (nf - 1) / 2));
    for (const i of (s === 4 ? [] : order)) {
      const th = Math.PI * (0.06 + (i / (nf - 1)) * 0.88);
      const px = cx + Math.cos(th) * rx * 0.98;
      const py = cy + Math.sin(th) * ry + 3;
      const tilt = Math.cos(th) * 0.75;
      fn(ctx, px, py, 30, looks.petal === 'leaf' ? 34 : 24, tilt, looks.front[0], looks.front[1], looks.edgeP);
    }
    const ni = 7;
    const order2 = [];
    for (let i = 0; i < ni; i++) order2.push(i);
    order2.sort((a, b) => Math.abs(b - (ni - 1) / 2) - Math.abs(a - (ni - 1) / 2));
    for (const i of order2) {
      const th = Math.PI * (0.12 + (i / (ni - 1)) * 0.76);
      const px = cx + Math.cos(th) * rx * 0.86;
      const py = cy + Math.sin(th) * ry * 0.9 + 10;
      const tilt = Math.cos(th) * 0.55;
      fn(ctx, px, py, 26, looks.petal === 'leaf' ? 24 : 18, tilt, looks.inner[0], looks.inner[1], looks.edgeP);
    }
  }

  const out = { canvas: cv, flame, incense, water, size: SPRITE };
  spriteCache.set(key, out);
  return out;
}

/* ---------------- Flame / glow ---------------- */

let glowSprite = null;
export function glow() {
  if (glowSprite) return glowSprite;
  const s = 128;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,240,190,0.95)');
  g.addColorStop(0.18, 'rgba(255,200,110,0.55)');
  g.addColorStop(0.45, 'rgba(255,140,50,0.18)');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  glowSprite = c;
  return c;
}

export function drawFlame(ctx, x, y, h, t, seed) {
  const f = 0.86 + 0.14 * Math.sin(t * 13 + seed) + 0.08 * Math.sin(t * 23.7 + seed * 2);
  const hh = h * f;
  const w = h * 0.36;
  const sway = Math.sin(t * 3.1 + seed) * w * 0.25;
  const g = ctx.createRadialGradient(x, y - hh * 0.3, 0, x, y - hh * 0.35, hh * 0.8);
  g.addColorStop(0, 'rgba(255,255,235,1)');
  g.addColorStop(0.35, 'rgba(255,225,120,0.95)');
  g.addColorStop(0.75, 'rgba(255,140,40,0.75)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - w, y - hh * 0.15, x - w * 0.55 + sway * 0.4, y - hh * 0.7, x + sway, y - hh);
  ctx.bezierCurveTo(x + w * 0.55 + sway * 0.4, y - hh * 0.7, x + w, y - hh * 0.15, x, y);
  ctx.fill();
}

/* ---------------- Lantern (โคมลอย) ---------------- */

let lanternSprite = null;
export function lantern() {
  if (lanternSprite) return lanternSprite;
  const w = 64;
  const h = 84;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const top = 8;
  const bot = 70;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#d9642a');
  g.addColorStop(0.5, '#ff9f45');
  g.addColorStop(1, '#ffd889');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(14, bot);
  ctx.bezierCurveTo(9, 48, 6, 20, 12, top + 4);
  ctx.quadraticCurveTo(32, top - 6, 52, top + 4);
  ctx.bezierCurveTo(58, 20, 55, 48, 50, bot);
  ctx.closePath();
  ctx.fill();
  // ribs
  ctx.strokeStyle = 'rgba(190,90,20,0.25)';
  ctx.lineWidth = 1;
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(32 + k * 30, top + 2);
    ctx.quadraticCurveTo(32 + k * 34, 40, 32 + k * 26, bot);
    ctx.stroke();
  }
  // inner light
  const ig = ctx.createRadialGradient(32, bot - 6, 0, 32, bot - 10, 34);
  ig.addColorStop(0, 'rgba(255,246,200,0.85)');
  ig.addColorStop(0.5, 'rgba(255,200,110,0.35)');
  ig.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = ig;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  // opening
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.ellipse(32, bot, 18, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe07a';
  ctx.beginPath();
  ctx.ellipse(32, bot + 3, 4, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  lanternSprite = c;
  return c;
}
