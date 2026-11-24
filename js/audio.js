// Gentle generated soundscape: flowing water + soft ranat-like notes.
// Everything is synthesized with Web Audio (no audio files, no copyrighted music).

export class Sound {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.supported = typeof AC === 'function';
    this.AC = AC;
    this.ctx = null;
    this.on = false;
    this.timer = 0;
  }

  _init() {
    if (this.ctx || !this.supported) return;
    const ctx = new this.AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // simple reverb
    this.verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    this.verb.buffer = ir;
    this.verbGain = ctx.createGain();
    this.verbGain.gain.value = 0.35;
    this.verb.connect(this.verbGain).connect(this.master);

    // water: brown noise through a lowpass with slow movement
    const nlen = ctx.sampleRate * 4;
    const nb = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nlen; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      nd[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = nb;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const wg = ctx.createGain();
    wg.gain.value = 0.32;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(lp.frequency);
    src.connect(lp).connect(wg).connect(this.master);
    src.start();
    lfo.start();
  }

  async toggle() {
    if (!this.supported) return false;
    try {
      this._init();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.on = !this.on;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(this.on ? 0.9 : 0, now + 0.8);
      clearTimeout(this.timer);
      if (this.on) this._schedule();
      return this.on;
    } catch (_) {
      this.on = false;
      return false;
    }
  }

  _schedule() {
    if (!this.on) return;
    try {
      this._phrase();
    } catch (_) { /* ignore */ }
    this.timer = setTimeout(() => this._schedule(), 2600 + Math.random() * 2600);
  }

  _phrase() {
    // Thai-flavoured pentatonic (C D E G A) over two octaves
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
    let idx = 3 + Math.floor(Math.random() * 5);
    const n = 3 + Math.floor(Math.random() * 4);
    let t = this.ctx.currentTime + 0.05;
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(scale.length - 1, idx + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))));
      this._pluck(scale[idx], t, 0.055);
      if (Math.random() < 0.25) this._pluck(scale[idx] * 2, t + 0.12, 0.025);
      t += 0.26 + Math.random() * 0.34;
    }
  }

  _pluck(freq, when, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o2.type = 'sine';
    o.frequency.value = freq;
    o2.frequency.value = freq * 3.98;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.master);
    g.connect(this.verb);
    o.start(when);
    o2.start(when);
    o.stop(when + 1.5);
    o2.stop(when + 1.5);
  }

  _noiseBurst(when, dur, freq, vol) {
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g);
    g.connect(this.master);
    g.connect(this.verb);
    s.start(when);
  }

  boom(height) {
    if (!this.on || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + 0.15 + (1 - height) * 0.2;
      this._noiseBurst(t, 1.1, 260, 0.22);
      this._noiseBurst(t + 0.05, 0.9, 2400, 0.03);
    } catch (_) { /* ignore */ }
  }

  plop() {
    if (!this.on || !this.ctx) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime + 0.02;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g);
      g.connect(this.master);
      g.connect(this.verb);
      o.start(t);
      o.stop(t + 0.35);
      this._noiseBurst(t, 0.35, 1400, 0.05);
    } catch (_) { /* ignore */ }
  }

  chime() {
    if (!this.on || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + 0.02;
      [783.99, 987.77, 1174.66].forEach((f, i) => this._pluck(f, t + i * 0.09, 0.04));
    } catch (_) { /* ignore */ }
  }
}
