/* השכונה האיזומטרית: ציור SVG, מצבי לפני/אחרי, אנימציות מעבר וחיים לפי התקדמות */
'use strict';
const TW = 40, TH = 20, ZH = 24;
const P = (x, y, z = 0) => [(x - y) * TW, (x + y) * TH - z * ZH];
const f1 = v => Math.round(v * 10) / 10;
const pts = a => a.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
const poly = (a, f, x = '') => `<polygon points="${pts(a)}" fill="${f}" ${x}/>`;
function sh(hex, f) { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255].map(v => clamp(v * f | 0, 0, 255)); return `rgb(${c})`; }
const g = (inner, a = '') => `<g ${a}>${inner}</g>`;
/* תגיות אנימציה: o-* = יציאה של המצב המלוכלך, i-* = כניסה של המצב הנקי */
const A = (cls, d, extra = '') => `class="${cls}" style="--d:${f1(d * 10) / 10}s;${extra}"`;

/* ---------- אבני בניין ---------- */
function shadow(x, y, w, d, h, o = .2) {
  const s = Math.min(2.4, h * .45), a = s * .35;
  return poly([P(x, y), P(x + w, y), P(x + w + a, y + s), P(x + w + a, y + d + s), P(x + a, y + d + s), P(x, y + d)], '#000', `opacity="${o}"`);
}
function box(x, y, z, w, d, h, c, top) {
  return poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], sh(c, .84)) +
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], sh(c, .66)) +
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top || c);
}
function roof(x, y, z, w, d, h, c) {
  // גג גמלון לאורך ציר x
  const r1 = P(x, y + d / 2, z + h), r2 = P(x + w, y + d / 2, z + h);
  return poly([P(x, y, z), P(x + w, y, z), r2, r1], sh(c, 1.12)) +
    poly([P(x + w, y, z), P(x + w, y + d, z), r2], sh(c, .8)) +
    poly([P(x, y + d, z), P(x + w, y + d, z), r2, r1], sh(c, .72)) +
    `<line x1="${f1(r1[0])}" y1="${f1(r1[1])}" x2="${f1(r2[0])}" y2="${f1(r2[1])}" stroke="${sh(c, .55)}" stroke-width="2"/>`;
}
const qX = (X, y1, y2, z1, z2, f, x = '') => poly([P(X, y1, z1), P(X, y2, z1), P(X, y2, z2), P(X, y1, z2)], f, x);
const qY = (Y, x1, x2, z1, z2, f, x = '') => poly([P(x1, Y, z1), P(x2, Y, z1), P(x2, Y, z2), P(x1, Y, z2)], f, x);
const ground = (x1, y1, x2, y2, f, x = '') => poly([P(x1, y1), P(x2, y1), P(x2, y2), P(x1, y2)], f, x);
const ell = (x, y, rx, ry, f, x2 = '') => { const [a, b] = P(x, y); return `<ellipse cx="${f1(a)}" cy="${f1(b)}" rx="${rx}" ry="${ry}" fill="${f}" ${x2}/>`; };
const emo = (x, y, z, e, sz = 34, a = '') => { const [p, q] = P(x, y, z); return `<text x="${f1(p)}" y="${f1(q)}" font-size="${sz}" text-anchor="middle" ${a}>${e}</text>`; };

function house(x, y, w, d, wall, rf, dirty) {
  let s = shadow(x, y, w, d, 2.4) + box(x, y, 0, w, d, 1.5, wall) + roof(x, y, 1.5, w, d, 1.1, rf);
  s += qY(y + d, x + w * .42, x + w * .6, 0, .95, dirty ? '#4a3b2f' : '#8a4f2a');
  const wc = dirty ? '#5d6470' : '#bfe3ff', fr = dirty ? '#6b6258' : '#fff';
  for (const [a, b] of [[.1, .3], [.7, .9]]) s += qY(y + d, x + w * a, x + w * b, .55, 1.15, wc, `stroke="${fr}" stroke-width="1.5"`);
  s += qX(x + w, y + d * .3, y + d * .7, .55, 1.15, wc, `stroke="${fr}" stroke-width="1.5"`);
  if (dirty) {
    s += `<path d="M${pts([P(x + w, y + d * .15, 1.45)])} l6,10 l-5,8 l7,10" stroke="#3a2f26" stroke-width="2.2" fill="none"/>`;
    s += `<path d="M${pts([P(x + w * .2, y + d, 1.4)])} l-4,9 l5,6" stroke="#3a2f26" stroke-width="2" fill="none"/>`;
    s += qY(y + d, x + w * .1, x + w * .3, .55, 1.15, 'none', 'stroke="#3a2f26" stroke-width="1.5"');
  } else {
    // עציצים בחלון
    s += qY(y + d, x + w * .1, x + w * .3, .5, .58, '#c45a3a') + qY(y + d, x + w * .7, x + w * .9, .5, .58, '#c45a3a');
    s += emo(x + w * .2, y + d, .58, '🌸', 11) + emo(x + w * .8, y + d, .58, '🌼', 11);
  }
  return s;
}
function tree(x, y, alive, s = 1, a = '') {
  const [bx, by] = P(x, y, 0), [tx, ty] = P(x, y, 1.25 * s);
  let o = ell(x, y, 22 * s, 9 * s, '#000', 'opacity=".2"');
  if (alive) o += `<line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="#6b4423" stroke-width="${7 * s}" stroke-linecap="round"/>
    <circle cx="${f1(tx)}" cy="${f1(ty - 12 * s)}" r="${26 * s}" fill="#2f8a3e"/><circle cx="${f1(tx + 9 * s)}" cy="${f1(ty - 6 * s)}" r="${15 * s}" fill="#3f9b45"/>
    <circle cx="${f1(tx - 8 * s)}" cy="${f1(ty - 22 * s)}" r="${16 * s}" fill="#5cbf60"/><circle cx="${f1(tx - 12 * s)}" cy="${f1(ty - 26 * s)}" r="${6 * s}" fill="#8fe08a" opacity=".8"/>`;
  else o += `<line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="#4f463e" stroke-width="${6 * s}" stroke-linecap="round"/>
    <path d="M${f1(tx)},${f1(ty + 4)} l-14,-16 M${f1(tx)},${f1(ty + 12)} l15,-13 M${f1(tx)},${f1(ty)} l2,-18 M${f1(tx - 9)},${f1(ty - 7)} l-7,-4" stroke="#4f463e" stroke-width="${4 * s}" stroke-linecap="round" fill="none"/>`;
  return g(o, a);
}
function bush(x, y, s = 1, c = '#3f9b45', a = '') { const [p, q] = P(x, y); return g(`<circle cx="${f1(p - 8 * s)}" cy="${f1(q - 6 * s)}" r="${9 * s}" fill="${sh(c, .85)}"/><circle cx="${f1(p + 7 * s)}" cy="${f1(q - 6 * s)}" r="${9 * s}" fill="${sh(c, .9)}"/><circle cx="${f1(p)}" cy="${f1(q - 12 * s)}" r="${10 * s}" fill="${c}"/>`, a); }
function cloud(cx, cy, c, sc = 1, a = '') { const r = v => f1(v * sc); return g(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r(30)}" fill="${c}"/><circle cx="${f1(cx + 30 * sc)}" cy="${f1(cy + 6 * sc)}" r="${r(24)}" fill="${c}"/><circle cx="${f1(cx - 28 * sc)}" cy="${f1(cy + 8 * sc)}" r="${r(22)}" fill="${c}"/><circle cx="${f1(cx + 8 * sc)}" cy="${f1(cy - 18 * sc)}" r="${r(22)}" fill="${c}"/>`, a); }
function car(x, y, c, a = '') { return g(shadow(x, y, .6, 1.1, .5, .18) + box(x, y, .12, .6, 1.1, .32, c) + box(x + .06, y + .22, .44, .48, .6, .26, sh(c, 1.15), '#bfe3ff') +
  ell(x + .6, y + .25, 5, 4, '#222') + ell(x + .6, y + .9, 5, 4, '#222'), a); }
function person(c, skin = '#f1c7a0', kid = false) {
  const k = kid ? .75 : 1, r = v => f1(v * k);
  return `<g class="legs"><line x1="${r(-3)}" y1="${r(-10)}" x2="${r(-4)}" y2="0" stroke="#33415c" stroke-width="${r(3.4)}" stroke-linecap="round"/><line x1="${r(3)}" y1="${r(-10)}" x2="${r(4)}" y2="0" stroke="#33415c" stroke-width="${r(3.4)}" stroke-linecap="round"/></g>
    <rect x="${r(-6)}" y="${r(-25)}" width="${r(12)}" height="${r(16)}" rx="${r(5)}" fill="${c}"/><circle cy="${r(-31)}" r="${r(6)}" fill="${skin}"/><path d="M${r(-6)},${r(-33)} q${r(6)},${r(-8)} ${r(12)},0" fill="#4a3426"/>`;
}
const DG = '#8a7f6b', CG = '#7cc46a', CG2 = '#6db55c';
function grass(x1, y1, x2, y2) {
  let s = ground(x1, y1, x2, y2, CG);
  for (let i = 0; i < 9; i++) { const x = x1 + .4 + ((i * 37) % 10) / 10 * (x2 - x1 - .8), y = y1 + .4 + ((i * 53) % 10) / 10 * (y2 - y1 - .8); s += ell(x, y, 14, 5, CG2); }
  return s;
}
function dirt(x1, y1, x2, y2) {
  let s = ground(x1, y1, x2, y2, DG);
  for (let i = 0; i < 6; i++) { const x = x1 + .5 + ((i * 41) % 10) / 10 * (x2 - x1 - 1), y = y1 + .5 + ((i * 67) % 10) / 10 * (y2 - y1 - 1); s += ell(x, y, 18, 6, '#7a6f5c'); }
  return s;
}

/* ---------- רובע אוויר (אחורי) ---------- */
function qAir() {
  const smoke = (x, y, z, i) => { const [a, b] = P(x, y, z); return cloud(a, b, i % 2 ? '#5a544c' : '#4a4540', .8 + (i % 3) * .15, A('o-rise smoke', .1 + i * .15)); };
  let d = dirt(0, 0, 5, 5);
  d += g(shadow(.8, .8, 2.8, 2.2, 3) + box(.8, .8, 0, 2.8, 2.2, 1.9, '#9a6b55') +
    [0, 1, 2].map(i => qY(3, 1 + i * .85, 1.6 + i * .85, .5, 1.2, '#3b3430')).join('') + qX(3.6, 1.1, 1.7, 0, 1.1, '#3b3430') +
    box(1.2, 1.1, 1.9, .45, .45, 3.2, '#7d5546') + box(1.2, 1.1, 4.4, .45, .45, .35, '#c9c1b5') + box(2.5, 1.2, 1.9, .45, .45, 2.6, '#7d5546') + box(2.5, 1.2, 3.8, .45, .45, .3, '#c9c1b5'), A('o-fade', .9));
  d += tree(4.2, .8, 0, 1, A('o-fade', .3)) + tree(.8, 4.2, 0, 1, A('o-fade', .4)) + tree(4.2, 4.2, 0, 1, A('o-fade', .5)) + tree(2.6, 4.4, 0, 1, A('o-fade', .6));
  d += ell(3.8, 3.3, 26, 9, '#3c3226', 'opacity=".55"');
  d += car(5.9, .5, '#c0392b', A('o-drive', .2)) + car(5.9, 2.6, '#2c6fb7', A('o-drive', .5));
  d += [P(6.2, 1.7, .3), P(6.2, 3.8, .3)].map(([a, b], i) => cloud(a + 10, b + 6, '#6a645c', .35, A('o-rise puff', .2 + i * .3))).join('');
  d += [[1.42, 1.32, 5.4], [1.6, 1.3, 6.4], [2.72, 1.42, 4.6], [2.9, 1.4, 5.6], [1.9, 1.3, 7.2]].map((p, i) => smoke(...p, i)).join('');
  let c = grass(0, 0, 5, 5);
  c += g(poly([P(0, 4.3), P(5, 4.3), P(5, 4.7), P(0, 4.7)], '#d9c9a0') + poly([P(4.3, 0), P(4.7, 0), P(4.7, 4.3), P(4.3, 4.3)], '#d9c9a0'));
  c += g(shadow(.8, .8, 2.8, 2.2, 2) + box(.8, .8, 0, 2.8, 2.2, 1.9, '#d9b48f', '#5cae4f') + [0, 1, 2].map(i => qY(3, 1 + i * .85, 1.6 + i * .85, .5, 1.3, '#bfe3ff', 'stroke="#fff" stroke-width="1.5"')).join('') +
    qY(3, 3.0, 3.4, 0, .9, '#8a4f2a') + bush(1.4, 1.6, .7, '#3f9b45') + bush(2.6, 2.2, .7, '#4daa4a'), A('i-fade', 1.2));
  c += tree(.6, 3.7, 1, 1, A('i-grow', 1.3)) + tree(4.0, .6, 1, 1, A('i-grow', 1.45)) + tree(3.9, 3.7, 1, 1.1, A('i-grow', 1.6)) + tree(1.9, 4.0, 1, .9, A('i-grow', 1.75)) + tree(4.0, 2.2, 1, .85, A('i-grow', 1.9)) + tree(.5, .5, 1, .8, A('i-grow', 2.05));
  c += g(box(2.6, 3.4, 0, .9, .25, .3, '#8a5a32') + box(2.6, 3.62, .3, .9, .06, .3, '#8a5a32'), A('i-pop', 2.1));
  c += emo(6.2, 1.6, 0, '🚲', 34, A('i-drop', 2.2)) + emo(6.1, 3.6, 0, '🛴', 30, A('i-drop', 2.35));
  return `<g class="q" id="q-air"><g class="dirty">${d}</g><g class="clean">${c}</g></g>`;
}

/* ---------- רובע זבל (שמאלי) ---------- */
function qTrash() {
  const binAt = P(1.0, 11.2, .6);
  const junk = [[1.4, 10.2, '🥫'], [2.2, 11.3, '🧴'], [4.3, 8.0, '📰'], [.7, 11.6, '🍌'], [3.6, 7.5, '🛍️'], [4.6, 11.5, '🥤'], [2.5, 9.6, '🍎'], [4.2, 9.4, '📦']];
  let d = dirt(0, 7, 5, 12);
  d += g(house(.8, 7.6, 2.2, 1.8, '#b8a888', '#7a4a35', 1) + house(2.9, 9.8, 1.9, 1.7, '#a9a08c', '#6b4a3a', 1), A('o-fade', 1));
  d += ell(1.5, 10.6, 50, 18, '#4e4334', 'opacity=".7"') + ell(3.9, 8.6, 30, 10, '#4e4334', 'opacity=".55"');
  d += emo(1.1, 10.8, 0, '🗑️', 40, A('o-fade', .9));
  d += junk.map(([x, y, e], i) => { const [a, b] = P(x, y); return emo(x, y, 0, e, 30, A('o-fly', .1 + i * .1, `--dx:${f1(binAt[0] - a)}px;--dy:${f1(binAt[1] - b)}px`)); }).join('');
  d += g([0, 1, 2].map(i => `<circle class="fly" r="2.2" fill="#222" cx="${f1(P(1.1, 10.8, 1.6)[0] + i * 6 - 6)}" cy="${f1(P(1.1, 10.8, 1.6)[1])}" style="animation-delay:${i * .25}s"/>`).join(''), A('o-fade', .2));
  let c = grass(0, 7, 5, 12);
  c += g(poly([P(0, 7.3), P(5, 7.3), P(5, 7.65), P(0, 7.65)], '#d9c9a0'));
  c += g(house(.8, 7.9, 2.2, 1.8, '#f2e2bc', '#c0573a', 0), A('i-fade', 1.2)) + g(house(2.9, 9.8, 1.9, 1.7, '#e8dcc4', '#3d7fb3', 0), A('i-fade', 1.3));
  c += [['#f28c28', .5, 10.4], ['#2f7fd8', .5, 10.95], ['#3c9a4a', .5, 11.5], ['#8e44ad', 1.1, 11.5]].map(([col, x, y], i) => g(shadow(x, y, .45, .45, .9, .15) + box(x, y, 0, .45, .45, .85, col) + box(x - .03, y - .03, .85, .51, .51, .08, sh(col, .8)), A('i-drop', 1.4 + i * .15))).join('');
  c += emo(4.4, 8.3, 0, '🌼', 26, A('i-grow', 2.0)) + emo(4.6, 11.4, 0, '🌷', 26, A('i-grow', 2.1)) + emo(2.4, 12, 0, '🌻', 28, A('i-grow', 2.2)) + emo(4.2, 9.6, 0, '🌷', 24, A('i-grow', 2.3));
  c += bush(.3, 9.6, .8, '#3f9b45', A('i-grow', 1.9)) + bush(4.6, 10.3, .8, '#4daa4a', A('i-grow', 2.0));
  return `<g class="q" id="q-trash"><g class="dirty">${d}</g><g class="clean">${c}</g></g>`;
}

/* ---------- רובע חשמל (ימני) ---------- */
function qPower() {
  const win = (lit) => { let w = '', i = 0; for (let r = 0; r < 5; r++) { const z1 = .7 + r * 1.15; for (let c = 0; c < 3; c++) {
    const on1 = lit ? (r * 3 + c) % 4 !== 1 : (r + c) % 5 === 0, on2 = lit ? (r * 2 + c) % 5 !== 3 : (r + c) % 4 === 2;
    const fA = on1 ? (lit ? '#ffe14d' : '#ffe9a8') : '#2c3b5c', fB = on2 ? (lit ? '#ffd23f' : '#ffe9a8') : '#24314d';
    w += qX(10.8, 1.35 + c * .95, 1.85 + c * .95, z1, z1 + .6, fA, on1 && lit ? A('o-off', .05 + (i++) * .045) : '');
    w += qY(4, 8.15 + c * .95, 8.65 + c * .95, z1, z1 + .6, fB, on2 && lit ? A('o-off', .05 + (i++) * .045) : ''); } } return w; };
  let d = dirt(7, 0, 12, 5);
  d += shadow(7.8, 1, 3, 3, 6.6) + box(7.8, 1, 0, 3, 3, 6.6, '#8f96a6') + win(1);
  d += `<circle cx="${f1(P(10.8, 2.5, 4)[0] + 40)}" cy="${f1(P(10.8, 2.5, 4)[1])}" r="80" fill="#ffe14d" opacity=".2" ${A('o-fade', 1)}/>`;
  d += emo(9.3, 2.5, 6.9, '⚡', 48, A('o-rise zap', .2)) + emo(11.4, 4.4, 0, '🔌', 28, A('o-fade', .5));
  d += box(10.8, 1.6, 2.2, .3, .5, .35, '#cfd3da') + box(10.8, 3, 3.4, .3, .5, .35, '#cfd3da') + box(9, 4, 1.1, .5, .3, .35, '#cfd3da');
  let c = grass(7, 0, 12, 5);
  c += shadow(7.8, 1, 3, 3, 6.6) + box(7.8, 1, 0, 3, 3, 6.6, '#aeb6c6') + win(0);
  c += [0, 1, 2].map(i => g(poly([P(8.05 + i * .95, 1.25, 6.6), P(8.8 + i * .95, 1.25, 6.6), P(8.8 + i * .95, 3.75, 6.95), P(8.05 + i * .95, 3.75, 6.95)], '#1f3d7a', 'stroke="#9fc3ff" stroke-width="1.5"') +
    `<line x1="${f1(P(8.43 + i * .95, 1.25, 6.6)[0])}" y1="${f1(P(8.43 + i * .95, 1.25, 6.6)[1])}" x2="${f1(P(8.43 + i * .95, 3.75, 6.95)[0])}" y2="${f1(P(8.43 + i * .95, 3.75, 6.95)[1])}" stroke="#9fc3ff" stroke-width="1"/>`, A('i-drop', 1.4 + i * .2))).join('');
  c += tree(11.4, 4.3, 1, .8, A('i-grow', 2.0)) + tree(7.4, 4.4, 1, .7, A('i-grow', 2.1)) + bush(11.5, .6, .8, '#3f9b45', A('i-grow', 2.2));
  return `<g class="q" id="q-power"><g class="dirty">${d}</g><g class="clean">${c}</g></g>`;
}

/* ---------- רובע מים (קדמי) ---------- */
function qWater() {
  let d = dirt(7, 7, 12, 12);
  d += g(house(7.6, 7.5, 2.2, 1.8, '#b5ab95', '#5f6a7a', 1) + house(10, 10, 1.7, 1.6, '#aaa192', '#5a5f6c', 1), A('o-fade', 1));
  d += g(poly([P(7, 10.2), P(9.8, 10.4), P(10, 12), P(7, 12)], 'rgba(70,140,210,.7)') + poly([P(5.3, 8), P(6.7, 8), P(6.7, 12), P(5.3, 12)], 'rgba(70,140,210,.6)') + poly([P(11, 7.2), P(12, 7.2), P(12, 9.4), P(11.2, 9.2)], 'rgba(70,140,210,.6)'), A('o-shrink', .3));
  d += emo(6, 10.8, 0, '🌊', 34, A('o-shrink', .5));
  d += `<g class="rain" ${A('o-fade', .2)}>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const [a, b] = P(8.2 + i * .35, 8.4 + i * .18, 4.2); return `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(a - 6)}" y2="${f1(b + 22)}" stroke="#9fd0ff" stroke-width="3" style="animation-delay:${i * .07}s"/>`; }).join('')}</g>`;
  { const [a, b] = P(9.3, 9.3, 6.2); d += cloud(a, b, '#5d6672', 1.25, A('o-rise', .6)); }
  let c = grass(7, 7, 12, 12);
  c += g(ground(7.3, 10.2, 9.3, 11.9, '#7a5631') + [[7.8, 11.3], [8.5, 10.9], [8.9, 11.5], [7.6, 10.6]].map(([x, y]) => bush(x, y, .55, '#5cbf60')).join(''), A('i-fade', 1.5));
  c += g(house(7.6, 7.5, 2.2, 1.8, '#efe4cc', '#c0573a', 0), A('i-fade', 1.2)) + g(house(10, 10, 1.7, 1.6, '#e8dfcf', '#3d7fb3', 0), A('i-fade', 1.3));
  // מרזב וחבית מי גשם
  const barrel = (x, y, dl) => g(shadow(x, y, .55, .55, 1, .15) + box(x, y, 0, .55, .55, .9, '#3a8fd0') + box(x - .02, y - .02, .9, .59, .59, .06, '#2a6fa8') + qY(y + .55, x, x + .55, .3, .36, '#2a6fa8') + qY(y + .55, x, x + .55, .62, .68, '#2a6fa8'), A('i-drop', dl));
  c += barrel(9.85, 8.2, 1.4) + barrel(8.4, 11.55, 1.55) + barrel(11.75, 10.6, 1.7);
  c += qX(9.8, 8.4, 8.5, .9, 1.5, '#9aa6b2') + qY(11.6, 10.4, 10.5, .9, 1.5, '#9aa6b2');
  c += emo(7.5, 10.6, 0, '🌷', 26, A('i-grow', 1.9)) + emo(8.0, 11.4, 0, '🌻', 30, A('i-grow', 2.0)) + emo(9.6, 11.8, 0, '🌷', 26, A('i-grow', 2.1)) + emo(11.6, 7.9, 0, '🌻', 30, A('i-grow', 2.2)) + emo(7.3, 9.9, 0, '🌼', 24, A('i-grow', 2.3)) + emo(10.6, 7.6, 0, '🌸', 24, A('i-grow', 2.35));
  return `<g class="q" id="q-water"><g class="dirty">${d}</g><g class="clean">${c}</g></g>`;
}

/* ---------- כבישים ---------- */
function roads() {
  let s = '';
  s += poly([P(12, 0), P(12, 12), P(12, 12, -1.2), P(12, 0, -1.2)], '#6b5238') + poly([P(0, 12), P(12, 12), P(12, 12, -1.2), P(0, 12, -1.2)], '#553f2b');
  s += poly([P(12, 0, -.05), P(12, 12, -.05), P(12, 12, -.35), P(12, 0, -.35)], '#4f8a3f') + poly([P(0, 12, -.05), P(12, 12, -.05), P(12, 12, -.35), P(0, 12, -.35)], '#3f7232');
  s += ground(0, 0, 12, 12, '#6e6e72');
  const walk = '#b9b4a6';
  s += ground(5, 0, 5.3, 12, walk) + ground(6.7, 0, 7, 12, walk) + ground(0, 5, 12, 5.3, walk) + ground(0, 6.7, 12, 7, walk);
  s += ground(5.3, 5.3, 6.7, 6.7, '#6e6e72');
  const dash = (a, b) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#e8e2c8" stroke-width="3" stroke-dasharray="14 12"/>`;
  s += dash(P(6, 0), P(6, 4.6)) + dash(P(6, 7.4), P(6, 12)) + dash(P(0, 6), P(4.6, 6)) + dash(P(7.4, 6), P(12, 6));
  // מעברי חציה
  for (let i = 0; i < 5; i++) { const t = 5.4 + i * .28; s += ground(t, 4.75, t + .14, 5.0, '#eee') + ground(t, 7.0, t + .14, 7.25, '#eee') + ground(4.75, t, 5.0, t + .14, '#eee') + ground(7.0, t, 7.25, t + .14, '#eee'); }
  return s;
}

/* ---------- חיים בשכונה ---------- */
function walker(x1, y1, x2, y2, col, dur, delay = 0, kid = false) {
  const [a, b] = P(x1, y1), [c, d] = P(x2, y2);
  return `<g class="walker" style="--ax:${f1(a)}px;--ay:${f1(b)}px;--bx:${f1(c)}px;--by:${f1(d)}px;animation-duration:${dur}s;animation-delay:-${delay}s"><g class="bobber">${person(col, '#f1c7a0', kid)}</g></g>`;
}
function lifeBack() {
  let l2 = walker(5.15, .4, 5.15, 4.6, '#e85d75', 14, 0) + walker(5.15, 4.4, 5.15, .4, '#4a90d9', 17, 6);
  let l4 = '';
  { const [a, b] = P(3.0, 3.4); l4 += `<g transform="translate(${f1(a)},${f1(b)})"><g class="hop">${person('#ffb03b', '#e0a87c', true)}</g></g>`; }
  { const [a, b] = P(3.6, 2.6); l4 += `<g transform="translate(${f1(a)},${f1(b)})"><g class="hop" style="animation-delay:-.35s">${person('#9b59b6', '#f1c7a0', true)}</g></g>`; }
  { const [a, b] = P(3.3, 3.0); l4 += `<g transform="translate(${f1(a)},${f1(b)})"><circle class="ball" r="5" cy="-5" fill="#e74c3c" stroke="#fff" stroke-width="1.5"/></g>`; }
  return `<g class="life2">${l2}</g><g class="life4">${l4}</g>`;
}
function lifeMid() {
  let l2 = walker(7.4, 5.15, 11.6, 5.15, '#2ecc71', 16, 3) + walker(5.15, 7.4, 5.15, 11.6, '#f39c12', 15, 8) + walker(6.85, 11.5, 6.85, 7.4, '#8e44ad', 13, 2);
  let l4 = walker(1, 6.85, 4.6, 6.85, '#e74c3c', 9, 1, true) + walker(4.6, 6.85, 1, 6.85, '#1abc9c', 10, 4, true);
  return `<g class="life2">${l2}</g><g class="life4">${l4}</g>`;
}
function lifeFront() {
  let l2 = '';
  for (let i = 0; i < 3; i++) l2 += `<g class="bird" style="animation-delay:-${i * 5}s;--by:${-110 + i * 26}px"><path class="wing" d="M-12,0 q6,-8 12,0 q6,-8 12,0" stroke="#33333a" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  let l4 = '';
  const bal = ['🎈', '🎈', '🎈', '🎈'], [cx, cy] = P(6, 6);
  bal.forEach((e, i) => { l4 += `<text class="balloon" x="${f1(cx - 60 + i * 40)}" y="${f1(cy)}" font-size="34" text-anchor="middle" style="animation-delay:-${i * 1.7}s">${e}</text>`; });
  [[2.6, 11.4], [8.6, 11], [3.2, 8.8], [10.8, 7.8]].forEach(([x, y], i) => { const [a, b] = P(x, y, 1.4); l4 += `<text class="butterfly" x="${f1(a)}" y="${f1(b)}" font-size="22" text-anchor="middle" style="animation-delay:-${i * .9}s">🦋</text>`; });
  return `<g class="life2">${l2}</g><g class="life4">${l4}</g>`;
}
function sky() {
  let s = `<g class="skysmog">`;
  [[-380, -110, 1.5], [-180, -128, 1.2], [60, -112, 1.6], [300, -125, 1.3], [430, -90, 1]].forEach(([x, y, sc], i) => { s += cloud(x, y, i % 2 ? '#6d6354' : '#5d5446', sc, `class="smog" style="animation-delay:-${i * 1.3}s"`); });
  s += `</g><g class="skysun"><g class="sunrot" transform="translate(-400,-95)"><circle r="34" fill="#ffd23f"/>${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="-44" x2="0" y2="-58" stroke="#ffd23f" stroke-width="5" stroke-linecap="round" transform="rotate(${i * 36})"/>`).join('')}</g>`;
  s += cloud(320, -100, '#fff', 1, 'opacity=".9"') + cloud(-120, -120, '#fff', .8, 'opacity=".8"') + `</g>`;
  return s;
}

/* ---------- בנייה ---------- */
function buildHood() {
  let s = sky() + roads() + qAir() + lifeBack() + qPower() + qTrash() + lifeMid() + qWater() + lifeFront();
  const BP = { air: P(2.8, 2.8, 5.6), trash: P(2.6, 9.6, 4.2), power: P(9.3, 2.5, 9.8), water: P(9.6, 9.6, 4.6) };
  ORDER.forEach(k => { const [x, y] = BP[k];
    s += `<g class="bub" id="b-${k}" transform="translate(${f1(x)},${f1(y)})"><circle class="hit" r="72" fill="transparent"/><g class="pul"><circle class="disc" r="54" fill="#fff" stroke="#222" stroke-width="3"/><text class="bi" y="18" font-size="52" text-anchor="middle">${G[k].icon}</text></g>
    <text y="86" font-size="24" font-weight="900" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">${G[k].label}</text></g>`; });
  $('hood').innerHTML = s;
  ORDER.forEach(k => $('b-' + k).addEventListener('click', () => { if (!S.solved[k] && !hoodBusy) { Sound.click(); openHow(k); } }));
}

/* ---------- ציור מצב ---------- */
let hoodBusy = false, hoodShown = -1;
function setHoodLevel(n) {
  const h = $('home');
  for (let i = 0; i <= 4; i++) h.classList.toggle('n' + i, i === n);
  h.classList.toggle('life-2', n >= 2); h.classList.toggle('life-4', n >= 4);
  h.style.setProperty('--n', n);
  Robot.set($('homeBot'), Robot.byProgress(n));
}
function renderHome() {
  const sl = $('slots'); sl.innerHTML = '';
  ORDER.forEach((k, i) => { const d = el('div', 'slot' + (S.solved[k] ? ' got' : '')); d.innerHTML = `<b>${S.solved[k] ? lockCode()[i] : '?'}</b><i>${G[k].icon}</i>`; sl.append(d); });
  const j = S.justSolved && S.solved[S.justSolved] ? S.justSolved : null;
  ORDER.forEach(k => {
    const d = !!S.solved[k] && k !== j;
    $('q-' + k).classList.toggle('done', d); $('q-' + k).classList.remove('trans');
    const b = $('b-' + k); b.classList.toggle('done', !!S.solved[k]);
    b.querySelector('.disc').setAttribute('fill', S.solved[k] ? '#5ccf6e' : '#fff'); b.querySelector('.bi').textContent = S.solved[k] ? '✅' : G[k].icon;
  });
  const n = nDone();
  $('home').classList.remove('finale');
  if (j) {
    setHoodLevel(n - 1);
    playTransition(j, n);
  } else setHoodLevel(n);
  Sound.setMood(n);
  if (S.justSolved) { S.justSolved = null; save(); }
}
const TRANS_MS = 2900;
function playTransition(k, n) {
  hoodBusy = true;
  const q = $('q-' + k);
  void q.getBoundingClientRect();
  q.classList.add('trans');
  requestAnimationFrame(() => { setHoodLevel(n); Robot.set($('homeBot'), 'jump'); });
  Robot.set($('homeBot'), 'jump');
  Sound.transition(k);
  setTimeout(() => {
    q.classList.remove('trans'); q.classList.add('done'); hoodBusy = false;
    Robot.set($('homeBot'), Robot.byProgress(n));
    if (allDone()) renderFinal();
  }, TRANS_MS);
}
