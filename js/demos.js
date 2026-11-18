/* הדגמות מונפשות (3 שניות, בלולאה) בכרטיס ההוראות */
'use strict';
const Demos = {
  air(h) {
    h.innerHTML = `<div class="dm dm-air">
      <div class="dtool t1">🌰</div><div class="dtool t2">🪣</div>
      <div class="dhole"><span class="s1">🌰</span><span class="s2">🌱</span><span class="s3">🌳</span></div>
      <div class="dhand">👆</div></div>`;
  },
  trash(h) {
    h.innerHTML = `<div class="dm dm-trash">
      <div class="dbin" style="background:${CONFIG.bins.o.c}">${CONFIG.bins.o.n}</div><div class="dbin b2" style="background:${CONFIG.bins.b.c}">${CONFIG.bins.b.n}</div>
      <div class="ditem">🧴</div><div class="dhand">👆</div><div class="dok">✅</div></div>`;
  },
  power(h) {
    h.innerHTML = `<div class="dm dm-power">
      <div class="dwin y">💡</div><div class="dwin g">📖</div><div class="dno">🚫</div>
      <div class="dhand">👆</div></div>`;
  },
  water(h) {
    h.innerHTML = `<div class="dm dm-water">
      <i class="dd d1"></i><i class="dd d2 oil"></i><i class="dd d3"></i>
      <div class="dbk"></div><div class="dhand">👆</div></div>`;
  }
};
