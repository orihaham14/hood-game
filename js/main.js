/* הפעלה */
'use strict';
function showIntro() { show('intro'); Robot.set(document.querySelector('.introbot'), 'sad'); Sound.setMood(0); }

function bindFlow() {
  $('startBtn').onclick = () => {
    Sound.unlock(); Sound.click();
    const first = !S.t0; S.started = true; if (first) S.t0 = Date.now(); save(); goHome(); if (first) Sound.narrate(CONFIG.narration.intro);
  };
  $('howGo').onclick = () => { closeHow(); startGame(cur); };
  $('howX').onclick = () => { Sound.click(); closeHow(); };
  $('backBtn').onclick = () => { Sound.click(); stopGame(); goHome(); };
  $('winGo').onclick = () => { Sound.click(); ov('winOv', false); goHome(); };
}

/* חסימת מחוות: זום, לחיצה ארוכה, גרירת תמונות, משיכה לרענון */
function lockGestures() {
  ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'selectstart', 'dragstart'].forEach(e => document.addEventListener(e, ev => ev.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('.admin')) e.preventDefault(); }, { passive: false });
  let lastEnd = 0;
  document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastEnd < 320 && !e.target.closest('button,.item,.spot,.win')) e.preventDefault(); lastEnd = n; }, { passive: false });
}

/* מסך דולק (כשנתמך) */
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wakeLock && document.visibilityState === 'visible') { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
document.addEventListener('pointerdown', keepAwake, { passive: true });

/* עבודה בלי אינטרנט */
function registerSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

function boot() {
  fillTexts(); Robot.mountAll(); buildHood(); bindFlow(); Admin.bind(); lockGestures(); registerSW();
  if (!S.started) showIntro(); else goHome();
  const hide = () => $('boot').classList.add('gone');
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(hide, 350));
}
boot();
