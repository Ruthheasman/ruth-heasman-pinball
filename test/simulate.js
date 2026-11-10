require('../src/physics.js'); require('../src/themes.js'); // node test/simulate.js [tableId]
const { Pinball } = globalThis.WH;
function bot(g, skill) {
  for (const f of g.t.flippers) { let want = false;
    for (const b of g.balls) { if (!(f.mask & b.layer)) continue; const lx = f.side < 0 ? b.x - f.px : f.px - b.x; if (lx > 0.3 && lx < f.len + 0.2 && b.y < f.py + 1.3 && b.y > f.py - 1.6 && b.vy < 6) want = true; }
    if (want && g.rng() < skill) f.hold = 0.12; if (f.hold > 0) f.hold -= 1 / 720; f._want = f.hold > 0; }
  for (const side of ['L', 'R']) g.setFlipper(side, g.t.flippers.some(f => ((f.side < 0) === (side === 'L')) && f._want));
}
const only = process.argv[2];
for (const th of globalThis.WHThemes) {
  if (only && th.id !== only) continue;
  const tally = {}, stuckAt = {}; let bad = 0, tt = 0, n = 0, sc = [];
  for (const skill of [0, 0.4, 0.9]) for (let seed = 1; seed <= 5; seed++) {
    const g = new Pinball(seed * 7 + skill * 10, th.layout); g.start(); let t = 0;
    while (g.state === 'playing' && t < 240) {
      if (g.ballInLane()) g.launch(0.3 + g.rng() * 0.7); bot(g, skill); g.step(1 / 720); t += 1 / 720;
      for (const e of g.events) { const k = e.type === 'shot' || e.type === 'saucer' ? e.type + ':' + e.id : e.type === 'denied' ? 'denied:' + e.why : e.type; tally[k] = (tally[k] || 0) + 1; } g.events.length = 0;
      for (const b of g.balls) { if (isNaN(b.x) || b.x < 0.1 || b.x > 19.9 || b.y > 41.9) bad++; if (b.still > 3.4) { const k = b.x.toFixed(0) + ',' + b.y.toFixed(0); stuckAt[k] = 1; } }
    }
    tt += t; n++; sc.push(g.score);
  }
  const pickd = {}; for (const k of Object.keys(tally)) if (/shot|saucer|denied|kickback|drone|disc|crypt|multiball$|jackpot|lock|ramp|bank|moon|drop|bumper|witching$/.test(k)) pickd[k] = tally[k];
  console.log(th.id.padEnd(10), 'avg s', (tt / n).toFixed(0), 'oob', bad, 'stuck', JSON.stringify(Object.keys(stuckAt)), 'median', sc.sort((a, b) => a - b)[7], '\n   ', JSON.stringify(pickd));
}
