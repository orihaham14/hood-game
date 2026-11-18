/* סאונד: הכל מסונתז ב-WebAudio, בלי קבצים. קריינות מקבצי mp3 אם קיימים. */
'use strict';
const Sound = (() => {
  let AC = null, master = null, sfxBus = null, musicBus = null, narr = null;
  function unlock() {
    try {
      if (!AC) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        master = AC.createGain(); master.connect(AC.destination);
        sfxBus = AC.createGain(); sfxBus.connect(master);
        musicBus = AC.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
        apply();
      }
      if (AC.state === 'suspended') AC.resume();
    } catch (e) {}
  }
  function apply() { if (!AC) return; sfxBus.gain.value = S.sound ? 1 : 0; if (typeof Music !== 'undefined') Music.enable(S.sound && S.music); }

  function tone(f = 600, d = .12, type = 'sine', vol = .18, when = 0, slide = 0) {
    if (!AC || !S.sound) return;
    try {
      const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  }

  /* רעש לבן (לרוח, לשפיכה) */
  let noiseBuf = null;
  function noise(d = .4, vol = .12, freq = 800, when = 0, q = .8, sweep = 0) {
    if (!AC || !S.sound) return;
    try {
      if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const c = noiseBuf.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1; }
      const t = AC.currentTime + when, src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
      src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      src.connect(f).connect(g).connect(sfxBus); src.start(t, Math.random() * .5); src.stop(t + d + .05);
    } catch (e) {}
  }
  const arp = (fs, step = .07, type = 'triangle', d = .14, vol = .16) => fs.forEach((f, i) => tone(f, d, type, vol, i * step));
  /* צליל לכל פעולה */
  const SFX = {
    plant: () => { tone(300, .08, 'triangle', .16); tone(420, .1, 'triangle', .14, .06); },
    water: () => { tone(900, .16, 'sine', .12, 0, .45); noise(.18, .05, 2500); },
    grow: () => arp([523, 659, 784, 1046], .06),
    pest: () => { tone(240, .07, 'square', .05); tone(260, .07, 'square', .05, .1); },
    squish: () => { tone(320, .14, 'sawtooth', .07, 0, .3); arp([880, 1175], .05, 'sine', .08, .1); },
    fill: () => [0, 1, 2, 3].forEach(i => tone(380 + i * 90, .09, 'sine', .1, i * .06, 1.3)),
    dry: () => tone(260, .35, 'sine', .12, 0, .45),
    ok: () => { tone(660, .1, 'triangle'); tone(990, .12, 'triangle', .18, .08); },
    combo: () => arp([784, 988, 1175, 1568, 1976], .055, 'triangle', .16, .17),
    off: () => tone(700, .07, 'square', .05, 0, .5),
    acClose: () => { tone(300, .05, 'square', .06); noise(.12, .05, 1200); },
    oops: () => tone(180, .22, 'sawtooth', .08),
    blackout: () => { tone(160, .7, 'sawtooth', .1, 0, .25); noise(.5, .08, 300); },
    drop: () => tone(1100 + Math.random() * 300, .07, 'sine', .1, 0, .6),
    gold: () => arp([1046, 1318, 1568, 2093], .05, 'sine', .14, .14),
    oil: () => { tone(140, .25, 'sawtooth', .08, 0, .7); },
    wind: () => noise(1.6, .09, 500, 0, .6, 2.2),
    pour: () => { noise(1.1, .1, 1400, 0, .7, .5); },
    solar: () => arp([392, 523, 659, 784, 1046], .12, 'triangle', .22, .14),
    round: () => arp([523, 784], .1),
    pickup: () => tone(440, .05, 'sine', .12)
  };
  function sfx(n) { const f = SFX[n]; if (f) f(); }

  /* ----- קריינות ----- */
  const missing = {};
  let narrSrc = null, narrToken = 0;
  async function narrate(url) {
    stopNarration();
    if (!url || missing[url] || !S.sound) return;
    // בודקים קבצי קריינות רק כשה-Service Worker פעיל (הוא עונה "אין קובץ" בשקט, בלי שגיאה)
    if (!(navigator.serviceWorker && navigator.serviceWorker.controller)) return;
    const my = ++narrToken;
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (r.status !== 200) { missing[url] = true; return; }
      const buf = await r.arrayBuffer();
      if (!AC || my !== narrToken) return;
      const audio = await new Promise((ok, no) => AC.decodeAudioData(buf, ok, no));
      if (my !== narrToken) return;
      narrSrc = AC.createBufferSource(); narrSrc.buffer = audio;
      const g = AC.createGain(); g.gain.value = 1; narrSrc.connect(g).connect(master);
      if (typeof Music !== 'undefined') Music.duck(true);
      narrSrc.onended = () => { if (typeof Music !== 'undefined') Music.duck(false); };
      narrSrc.start();
    } catch (e) { missing[url] = true; }
  }
  function stopNarration() { narrToken++; if (narrSrc) { try { narrSrc.stop(); } catch (e) {} narrSrc = null; } if (typeof Music !== 'undefined') Music.duck(false); }

  return {
    unlock, apply, tone, noise, sfx, narrate, stopNarration,
    get ctx() { return AC; }, get musicBus() { return musicBus; }, get narrating() { return !!narrSrc; },
    setMood(n, inGame) { if (typeof Music !== 'undefined') Music.mood(n, inGame); },
    good() { tone(660, .1, 'triangle'); tone(990, .12, 'triangle', .18, .08); },
    bad() { tone(180, .22, 'sawtooth', .08); },
    tap() { tone(440, .05, 'sine', .12); },
    click() { tone(520, .06, 'triangle', .1); },
    fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .24, 'triangle', .18, i * .13)); tone(1318, .5, 'triangle', .16, .55); tone(784, .5, 'sine', .1, .55); },
    finale() { const m = [523, 659, 784, 1046, 784, 1046, 1318, 1568]; m.forEach((f, i) => { tone(f, .22, 'triangle', .17, i * .14); tone(f / 2, .22, 'sine', .08, i * .14); }); tone(2093, .9, 'sine', .1, m.length * .14); },
    transition(k) {
      if (k === 'air') { noise(1.4, .08, 600, 0, .6, .4); arp([392, 523, 659, 784, 1046], .22, 'triangle', .2, .14); }
      if (k === 'trash') { for (let i = 0; i < 8; i++) tone(700 + Math.random() * 500, .05, 'square', .04, .1 + i * .1); arp([523, 659, 784, 1046], .12, 'triangle', .16, .15); }
      if (k === 'power') { for (let i = 0; i < 12; i++) tone(900 - i * 40, .04, 'square', .04, i * .09); arp([392, 523, 659, 784, 1046], .14, 'triangle', .2, .14); }
      if (k === 'water') { noise(1.2, .09, 1500, 0, .7, .5); for (let i = 0; i < 6; i++) tone(1200 + i * 120, .07, 'sine', .08, 1.2 + i * .12, .6); }
    }
  };
})();
document.addEventListener('pointerdown', () => Sound.unlock(), true);
