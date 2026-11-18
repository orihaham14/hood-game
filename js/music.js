/* מוזיקת רקע מסונתזת: עוברת מקודרת (מינור, איטית) לשמחה (מז'ור, קצבית) לפי ההתקדמות.
   הכל נוצר בזמן אמת ב-WebAudio, בלי קבצים. */
'use strict';
const Music = (() => {
  let on = false, mood = 0, inGame = false, timer = 0, nextT = 0, step = 0, bus = null, duckG = null, level = .32;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  // אקורדים (מספרי MIDI של השורש) לכל מצב רוח
  const PROGS = [
    [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'm']],   // Am F G Em : קודר
    [[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']],   // Am F C G
    [[48, 'M'], [57, 'm'], [53, 'M'], [55, 'M']],   // C Am F G
    [[48, 'M'], [55, 'M'], [57, 'm'], [53, 'M']],   // C G Am F
    [[48, 'M'], [53, 'M'], [55, 'M'], [48, 'M']]    // C F G C : חגיגי
  ];
  const chord = (r, q) => [r, r + (q === 'm' ? 3 : 4), r + 7];
  const MEL = [[0, 2, 4, 2], [4, 2, 0, 2], [0, 4, 7, 4], [7, 4, 2, 0]];
  function ensure() {
    const AC = Sound.ctx; if (!AC) return null;
    if (!bus) { duckG = AC.createGain(); duckG.gain.value = 1; bus = AC.createGain(); bus.gain.value = 0; bus.connect(duckG).connect(Sound.musicBus); Sound.musicBus.gain.value = 1; }
    return AC;
  }
  function note(AC, f, t, d, type, vol, attack = .02) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(bus); o.start(t); o.stop(t + d + .05);
  }
  function hat(AC, t, vol) { const b = AC.createBuffer(1, AC.sampleRate * .05, AC.sampleRate), c = b.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / c.length);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = vol; s.connect(f).connect(g).connect(bus); s.start(t); }
  function schedule() {
    const AC = ensure(); if (!AC) return;
    const bpm = lerp(68, 116, mood / 4) + (inGame ? 6 : 0), eighth = 60 / bpm / 2;
    if (nextT < AC.currentTime) nextT = AC.currentTime + .05;
    while (nextT < AC.currentTime + .4) {
      const prog = PROGS[clamp(mood, 0, 4)], bar = Math.floor(step / 8) % 4, e = step % 8, [root, q] = prog[bar], ch = chord(root, q), t = nextT;
      if (e === 0) { ch.forEach(n => note(AC, midi(n), t, eighth * 8, 'triangle', .035, .4)); note(AC, midi(root - 12), t, eighth * 3.5, 'sine', .11); }
      if (e === 4) note(AC, midi(root - 12), t, eighth * 3, 'sine', mood ? .08 : .07);
      if (mood === 0 && e % 4 === 2) note(AC, midi(ch[(e >> 2) % 3] + 12), t, eighth * 2.5, 'sine', .028, .08);
      if (mood >= 1 && e % 2 === 1) note(AC, midi(ch[(e >> 1) % 3] + 12), t, eighth * 1.2, 'triangle', .03 + mood * .006);
      if (mood >= 2 && (e % 2 === 0)) hat(AC, t, .02 + (inGame ? .015 : 0));
      if (mood >= 3 && (e === 0 || e === 3 || e === 6)) { const sc = q === 'm' ? [0, 3, 7, 10] : [0, 4, 7, 9]; const m = MEL[bar][e === 0 ? 0 : e === 3 ? 1 : 2]; note(AC, midi(root + 12 + (sc[m % 4] || m)), t, eighth * 2, 'sine', .045); }
      nextT += eighth; step++;
    }
  }
  function fadeTo(v, sec = 1.2) { const AC = ensure(); if (!AC) return; bus.gain.cancelScheduledValues(AC.currentTime); bus.gain.setTargetAtTime(v, AC.currentTime, sec / 3); }
  return {
    enable(v) {
      on = v; const AC = ensure(); if (!AC) return;
      if (on && !timer) { nextT = 0; timer = setInterval(schedule, 120); schedule(); }
      fadeTo(on ? level : 0);
      if (!on && timer) setTimeout(() => { if (!on) { clearInterval(timer); timer = 0; } }, 1500);
    },
    mood(n, game) { mood = clamp(n | 0, 0, 4); inGame = !!game; },
    duck(d) { if (!duckG) return; const AC = Sound.ctx; duckG.gain.setTargetAtTime(d ? .3 : 1, AC.currentTime, .15); }
  };
})();
