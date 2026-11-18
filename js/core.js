/* ליבה: מצב שמור, כלים קטנים, מסכים ומהלך המשחק */
'use strict';
const ORDER = ['air', 'trash', 'power', 'water'];
const G = CONFIG.games;
const T = CONFIG.texts;

/* ---------- מצב (נשמר במכשיר) ---------- */
const STORE = 'hoodGame.v2';
const fresh = () => ({
  solved: {}, started: false, t0: null, t1: null, logged: false, skipped: false, justSolved: null,
  code: null, pin: null, level: CONFIG.defaultLevel, sound: true, music: true, times: []
});
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && typeof s === 'object') return Object.assign(fresh(), s); } catch (e) {}
  return fresh();
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
const lockCode = () => (S.code || CONFIG.lockCode);
const adminPin = () => (S.pin || CONFIG.adminPin);
const levelKey = () => (CONFIG.levels[S.level] ? S.level : 'normal');
const LV = g => CONFIG.levels[levelKey()][g];
const allDone = () => ORDER.every(k => S.solved[k]);
const nDone = () => ORDER.filter(k => S.solved[k]).length;
function resetGroup() {
  Object.assign(S, { solved: {}, started: false, t0: null, t1: null, logged: false, skipped: false, justSolved: null });
  save();
}

/* ---------- כלים ---------- */
const $ = id => document.getElementById(id);
function el(t, c, html) { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
function restart(e, c) { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); }
function fmt(ms) { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
/* מספר עם סימן (+5) בתוך טקסט עברי: עוטפים כדי שלא יתהפך ל-5+ */
const num = v => '\u2066' + v + '\u2069';
const tpl = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ''));
function msg(A, txt, x, y) { x = clamp(x, 160, A.clientWidth - 160); const o = el('div', 'oops'); o.textContent = txt; o.style.left = x + 'px'; o.style.top = y + 'px'; A.append(o); setTimeout(() => o.remove(), 1100); }
function banner(A, txt) { const b = el('div', 'banner'); b.textContent = txt; A.append(b); setTimeout(() => b.remove(), 1400); }
function fillTexts() { document.querySelectorAll('[data-t]').forEach(e => { e.textContent = T[e.dataset.t] || ''; }); }

/* ---------- מסכים ---------- */
let screen = 'intro';
function show(id) { screen = id; document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
function ov(id, on) { $(id).classList.toggle('on', on); }
const anyOv = () => !!document.querySelector('.ov.on');

/* ---------- מהלך ---------- */
let cur = null, cleanup = null;
function goHome() { if (allDone() && !S.justSolved) renderFinal(); else { show('home'); renderHome(); } }

function openHow(k) {
  cur = k;
  $('howIcon').textContent = G[k].icon; $('howTitle').textContent = G[k].title; $('howText').textContent = G[k].how;
  if (typeof Demos !== 'undefined' && Demos[k]) Demos[k]($('howDemo')); else $('howDemo').innerHTML = '';
  ov('how', true);
  Sound.narrate(CONFIG.narration.how[k]);
}
function closeHow() { ov('how', false); Sound.stopNarration(); $('howDemo').innerHTML = ''; }

function setTimer(sec) {
  const t = $('gTimer');
  if (sec == null) { t.className = ''; return; }
  t.className = 'on' + (sec <= 10 ? ' low' : '');
  t.textContent = '⏱ ' + fmt(Math.ceil(Math.max(0, sec)) * 1000);
}
function startGame(k) {
  cur = k;
  $('gTitle').textContent = G[k].icon + ' ' + G[k].title; $('gProg').style.width = '0'; setTimer(null);
  const A = $('arena'); A.innerHTML = ''; A.className = 'arena'; show('game');
  Sound.setMood(nDone(), true); GameBot.set(Robot.byProgress(nDone()));
  requestAnimationFrame(() => {
    cleanup = GAMES[k]({
      A, L: LV(k), C: CONFIG[k] || {},
      prog: p => { $('gProg').style.width = clamp(p * 100, 0, 100) + '%'; },
      win: () => winGame(k)
    });
  });
}
function stopGame() { if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; } setTimer(null); }

function markSolved(k, byAdmin) {
  S.solved[k] = true;
  if (byAdmin) S.skipped = true; else S.justSolved = k;
  if (allDone() && !S.t1) {
    S.t1 = Date.now();
    if (!S.logged && S.t0) {
      S.times.unshift({ at: S.t1, ms: S.t1 - S.t0, level: levelKey(), skipped: !!S.skipped });
      S.times = S.times.slice(0, CONFIG.recentTimes);
      S.logged = true;
    }
  }
  save();
}
function winGame(k) {
  stopGame(); markSolved(k, false); Sound.fanfare();
  const i = ORDER.indexOf(k);
  $('winFact').textContent = G[k].fact;
  $('winPos').textContent = tpl(T.winPos, { n: i + 1 });
  $('winDigit').textContent = lockCode()[i];
  ov('winOv', true); restart($('winDigit'), 'digitpop'); Robot.set(document.querySelector('.winbot'), 'joy');
  FX.confetti(60);
}

function renderFinal() {
  const f = $('fcode'); f.innerHTML = '';
  [...lockCode()].forEach((c, i) => { const d = el('div'); d.textContent = c; d.style.animationDelay = (i * .25) + 's'; f.append(d); });
  $('ftime').textContent = (S.t0 && S.t1) ? tpl(T.finalTime, { t: fmt(S.t1 - S.t0) }) : '';
  const t = $('tips'); t.innerHTML = ''; ORDER.forEach(k => { const d = el('div'); d.textContent = G[k].tip; t.append(d); });
  if (!hoodBusy) { show('home'); renderHome(); }
  $('home').classList.add('finale'); Robot.set(document.querySelector('.finalbot'), 'dance');
  Sound.setMood(4); Sound.finale(); FX.confetti(110);
  Sound.narrate(CONFIG.narration.final);
}

const GAMES = {};
