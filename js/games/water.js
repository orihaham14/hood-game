/* משחק 4: אוספים את הגשם
   הדלי עוקב אחרי האצבע (וככל שהוא מתמלא, הוא כבד ואיטי יותר).
   שחור = שמן (-1), ✨ זהב = +3, רוח מזיזה את הטיפות. נגמר הזמן? מגיע עוד ענן. */
'use strict';
GAMES.water = function ({ A, L, C, prog, win }) {
  A.classList.add('water');
  const c = el('div', 'cloudrow'); c.textContent = '☁️🌧️☁️🌧️☁️🌧️'; A.append(c);
  const wind = el('div', 'windsign'); A.append(wind);
  const garden = el('div', 'garden'); A.append(garden);
  const barrel = el('div', 'barrel', '<div class="bfill"></div>'); A.append(barrel);
  const bk = el('div', 'bucket', '<div class="wfill"></div>'); A.append(bk);
  const wf = bk.querySelector('.wfill');
  const BW = L.bucketWidth, GOAL = L.goal; bk.style.width = BW + 'px';
  let r = A.getBoundingClientRect(), target = r.width / 2, bx = target, caught = 0, drops = [], acc = 0, t = 0, limit = L.startTime;
  let last = performance.now(), raf = 0, alive = true, secTick = 0, timers = [];
  let windV = 0, windTarget = 0, nextWind = L.wind ? C.windEvery * (.7 + Math.random() * .4) : 1e9, windEnd = 0, warned = false, windDir = 1;
  const place = () => { bk.style.transform = `translateX(${bx - BW / 2}px)`; }; place();
  const mv = e => { if (!alive) return; target = clamp(e.clientX - r.left, BW / 2, r.width - BW / 2); };
  A.addEventListener('pointerdown', mv); A.addEventListener('pointermove', mv);

  function tick(now) {
    if (!alive) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    secTick += dt; if (secTick > .2) { secTick = 0; setTimer(limit - t); r = A.getBoundingClientRect(); }
    if (t >= limit) { limit += L.extraTime; banner(A, 'עוד ענן גשם מגיע! ☁️'); }
    // דלי כבד: ההחלקה מאטה ככל שהוא מתמלא
    const fillK = caught / GOAL, follow = lerp(26, 6, fillK);
    bx += (target - bx) * Math.min(1, dt * follow); place();
    // רוח
    if (L.wind) {
      if (!warned && t > nextWind - 1.4) { warned = true; windDir = Math.random() < .5 ? -1 : 1; wind.textContent = windDir < 0 ? '⬅️ 💨' : '💨 ➡️'; wind.classList.add('on'); Sound.sfx('wind'); }
      if (t > nextWind && !windEnd) { windEnd = t + C.windFor; windTarget = windDir * 120 * L.wind; A.classList.add('windy'); }
      if (windEnd && t > windEnd) { windEnd = 0; windTarget = 0; warned = false; wind.classList.remove('on'); A.classList.remove('windy'); nextWind = t + C.windEvery * (.8 + Math.random() * .4); }
      windV += (windTarget - windV) * Math.min(1, dt * 2.5);
    }
    // טיפות חדשות
    const k = t / C.rampTime;
    const gap = lerp(C.gapStart, C.gapEnd, k), speed = lerp(C.speedStart, C.speedEnd, k), dirtyP = lerp(C.dirtyStart, C.dirtyEnd, k);
    acc += dt;
    if (acc > gap) {
      acc = 0; const q = Math.random(), kind = q < L.goldChance ? 'gold' : q < L.goldChance + dirtyP ? 'dirty' : 'clean';
      const d = el('div', 'drop ' + kind); A.append(d);
      drops.push({ el: d, x: 40 + Math.random() * (r.width - 80), y: r.height * .12, v: speed * (.9 + Math.random() * .25) * (kind === 'gold' ? .85 : 1), kind });
    }
    const top = r.height - r.height * .04 - 120;
    drops = drops.filter(d => {
      d.y += d.v * dt; d.x += windV * dt;
      if (d.y >= top - 12 && d.y < top + 26 && Math.abs(d.x - bx) < BW / 2 + 16) {
        d.el.remove(); catchDrop(d, top); return false;
      }
      if (d.y > r.height || d.x < -40 || d.x > r.width + 40) { d.el.remove(); return false; }
      d.el.style.transform = `translate(${d.x - 13}px,${d.y}px) rotate(${45 - windV * .2}deg)`; return true;
    });
    if (alive) raf = requestAnimationFrame(tick);
  }
  function catchDrop(d, top) {
    if (d.kind === 'dirty') { caught = Math.max(0, caught - 1); Sound.sfx('oil'); msg(A, 'אוי, שמן!', bx, top - 40); restart(bk, 'shake'); GameBot.react('meh', 800); }
    else if (d.kind === 'gold') { caught += C.goldValue; Sound.sfx('gold'); FX.sparks(A, bx, top, 16, ['#ffd23f', '#fff4b0', '#fff']); FX.plus(A, bx, top - 50, `+${C.goldValue} ✨`, 'big'); GameBot.react('jump', 1200); }
    else { caught++; Sound.sfx('drop'); FX.plus(A, bx, top - 30, '+1'); }
    caught = Math.min(caught, GOAL);
    wf.style.height = (caught / GOAL * 100) + '%'; prog(caught / GOAL);
    if (caught >= GOAL) finish();
  }
  function finish() {
    alive = false; cancelAnimationFrame(raf); drops.forEach(d => d.el.remove()); drops = [];
    wind.classList.remove('on'); A.classList.remove('windy'); setTimer(null);
    // הדלי נשפך לחבית והגינה פורחת
    const br = barrel.getBoundingClientRect(), ar = A.getBoundingClientRect();
    const tx = br.left - ar.left + br.width / 2 - BW / 2 - 40;
    bk.style.transition = 'transform .8s ease-in-out'; bk.style.transform = `translate(${tx}px,-70px) rotate(-55deg)`;
    timers.push(setTimeout(() => { Sound.sfx('pour'); wf.style.height = '0%'; barrel.classList.add('full'); }, 800));
    timers.push(setTimeout(() => { A.classList.add('bloom'); Sound.sfx('grow'); GameBot.react('joy', 2000); }, 1500));
    timers.push(setTimeout(win, 2700));
  }
  ['🌷', '🌻', '🌼', '🌷', '🌸', '🌻', '🌷', '🌼'].forEach((f, i) => { const s = el('span'); s.textContent = f; s.style.animationDelay = (i * .08) + 's'; garden.append(s); });
  setTimer(limit); raf = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); A.removeEventListener('pointerdown', mv); A.removeEventListener('pointermove', mv); };
};
