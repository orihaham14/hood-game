/* משחק 1: שותלים עצים
   זרע ← השקיה ← שתיל ← השקיה ← עץ. מזיקים עוצרים צמיחה, הבאר מתייבשת לפעמים,
   וכל עץ שגדל מנקה את הערפל שמעליו. */
'use strict';
GAMES.air = function ({ A, L, prog, win }) {
  A.classList.add('air');
  const cv = el('canvas', 'smogC'); A.append(cv); const ctx = cv.getContext('2d');
  const tools = el('div', 'tools'); A.append(tools);
  const field = el('div', 'field'); A.append(field);
  const N = L.holes, MAXW = L.bucketMax, TOTAL = N * 3, cols = Math.ceil(N / 2);
  field.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  let tool = 'seed', water = 0, steps = 0, alive = true, dry = false, timers = [], raf = 0, dpr = 1, W = 0, H = 0, smogA = 1;
  const later = (f, ms) => { const t = setTimeout(() => alive && f(), ms); timers.push(t); return t; };

  /* ---- כלים ---- */
  const mk = (id, ic, txt) => { const b = el('button', 'tool'); b.dataset.tool = id; b.innerHTML = `<span>${ic}</span><em>${txt}</em>`; tools.append(b); b.addEventListener('pointerdown', () => sel(id)); return b; };
  const TL = { seed: mk('seed', '🌰', 'זרעים'), bucket: mk('bucket', '🪣', 'דלי'), tap: mk('tap', '🚰', 'למלא מים') };
  const lvl = el('div', 'lvl'); TL.bucket.append(lvl);
  const dryBar = el('div', 'drybar'); TL.tap.append(dryBar);
  const drawW = () => { lvl.innerHTML = ''; for (let i = 0; i < MAXW; i++) lvl.append(el('i', i < water ? 'f' : '')); };
  function sel(id) {
    if (!alive) return;
    if (id === 'tap') {
      if (dry) { restart(TL.tap, 'shake'); Sound.sfx('dry'); const [x, y] = FX.at(A, TL.tap); msg(A, 'הבאר יבשה, רגע... ⏳', x + 60, y - 60); return; }
      if (water < MAXW) { water = MAXW; drawW(); Sound.sfx('fill'); const [x, y] = FX.at(A, TL.bucket); FX.sparks(A, x, y, 6, ['#4fc3f7', '#9be2ff', '#fff']); }
      id = 'bucket';
    }
    tool = id; for (const k in TL) TL[k].classList.toggle('sel', k === tool);
  }
  sel('seed'); drawW();

  /* ---- גומות ---- */
  const LOOK = ['', '🌰', '🌱', '🌳'];
  const spots = [];
  for (let i = 0; i < N; i++) {
    const sp = { i, st: 0, pest: false, el: el('button', 'spot'), plant: el('span', 'plant'), need: el('span', 'need'), bug: el('span', 'bug'), r: 0, rt: 0 };
    sp.el.dataset.i = i; sp.el.dataset.st = 0; sp.need.textContent = '💧'; sp.bug.textContent = '🐛';
    sp.el.append(sp.plant, sp.need, sp.bug);
    sp.el.addEventListener('pointerdown', () => tapSpot(sp));
    field.append(sp.el); spots.push(sp);
  }
  const draw = sp => { sp.plant.textContent = LOOK[sp.st]; sp.el.dataset.st = sp.st; sp.el.classList.toggle('thirsty', sp.st === 1 || sp.st === 2); sp.el.classList.toggle('pest', sp.pest); };
  function hint(sp, toolEl, text) {
    restart(sp.el, 'shake'); restart(toolEl, 'hintme'); Sound.sfx('oops');
    if (text) { const [x, y] = FX.at(A, sp.el); msg(A, text, x, y - 70); }
  }
  function tapSpot(sp) {
    if (!alive) return;
    if (sp.pest) { // הקשה מורידה את המזיק
      sp.pest = false; draw(sp); Sound.sfx('squish'); const [x, y] = FX.at(A, sp.el); FX.sparks(A, x, y - 30, 8); FX.plus(A, x, y - 60, '👋🐛');
      return;
    }
    if (sp.st === 3) return;
    if (sp.st === 0 && tool !== 'seed') return hint(sp, TL.seed);
    if (sp.st > 0 && tool !== 'bucket') return hint(sp, TL.bucket);
    if (sp.st > 0 && water <= 0) return hint(sp, TL.tap, 'אין מים! 🚰');
    if (sp.st > 0) { water--; drawW(); }
    sp.st++; steps++; draw(sp); restart(sp.el, 'pop');
    const [x, y] = FX.at(A, sp.el);
    if (sp.st === 1) Sound.sfx('plant');
    else if (sp.st === 2) { Sound.sfx('water'); FX.sparks(A, x, y - 20, 5, ['#4fc3f7', '#9be2ff']); }
    else { Sound.sfx('grow'); FX.leaves(A, x, y - 40); sp.rt = 1; growSmog(); }
    prog(steps / TOTAL);
    if (steps === TOTAL) { alive = false; timers.forEach(clearTimeout); fadeSmog(); setTimeout(win, 1100); }
  }

  /* ---- מזיקים ---- */
  function spawnPest() {
    const cand = spots.filter(s => (s.st === 1 || s.st === 2) && !s.pest);
    if (cand.length && spots.filter(s => s.pest).length < 2) { const s = pick(cand); s.pest = true; draw(s); Sound.sfx('pest'); }
    later(spawnPest, L.pestEvery * 1000 * (.75 + Math.random() * .5));
  }
  if (L.pestEvery > 0) later(spawnPest, L.pestEvery * 1000);

  /* ---- באר מתייבשת ---- */
  function dryUp() {
    dry = true; TL.tap.classList.add('dry'); dryBar.style.animationDuration = L.wellDryFor + 's'; restart(dryBar, 'run');
    later(() => { dry = false; TL.tap.classList.remove('dry'); restart(TL.tap, 'pop'); }, L.wellDryFor * 1000);
    later(dryUp, L.wellDryEvery * 1000 * (.8 + Math.random() * .4));
  }
  if (L.wellDryEvery > 0) later(dryUp, L.wellDryEvery * 1000 * (.8 + Math.random() * .4));

  /* ---- ערפל: כל עץ פותח חור שקוף מעליו ---- */
  function size() {
    const r = A.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; paint();
  }
  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
    const base = ctx.createLinearGradient(0, 0, 0, H); base.addColorStop(0, 'rgba(88,78,58,.9)'); base.addColorStop(.45, 'rgba(88,78,58,.72)'); base.addColorStop(1, 'rgba(88,78,58,.45)');
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    const a = A.getBoundingClientRect(), maxR = Math.max(W / cols * 1.05, H * .42);
    spots.forEach(s => {
      if (s.r <= .01) return;
      const b = s.el.getBoundingClientRect(), x = b.left - a.left + b.width / 2, y = b.top - a.top - H * .08, r = s.r * maxR;
      const gr = ctx.createRadialGradient(x, y, r * .15, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    });
  }
  function growSmog() {
    cancelAnimationFrame(raf);
    const step = () => {
      let busy = false;
      spots.forEach(s => { if (s.rt && s.r < s.rt - .005) { s.r += (s.rt - s.r) * .08; busy = true; } });
      paint(); if (busy) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function fadeSmog() { cv.style.transition = 'opacity 1s'; cv.style.opacity = 0; }
  size(); window.addEventListener('resize', size);
  return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
};
