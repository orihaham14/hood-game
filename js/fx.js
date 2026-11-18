/* אפקטים: ניצוצות, "+1" קופצים, רעידה */
'use strict';
const FX = {
  sparks(A, x, y, n = 10, colors = ['#ffd23f', '#5ccf6e', '#fff', '#4fc3f7', '#ff8fb1']) {
    for (let i = 0; i < n; i++) {
      const d = el('i', 'spark'), a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 60;
      d.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px;background:${pick(colors)};animation-delay:${Math.random() * .08}s`;
      A.append(d); setTimeout(() => d.remove(), 900);
    }
  },
  leaves(A, x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const d = el('i', 'leaf'), a = -Math.PI / 2 + (Math.random() - .5) * 2.2, r = 50 + Math.random() * 60;
      d.textContent = pick(['🍃', '✨', '🍃']);
      d.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
      A.append(d); setTimeout(() => d.remove(), 1000);
    }
  },
  plus(A, x, y, txt, cls = '') { x = clamp(x, 110, A.clientWidth - 110); const o = el('div', 'plus ' + cls); o.textContent = txt; if (!/[\u0590-\u05FF]/.test(txt)) o.dir = 'ltr'; o.style.left = x + 'px'; o.style.top = y + 'px'; A.append(o); setTimeout(() => o.remove(), 1000); },
  at(A, e) { const r = e.getBoundingClientRect(), a = A.getBoundingClientRect(); return [r.left - a.left + r.width / 2, r.top - a.top + r.height / 2]; },
  shake(e) { restart(e, 'shake'); },
  /* קונפטי שנופל על כל המסך */
  confetti(n = 70, host = document.body) {
    const box = el('div', 'confetti'); host.append(box);
    const cols = ['#ffd23f', '#5ccf6e', '#4fc3f7', '#ff8fb1', '#f28c28', '#8e44ad', '#fff'];
    for (let i = 0; i < n; i++) {
      const c = el('i'); const w = 8 + Math.random() * 8;
      c.style.cssText = `left:${Math.random() * 100}%;width:${w}px;height:${w * 1.6}px;background:${pick(cols)};animation-duration:${2.2 + Math.random() * 1.8}s;animation-delay:${Math.random() * .8}s;--rx:${(Math.random() - .5) * 240}px;--rr:${(Math.random() - .5) * 1080}deg`;
      box.append(c);
    }
    setTimeout(() => box.remove(), 5000);
  }
};
/* הרובוט הקטן בסרגל המשחק */
const GameBot = {
  base: 'ok',
  set(m) { this.base = m; Robot.set($('gameBot'), m); },
  react(m, ms = 1300) { Robot.react($('gameBot'), m, ms); }
};
