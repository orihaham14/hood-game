/* משחק 2: ממיינים לפחים
   3 סיבובים. בסיבוב 3 הפריטים מגיעים על מסוע; מה שלא מוין חוזר להתחלה.
   כמה ילדים יכולים לגרור בבת אחת (כל אצבע מזוהה בנפרד). */
'use strict';
GAMES.trash = function ({ A, L, prog, win }) {
  A.classList.add('trash');
  const BINS = CONFIG.bins, SUR = CONFIG.surprises;
  const R = [
    { bins: ['o', 'b', 'g'], n: L.rounds[0] },
    { bins: ['o', 'b', 'g', 'p'], n: L.rounds[1] },
    { bins: ['o', 'b', 'g', 'p'], n: L.rounds[2], belt: true }
  ];
  if (L.surprises) R[2].bins.push('r');
  const TOT = R.reduce((a, r) => a + r.n, 0);
  let done = 0, ri = 0, combo = 0, alive = true, timers = [], raf = 0, left = 0, be = {}, live = [];
  const later = (f, ms) => timers.push(setTimeout(() => alive && f(), ms));

  const rl = el('div', 'round'); A.append(rl);
  const pile = el('div', 'pile'); A.append(pile);
  const belt = el('div', 'belt', '<div class="beltTop"></div><div class="rollers"></div>'); A.append(belt);
  const row = el('div', 'bins'); A.append(row);
  const tip = el('div', 'tipbub'); A.append(tip);
  let tipT = 0;
  function showTip(text) { tip.textContent = text; tip.classList.add('on'); clearTimeout(tipT); tipT = setTimeout(() => tip.classList.remove('on'), 3200); }

  /* איזה פח מתחת לאצבע (סלחני: מרחיבים את האזור ובוחרים את הקרוב) */
  function binAt(x, y) {
    let best = null, bd = 1e9;
    for (const k in be) {
      const r = be[k].getBoundingClientRect();
      if (x > r.left - 40 && x < r.right + 40 && y > r.top - 100 && y < r.bottom + 30) { const d = Math.abs(x - (r.left + r.right) / 2); if (d < bd) { bd = d; best = k; } }
    }
    return best;
  }
  function makeList(r) {
    const surprises = [];
    if (L.surprises) SUR.forEach(s => { if (r + 1 >= s.fromRound && R[r].bins.includes(s.bin)) surprises.push({ bin: s.bin, e: s.e, tip: s.tip, sur: true }); });
    const regBins = R[r].bins.filter(k => BINS[k].items.length);
    const n = R[r].n - surprises.length;
    let ks = []; regBins.forEach(k => ks.push(k, k)); ks = shuffle(ks).slice(0, n); while (ks.length < n) ks.push(pick(regBins));
    const list = ks.map(k => { const [e, t] = pick(BINS[k].items); return { bin: k, e, tip: t }; });
    return shuffle(list.concat(surprises));
  }

  /* ---- פריט נגרר ---- */
  function makeItem(it, onBelt) {
    const e = el('div', 'item new'); e.textContent = it.e; e.dataset.bin = it.bin; if (it.sur) e.classList.add('sur');
    it.el = e; it.pid = null; it.dx = 0; it.dy = 0;
    e.addEventListener('pointerdown', ev => {
      if (!alive || it.pid !== null || it.gone) return;
      it.pid = ev.pointerId; try { e.setPointerCapture(ev.pointerId); } catch (_) {}
      it.sx = ev.clientX; it.sy = ev.clientY; it.dx = it.dy = 0;
      e.classList.remove('new'); e.classList.add('drag'); Sound.sfx('pickup'); place(it);
    });
    e.addEventListener('pointermove', ev => {
      if (ev.pointerId !== it.pid) return;
      it.dx = ev.clientX - it.sx; it.dy = ev.clientY - it.sy; place(it);
      const h = binAt(ev.clientX, ev.clientY); for (const b in be) be[b].classList.toggle('over', b === h);
    });
    const end = ev => {
      if (ev.pointerId !== it.pid) return;
      it.pid = null; e.classList.remove('drag'); for (const b in be) be[b].classList.remove('over');
      const h = binAt(ev.clientX, ev.clientY);
      if (h === it.bin) return sorted(it, h);
      it.dx = it.dy = 0; place(it);
      if (h) {
        combo = 0; Sound.sfx('oops'); restart(be[h], 'shake'); restart(be[it.bin], 'hintme'); showTip(it.tip); GameBot.react('meh', 900);
      }
    };
    e.addEventListener('pointerup', end); e.addEventListener('pointercancel', end);
    return e;
  }
  function place(it) {
    if (it.onBelt) it.el.style.transform = `translate(${it.x + it.dx}px,${it.y + it.dy}px)` + (it.pid !== null ? ' scale(1.15)' : '');
    else it.el.style.transform = it.pid !== null || it.dx || it.dy ? `translate(${it.dx}px,${it.dy}px) scale(1.15)` : '';
  }
  function sorted(it, h) {
    it.gone = true; it.el.classList.add('gone'); done++; left--; combo++; prog(done / TOT);
    const a = A.getBoundingClientRect(), r = be[h].getBoundingClientRect(), x = r.left - a.left + r.width / 2, y = r.top - a.top + 10;
    restart(be[h], 'gulp');
    if (combo > 0 && combo % 3 === 0) {
      Sound.sfx('combo'); FX.sparks(A, x, y, 22); FX.plus(A, x, y - 40, 'קומבו! ✨', 'big'); GameBot.react('jump', 1400);
    } else { Sound.sfx('ok'); FX.sparks(A, x, y, 8); }
    if (left === 0) {
      ri++; if (ri < R.length) later(startRound, 1000);
      else { alive = false; cancelAnimationFrame(raf); Sound.sfx('combo'); setTimeout(win, 800); }
    }
  }

  /* ---- סיבוב ---- */
  function startRound() {
    const RR = R[ri]; rl.textContent = `סיבוב ${ri + 1} מתוך ${R.length}`; banner(A, `סיבוב ${ri + 1}!`); Sound.sfx('round');
    row.innerHTML = ''; be = {};
    row.style.gridTemplateColumns = RR.bins.map(k => BINS[k].small ? '.62fr' : '1fr').join(' ');
    RR.bins.forEach(k => { const b = BINS[k], d = el('div', 'bin' + (b.small ? ' small' : '')); d.dataset.bin = k; d.style.background = b.c;
      d.innerHTML = `<div class="lid"></div><b>${b.small ? '🔋 ' : ''}${b.n}</b><small>${b.s}</small>`; row.append(d); be[k] = d; });
    if (!be.r && ri === 2) {} // ברמה קלה אין קופסת סוללות
    const list = makeList(ri); left = list.length; pile.innerHTML = ''; live = list;
    A.classList.toggle('beltOn', !!RR.belt);
    if (!RR.belt) { list.forEach((it, i) => { const e = makeItem(it, false); e.style.animationDelay = (i * .05) + 's'; pile.append(e); }); return; }
    beltRound(list);
  }

  /* ---- מסוע (סיבוב 3) ---- */
  function beltRound(list) {
    const ar = A.getBoundingClientRect(), br = belt.getBoundingClientRect();
    const size = Math.min(112, Math.max(72, ar.width * .09));
    const y0 = br.top - ar.top + (br.height - size) / 2 - 6;
    const xEnd = br.left - ar.left - size, xStart = br.right - ar.left - size * .2;
    const gap = size * 1.3, speed = L.conveyorSpeed;
    let queue = list.slice(), onBelt = [];
    const put = (it, x) => { it.onBelt = true; it.x = x; it.y = y0; if (!it.el) { makeItem(it, true); it.el.classList.add('onbelt'); A.append(it.el); } it.el.classList.remove('hidden'); restart(it.el, 'new'); onBelt.push(it); place(it); };
    // ממלאים מראש חלק מהמסוע כדי שיהיה מה למיין מיד
    const pre = Math.min(queue.length, Math.max(1, Math.floor((xStart - xEnd) / gap) - 1));
    for (let i = 0; i < pre; i++) put(queue.shift(), xStart - size - i * gap);
    let last = performance.now();
    const tick = now => {
      if (!alive) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      onBelt = onBelt.filter(it => {
        if (it.gone) return false;
        if (it.pid === null) {
          it.x -= speed * dt;
          if (it.x < xEnd) { it.el.classList.add('hidden'); it.onBelt = false; queue.push(it); return false; } // לא מוין: חוזר להתחלה
          place(it);
        }
        return true;
      });
      const nearStart = onBelt.some(it => it.x > xStart - size - gap);
      if (queue.length && !nearStart) put(queue.shift(), xStart - size);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  startRound();
  return () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); clearTimeout(tipT); };
};
