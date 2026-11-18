/* מסך מנהל: כניסה ב-5 הקשות או החזקה של 2 שניות בפינה השמאלית העליונה */
'use strict';
const Admin = (() => {
  let padCb = null, padVal = '', padSecret = false, dirty = false;
  function pad(title, secret, cb) { padCb = cb; padVal = ''; padSecret = secret; $('padTitle').textContent = title; drawPad(); ov('padOv', true); }
  function drawPad() { $('padDisp').textContent = (padSecret ? '●'.repeat(padVal.length) : padVal) + '_'.repeat(4 - padVal.length); }
  function buildKeys() {
    const k = $('keys');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', '⌫'].forEach(x => {
      const b = el('button'); b.textContent = x; b.dataset.key = x; k.append(b);
      b.addEventListener('click', () => {
        Sound.click();
        if (x === '✕') { ov('padOv', false); return; }
        if (x === '⌫') { padVal = padVal.slice(0, -1); drawPad(); return; }
        if (padVal.length >= 4) return;
        padVal += x; drawPad();
        if (padVal.length === 4) { const v = padVal; setTimeout(() => { ov('padOv', false); padCb && padCb(v); }, 200); }
      });
    });
  }
  /* --- פינה סודית --- */
  let hotT = null, taps = [];
  const openPin = () => {
    clearTimeout(hotT); taps = [];
    if ($('padOv').classList.contains('on') || $('adminOv').classList.contains('on')) return;
    pad('קוד מנהל', true, v => { if (v === adminPin()) open(); else { Sound.bad(); restart($('padOv').querySelector('.card'), 'shake'); } });
  };
  function bindHot() {
    $('hot').addEventListener('pointerdown', e => {
      e.preventDefault(); clearTimeout(hotT); hotT = setTimeout(openPin, 2000);
      const n = Date.now(); taps = taps.filter(t => n - t < 3000); taps.push(n); if (taps.length >= 5) openPin();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('hot').addEventListener(ev, () => clearTimeout(hotT)));
  }
  /* --- המסך עצמו --- */
  function open(keep) { if (!keep) dirty = false; render(); ov('adminOv', true); }
  function render() {
    $('aCode').textContent = `🔒 קוד המנעול: ${lockCode()}`;
    $('aSound').textContent = S.sound ? '🔊 סאונד: פועל' : '🔇 סאונד: כבוי';
    $('aMusic').textContent = S.music ? '🎵 מוזיקה: פועלת' : '🎵 מוזיקה: כבויה';
    $('aSound').classList.toggle('on', S.sound); $('aMusic').classList.toggle('on', S.music);
    const lv = $('aLevels'); lv.innerHTML = '';
    Object.keys(CONFIG.levels).forEach(k => { const b = el('button', k === levelKey() ? 'on' : ''); b.dataset.level = k; b.textContent = CONFIG.levelNames[k] || k;
      b.onclick = () => { S.level = k; save(); dirty = true; render(); }; lv.append(b); });
    const sk = $('aSkips'); sk.innerHTML = '';
    ORDER.forEach(k => { const b = el('button', S.solved[k] ? 'on' : ''); b.dataset.skip = k; b.textContent = (S.solved[k] ? '✅ ' : '⬜ ') + G[k].icon + ' ' + G[k].label;
      b.onclick = () => { if (S.solved[k]) { delete S.solved[k]; S.t1 = null; save(); } else markSolved(k, true); dirty = true; render(); }; sk.append(b); });
    const tm = $('aTimes'); tm.innerHTML = '';
    if (!S.times.length) tm.append(el('div', 'empty', 'עדיין אין קבוצות שסיימו'));
    S.times.forEach(r => {
      const d = new Date(r.at);
      const when = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      tm.append(el('div', '', when), el('div', 'dur', fmt(r.ms) + (r.skipped ? ' *' : '')), el('div', '', CONFIG.levelNames[r.level] || r.level));
    });
    if (S.times.some(r => r.skipped)) tm.append(el('div', 'empty', '* חלק מהמשימות סומנו ידנית'));
  }
  function close() {
    ov('adminOv', false);
    if (!dirty) return;
    stopGame(); ['how', 'winOv'].forEach(i => ov(i, false));
    if (S.started) goHome(); else show('intro');
  }
  function bind() {
    buildKeys(); bindHot();
    $('aReset').onclick = () => { stopGame(); resetGroup(); ['how', 'winOv', 'adminOv', 'padOv'].forEach(i => ov(i, false)); Sound.stopNarration(); showIntro(); };
    $('aCode').onclick = () => pad('קוד מנעול חדש', false, v => { S.code = v; save(); dirty = true; open(true); });
    $('aPin').onclick = () => pad('קוד מנהל חדש', false, v => { S.pin = v; save(); open(true); });
    $('aSound').onclick = () => { S.sound = !S.sound; save(); Sound.apply(); render(); };
    $('aMusic').onclick = () => { S.music = !S.music; save(); Sound.apply(); render(); };
    $('aClose').onclick = close;
  }
  return { bind, open, pad };
})();
