/* הרובוט המלווה "ניצן": דמות מקורית. גוף קפסולה, מסך-פנים, נבט על הראש, גלגל כדור.
   מצבי רוח: sad, meh, ok, happy, joy, dance, cover, jump  */
'use strict';
const Robot = (() => {
  const MOODS = ['sad', 'meh', 'ok', 'happy', 'joy', 'dance', 'cover', 'jump'];
  let uid = 0;
  function svg() {
    const id = 'rb' + (uid++);
    return `<svg class="robot-svg" viewBox="0 0 200 200" aria-hidden="true">
<defs>
  <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0c4"/><stop offset="1" stop-color="#2fa58a"/></linearGradient>
  <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173a40"/><stop offset="1" stop-color="#0c2328"/></linearGradient>
  <radialGradient id="${id}w" cx=".35" cy=".35"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#e3a21a"/></radialGradient>
</defs>
<g class="rb-all">
  <ellipse class="rb-shadow" cx="100" cy="190" rx="44" ry="7" fill="#000" opacity=".22"/>
  <g class="rb-body">
    <!-- נבט -->
    <g class="rb-sprout">
      <path d="M100 52 C100 40 101 32 100 22" stroke="#3f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="rb-leafL" d="M100 30 C88 18 74 22 72 30 C84 36 94 36 100 30Z" fill="#6cc84f"/>
      <path class="rb-leafR" d="M100 24 C110 10 126 12 129 20 C118 30 106 30 100 24Z" fill="#8ddc5e"/>
    </g>
    <!-- זרועות -->
    <g class="rb-armL"><path d="M44 112 C28 116 22 128 24 140" stroke="#2a8f78" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="24" cy="142" r="9" fill="#f2c94c"/></g>
    <g class="rb-armR"><path d="M156 112 C172 116 178 128 176 140" stroke="#2a8f78" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="176" cy="142" r="9" fill="#f2c94c"/></g>
    <!-- גוף -->
    <rect x="40" y="50" width="120" height="118" rx="52" fill="url(#${id}b)" stroke="#1f7a66" stroke-width="4"/>
    <ellipse cx="78" cy="70" rx="22" ry="9" fill="#fff" opacity=".35"/>
    <!-- מסך -->
    <rect x="56" y="70" width="88" height="58" rx="22" fill="url(#${id}s)" stroke="#0b1d20" stroke-width="3"/>
    <g class="rb-face" stroke="#7ff5ff" fill="#7ff5ff" stroke-linecap="round">
      <g class="f f-sad"><path d="M74 97 l14 -6 M126 97 l-14 -6" stroke-width="5" fill="none"/><rect x="77" y="100" width="10" height="10" rx="5" stroke="none"/><rect x="113" y="100" width="10" height="10" rx="5" stroke="none"/><path d="M90 120 q10 -7 20 0" stroke-width="4" fill="none"/></g>
      <g class="f f-meh"><rect x="76" y="92" width="12" height="15" rx="6" stroke="none"/><rect x="112" y="92" width="12" height="15" rx="6" stroke="none"/><path d="M91 118 h18" stroke-width="4"/></g>
      <g class="f f-ok"><rect x="76" y="89" width="12" height="18" rx="6" stroke="none"/><rect x="112" y="89" width="12" height="18" rx="6" stroke="none"/><path d="M90 115 q10 6 20 0" stroke-width="4" fill="none"/></g>
      <g class="f f-happy"><path d="M74 100 q8 -12 16 0 M110 100 q8 -12 16 0" stroke-width="5" fill="none"/><path d="M86 112 q14 12 28 0" stroke-width="4.5" fill="none"/><circle cx="68" cy="112" r="5" fill="#ff8fb1" stroke="none" opacity=".8"/><circle cx="132" cy="112" r="5" fill="#ff8fb1" stroke="none" opacity=".8"/></g>
      <g class="f f-joy"><path d="M74 102 q8 -14 16 0 M110 102 q8 -14 16 0" stroke-width="5" fill="none"/><path d="M86 110 q14 18 28 0 z" stroke-width="3"/><circle cx="68" cy="112" r="6" fill="#ff8fb1" stroke="none"/><circle cx="132" cy="112" r="6" fill="#ff8fb1" stroke="none"/></g>
      <g class="f f-cover"><path d="M74 98 l14 0 M112 98 l14 0" stroke-width="5"/><path d="M92 118 q8 -4 16 0" stroke-width="4" fill="none"/></g>
    </g>
    <!-- ידיים על העיניים (במצב cover) -->
    <g class="rb-hands"><circle cx="82" cy="98" r="15" fill="#f2c94c" stroke="#c99a1c" stroke-width="3"/><circle cx="118" cy="98" r="15" fill="#f2c94c" stroke="#c99a1c" stroke-width="3"/></g>
    <!-- כפתור לב -->
    <circle cx="100" cy="146" r="8" fill="#f2c94c" stroke="#1f7a66" stroke-width="3"/>
    <!-- גלגל כדור -->
    <circle cx="100" cy="176" r="12" fill="url(#${id}w)" stroke="#9a6b10" stroke-width="3"/>
  </g>
</g></svg>`;
  }
  function mount(host, mood) {
    if (!host) return null;
    host.classList.add('robot');
    host.innerHTML = svg();
    set(host, mood || host.dataset.robot || 'ok');
    return host;
  }
  function set(host, mood) { if (host && MOODS.includes(mood)) host.dataset.mood = mood; }
  /* מצב רוח לפי מספר המשימות שנפתרו */
  const byProgress = n => ['sad', 'meh', 'ok', 'happy', 'joy'][clamp(n, 0, 4)];
  /* תגובה רגעית ואז חזרה */
  function react(host, mood, ms = 1200) {
    if (!host) return; const prev = host.dataset.mood; set(host, mood);
    clearTimeout(host._rt); host._rt = setTimeout(() => set(host, prev), ms);
  }
  function mountAll() { document.querySelectorAll('[data-robot]').forEach(h => mount(h, h.dataset.robot)); }
  return { mount, set, react, byProgress, mountAll, svg };
})();
