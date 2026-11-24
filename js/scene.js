// The night river: sky, moon, temples, lanterns, fireworks and floating krathongs.

import { krathongSprite, drawFlame, glow, lantern, rng, makeCanvas, FLOWER, STYLE_COUNT } from './draw.js';

const WL = 190 / 256; // waterline position inside a krathong sprite
const CLIP = 198; // sprite rows drawn above water (a few px below the waterline)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/* ---------------- Skyline shapes ---------------- */

function prangPath(ctx, x, base, h) {
  const w = h * 0.3;
  ctx.rect(x - w * 0.95, base - h * 0.07, w * 1.9, h * 0.07);
  ctx.rect(x - w * 0.78, base - h * 0.14, w * 1.56, h * 0.075);
  ctx.rect(x - w * 0.62, base - h * 0.2, w * 1.24, h * 0.065);
  const b = base - h * 0.2;
  const top = base - h * 0.84;
  ctx.moveTo(x - w * 0.5, b);
  ctx.bezierCurveTo(x - w * 0.53, b - h * 0.32, x - w * 0.36, top + h * 0.1, x, top);
  ctx.bezierCurveTo(x + w * 0.36, top + h * 0.1, x + w * 0.53, b - h * 0.32, x + w * 0.5, b);
  ctx.closePath();
  ctx.moveTo(x - w * 0.07, top + h * 0.03);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + w * 0.07, top + h * 0.03);
  ctx.closePath();
}

function prangTiers(ctx, x, base, h) {
  const w = h * 0.3;
  const b = base - h * 0.2;
  const top = base - h * 0.84;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const f = i / 8;
    const y = b - (b - top) * f;
    const hw = w * 0.5 * (1 - Math.pow(f, 2.2) * 0.85);
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x + hw, y);
  }
  ctx.stroke();
}

function chediPath(ctx, x, base, h) {
  const w = h * 0.44;
  ctx.rect(x - w * 0.5, base - h * 0.07, w, h * 0.07);
  ctx.rect(x - w * 0.42, base - h * 0.13, w * 0.84, h * 0.06);
  ctx.moveTo(x - w * 0.38, base - h * 0.13);
  ctx.bezierCurveTo(x - w * 0.4, base - h * 0.42, x - w * 0.14, base - h * 0.5, x - w * 0.09, base - h * 0.52);
  ctx.lineTo(x + w * 0.09, base - h * 0.52);
  ctx.bezierCurveTo(x + w * 0.14, base - h * 0.5, x + w * 0.4, base - h * 0.42, x + w * 0.38, base - h * 0.13);
  ctx.closePath();
  ctx.rect(x - w * 0.11, base - h * 0.59, w * 0.22, h * 0.07);
  ctx.moveTo(x - w * 0.08, base - h * 0.59);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + w * 0.08, base - h * 0.59);
  ctx.closePath();
}

function hallPath(ctx, x, base, w, h) {
  ctx.rect(x - w * 0.46, base - h * 0.36, w * 0.92, h * 0.36);
  const tiers = [
    [0.36, 0.6, 0.6, 0.44],
    [0.55, 0.79, 0.48, 0.35],
    [0.74, 0.95, 0.37, 0.27],
  ];
  for (const [e, r, bw, tw] of tiers) {
    ctx.moveTo(x - w * bw, base - h * e);
    ctx.lineTo(x - w * tw, base - h * r);
    ctx.lineTo(x + w * tw, base - h * r);
    ctx.lineTo(x + w * bw, base - h * e);
    ctx.closePath();
  }
}

function hallOrnaments(ctx, x, base, w, h) {
  // chofa finials and eave hooks (หางหงส์)
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(x + side * w * 0.27, base - h * 0.95);
    ctx.quadraticCurveTo(x + side * w * 0.29, base - h * 1.04, x + side * w * 0.33, base - h * 1.1);
    for (const [e, bw] of [[0.36, 0.6], [0.55, 0.48], [0.74, 0.37]]) {
      ctx.moveTo(x + side * w * bw, base - h * e);
      ctx.quadraticCurveTo(x + side * w * (bw + 0.035), base - h * (e + 0.02), x + side * w * (bw + 0.03), base - h * (e + 0.07));
    }
  }
  ctx.stroke();
}

function treeBlob(ctx, x, base, h, rand) {
  const n = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    const r = h * (0.28 + rand() * 0.22);
    ctx.moveTo(x + (rand() - 0.5) * h * 0.9 + r, base - r * 0.9 - rand() * h * 0.45);
    ctx.arc(x + (rand() - 0.5) * h * 0.9, base - r * 0.9 - rand() * h * 0.45, r, 0, Math.PI * 2);
  }
  ctx.rect(x - h * 0.06, base - h * 0.4, h * 0.12, h * 0.4);
}

function palm(ctx, x, base, h, lean) {
  const topX = x + lean * h * 0.35;
  const topY = base - h;
  ctx.lineWidth = Math.max(2, h * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + lean * h * 0.05, base - h * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, h * 0.028);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.48;
    const len = h * (0.36 + (i % 2) * 0.08);
    const ex = topX + Math.cos(a) * len * 1.1;
    const ey = topY + Math.sin(a) * len * 0.45 + len * 0.45;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.7, ex, ey);
    ctx.stroke();
  }
}

/* ---------------- Scene ---------------- */

export class Scene {
  constructor(canvas) {
    this.cv = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_unsupported');
    this.ctx = ctx;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.quality = 1;
    this.dprCap = 2;
    this.t = 0;
    this.last = 0;
    this.running = false;
    this.raf = 0;
    this.frameTimes = [];
    this.krathongs = [];
    this.lanterns = [];
    this.rockets = [];
    this.sparks = [];
    this.ripples = [];
    this.fireflies = [];
    this.shooting = null;
    this.nextShooting = 8 + Math.random() * 10;
    this.nextLantern = 0.5;
    this.nextFirework = this.reduced ? Infinity : 3 + Math.random() * 4;
    this.nextSpawn = 0;
    this.pool = [];
    this.poolIdx = 0;
    this.fresh = [];
    this.pointer = null;
    this.hoverKey = null;
    this.selectedKey = null;
    this.labels = { yours: 'กระทงของคุณ', anonymous: '' };
    this.labelFont = '600 13px Anuphan, "Noto Sans Thai", "Leelawadee UI", sans-serif';
    this.onKrathongTap = null;
    this.onEmptyTap = null;
    this.onBurst = null;
    this.onLantern = null;
    this.onRipple = null;
    this.W = 0;
    this.H = 0;

    this._loop = this._loop.bind(this);
    this._onResize = () => {
      clearTimeout(this._rz);
      this._rz = setTimeout(() => this.resize(), 120);
    };
    window.addEventListener('resize', this._onResize, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._onResize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });

    this._bindPointer();
    this.resize();
    this._initAmbient();
  }

  /* ---------- layout & caches ---------- */

  resize() {
    const W = Math.max(1, this.cv.clientWidth || window.innerWidth);
    const H = Math.max(1, this.cv.clientHeight || window.innerHeight);
    const oldW = this.W || W;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.dpr = dpr;
    this.cv.width = Math.round(W * dpr);
    this.cv.height = Math.round(H * dpr);
    this.W = W;
    this.H = H;
    const portrait = H > W;
    this.mobile = W < 700;
    this.hy = Math.round(H * (portrait ? 0.53 : 0.58));
    this.mr = clamp(Math.min(W, H) * 0.075, 28, 80);
    this.mx = W * (portrait ? 0.74 : 0.76);
    this.my = Math.max(this.mr + (portrait ? 205 : 150), H * (portrait ? 0.27 : 0.24));
    if (this.my > this.hy - this.mr * 2.2) this.my = this.hy - this.mr * 2.2;
    this.base = clamp(Math.min(W * 0.3, (H - this.hy) * 0.85), 80, 190);
    this.depthSpan = this.mobile ? 0.76 : 0.86;
    this.maxVisible = Math.round(clamp((W * (H - this.hy)) / 9000, 12, 34) * this.quality);

    if (oldW !== W) {
      const k = W / oldW;
      for (const kr of this.krathongs) kr.x *= k;
      for (const l of this.lanterns) l.x *= k;
    }
    this._buildBackground();
    this._buildForeground();
    this._buildStars();
    this._buildGlints();
    this._buildFireflies();
    if (!this.running) this._draw();
  }

  _buildBackground() {
    const { W, H, hy, dpr } = this;
    const bg = this.bg || (this.bg = makeCanvas(1, 1));
    bg.width = Math.round(W * dpr);
    bg.height = Math.round(H * dpr);
    const ctx = bg.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#04051a');
    sky.addColorStop(0.45, '#0c0f36');
    sky.addColorStop(0.8, '#1d1a4c');
    sky.addColorStop(1, '#3a2552');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hy + 2);

    // nebula haze
    const r = rng(42);
    for (let i = 0; i < 5; i++) {
      const x = r() * W;
      const y = r() * hy * 0.8;
      const rad = (0.25 + r() * 0.35) * Math.max(W, hy);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const hue = r() > 0.5 ? '120,90,200' : '60,110,200';
      g.addColorStop(0, `rgba(${hue},0.08)`);
      g.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, hy);
    }

    // festival glow on horizon
    const hg = ctx.createLinearGradient(0, hy - H * 0.16, 0, hy);
    hg.addColorStop(0, 'rgba(255,140,90,0)');
    hg.addColorStop(1, 'rgba(255,150,90,0.22)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, hy - H * 0.16, W, H * 0.16);

    // moon halo
    const { mx, my, mr } = this;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 6);
    halo.addColorStop(0, 'rgba(255,244,210,0.32)');
    halo.addColorStop(0.25, 'rgba(255,236,200,0.12)');
    halo.addColorStop(1, 'rgba(255,230,200,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, hy);

    // moon disk
    const md = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    md.addColorStop(0, '#fffdf2');
    md.addColorStop(0.7, '#fbf0cf');
    md.addColorStop(1, '#efd9a2');
    ctx.fillStyle = md;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.clip();
    const mare = [[-0.3, -0.2, 0.34], [0.22, -0.32, 0.22], [0.1, 0.18, 0.3], [-0.25, 0.35, 0.18], [0.42, 0.12, 0.14]];
    for (const [ox, oy, rr] of mare) {
      const cx = mx + ox * mr;
      const cy = my + oy * mr;
      const mg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr * mr);
      mg.addColorStop(0, 'rgba(190,165,115,0.26)');
      mg.addColorStop(0.7, 'rgba(190,165,115,0.12)');
      mg.addColorStop(1, 'rgba(190,165,115,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(cx - rr * mr, cy - rr * mr, rr * mr * 2, rr * mr * 2);
    }
    const shade = ctx.createRadialGradient(mx - mr * 0.4, my - mr * 0.4, mr * 0.6, mx, my, mr * 1.05);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(160,120,60,0.18)');
    ctx.fillStyle = shade;
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.restore();

    // water
    const water = ctx.createLinearGradient(0, hy, 0, H);
    water.addColorStop(0, '#272457');
    water.addColorStop(0.12, '#161a48');
    water.addColorStop(0.55, '#0b0f33');
    water.addColorStop(1, '#04061a');
    ctx.fillStyle = water;
    ctx.fillRect(0, hy, W, H - hy);
    // warm reflection of the horizon glow
    const wg = ctx.createLinearGradient(0, hy, 0, hy + (H - hy) * 0.35);
    wg.addColorStop(0, 'rgba(255,150,100,0.16)');
    wg.addColorStop(1, 'rgba(255,150,100,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, hy, W, (H - hy) * 0.35);

    this._buildSkyline(ctx);

    // mist line
    const mist = ctx.createLinearGradient(0, hy - 14, 0, hy + 10);
    mist.addColorStop(0, 'rgba(190,180,255,0)');
    mist.addColorStop(0.6, 'rgba(190,180,255,0.1)');
    mist.addColorStop(1, 'rgba(190,180,255,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, hy - 14, W, 24);
  }

  _buildSkyline(ctx) {
    const { W, H, hy } = this;
    const r = rng(2569);
    const sh = Math.min(H * 0.2, W * 0.34, 200);
    const tx = W * (this.mobile ? 0.28 : 0.26);

    // far tree line
    ctx.fillStyle = '#0c0d2a';
    ctx.beginPath();
    for (let x = -20; x < W + 20; x += 9 + r() * 10) {
      const rr = 5 + r() * sh * 0.07;
      ctx.moveTo(x + rr, hy);
      ctx.arc(x, hy - rr * 0.35, rr, 0, Math.PI * 2);
    }
    ctx.fill();

    // temple glow
    const tg = ctx.createRadialGradient(tx, hy - sh * 0.4, 0, tx, hy - sh * 0.4, sh * 1.6);
    tg.addColorStop(0, 'rgba(255,190,110,0.22)');
    tg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(tx - sh * 1.6, hy - sh * 2, sh * 3.2, sh * 2);

    // flood-lit temple complex
    const lit = ctx.createLinearGradient(0, hy - sh, 0, hy);
    lit.addColorStop(0, '#f2c27a');
    lit.addColorStop(0.45, '#b67445');
    lit.addColorStop(1, '#3a2232');
    ctx.fillStyle = lit;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    chediPath(ctx, tx - sh * 1.05, hy, sh * 0.5);
    prangPath(ctx, tx - sh * 0.45, hy, sh * 0.56);
    prangPath(ctx, tx + sh * 0.45, hy, sh * 0.56);
    ctx.fill();
    ctx.beginPath();
    prangPath(ctx, tx, hy, sh);
    ctx.fill();
    ctx.beginPath();
    hallPath(ctx, tx + sh * 1.05, hy, sh * 0.95, sh * 0.42);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(60,25,30,0.45)';
    ctx.lineWidth = 1;
    prangTiers(ctx, tx, hy, sh);
    prangTiers(ctx, tx - sh * 0.45, hy, sh * 0.56);
    prangTiers(ctx, tx + sh * 0.45, hy, sh * 0.56);
    ctx.strokeStyle = '#d9a35e';
    ctx.lineWidth = Math.max(1.2, sh * 0.012);
    ctx.lineCap = 'round';
    hallOrnaments(ctx, tx + sh * 1.05, hy, sh * 0.95, sh * 0.42);
    // hall doors / windows
    ctx.fillStyle = 'rgba(255,214,140,0.85)';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(tx + sh * 1.05 + i * sh * 0.14 - sh * 0.025, hy - sh * 0.11, sh * 0.05, sh * 0.08);
    }

    // trees
    ctx.fillStyle = '#06071a';
    ctx.beginPath();
    for (let x = -30; x < W + 40; x += 60 + r() * 120) {
      const nearTemple = Math.abs(x - tx) < sh * 1.4;
      const h = sh * (nearTemple ? 0.12 + r() * 0.1 : 0.16 + r() * 0.2);
      treeBlob(ctx, x, hy + 1, h, r);
    }
    ctx.fill();
    ctx.strokeStyle = '#06071a';
    ctx.lineCap = 'round';
    const palms = this.mobile ? [tx + sh * 1.7, W * 0.92] : [tx + sh * 1.75, tx - sh * 1.6, W * 0.62, W * 0.95];
    palms.forEach((px, i) => palm(ctx, px, hy + 1, sh * (0.42 + (i % 2) * 0.12), i % 2 ? -0.6 : 0.5));

    // shore
    ctx.fillStyle = '#05061a';
    ctx.fillRect(0, hy - 1, W, 3);

    // string lights along the shore
    this.lights = [];
    const step = this.mobile ? 13 : 16;
    const cols = ['255,214,120', '255,170,90', '255,140,170', '255,236,180'];
    const g = glow();
    ctx.globalCompositeOperation = 'lighter';
    const span = W / Math.max(1, Math.round(W / 260));
    for (let x = 4; x < W; x += step) {
      const local = (x % span) / span;
      const y = hy - 15 + Math.sin(local * Math.PI) * 6;
      const c = cols[Math.floor(x / step) % cols.length];
      ctx.globalAlpha = 0.9;
      ctx.drawImage(g, x - 7, y - 7, 14, 14);
      ctx.fillStyle = `rgb(${c})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
      if (Math.floor(x / step) % 2 === 0) this.lights.push({ x, c, p: r() * 6 });
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  _buildForeground() {
    const { W, H, dpr } = this;
    const fg = this.fg || (this.fg = makeCanvas(1, 1));
    fg.width = Math.round(W * dpr);
    fg.height = Math.round(H * dpr);
    const ctx = fg.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const r = rng(7);
    const s = clamp(Math.min(W, H) * 0.22, 90, 200);

    // lotus pads near the bottom corners
    const pads = [[0.04, 0.965, 1], [0.13, 0.99, 0.7], [0.95, 0.975, 0.9]];
    if (!this.mobile) pads.push([0.86, 1.0, 0.6]);
    for (const [px, py, k] of pads) {
      const x = W * px;
      const y = H * py;
      const rx = s * 0.42 * k;
      const ry = rx * 0.22;
      ctx.fillStyle = '#0a2219';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0.18, Math.PI * 2 - 0.18);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,200,150,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // reeds
    ctx.strokeStyle = '#04050f';
    ctx.lineCap = 'round';
    const reedSets = this.mobile ? [[0, 1]] : [[0, 1], [W, -1]];
    for (const [x0, dir] of reedSets) {
      for (let i = 0; i < 14; i++) {
        const x = x0 + dir * (r() * s * 0.55);
        const h = s * (0.55 + r() * 0.75);
        const bend = (r() - 0.3) * h * 0.25 * dir;
        ctx.lineWidth = 2 + r() * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, H + 4);
        ctx.quadraticCurveTo(x + bend * 0.4, H - h * 0.5, x + bend, H - h);
        ctx.stroke();
        if (r() > 0.6) {
          ctx.fillStyle = '#04050f';
          ctx.beginPath();
          ctx.ellipse(x + bend, H - h + 8, 3.5, 11, bend * 0.004, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  _buildStars() {
    const { W, hy } = this;
    const n = Math.round(clamp((W * hy) / 4200, 60, 260));
    const r = rng(99);
    this.stars = [];
    for (let i = 0; i < n; i++) {
      const x = r() * W;
      const y = r() * hy * 0.96;
      const dx = x - this.mx;
      const dy = y - this.my;
      if (dx * dx + dy * dy < (this.mr * 2.2) ** 2) continue;
      const big = r() > 0.93;
      this.stars.push({ x, y, s: big ? 1.6 + r() * 0.8 : 0.6 + r() * 0.8, p: r() * 6.28, sp: 0.6 + r() * 2.2, a: 0.35 + r() * 0.6 * (1 - y / hy * 0.5) });
    }
  }

  _buildGlints() {
    const { W, H, hy } = this;
    const r = rng(5);
    const n = Math.round(clamp(W / 7, 60, 200));
    this.glints = [];
    for (let i = 0; i < n; i++) {
      const p = Math.pow(r(), 1.4);
      const y = hy + 4 + p * (H - hy - 4);
      this.glints.push({ x: r() * W, y, w: 6 + p * 34 * r(), h: 1 + p * 1.5, ph: r() * 6.28, sp: 0.6 + r() * 1.6 });
    }
  }

  _buildFireflies() {
    const { W, H, hy } = this;
    const r = rng(11);
    const n = this.reduced ? 8 : Math.round(clamp(W / 40, 12, 30) * this.quality);
    this.fireflies = [];
    for (let i = 0; i < n; i++) {
      this.fireflies.push({ x: r() * W, y: hy - 30 + r() * (H - hy) * 0.5, ph: r() * 6.28, sp: 0.3 + r() * 0.6, amp: 10 + r() * 30 });
    }
  }

  _initAmbient() {
    const { W, hy } = this;
    const n = this.reduced ? 4 : 13;
    for (let i = 0; i < n; i++) {
      this._spawnLantern(Math.random() * W, hy * (0.15 + Math.random() * 0.75), false, Math.random() * 8);
    }
  }

  /* ---------- public API ---------- */

  start() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setLabels(labels) {
    this.labels = { ...this.labels, ...labels };
  }

  setPool(rows) {
    this.pool = Array.isArray(rows) ? rows.slice() : [];
    this.poolIdx = 0;
  }

  pushFresh(rows) {
    for (const row of rows) {
      if (!this.pool.some((p) => p.id === row.id)) this.pool.unshift(row);
      this.fresh.push(row);
    }
    if (this.pool.length > 400) this.pool.length = 400;
  }

  fillRiver() {
    const target = Math.round(this.maxVisible * 0.85);
    const slots = [];
    for (let i = 0; i < target; i++) slots.push((i + 0.15 + Math.random() * 0.7) / target);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    let guard = 0;
    while (this.krathongs.length < target && guard < 80) {
      this._spawnNext(true, slots[guard % slots.length]);
      guard++;
    }
  }

  launchMine(row) {
    const k = this._makeKrathong(row, { mine: true });
    k.x = this.W * 0.5;
    k.depth = this.mobile ? 0.55 : 0.58;
    k.vx = 4 + Math.random() * 4;
    k.vd = -0.009;
    k.born = this.t;
    k.launch = 1;
    this.krathongs.push(k);
    const y = this._yOf(k.depth);
    for (let i = 0; i < 3; i++) this._ripple(k.x, y, this._sizeOf(k.depth) * (0.5 + i * 0.25), i * 0.25);
    if (this.onRipple) this.onRipple();
    return k;
  }

  placeMine(row) {
    // a krathong the visitor floated earlier: put it somewhere mid-river
    const k = this._makeKrathong(row, { mine: true });
    k.x = this.W * (0.15 + Math.random() * 0.7);
    k.depth = 0.35 + Math.random() * 0.35;
    this.krathongs.push(k);
  }

  celebrate() {
    if (this.reduced) return;
    const n = 3;
    for (let i = 0; i < n; i++) {
      setTimeout(() => this._launchRocket(this.W * (0.2 + Math.random() * 0.6)), 250 + i * 520);
    }
  }

  releaseLantern(x, y) {
    this._spawnLantern(x, y, true, 0);
    if (this.onLantern) this.onLantern();
  }

  positionOf(key) {
    const k = this.krathongs.find((kk) => kk.key === key);
    if (!k) return null;
    const D = this._sizeOf(k.depth);
    return { x: k.x, y: this._yOf(k.depth) - D * 0.6, size: D };
  }

  select(key) {
    this.selectedKey = key;
  }

  /* ---------- geometry ---------- */

  _yOf(depth) {
    return this.hy + (this.H - this.hy) * (0.07 + this.depthSpan * depth);
  }

  _sizeOf(depth) {
    return this.base * (0.2 + 0.8 * Math.pow(clamp(depth, 0, 1.2), 1.1));
  }

  /* ---------- spawning ---------- */

  _makeKrathong(row, { mine = false, decorative = false } = {}) {
    const style = clamp(Math.round(row.style), 0, STYLE_COUNT - 1);
    const color = clamp(Math.round(row.color), 0, FLOWER.length - 1);
    return {
      key: decorative ? `d${Math.random().toString(36).slice(2)}` : `${mine ? 'm' : 'k'}${row.id}`,
      row,
      style,
      color,
      mine,
      decorative,
      x: 0,
      depth: 0.5,
      vx: 0,
      vd: 0,
      ph: Math.random() * 6.28,
      seed: Math.random() * 100,
      born: this.t,
      alpha: 0,
      dying: false,
      launch: 0,
    };
  }

  _spawnNext(initial, slot) {
    let row = null;
    let decorative = false;
    const visible = new Set(this.krathongs.map((k) => k.row && k.row.id));
    while (this.fresh.length && !row) {
      const f = this.fresh.shift();
      if (!visible.has(f.id)) row = f;
    }
    if (!row && this.pool.length) {
      for (let i = 0; i < this.pool.length; i++) {
        const cand = this.pool[this.poolIdx % this.pool.length];
        this.poolIdx++;
        if (!visible.has(cand.id)) {
          row = cand;
          break;
        }
      }
    }
    if (!row) {
      const realCount = this.krathongs.filter((k) => !k.decorative).length;
      if (realCount + this.krathongs.filter((k) => k.decorative).length >= Math.max(10, Math.round(this.maxVisible * 0.55))) return;
      decorative = true;
      row = { id: -1, style: Math.floor(Math.random() * STYLE_COUNT), color: Math.floor(Math.random() * FLOWER.length) };
    }
    const k = this._makeKrathong(row, { decorative, mine: !!row.mine });
    const D0 = this._sizeOf(1);
    if (initial) {
      k.depth = 0.08 + Math.random() * 0.78;
      k.x = (slot == null ? Math.random() : slot) * this.W;
      k.born = this.t - Math.random() * 2;
    } else {
      k.depth = 0.12 + Math.random() * 0.72;
      k.x = -D0 * 0.5 * (0.3 + k.depth);
    }
    const D = this._sizeOf(k.depth);
    k.vx = (7 + Math.random() * 12) * (D / 120);
    k.vd = -(0.0015 + Math.random() * 0.0025);
    this.krathongs.push(k);
  }

  _spawnLantern(x, y, user, age) {
    if (this.lanterns.length > (this.reduced ? 10 : 34)) {
      if (!user) return;
      this.lanterns.shift();
    }
    const near = user ? 1 : 0.45 + Math.random() * 0.55;
    this.lanterns.push({
      x,
      y,
      s: (user ? 36 : 16 + Math.random() * 18) * clamp(this.W / 900, 0.85, 1.25) * (user ? 1 : near),
      vy: -(user ? 26 : 8 + Math.random() * 12) * near,
      ph: Math.random() * 6.28,
      age: age || 0,
      user,
    });
  }

  _launchRocket(x) {
    const palette = [
      ['255,214,120', '255,170,80'],
      ['255,120,170', '255,200,230'],
      ['130,220,255', '220,250,255'],
      ['170,255,170', '255,255,200'],
      ['255,236,200', '255,190,120'],
      ['200,150,255', '255,210,255'],
    ];
    this.rockets.push({
      x,
      y: this.hy - 4,
      vy: -(this.hy * 0.9 + Math.random() * this.hy * 0.25),
      ty: this.hy * (0.18 + Math.random() * 0.35),
      col: palette[Math.floor(Math.random() * palette.length)],
      willow: Math.random() < 0.3,
    });
  }

  _explode(r) {
    const n = Math.round((r.willow ? 70 : 90) * clamp(this.quality, 0.5, 1));
    const speed = clamp(this.H * 0.16, 80, 170) * (0.8 + Math.random() * 0.4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
      const v = speed * (0.55 + Math.random() * 0.45);
      this.sparks.push({
        x: r.x,
        y: r.y,
        px: r.x,
        py: r.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        max: r.willow ? 2.6 + Math.random() : 1.3 + Math.random() * 0.6,
        c: Math.random() < 0.7 ? r.col[0] : r.col[1],
        drag: r.willow ? 0.975 : 0.965,
        g: r.willow ? 45 : 60,
      });
    }
    if (this.sparks.length > 900) this.sparks.splice(0, this.sparks.length - 900);
    if (this.onBurst) this.onBurst(r.x / this.W, 1 - r.y / this.hy);
  }

  _ripple(x, y, r, delay = 0) {
    this.ripples.push({ x, y, r0: r * 0.25, r1: r, life: -delay, max: 2.2 });
  }

  /* ---------- input ---------- */

  _bindPointer() {
    const cv = this.cv;
    const pos = (e) => {
      const rect = cv.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.pointer = pos(e);
      const k = this._hit(this.pointer.x, this.pointer.y);
      this.hoverKey = k ? k.key : null;
      cv.classList.toggle('pointer', !!(k && !k.decorative));
    }, { passive: true });
    cv.addEventListener('pointerleave', () => {
      this.pointer = null;
      this.hoverKey = null;
      cv.classList.remove('pointer');
    }, { passive: true });
    let down = null;
    cv.addEventListener('pointerdown', (e) => {
      down = { ...pos(e), t: performance.now() };
    }, { passive: true });
    cv.addEventListener('pointerup', (e) => {
      if (!down) return;
      const p = pos(e);
      const moved = Math.hypot(p.x - down.x, p.y - down.y);
      const quick = performance.now() - down.t < 700;
      down = null;
      if (moved > 14 || !quick) return;
      this._tap(p.x, p.y);
    }, { passive: true });
  }

  _tap(x, y) {
    const k = this._hit(x, y);
    if (k && !k.decorative) {
      this.selectedKey = k.key;
      if (this.onKrathongTap) this.onKrathongTap(k, x, y);
      return;
    }
    if (this.onEmptyTap) this.onEmptyTap();
    if (y < this.hy - 8) {
      this.releaseLantern(x, y);
    } else {
      this._ripple(x, y, clamp(this.W * 0.06, 30, 70));
      if (this.onRipple) this.onRipple();
    }
  }

  _hit(x, y) {
    let best = null;
    let bestDepth = -1;
    for (const k of this.krathongs) {
      if (k.alpha < 0.3 || k.decorative) continue;
      const D = this._sizeOf(k.depth);
      const ky = this._yOf(k.depth);
      if (x > k.x - D * 0.42 && x < k.x + D * 0.42 && y > ky - D * 0.62 && y < ky + D * 0.1) {
        if (k.depth > bestDepth) {
          best = k;
          bestDepth = k.depth;
        }
      }
    }
    return best;
  }

  /* ---------- loop ---------- */

  _loop(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!(dt > 0)) dt = 0.016;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    try {
      this._update(dt);
      this._draw();
    } catch (err) {
      // never let a single bad frame stop the river
      if (!this._warned) {
        this._warned = true;
        console.warn('frame skipped', err);
      }
    }
    this._adapt(dt);
    this.raf = requestAnimationFrame(this._loop);
  }

  _adapt(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 60) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 0.034 && this.quality > 0.55) {
      this.quality = Math.max(0.5, this.quality - 0.2);
      this.dprCap = Math.max(1, this.dprCap - 0.5);
      this.resize();
    }
  }

  _update(dt) {
    const { W, H, hy, t } = this;

    // krathongs
    for (const k of this.krathongs) {
      k.x += k.vx * dt;
      k.depth += k.vd * dt;
      if (k.mine && k.vd < -0.005) k.vd += 0.0006 * dt; // slow down as it drifts away
      const age = t - k.born;
      const D = this._sizeOf(k.depth);
      if (!k.dying && (k.x > W + D * 0.6 || k.depth < 0.04)) k.dying = true;
      if (k.dying) k.alpha -= dt * 0.8;
      else k.alpha = Math.min(1, k.alpha + dt * (k.launch ? 1.6 : 0.7));
      if (k.launch) k.launch = Math.max(0, 1 - age / 1.2);
    }
    this.krathongs = this.krathongs.filter((k) => !(k.dying && k.alpha <= 0));

    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0) {
      this.nextSpawn = this.fresh.length ? 0.6 : 1.6 + Math.random() * 1.6;
      if (this.krathongs.length < this.maxVisible) this._spawnNext(false);
    }

    // lanterns
    this.nextLantern -= dt;
    if (this.nextLantern <= 0) {
      this.nextLantern = (this.reduced ? 6 : 1.1) + Math.random() * 1.6;
      this._spawnLantern(Math.random() * W, hy - 10 - Math.random() * hy * 0.15, false, 0);
    }
    for (const l of this.lanterns) {
      l.age += dt;
      l.y += l.vy * dt;
      l.x += Math.sin(t * 0.5 + l.ph) * 6 * dt + 2.5 * dt;
      if (l.user) l.s *= 1 - dt * 0.035;
    }
    this.lanterns = this.lanterns.filter((l) => l.y > -80 && l.s > 4);

    // fireworks
    this.nextFirework -= dt;
    if (this.nextFirework <= 0) {
      this.nextFirework = 6 + Math.random() * 9;
      this._launchRocket(W * (0.1 + Math.random() * 0.8));
      if (Math.random() < 0.35) setTimeout(() => this._launchRocket(W * (0.1 + Math.random() * 0.8)), 400);
    }
    for (const r of this.rockets) {
      r.y += r.vy * dt;
      r.vy *= 1 - dt * 0.6;
      if (r.y <= r.ty || r.vy > -40) {
        r.done = true;
        this._explode(r);
      }
    }
    this.rockets = this.rockets.filter((r) => !r.done);
    for (const s of this.sparks) {
      s.px = s.x;
      s.py = s.y;
      s.vx *= Math.pow(s.drag, dt * 60);
      s.vy = s.vy * Math.pow(s.drag, dt * 60) + s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life += dt;
    }
    this.sparks = this.sparks.filter((s) => s.life < s.max);

    // ripples
    for (const r of this.ripples) r.life += dt;
    this.ripples = this.ripples.filter((r) => r.life < r.max);

    // shooting star
    this.nextShooting -= dt;
    if (!this.shooting && this.nextShooting <= 0) {
      this.nextShooting = 14 + Math.random() * 20;
      this.shooting = { x: W * (0.1 + Math.random() * 0.6), y: hy * (0.05 + Math.random() * 0.3), vx: W * 0.55, vy: hy * 0.22, life: 0 };
    }
    if (this.shooting) {
      const s = this.shooting;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life += dt;
      if (s.life > 0.9) this.shooting = null;
    }
  }

  _draw() {
    const { ctx, W, H, hy, t, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (this.bg) ctx.drawImage(this.bg, 0, 0, W, H);

    // stars
    ctx.fillStyle = '#fff8e6';
    for (const s of this.stars) {
      const a = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.p));
      ctx.globalAlpha = a;
      ctx.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // shooting star
    if (this.shooting) {
      const s = this.shooting;
      const a = Math.sin((s.life / 0.9) * Math.PI);
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.18, s.y - s.vy * 0.18);
      g.addColorStop(0, `rgba(255,255,240,${0.9 * a})`);
      g.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.18, s.y - s.vy * 0.18);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';
    this._drawFireworks();
    this._drawLanterns();
    this._drawWater();
    ctx.globalCompositeOperation = 'source-over';

    this._drawKrathongs();
    this._drawRipples();
    this._drawFireflies();

    if (this.fg) ctx.drawImage(this.fg, 0, 0, W, H);
  }

  _drawFireworks() {
    const { ctx } = this;
    const g = glow();
    for (const r of this.rockets) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(g, r.x - 6, r.y - 6, 12, 12);
      ctx.strokeStyle = 'rgba(255,220,160,0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + 18);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    for (const s of this.sparks) {
      const f = 1 - s.life / s.max;
      ctx.globalAlpha = Math.max(0, f * f);
      ctx.strokeStyle = `rgb(${s.c})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawLanterns() {
    const { ctx, hy } = this;
    const g = glow();
    const sp = lantern();
    for (const l of this.lanterns) {
      const fadeIn = clamp(l.age / 1.6, 0, 1);
      const fadeTop = clamp((l.y + 60) / (hy * 0.35), 0, 1);
      const a = fadeIn * fadeTop * (0.85 + 0.15 * Math.sin(this.t * 7 + l.ph));
      if (a <= 0.01) continue;
      const w = l.s;
      const h = w * (84 / 64);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(g, l.x - w * 1.3, l.y - w * 1.05, w * 2.6, w * 2.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      ctx.drawImage(sp, l.x - w / 2, l.y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
  }

  _drawWater() {
    const { ctx, W, H, hy, t, mx, mr } = this;
    // glints
    ctx.fillStyle = 'rgb(170,190,255)';
    for (const g of this.glints) {
      const a = Math.max(0, Math.sin(t * g.sp + g.ph)) * 0.14;
      if (a < 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillRect(g.x + Math.sin(t * 0.4 + g.ph) * 6, g.y, g.w, g.h);
    }
    // moon reflection
    ctx.fillStyle = 'rgb(255,236,190)';
    const rows = 54;
    for (let i = 0; i < rows; i++) {
      const p = i / rows;
      const y = hy + 2 + Math.pow(p, 1.3) * (H - hy - 2);
      const spread = mr * (0.55 + p * 2.6);
      const wob = Math.sin(t * 1.4 + i * 1.7) * spread * 0.28 + Math.sin(t * 0.5 + i * 0.37) * 5;
      const w = spread * (0.25 + 0.75 * Math.abs(Math.sin(t * 0.7 + i * 2.3)));
      const a = (0.42 - p * 0.28) * (0.5 + 0.5 * Math.sin(t * 2.1 + i * 0.9));
      ctx.globalAlpha = Math.max(0, a);
      const h = 1 + p * 2.4;
      ctx.fillRect(mx + wob - w / 2, y, w, h);
      if (i % 3 === 0) {
        ctx.globalAlpha = Math.max(0, a * 0.5);
        ctx.fillRect(mx - wob * 0.6 - w * 0.9, y + h * 1.5, w * 0.4, h);
      }
    }
    // shore light reflections
    if (this.lights) {
      for (const l of this.lights) {
        ctx.fillStyle = `rgb(${l.c})`;
        for (let j = 0; j < 5; j++) {
          const a = (0.38 - j * 0.07) * (0.45 + 0.55 * Math.sin(t * 2.6 + l.p + j * 1.3));
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          const y = hy + 3 + j * (4 + j * 2.5);
          const w = 2 + j * 1.2;
          ctx.fillRect(l.x - w / 2 + Math.sin(t * 2 + j + l.p) * 1.5, y, w, 1.6);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawKrathongs() {
    const { ctx, t } = this;
    const g = glow();
    const list = this.krathongs.slice().sort((a, b) => a.depth - b.depth);
    for (const k of list) {
      if (k.alpha <= 0) continue;
      const sp = krathongSprite(k.style, k.color);
      const D = this._sizeOf(k.depth) * (k.launch ? 1 + k.launch * 0.12 : 1);
      const y = this._yOf(k.depth);
      const bob = Math.sin(t * 1.5 + k.ph) * D * 0.012 - (k.launch ? k.launch * k.launch * D * 0.25 : 0);
      const rot = Math.sin(t * 1.05 + k.ph) * 0.035;
      const a = clamp(k.alpha, 0, 1) * (0.55 + 0.45 * clamp(k.depth * 2.2, 0, 1));

      // light on the water
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.5;
      ctx.drawImage(g, k.x - D * 0.6, y - D * 0.1, D * 1.2, D * 0.3);
      ctx.globalAlpha = a * 0.28;
      ctx.drawImage(g, k.x - D * 0.08, y + D * 0.02, D * 0.16, D * 0.55);
      ctx.globalCompositeOperation = 'source-over';

      // reflection
      ctx.save();
      ctx.translate(k.x, y + bob * 0.3);
      ctx.scale(1, -0.5);
      ctx.rotate(-rot);
      ctx.globalAlpha = a * 0.22;
      ctx.drawImage(sp.canvas, 0, 0, 256, 190, -D / 2, -D * WL, D, D * WL);
      ctx.restore();

      // krathong
      ctx.save();
      ctx.translate(k.x, y + bob);
      ctx.rotate(rot);
      ctx.globalAlpha = a;
      ctx.drawImage(sp.canvas, 0, 0, 256, CLIP, -D / 2, -D * WL, D, (D * CLIP) / 256);
      const fx = ((sp.flame.x - 128) / 256) * D;
      const fy = ((sp.flame.y - 190) / 256) * D;
      ctx.globalCompositeOperation = 'lighter';
      const fl = 0.8 + 0.2 * Math.sin(t * 9 + k.seed);
      ctx.globalAlpha = a * 0.85 * fl;
      ctx.drawImage(g, fx - D * 0.32, fy - D * 0.38, D * 0.64, D * 0.64);
      // incense embers
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 3 + k.seed));
      for (const tip of sp.incense) {
        const ix = ((tip.x - 128) / 256) * D;
        const iy = ((tip.y - 190) / 256) * D;
        ctx.drawImage(g, ix - D * 0.03, iy - D * 0.03, D * 0.06, D * 0.06);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      drawFlame(ctx, fx, fy + D * 0.006, Math.max(4, D * 0.085), t, k.seed);
      ctx.restore();

      // gentle ring on the water
      ctx.globalAlpha = a * (0.1 + 0.06 * Math.sin(t * 1.5 + k.ph));
      ctx.strokeStyle = '#cfd8ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(k.x, y + D * 0.02, D * 0.46, D * 0.055, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // label
      const showLabel = k.mine || k.key === this.hoverKey || k.key === this.selectedKey;
      if (showLabel && !k.decorative && k.alpha > 0.4) {
        let text = '';
        if (k.mine) text = this.labels.yours;
        else text = (k.row && k.row.displayName) || this.labels.anonymous;
        if (text) this._label(text, k.x, y - D * 0.6 + bob, k.mine, a);
      }
    }
    ctx.globalAlpha = 1;
  }

  _label(text, x, y, mine, a) {
    const { ctx } = this;
    ctx.font = this.labelFont;
    const tw = Math.min(ctx.measureText(text).width, 220);
    const w = tw + 20;
    const h = 24;
    const lx = clamp(x - w / 2, 6, this.W - w - 6);
    const ly = Math.max(this.hy - 30, y - h);
    ctx.globalAlpha = a * 0.92;
    ctx.fillStyle = mine ? 'rgba(255,196,90,0.92)' : 'rgba(10,12,40,0.72)';
    roundRect(ctx, lx, ly, w, h, 12);
    ctx.fill();
    if (!mine) {
      ctx.strokeStyle = 'rgba(255,210,122,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = mine ? '#3a1d00' : '#fff3d6';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.save();
    ctx.beginPath();
    ctx.rect(lx + 8, ly, w - 16, h);
    ctx.clip();
    ctx.fillText(text, lx + 10, ly + h / 2 + 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawRipples() {
    const { ctx } = this;
    ctx.strokeStyle = '#dfe6ff';
    ctx.lineWidth = 1.2;
    for (const r of this.ripples) {
      if (r.life < 0) continue;
      const f = r.life / r.max;
      const rad = lerp(r.r0, r.r1, Math.sqrt(f));
      ctx.globalAlpha = (1 - f) * 0.45;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad, rad * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawFireflies() {
    const { ctx, t } = this;
    const g = glow();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fireflies) {
      const x = f.x + Math.sin(t * f.sp + f.ph) * f.amp;
      const y = f.y + Math.cos(t * f.sp * 0.8 + f.ph) * f.amp * 0.4;
      const a = Math.max(0, Math.sin(t * f.sp * 2.4 + f.ph * 3));
      if (a < 0.05) continue;
      ctx.globalAlpha = a * 0.7;
      ctx.drawImage(g, x - 5, y - 5, 10, 10);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ---------------- Builder preview ---------------- */

export class Preview {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = 0;
    this.color = 0;
    this.running = false;
    this.t = 0;
    this._loop = this._loop.bind(this);
  }

  set(style, color) {
    this.style = style;
    this.color = color;
    if (!this.running) this._draw();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.t += dt;
    try {
      this._draw();
    } catch (_) { /* ignore */ }
    this.raf = requestAnimationFrame(this._loop);
  }

  _draw() {
    const { cv, ctx } = this;
    if (!ctx) return;
    const W = cv.clientWidth || 300;
    const H = cv.clientHeight || 140;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = this.t;
    const wy = H * 0.74;
    const sky = ctx.createLinearGradient(0, 0, 0, wy);
    sky.addColorStop(0, '#0a0d30');
    sky.addColorStop(1, '#2a2058');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, wy);
    const water = ctx.createLinearGradient(0, wy, 0, H);
    water.addColorStop(0, '#1d1f52');
    water.addColorStop(1, '#070a24');
    ctx.fillStyle = water;
    ctx.fillRect(0, wy, W, H - wy);
    ctx.fillStyle = 'rgb(255,236,190)';
    for (let i = 0; i < 9; i++) {
      const y = wy + 3 + i * 3.6;
      const w = 30 + Math.abs(Math.sin(t * 0.8 + i * 1.9)) * 50;
      ctx.globalAlpha = 0.12 + 0.1 * Math.sin(t * 2 + i);
      ctx.fillRect(W * 0.78 - w / 2 + Math.sin(t + i) * 6, y, w, 1.4);
    }
    ctx.globalAlpha = 1;

    const sp = krathongSprite(this.style, this.color);
    const D = Math.min(H * 1.25, W * 0.6);
    const x = W / 2;
    const bob = Math.sin(t * 1.6) * D * 0.012;
    const rot = Math.sin(t * 1.1) * 0.03;
    const g = glow();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(g, x - D * 0.6, wy - D * 0.1, D * 1.2, D * 0.3);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(x, wy);
    ctx.scale(1, -0.5);
    ctx.globalAlpha = 0.22;
    ctx.drawImage(sp.canvas, 0, 0, 256, 190, -D / 2, -D * WL, D, D * WL);
    ctx.restore();
    ctx.save();
    ctx.translate(x, wy + bob);
    ctx.rotate(rot);
    ctx.globalAlpha = 1;
    ctx.drawImage(sp.canvas, 0, 0, 256, CLIP, -D / 2, -D * WL, D, (D * CLIP) / 256);
    const fx = ((sp.flame.x - 128) / 256) * D;
    const fy = ((sp.flame.y - 190) / 256) * D;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 9);
    ctx.drawImage(g, fx - D * 0.32, fy - D * 0.38, D * 0.64, D * 0.64);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    drawFlame(ctx, fx, fy + D * 0.006, D * 0.085, t, 1);
    ctx.restore();
  }
}

export function drawThumb(canvas, style, color) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.clientWidth || 54;
  const H = canvas.clientHeight || 44;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const sp = krathongSprite(style, color);
  const D = Math.min(W * 1.25, H * 1.35);
  ctx.drawImage(sp.canvas, 0, 40, 256, CLIP - 40, W / 2 - D / 2, H - (D * (CLIP - 40)) / 256 - 1, D, (D * (CLIP - 40)) / 256);
}
