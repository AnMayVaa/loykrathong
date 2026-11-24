import { Scene, Preview, drawThumb } from './scene.js';
import { FLOWER, STYLE_COUNT } from './draw.js';
import { STR, timeAgo } from './i18n.js';
import * as api from './api.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) { /* private mode or full storage */ }
  },
};

// Light masking for words that shouldn't float on a shared river.
const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'เหี้ย', 'ควย', 'เย็ด', 'สัส', 'ไอ้สัตว์', 'อีดอก', 'แม่ง', 'จัญไร'];
const BAD_RE = new RegExp(BAD.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
const mask = (s) => String(s || '').replace(BAD_RE, (m) => '✿'.repeat(Math.min(4, [...m].length)));
const tidy = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

const QS_LANG = (() => {
  try {
    const v = new URLSearchParams(location.search).get('lang');
    return v === 'en' || v === 'th' ? v : null;
  } catch (_) {
    return null;
  }
})();

const state = {
  lang: QS_LANG || (store.get('loy.lang', 'th') === 'en' ? 'en' : 'th'),
  style: clampInt(store.get('loy.style', 0), 0, STYLE_COUNT - 1),
  color: clampInt(store.get('loy.color', 0), 0, FLOWER.length - 1),
  online: true,
  loaded: false,
  maxId: 0,
  count: null,
  mine: sanitizeMine(store.get('loy.mine', [])),
  busy: false,
  pollDelay: 12000,
  pollTimer: 0,
  polls: 0,
  cardKey: null,
};

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}

function sanitizeMine(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((r) => r && typeof r === 'object' && Number.isFinite(Number(r.id)))
    .slice(0, 30)
    .map((r) => ({
      id: Number(r.id),
      name: tidy(r.name, 24),
      wish: tidy(r.wish, 140),
      style: clampInt(r.style, 0, STYLE_COUNT - 1),
      color: clampInt(r.color, 0, FLOWER.length - 1),
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
      secret: !!r.secret,
      local: !!r.local,
    }));
}

const T = () => STR[state.lang];
const mineById = () => new Map(state.mine.map((m) => [m.id, m]));

function toSceneRow(r) {
  const mine = mineById().get(r.id);
  return {
    id: r.id,
    createdAt: r.createdAt,
    name: r.name || '',
    wish: r.wish || '',
    style: r.style,
    color: r.color,
    displayName: r.name ? mask(r.name) : '',
    mine: !!mine,
    localWish: mine ? mine.wish : '',
    secret: mine ? mine.secret : false,
  };
}

/* ---------------- Elements ---------------- */

const el = {
  scene: $('scene'),
  count: $('count'),
  liveNote: $('liveNote'),
  liveDot: $('liveDot'),
  counter: document.querySelector('.counter'),
  cta: $('openBuilder'),
  hint: document.querySelector('.hint'),
  builder: $('builder'),
  builderOverlay: $('builderOverlay'),
  form: $('builderForm'),
  styles: $('styles'),
  colors: $('colors'),
  name: $('inName'),
  wish: $('inWish'),
  wishCount: $('wishCount'),
  share: $('inShare'),
  shareNote: $('shareNote'),
  float: $('btnFloat'),
  preview: $('preview'),
  card: $('card'),
  cardKicker: $('cardKicker'),
  cardName: $('cardName'),
  cardWish: $('cardWish'),
  cardMeta: $('cardMeta'),
  about: $('about'),
  aboutOverlay: $('aboutOverlay'),
  toast: $('toast'),
  btnLang: $('btnLang'),
  langLabel: $('langLabel'),
  btnSound: $('btnSound'),
  btnShare: $('btnShare'),
  btnAbout: $('btnAbout'),
};

/* ---------------- Scene, preview, sound ---------------- */

let scene = null;
try {
  scene = new Scene(el.scene);
} catch (err) {
  console.warn('scene unavailable', err);
}
const preview = el.preview && el.preview.getContext ? new Preview(el.preview) : null;
const sound = new Sound();
if (!sound.supported) el.btnSound.hidden = true;

if (scene) {
  scene.onKrathongTap = (k, x, y) => showCard(k, x, y);
  scene.onEmptyTap = () => {
    hideCard();
    fadeHint();
  };
  scene.onBurst = (x, h) => sound.boom(h);
  scene.onLantern = () => {
    sound.chime();
    fadeHint();
  };
  scene.onRipple = () => sound.plop();
  scene.start();
}

if (new URLSearchParams(location.search).has('debug')) {
  window.__loy = { scene, state };
}

/* ---------------- i18n ---------------- */

function applyLang() {
  const t = T();
  document.documentElement.lang = state.lang;
  document.title = t.docTitle;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const v = t[node.getAttribute('data-i18n')];
    if (typeof v === 'string') node.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((node) => {
    const v = t[node.getAttribute('data-i18n-ph')];
    if (typeof v === 'string') node.setAttribute('placeholder', v);
  });
  el.langLabel.textContent = t.langLabel;
  el.btnLang.setAttribute('aria-label', t.langSwitch);
  el.btnShare.setAttribute('aria-label', t.share);
  el.btnShare.title = t.share;
  el.btnAbout.setAttribute('aria-label', t.about);
  el.btnAbout.title = t.about;
  updateSoundButton();
  document.querySelectorAll('.close-btn').forEach((b) => b.setAttribute('aria-label', t.close));
  document.querySelector('.actions').setAttribute('aria-label', t.menu);
  el.styles.querySelectorAll('.style-opt').forEach((b) => {
    const s = Number(b.dataset.style);
    b.querySelector('.nm').textContent = t.styles[s];
    b.querySelector('.nt').textContent = t.styleNotes[s];
    b.setAttribute('aria-label', `${t.styles[s]} · ${t.styleNotes[s]}`);
  });
  el.colors.querySelectorAll('.color-opt').forEach((b) => {
    const c = Number(b.dataset.color);
    b.setAttribute('aria-label', t.colors[c]);
    b.title = t.colors[c];
  });
  updateShareNote();
  updateCount();
  if (scene) scene.setLabels({ yours: t.yours, anonymous: t.anonymous });
  if (!el.card.hidden) hideCard();
}

/* ---------------- Counter ---------------- */

function updateCount() {
  const t = T();
  if (state.count == null && state.online) return;
  el.counter.classList.add('ready');
  el.liveDot.classList.toggle('offline', !state.online);
  if (state.count == null) {
    // never reached the shared river: say so plainly instead of showing a number
    el.count.textContent = t.offlineNote;
    el.liveNote.textContent = '';
    el.liveNote.hidden = true;
    return;
  }
  el.liveNote.hidden = false;
  el.count.textContent = state.count > 0 ? t.count(state.count) : t.countZero;
  el.liveNote.textContent = state.online ? t.liveNote : t.offlineNote;
}

function setOnline(on) {
  if (state.online === on) return;
  state.online = on;
  updateCount();
}

/* ---------------- Builder ---------------- */

function buildOptions() {
  el.styles.textContent = '';
  for (let s = 0; s < STYLE_COUNT; s++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'style-opt';
    b.dataset.style = String(s);
    b.setAttribute('role', 'radio');
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    const nm = document.createElement('span');
    nm.className = 'nm';
    const nt = document.createElement('span');
    nt.className = 'nt';
    b.append(cv, nm, nt);
    b.addEventListener('click', () => selectStyle(s));
    el.styles.append(b);
  }
  el.colors.textContent = '';
  FLOWER.forEach((pal, c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'color-opt';
    b.dataset.color = String(c);
    b.setAttribute('role', 'radio');
    b.style.background = `radial-gradient(circle at 35% 30%, ${pal.light}, ${pal.main} 55%, ${pal.dark})`;
    b.addEventListener('click', () => selectColor(c));
    el.colors.append(b);
  });
  radioKeys(el.styles, '.style-opt', (i) => selectStyle(i, true));
  radioKeys(el.colors, '.color-opt', (i) => selectColor(i, true));
  syncSelection();
}

function radioKeys(group, sel, pick) {
  group.addEventListener('keydown', (e) => {
    const items = [...group.querySelectorAll(sel)];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % items.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
    if (n >= 0) {
      e.preventDefault();
      pick(n);
      items[n].focus();
    }
  });
}

function selectStyle(s, keep) {
  state.style = s;
  store.set('loy.style', s);
  syncSelection(keep);
}

function selectColor(c, keep) {
  state.color = c;
  store.set('loy.color', c);
  syncSelection(keep);
  drawThumbs();
}

function syncSelection() {
  el.styles.querySelectorAll('.style-opt').forEach((b) => {
    const on = Number(b.dataset.style) === state.style;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  el.colors.querySelectorAll('.color-opt').forEach((b) => {
    const on = Number(b.dataset.color) === state.color;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  if (preview) preview.set(state.style, state.color);
}

function drawThumbs() {
  el.styles.querySelectorAll('.style-opt').forEach((b) => {
    const cv = b.querySelector('canvas');
    try {
      drawThumb(cv, Number(b.dataset.style), state.color);
    } catch (_) { /* ignore */ }
  });
}

function updateWishCount() {
  el.wishCount.textContent = `${[...el.wish.value].length}/140`;
}

function updateShareNote() {
  const t = T();
  el.shareNote.textContent = el.share.checked ? t.shareOnNote : t.shareOffNote;
}

let lastFocus = null;

function openPanel(panel, overlay) {
  lastFocus = document.activeElement;
  hideCard();
  overlay.hidden = false;
  panel.hidden = false;
}

function closePanel(panel, overlay) {
  if (panel.hidden) return;
  panel.hidden = true;
  overlay.hidden = true;
  if (lastFocus && typeof lastFocus.focus === 'function') {
    try {
      lastFocus.focus({ preventScroll: true });
    } catch (_) { /* ignore */ }
  }
}

function openBuilder() {
  openPanel(el.builder, el.builderOverlay);
  if (!el.name.value) el.name.value = tidy(store.get('loy.name', ''), 24);
  updateWishCount();
  drawThumbs();
  syncSelection();
  if (preview) preview.start();
  fadeHint();
  const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  setTimeout(() => {
    const target = fine ? el.name : el.builder.querySelector('.close-btn');
    try {
      target.focus({ preventScroll: true });
    } catch (_) { /* ignore */ }
  }, 60);
}

function closeBuilder() {
  closePanel(el.builder, el.builderOverlay);
  if (preview) preview.stop();
}

async function submitKrathong(e) {
  e.preventDefault();
  if (state.busy) return;
  const t = T();
  state.busy = true;
  el.float.disabled = true;
  const label = el.float.querySelector('[data-i18n]');
  if (label) label.textContent = t.floating;

  const name = tidy(el.name.value, 24);
  const wish = tidy(el.wish.value, 140);
  const share = el.share.checked;
  store.set('loy.name', name);

  let row = null;
  let ok = false;
  let rate = false;
  try {
    row = await api.insertKrathong({ name, wish: share ? wish : '', style: state.style, color: state.color, lang: state.lang });
    ok = true;
  } catch (err) {
    rate = !!(err && err.rateLimited);
  }

  const done = () => {
    state.busy = false;
    el.float.disabled = false;
    if (label) label.textContent = T().submit;
  };

  if (rate) {
    toast(t.rateToast);
    done();
    return;
  }

  if (!ok) {
    row = { id: -Date.now(), createdAt: new Date().toISOString(), name, wish: share ? wish : '', style: state.style, color: state.color };
  }
  const rec = { id: row.id, name, wish, style: row.style, color: row.color, createdAt: row.createdAt, secret: !share, local: !ok };
  state.mine = [rec, ...state.mine.filter((m) => m.id !== rec.id)].slice(0, 30);
  store.set('loy.mine', state.mine);

  if (ok) {
    setOnline(true);
    state.count = (state.count || 0) + 1;
    updateCount();
  } else {
    setOnline(false);
  }

  const sceneRow = toSceneRow({ ...row, name });
  if (scene) {
    if (!scene.pool.some((p) => p.id === sceneRow.id)) scene.pool.unshift(sceneRow);
    scene.launchMine(sceneRow);
    scene.celebrate();
  }
  sound.plop();
  setTimeout(() => sound.chime(), 450);

  el.wish.value = '';
  updateWishCount();
  closeBuilder();
  done();
  toast(ok ? t.doneToast(mask(name)) : t.offlineToast, 4600);
}

/* ---------------- Card ---------------- */

function showCard(k, x, y) {
  const t = T();
  const row = k.row || {};
  const styleName = t.styles[row.style] || t.styles[0];
  state.cardKey = k.key;
  el.cardKicker.textContent = k.mine ? `${t.yours} · ${styleName}` : t.floatedBy(styleName);
  el.cardName.textContent = row.displayName || t.anonymous;
  el.cardWish.classList.remove('secret');
  let meta = timeAgo(state.lang, row.createdAt);
  if (k.mine) {
    el.cardWish.textContent = row.localWish || row.wish || t.noWish;
    if (row.secret && row.localWish) meta = `${meta} · ${state.lang === 'th' ? '🔒 มีแค่คุณที่เห็นคำอธิษฐานนี้' : '🔒 Only you can see this wish'}`;
  } else if (row.wish) {
    el.cardWish.textContent = mask(row.wish);
  } else {
    el.cardWish.textContent = t.secretWish;
    el.cardWish.classList.add('secret');
  }
  el.cardMeta.textContent = meta;
  el.card.hidden = false;
  if (scene) scene.select(k.key);

  const narrow = window.innerWidth <= 640;
  if (!narrow) {
    const pos = (scene && scene.positionOf(k.key)) || { x, y };
    const w = el.card.offsetWidth || 320;
    const h = el.card.offsetHeight || 150;
    let left = pos.x - w / 2;
    let top = pos.y - h - 18;
    if (top < 90) top = pos.y + 30;
    left = Math.max(12, Math.min(window.innerWidth - w - 12, left));
    top = Math.max(12, Math.min(window.innerHeight - h - 12, top));
    el.card.style.left = `${Math.round(left)}px`;
    el.card.style.top = `${Math.round(top)}px`;
  } else {
    el.card.style.left = '';
    el.card.style.top = '';
  }
  fadeHint();
}

function hideCard() {
  if (el.card.hidden) return;
  el.card.hidden = true;
  state.cardKey = null;
  if (scene) scene.select(null);
}

/* ---------------- Toast ---------------- */

let toastTimer = 0;
let toastOutTimer = 0;
function toast(msg, ms = 3800) {
  clearTimeout(toastTimer);
  clearTimeout(toastOutTimer);
  el.toast.textContent = msg;
  el.toast.classList.remove('out');
  el.toast.hidden = false;
  // restart the entrance animation
  void el.toast.offsetWidth;
  toastTimer = setTimeout(() => {
    el.toast.classList.add('out');
    toastOutTimer = setTimeout(() => {
      el.toast.hidden = true;
      el.toast.classList.remove('out');
    }, 380);
  }, ms);
}

/* ---------------- Header actions ---------------- */

function updateSoundButton() {
  const t = T();
  el.btnSound.setAttribute('aria-pressed', String(sound.on));
  el.btnSound.setAttribute('aria-label', sound.on ? t.soundOn : t.soundOff);
  el.btnSound.title = sound.on ? t.soundOn : t.soundOff;
}

async function shareSite() {
  const t = T();
  const url = `${location.origin}/`;
  if (navigator.share) {
    try {
      await navigator.share({ title: t.shareTitle, text: t.shareText, url });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  const text = `${t.shareText} ${url}`;
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch (_) { /* fall through */ }
  if (!copied) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      copied = document.execCommand('copy');
      ta.remove();
    } catch (_) { /* ignore */ }
  }
  toast(copied ? t.copied : url);
}

let hintFaded = false;
function fadeHint() {
  if (hintFaded) return;
  hintFaded = true;
  el.hint.classList.add('faded');
}
setTimeout(fadeHint, 16000);

/* ---------------- Data: initial load + polling ---------------- */

async function loadRiver() {
  let rows = [];
  try {
    rows = await api.fetchRecent(160);
    setOnline(true);
    state.maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  } catch (_) {
    setOnline(false);
  }
  const serverIds = new Set(rows.map((r) => r.id));
  const extra = state.mine.filter((m) => !serverIds.has(m.id)).slice(0, 10);
  const pool = [...rows, ...extra].map(toSceneRow);
  if (scene) {
    scene.setPool(pool);
    const latestMine = pool.find((p) => p.mine);
    if (latestMine) scene.placeMine(latestMine);
    scene.fillRiver();
  }
  state.loaded = true;
  try {
    const c = await api.fetchCount();
    if (c != null) state.count = c;
  } catch (_) { /* keep previous */ }
  updateCount();
  schedulePoll();
}

function schedulePoll(delay) {
  clearTimeout(state.pollTimer);
  state.pollTimer = setTimeout(poll, delay == null ? state.pollDelay : delay);
}

async function poll() {
  if (document.hidden) {
    schedulePoll();
    return;
  }
  try {
    const rows = await api.fetchSince(state.maxId);
    if (rows.length) {
      state.maxId = rows.reduce((m, r) => Math.max(m, r.id), state.maxId);
      const mine = mineById();
      const others = rows.filter((r) => !mine.has(r.id));
      if (others.length) {
        if (scene) scene.pushFresh(others.map(toSceneRow));
        if (state.count != null) state.count += others.length;
      }
    }
    state.polls++;
    if (state.polls % 5 === 0) {
      const c = await api.fetchCount();
      if (c != null) state.count = c;
    }
    setOnline(true);
    state.pollDelay = 12000;
    updateCount();
  } catch (_) {
    setOnline(false);
    state.pollDelay = Math.min(60000, state.pollDelay * 2);
  }
  schedulePoll();
}

window.addEventListener('online', () => schedulePoll(300));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.loaded) schedulePoll(400);
});

/* ---------------- Wiring ---------------- */

function trapFocus(panel, e) {
  const nodes = [...panel.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled && n.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function wire() {
  el.cta.addEventListener('click', openBuilder);
  el.builderOverlay.addEventListener('click', closeBuilder);
  el.aboutOverlay.addEventListener('click', () => closePanel(el.about, el.aboutOverlay));
  document.querySelectorAll('[data-close]').forEach((b) => {
    b.addEventListener('click', () => {
      const what = b.getAttribute('data-close');
      if (what === 'builder') closeBuilder();
      else if (what === 'about') closePanel(el.about, el.aboutOverlay);
      else hideCard();
    });
  });
  el.form.addEventListener('submit', submitKrathong);
  el.wish.addEventListener('input', updateWishCount);
  el.wish.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) el.form.requestSubmit ? el.form.requestSubmit() : el.float.click();
  });
  el.name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      el.wish.focus();
    }
  });
  el.share.addEventListener('change', updateShareNote);

  el.btnLang.addEventListener('click', () => {
    state.lang = state.lang === 'th' ? 'en' : 'th';
    store.set('loy.lang', state.lang);
    applyLang();
  });
  el.btnSound.addEventListener('click', async () => {
    await sound.toggle();
    updateSoundButton();
  });
  el.btnShare.addEventListener('click', shareSite);
  el.btnAbout.addEventListener('click', () => {
    openPanel(el.about, el.aboutOverlay);
    setTimeout(() => {
      try {
        el.about.querySelector('.close-btn').focus({ preventScroll: true });
      } catch (_) { /* ignore */ }
    }, 60);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!el.builder.hidden) closeBuilder();
      else if (!el.about.hidden) closePanel(el.about, el.aboutOverlay);
      else hideCard();
    } else if (e.key === 'Tab') {
      if (!el.builder.hidden) trapFocus(el.builder, e);
      else if (!el.about.hidden) trapFocus(el.about, e);
    }
  });
}

/* ---------------- Boot ---------------- */

buildOptions();
wire();
applyLang();
updateWishCount();
loadRiver();

if (document.fonts && document.fonts.load) {
  document.fonts.load('600 13px Anuphan').catch(() => {});
  document.fonts.load('700 40px Charm').catch(() => {});
}
