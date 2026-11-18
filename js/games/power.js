/* משחק 3: מכבים אורות
   צהוב = בזבוז, מכבים. ירוק = מישהו משתמש, לא נוגעים (+1 שנייה).
   מזגן עם חלון פתוח: הקשה ראשונה סוגרת חלון, שנייה מכבה. 8 צהובים = הפסקת חשמל (+5 שניות). */
'use strict';
GAMES.power = function ({ A, L, C, prog, win }) {
  A.classList.add('power');
  const wrap = el('div', 'bwrap'); A.append(wrap);
  const roofEl = el('div', 'roof'); wrap.append(roofEl);
  const panels = [0, 1, 2, 3].map(() => { const p = el('div', 'panel'); roofEl.append(p); return p; });
  const b = el('div', 'building'); wrap.append(b);
  const m = el('div', 'meter', '<span>⚡</span><div class="mfill"></div><div class="mline"></div>'); A.append(m);
  const fill = m.querySelector('.mfill');
  const THINGS = ['💡', '📺', '💻', '🔌', '🎮'], GREEN = ['📖', '🧊'];
  let dur = L.duration, t = 0, over = false, spawnT = 0, tickT = 0, boT = 0, last = performance.now(), timers = [];
  const W = [];
  const yellow = () => W.filter(w => w.kind === 'y' || w.kind === 'ac');
  const upd = () => { const n = yellow().length; fill.style.height = Math.min(100, n / L.overload * 100) + '%'; m.classList.toggle('hot', n >= L.overload - 2); };
  function setKind(w, kind, ic) {
    clearTimeout(w.gt); w.kind = kind; w.el.className = 'win' + (kind ? ' lit k-' + kind : ''); w.el.dataset.kind = kind || '';
    w.el.innerHTML = ic || '';
  }
  const off = w => setKind(w, null);
  for (let i = 0; i < 16; i++) {
    const w = { el: el('button', 'win'), kind: null, gt: 0 }; w.el.dataset.i = i; b.append(w.el); W.push(w);
    w.el.addEventListener('pointerdown', () => tap(w));
  }
  function tap(w) {
    if (over || !w.kind) return;
    const [x, y] = FX.at(A, w.el);
    if (w.kind === 'g') {
      restart(w.el, 'redflash'); Sound.sfx('oops'); dur += C.greenPenalty; msg(A, `אופס! שם צריך חשמל ${num('+' + C.greenPenalty)}`, x, y - 60); GameBot.react('meh', 900);
      return;
    }
    if (w.kind === 'ac' && w.el.classList.contains('open')) { w.el.classList.remove('open'); w.el.innerHTML = '❄️'; Sound.sfx('acClose'); restart(w.el, 'pop'); return; }
    off(w); Sound.sfx('off'); FX.sparks(A, x, y, 6, ['#ffe66b', '#fff']); upd();
  }
  function spawn() {
    if (over) return;
    const dark = W.filter(w => !w.kind);
    if (dark.length) {
      const w = pick(dark), r = Math.random();
      if (r < L.greenChance) { setKind(w, 'g', pick(GREEN)); w.gt = setTimeout(() => { if (w.kind === 'g') off(w); }, C.greenLife * 1000); }
      else if (r < L.greenChance + L.acChance) { setKind(w, 'ac', '<span class="acu">❄️</span><span class="opn">🪟</span>'); w.el.classList.add('open'); }
      else setKind(w, 'y', pick(THINGS));
      upd();
      if (yellow().length >= L.overload && !boT) boT = setTimeout(blackout, 450);
    }
    spawnT = setTimeout(spawn, lerp(L.gapStart, L.gapEnd, t / L.duration) * 1000);
  }
  function blackout() {
    boT = 0; if (over || yellow().length < L.overload) return;
    W.forEach(off); upd();
    const bo = el('div', 'blackout'); A.append(bo); setTimeout(() => bo.remove(), 1300);
    Sound.sfx('blackout'); GameBot.react('cover', 1600); dur += C.blackoutPenalty;
    msg(A, `עומס! הפסקת חשמל ${num('+' + C.blackoutPenalty)} שניות`, A.clientWidth / 2, A.clientHeight / 2);
  }
  function finish() {
    over = true; clearTimeout(spawnT); clearInterval(tickT); clearTimeout(boT); setTimer(0); prog(1);
    W.forEach((w, i) => timers.push(setTimeout(() => { off(w); upd(); Sound.tone(500 - i * 15, .05, 'square', .04); }, i * 45)));
    upd();
    timers.push(setTimeout(() => { A.classList.add('solarOn'); Sound.sfx('solar'); panels.forEach((p, i) => p.style.animationDelay = (i * .18) + 's'); GameBot.react('joy', 2000); }, 900));
    timers.push(setTimeout(win, 2600));
  }
  spawnT = setTimeout(spawn, 700);
  tickT = setInterval(() => {
    const n = performance.now(); t += (n - last) / 1000; last = n; setTimer(dur - t); prog(t / dur);
    if (t >= dur && !over) finish();
  }, 100);
  setTimer(dur);
  return () => { over = true; clearTimeout(spawnT); clearInterval(tickT); clearTimeout(boT); timers.forEach(clearTimeout); W.forEach(w => clearTimeout(w.gt)); };
};
