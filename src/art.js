/* Existential Dread — painted artwork, drawn to canvases at load. */
(function () {
  'use strict';
  const S = 64;
  const C = { ink: '#04070d', deep: '#0a1520', storm: '#16324a', fog: '#3f6f8c', mist: '#8fb6c9', bone: '#e9e2c8', boneLo: '#8d8468', amber: '#ffb347', ember: '#ff7a1a', teal: '#4fd6e0', cream: '#e9e2c8', flame: '#ff7a1a' };
  let DISPLAY = '"Griffy", "IM Fell English SC", Georgia, serif', WT = '', SC = 1, APRON = '74px';
  const FELL = '"IM Fell English SC", "Griffy", Georgia, serif';
  let LABEL = FELL;
  const DIGIT = '"Orbitron", "Courier New", monospace';

  function rngFor(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function star(g, x, y, r, n, inner, rot) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (rot || 0) + Math.PI * i / n - Math.PI / 2, rr = i % 2 ? r * inner : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
  }
  function glow(g, x, y, r, col, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore();
  }
  function stars(g, w, h, n, rnd) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() * rnd() * 2.6 + 0.5;
      g.globalAlpha = 0.25 + rnd() * 0.7; g.fillStyle = rnd() < 0.2 ? C.amber : C.cream;
      if (rnd() < 0.1) { star(g, x, y, r * 4.5, 4, 0.22, 0); g.fill(); } else { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  function bat(g, x, y, s, rot, fill) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.beginPath(); g.moveTo(0, -6);
    g.lineTo(3, -12); g.lineTo(5, -6);
    g.bezierCurveTo(16, -18, 34, -16, 50, -2); g.bezierCurveTo(42, -4, 38, 0, 36, 8);
    g.bezierCurveTo(30, 2, 24, 2, 20, 10); g.bezierCurveTo(16, 4, 10, 6, 0, 16);
    g.bezierCurveTo(-10, 6, -16, 4, -20, 10); g.bezierCurveTo(-24, 2, -30, 2, -36, 8);
    g.bezierCurveTo(-38, 0, -42, -4, -50, -2); g.bezierCurveTo(-34, -16, -16, -18, -5, -6);
    g.lineTo(-3, -12); g.closePath();
    g.fillStyle = fill || C.ink; g.fill(); g.restore();
  }
  function arcText(g, text, cx, cy, r, mid, spread, font, fill, stroke, lw, inside) {
    g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = text.length;
    for (let i = 0; i < n; i++) {
      const a = mid + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread) * (inside ? -1 : 1);
      g.save(); g.translate(cx + Math.sin(a) * r, cy - Math.cos(a) * r * (inside ? -1 : 1)); g.rotate(inside ? -a : a);
      if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text[i], 0, 0); }
      g.fillStyle = fill; g.fillText(text[i], 0, 0); g.restore();
    }
    g.restore();
  }
  function label(g, text, x, y, size, fill, rot, stroke) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.font = WT + size + 'px ' + LABEL; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = size * 0.28; g.strokeStyle = stroke || C.ink; g.strokeText(text, 0, 0);
    g.fillStyle = fill; g.fillText(text, 0, 0); g.restore();
  }
  function goldRing(g, x, y, r1, r0) {
    const gr = g.createLinearGradient(x - r1, y - r1, x + r1, y + r1);
    gr.addColorStop(0, C.goldHi); gr.addColorStop(0.35, C.gold); gr.addColorStop(0.6, C.goldLo); gr.addColorStop(0.8, C.gold); gr.addColorStop(1, C.goldHi);
    g.beginPath(); g.arc(x, y, r1, 0, 7); g.arc(x, y, r0, 0, 7, true); g.fillStyle = gr; g.fill('evenodd');
    g.lineWidth = 5; g.strokeStyle = C.ink; g.beginPath(); g.arc(x, y, r1, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, r0, 0, 7); g.stroke();
  }
  function grain(g, w, h, rnd, n, a) {
    for (let i = 0; i < n; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 1.6 + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  }
  function socket(g, x, y, r, col) {
    g.save(); g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.fillStyle = C.ink; g.fill();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.globalAlpha = 0.3; g.fill();
    g.globalAlpha = 0.35; g.lineWidth = 2; g.strokeStyle = '#fff'; g.beginPath(); g.arc(x, y, r - 4, 3.6, 5.2); g.stroke(); g.restore();
  }
  function chevron(g, x, y, s, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    g.moveTo(-s, s * 0.5); g.lineTo(0, -s * 0.5); g.lineTo(s, s * 0.5); g.lineTo(s, s * 0.95); g.lineTo(0, 0); g.lineTo(-s, s * 0.95); g.closePath();
    g.fillStyle = col; g.lineWidth = 6; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.stroke(); g.fill(); g.restore();
  }



  let P = { bone: C.bone, a: C.amber, b: C.teal };
  function use(theme) { P = { bone: theme.pal[0], a: theme.pal[1], b: theme.pal[2] }; const ty = theme.type; DISPLAY = ty.display; LABEL = ty.label; WT = ty.weight; SC = ty.scale; APRON = ty.apron; TECH = theme.font !== 'fell'; }
  let TECH = false;
  const fs = n => Math.round(n * SC);
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function socket2(g, x, y, r, col) {
    g.save(); g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.fillStyle = 'rgba(4,7,13,0.85)'; g.fill();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.globalAlpha = 0.22; g.fill();
    g.globalAlpha = 0.5; g.lineWidth = 2; g.strokeStyle = P.bone; g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.stroke(); g.restore();
  }
  function spiral(g, cx, cy, r, turns, lw, col) {
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= 240; i++) { const t = i / 240, a = t * turns * Math.PI * 2, rr = r * t; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.stroke(); g.restore();
  }
  function curl(g, x, y, s, flip) {
    g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.strokeStyle = P.bone; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(40, -10, 70, -40, 60, -70); g.bezierCurveTo(52, -96, 20, -92, 22, -68); g.bezierCurveTo(24, -52, 44, -52, 42, -66); g.stroke(); g.restore();
  }
  function shade(g, w, h, a) { const v = g.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + a + ')'); g.fillStyle = v; g.fillRect(0, 0, w, h); }

  // painted markings for each table's signature feature
  function features(g, X, Y, table, theme, level) {
    for (const s of table.saucers) if (s.id !== 'crypt' && s.id !== 'lock' && (s.level || 0) === level) {
      g.save(); g.beginPath(); g.arc(X(s.x), Y(s.y), 84, 0, 7); g.fillStyle = 'rgba(4,7,13,0.8)'; g.fill(); g.lineWidth = 6; g.strokeStyle = P.a; g.stroke(); g.restore();
      if (s.label) label(g, s.label.toUpperCase(), X(s.x), Y(s.y - 1.75), fs(34), P.a);
    }
    for (const r of table.rollovers) if (r.kind === 'shot' && (r.level || 0) === level) {
      g.save(); g.fillStyle = rgba(P.a, 0.35); g.strokeStyle = P.bone; g.lineWidth = 4; g.beginPath(); g.arc(X(r.x), Y(r.y), r.r * S, 0, 7); g.fill(); g.stroke(); g.restore();
      if (r.at) label(g, r.label.toUpperCase(), X(r.at[0]), Y(r.at[1]), fs(30), P.bone, r.at[2]);
    }
    if (table.disc && level === 0) { const d = table.disc; g.save(); g.beginPath(); g.arc(X(d.x), Y(d.y), (d.r + 0.25) * S, 0, 7); g.fillStyle = 'rgba(4,7,13,0.7)'; g.fill(); g.lineWidth = 6; g.strokeStyle = P.a; g.stroke(); g.restore(); }
    if (table.gate && level === 0) label(g, 'NO', X(17.05), Y(20.3), fs(54), P.a);
    if (theme.layout.kickback && level === 0) label(g, 'KICK', X(1.22), Y(11.6), fs(22), P.a);
  }

  // ------------------------------------------------------------ lower playfield
  function lower(img, inserts, theme, table) {
    use(theme);
    const W = 20 * S, Hh = 26 * S, c = canvas(W, Hh), g = c.getContext('2d'), w = theme.w;
    const X = x => x * S, Y = y => (26 - y) * S;
    g.imageSmoothingQuality = 'high';
    const cl = theme.cropL || [0, 640, 1024, 896];
    g.drawImage(img, cl[0], cl[1], cl[2], cl[3], 0, 0, W, Hh);
    g.fillStyle = 'rgba(4,8,14,0.14)'; g.fillRect(0, 0, W, Hh);
    const cx = X(9.4), cy = Y(14.2);
    glow(g, cx, cy, 5.2 * S, rgba(P.b, 0.22));
    g.save(); g.beginPath(); g.arc(cx, cy, 4.55 * S, 0, 7); g.fillStyle = 'rgba(4,7,13,0.28)'; g.fill(); g.restore();
    spiral(g, cx, cy, 3.3 * S, 3.5, 7, rgba(P.bone, 0.3));
    g.save(); g.strokeStyle = rgba(P.bone, 0.55); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 4.55 * S, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 3.3 * S, 0, 7); g.stroke(); g.restore();
    if (!theme.layout.noArc) arcText(g, 'TWELVE ' + w.plural + ' LIGHT THE LOCK', cx, cy, 5.1 * S, 0, 1.95, WT + fs(34) + 'px ' + LABEL, P.bone, C.ink, 9);
    for (const b of table.circs) if (!b.level) {
      g.save(); g.fillStyle = 'rgba(4,7,13,0.55)'; g.beginPath(); g.arc(X(b.x), Y(b.y), (b.r + 0.6) * S, 0, 7); g.fill();
      g.strokeStyle = b.kind === 'post' ? P.b : P.bone; g.lineWidth = 6; g.beginPath(); g.arc(X(b.x), Y(b.y), (b.r + 0.6) * S, 0, 7); g.stroke(); g.restore();
    }
    g.save(); g.beginPath(); g.arc(X(2.1), Y(23.6), 84, 0, 7); g.fillStyle = 'rgba(4,7,13,0.8)'; g.fill(); g.lineWidth = 6; g.strokeStyle = P.a; g.stroke(); g.restore();
    label(g, w.saucer.toUpperCase(), X(3.2), Y(21.9), fs(40), P.a, -0.08);
    features(g, X, Y, table, theme, 0);
    for (let i = 0; i < 4; i++) chevron(g, X(17.05), Y(17.6 + i * 1.0), 42, 0, i % 2 ? P.a : P.bone);
    label(g, 'RAMP', X(17.05), Y(16.5), fs(38), P.bone);
    label(g, w.banks[0], X(3.75), Y(12.7), fs(34), P.bone, -1.17);
    label(g, w.banks[1], X(15.05), Y(12.7), fs(34), P.bone, 1.17);
    for (const m of [0, 1]) {
      const M = x => X(m ? 18.8 - x : x);
      g.beginPath(); g.moveTo(M(3.1), Y(11.2)); g.lineTo(M(3.1), Y(7.5)); g.lineTo(M(5.2), Y(6.4)); g.closePath();
      g.fillStyle = 'rgba(6,12,20,0.82)'; g.fill(); g.lineWidth = 6; g.strokeStyle = P.bone; g.lineJoin = 'round'; g.stroke();
      spiral(g, M(3.75), Y(8.5), 40, 2.2, 5, P.a);
      if (!TECH) curl(g, M(0.9), Y(12.4), 1.1, !!m);
    }
    label(g, 'SHOOT AGAIN', X(9.4), Y(2.3), fs(26), P.bone);
    ['2X', '3X', '4X', '5X'].forEach((t, i) => label(g, t, X(7.3 + i * 1.4), Y(9.3), fs(26), P.bone));
    label(g, 'BONUS', X(9.4), Y(11.0), fs(26), P.a);
    for (const it of inserts) if (it.level === 0 && !it.noSocket) socket2(g, X(it.x), Y(it.y), it.r * S, it.color);
    shade(g, W, Hh, 0.5);
    return c;
  }

  // ------------------------------------------------------------ upper playfield
  function upper(img, inserts, theme, table) {
    use(theme);
    const W = 20 * S, Hh = Math.round(15.6 * S), c = canvas(W, Hh), g = c.getContext('2d'), w = theme.w;
    const X = x => x * S, Y = y => (41.6 - y) * S;
    g.imageSmoothingQuality = 'high';
    const cu = theme.cropU || [130, 230, 770, 510];
    g.drawImage(img, cu[0], cu[1], cu[2], cu[3], 0, 0, W, Hh);
    for (const b of table.circs) if (b.level && b.cap !== 'eye') { g.save(); g.fillStyle = 'rgba(4,7,13,0.45)'; g.strokeStyle = P.bone; g.lineWidth = 5; g.beginPath(); g.arc(X(b.x), Y(b.y), (b.r + 0.5) * S, 0, 7); g.fill(); g.stroke(); g.restore(); }
    g.save(); g.beginPath(); g.arc(X(2.8), Y(33.8), 88, 0, 7); g.fillStyle = 'rgba(4,7,13,0.85)'; g.fill(); g.lineWidth = 6; g.strokeStyle = P.b; g.stroke(); g.restore();
    label(g, 'LOCK', X(4.75), Y(32.0), fs(44), P.b, 0.5);
    features(g, X, Y, table, theme, 1);
    label(g, w.mb.toUpperCase(), X(9.5), Y(40.3), fs(42), P.bone);
    label(g, 'MULTIBALL', X(9.5), Y(39.4), fs(30), P.a);
    if (theme.layout.upperBank !== false) label(g, w.banks[2], X(14.2), Y(34.3), fs(34), P.bone, 1.23);
    for (const it of inserts) if (it.level === 1 && !it.noSocket) socket2(g, X(it.x), Y(it.y), it.r * S, it.color);
    shade(g, W, Hh, 0.35);
    return c;
  }

  // ------------------------------------------------------------ backglass
  function backglass(img, theme) {
    use(theme);
    const W = 1600, Hh = 1000, c = canvas(W, Hh), g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, 1024, 640, 0, 0, W, Hh);
    g.fillStyle = C.ink; g.fillRect(470, 846, 660, 124);
    g.lineWidth = 8; g.strokeStyle = P.bone; g.strokeRect(470, 846, 660, 124);
    g.lineWidth = 30; g.strokeStyle = C.ink; g.strokeRect(0, 0, W, Hh); g.lineWidth = 6; g.strokeStyle = rgba(P.bone, 0.55); g.strokeRect(22, 22, W - 44, Hh - 44);
    return c;
  }

  function scorePanel(c, score, ball, msg) {
    c = c || canvas(1024, 192); const g = c.getContext('2d');
    g.fillStyle = '#070403'; g.fillRect(0, 0, 1024, 192);
    g.font = '700 112px ' + DIGIT; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,120,20,0.10)'; g.fillText('8,888,888,888', 1000, 108);
    g.shadowColor = '#ff7a1a'; g.shadowBlur = 26; g.fillStyle = '#ffb347'; g.fillText(msg || score.toLocaleString('en-GB'), 1000, 108); g.shadowBlur = 0;
    g.font = '700 30px ' + DIGIT; g.textAlign = 'left'; g.fillStyle = '#ff9a3a'; g.fillText(ball, 26, 34);
    return c;
  }

  function eyeCap(lookX, lookY) {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#10161c'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    const gr = g.createRadialGradient(100, 96, 10, 128, 128, 112); gr.addColorStop(0, '#f4f1e4'); gr.addColorStop(0.7, '#c9ccc4'); gr.addColorStop(1, '#7f8c90');
    g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(120,60,50,0.35)'; g.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3; g.beginPath(); g.moveTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108); g.quadraticCurveTo(128 + Math.cos(a + 0.3) * 80, 128 + Math.sin(a + 0.3) * 80, 128 + Math.cos(a) * 60, 128 + Math.sin(a) * 60); g.stroke(); }
    const px = 128 + lookX * 34, py = 128 + lookY * 34;
    g.beginPath(); g.arc(px, py, 26, 0, 7); g.fillStyle = '#05070a'; g.fill();
    g.beginPath(); g.arc(px - 9, py - 9, 7, 0, 7); g.fillStyle = '#fff'; g.fill();
    return c;
  }
  function spiralCap(col) {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#10161c'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fillStyle = col; g.fill();
    spiral(g, 128, 128, 96, 3, 13, '#10161c');
    return c;
  }
  function vinylCap(col) {
    const c = canvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#08080a'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1.5; for (let r = 52; r < 124; r += 5) { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 96, -0.9, -0.3); g.stroke(); g.beginPath(); g.arc(128, 128, 96, 2.2, 2.8); g.stroke();
    g.beginPath(); g.arc(128, 128, 44, 0, 7); g.fillStyle = col; g.fill(); g.beginPath(); g.arc(128, 128, 6, 0, 7); g.fillStyle = '#08080a'; g.fill();
    return c;
  }
  function targetFace(kind, theme) {
    use(theme);
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = P.bone; g.fillRect(0, 0, 128, 128); g.lineWidth = 12; g.strokeStyle = kind === 'moon' ? P.b : P.a; g.strokeRect(6, 6, 116, 116);
    if (typeof kind === 'number') { g.font = '700 84px ' + DIGIT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.ink; g.fillText(String(kind), 64, 70); }
    else if (kind === 'bat') star(g, 64, 64, 36, 5, 0.45, 0), g.fillStyle = C.ink, g.fill(); else spiral(g, 64, 64, 40, 2.5, 8, C.ink);
    return c;
  }
  function letter(ch, lit, theme) {
    use(theme);
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = lit ? P.a : '#2b3440'; g.fillRect(0, 0, 128, 128); g.lineWidth = 10; g.strokeStyle = C.ink; g.strokeRect(5, 5, 118, 118);
    g.font = WT + fs(96) + 'px ' + LABEL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = lit ? C.ink : '#0b1218'; g.fillText(ch, 64, 70, 100);
    return c;
  }
  function witch() { // a plain silhouette, drawn here
    const c = canvas(640, 400), g = c.getContext('2d'); g.fillStyle = '#05060c'; g.strokeStyle = '#05060c'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(320, 215); g.rotate(-0.1);
    const paint = () => {
    g.lineWidth = 11; g.beginPath(); g.moveTo(-200, 46); g.lineTo(262, 22); g.stroke();                       // broom handle
    g.beginPath(); g.moveTo(-196, 46); g.lineTo(-300, 4); g.lineTo(-282, 36); g.lineTo(-306, 58); g.lineTo(-276, 62); g.lineTo(-296, 96); g.closePath(); g.fill();   // bristles
    g.beginPath(); g.moveTo(-46, 36); g.bezierCurveTo(-64, -40, -30, -100, 16, -104); g.bezierCurveTo(50, -88, 60, -30, 52, 34); g.closePath(); g.fill();         // body
    g.beginPath(); g.moveTo(-34, -40); g.bezierCurveTo(-120, -66, -190, -18, -262, -58); g.bezierCurveTo(-206, 14, -112, 32, -30, 30); g.closePath(); g.fill();   // cloak
    g.beginPath(); g.arc(30, -124, 28, 0, 7); g.fill();                                                                                                       // head
    g.beginPath(); g.moveTo(-26, -132); g.lineTo(88, -136); g.lineTo(56, -150); g.lineTo(34, -246); g.lineTo(6, -150); g.closePath(); g.fill();                    // hat
    g.beginPath(); g.moveTo(54, -120); g.lineTo(74, -112); g.lineTo(56, -106); g.closePath(); g.fill();                                                          // nose
    g.lineWidth = 13; g.beginPath(); g.moveTo(36, -64); g.lineTo(104, 10); g.stroke();                                                                         // arm
    g.beginPath(); g.moveTo(24, 30); g.lineTo(78, 72); g.lineTo(122, 58); g.stroke();                                                                          // leg
    };
    g.shadowColor = 'rgba(255,244,214,0.6)'; g.shadowBlur = 10; paint(); g.shadowBlur = 0; paint();   // moonlit halo so it reads over dark art
    return c;
  }
  function wood() {
    const c = canvas(512, 128), g = c.getContext('2d'), rnd = rngFor(5);
    g.fillStyle = '#0a1016'; g.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (40 + rnd() * 30 | 0) + ',' + (46 + rnd() * 30 | 0) + ',' + (56 + rnd() * 30 | 0) + ',' + (0.15 + rnd() * 0.3) + ')'; g.lineWidth = 1 + rnd() * 2; const y = rnd() * 128; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + rnd() * 8 - 4, 340, y + rnd() * 8 - 4, 512, y + rnd() * 6 - 3); g.stroke(); }
    return c;
  }
  function face(theme) {
    use(theme);
    const c = canvas(1224, 120), g = c.getContext('2d');
    g.fillStyle = '#0a1016'; g.fillRect(0, 0, 1224, 120);
    g.fillStyle = rgba(P.bone, 0.6); g.fillRect(0, 0, 1224, 8); g.fillRect(0, 106, 1224, 4);
    for (let i = 0; i < 20; i++) spiral(g, 30 + i * 62, 58, 20, 2, 4, rgba(i % 2 ? P.a : P.b, 0.8));
    return c;
  }
  function apron(theme) {
    use(theme);
    const c = canvas(1408, 256), g = c.getContext('2d'), w = theme.w, pl = w.plural.toLowerCase();
    g.fillStyle = '#080d13'; g.fillRect(0, 0, 1408, 256);
    g.lineWidth = 5; g.strokeStyle = rgba(P.bone, 0.6); g.strokeRect(14, 14, 1380, 228);
    const card = (x, title, lines) => { g.fillStyle = P.bone; g.fillRect(x, 40, 392, 176); g.lineWidth = 4; g.strokeStyle = C.ink; g.strokeRect(x + 8, 48, 376, 160); g.fillStyle = C.ink; g.font = '34px ' + FELL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, x + 196, 80); g.font = '23px ' + FELL; lines.forEach((l, i) => g.fillText(l, x + 196, 120 + i * 30)); };
    card(60, 'How to Play', [w.tip, 'Twelve ' + pl + ' light the lock', 'Lock ' + (theme.layout.mbBalls === 2 ? 'two' : 'three') + ' balls for multiball']);
    card(956, 'Scoring', ['Ramp 3,000 · Jackpot 25,000', w.set + ' raises the bonus', 'Bonus: ' + pl + ' x 500 x multiplier']);
    const words = theme.title.split(' '), half = Math.ceil(words.length / 2), l1 = words.slice(0, half).join(' '), l2 = words.slice(half).join(' ');
    g.font = APRON + ' ' + DISPLAY; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = P.bone;
    if (l2) { g.fillText(l1, 704, 92, 440); g.fillText(l2, 704, 170, 440); } else g.fillText(l1, 704, 128, 440);
    return c;
  }
  function env() {
    const c = canvas(1024, 512), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#12202e'); gr.addColorStop(0.5, '#070c12'); gr.addColorStop(1, '#030406');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    const box = (x, y, w, h, col) => { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 50; g.fillRect(x, y, w, h); g.shadowBlur = 0; };
    box(120, 40, 240, 70, '#eef6ff'); box(620, 30, 300, 80, '#d8ecff'); box(430, 150, 90, 40, P.a); box(30, 210, 60, 120, P.b); box(900, 200, 70, 130, P.a); box(480, 10, 80, 30, '#ffffff');
    return c;
  }

  window.WHArt = { C, S, DIGIT, use, lower, upper, backglass, scorePanel, eyeCap, spiralCap, vinylCap, witch, targetFace, letter, wood, face, apron, env, canvas, pal: () => P };
})();
