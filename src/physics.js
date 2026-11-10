/* Witching Hour — table definition, physics and rules. No DOM in this file. */
(function (root) {
  'use strict';
  const R = 0.42, H = 1.5;
  const L0 = 1, L1 = 2, LR = 4, ALL = 7;
  const G = 38, G_RAMP = 30, MAXV = 86, DT = 1 / 720;
  const RAMP = { x0: 15.9, x1: 18.2, y0: 21.5, y1: 30.5 };
  const EDGE = 26;                 // front edge of the upper playfield
  const MIR = x => 18.8 - x;       // mirror about the lower playfield centre line

  function buildTable(L) {
    L = L || {};
    const segs = [], circs = [], flippers = [], drops = [], standups = [], saucers = [], rollovers = [];
    const seg = (ax, ay, bx, by, mask, kind, o) => {
      const s = Object.assign({ ax, ay, bx, by, mask, kind: kind || 'wall', e: 0.45, active: true }, o || {});
      segs.push(s); return s;
    };
    // cabinet walls
    seg(0.6, 0, 0.6, 32, L0 | L1);
    seg(18.2, 0, 18.2, 32, ALL, 'wall', { tag: 'laneWall' });
    seg(19.4, 0, 19.4, 32, ALL);
    seg(18.2, 1.7, 19.4, 1.7, ALL, 'wall', { e: 0.2, tag: 'plunger' });
    // front face of the upper playfield
    seg(0.6, EDGE, RAMP.x0, EDGE, L0, 'wall', { tag: 'face' });
    // ramp rail (left side; the lane wall is the right side)
    seg(RAMP.x0, RAMP.y0, RAMP.x0, RAMP.y1, ALL, 'wall', { tag: 'rampRail' });
    seg(RAMP.x0, RAMP.y1, RAMP.x0, RAMP.y1 + R, LR, 'wall', { tag: 'hidden' });
    // one-way gates
    seg(RAMP.x0, 30.5, 18.2, 31.1, L1, 'gate', { oneSided: true, e: 0.2 });
    seg(18.2, 32.0, 19.4, 32.7, L1, 'gate', { oneSided: true, e: 0.2 });
    // arch
    const N = 40;
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N;
      seg(10 + 9.4 * Math.cos(a0), 32 + 9.4 * Math.sin(a0), 10 + 9.4 * Math.cos(a1), 32 + 9.4 * Math.sin(a1), L1, 'wall', { tag: 'arch', e: 0.3 });
    }

    // ---- lower playfield: lanes, slings, flippers (built left, mirrored right)
    for (const m of [0, 1]) {
      const X = m ? MIR : (x => x);
      seg(X(1.85), 6.95, X(1.85), 11.0, L0, 'wall', { tag: 'laneGuide', e: 0.4 });
      seg(X(1.85), 6.95, X(5.95), 4.76, L0, 'wall', { tag: 'laneGuide', e: 0.3 });
      seg(X(3.1), 11.2, X(3.1), 7.5, L0, 'wall', { tag: 'slingSide', e: 0.5 });
      seg(X(3.1), 7.5, X(5.2), 6.4, L0, 'wall', { tag: 'slingSide', e: 0.5 });
      seg(X(5.2), 6.4, X(3.1), 11.2, L0, 'sling', { e: 0.5, id: m ? 'slingR' : 'slingL' });
      flippers.push({
        id: m ? 'R' : 'L', side: m ? 1 : -1, px: X(5.9), py: 4.4, len: 3.1, r: 0.34, mask: L0,
        rest: m ? Math.PI + 0.49 : -0.49, up: m ? Math.PI - 0.49 : 0.49, angle: 0, omega: 0, pressed: false
      });
      rollovers.push({ id: m ? 'inR' : 'inL', x: X(2.47), y: 9.4, r: 0.5, mask: L0, kind: 'inlane' });
      rollovers.push({ id: m ? 'outR' : 'outL', x: X(1.22), y: 8.4, r: 0.5, mask: L0, kind: 'outlane' });
      // drop target bank
      const ax = 1.3, ay = 13.4, bx = 2.8, by = 16.9, len = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / len, dy = (by - ay) / len, nx = dy, ny = -dx;
      const Ab = [ax - 0.3 * nx, ay - 0.3 * ny], Bb = [bx - 0.3 * nx, by - 0.3 * ny];
      seg(X(Ab[0]), Ab[1], X(Bb[0]), Bb[1], L0, 'wall', { tag: 'bankBack', e: 0.3 });
      seg(X(0.6), 12.6, X(Ab[0]), Ab[1], L0, 'wall', { tag: 'bankBack' });
      seg(X(Bb[0]), Bb[1], X(0.6), 18.6, L0, 'wall', { tag: 'bankBack' });
      seg(X(Ab[0]), Ab[1], X(ax), ay, L0, 'wall', { tag: 'bankBack' });
      seg(X(Bb[0]), Bb[1], X(bx), by, L0, 'wall', { tag: 'bankBack' });
      for (let i = 0; i < 3; i++) {
        const t0 = 0.085 + i * 1.27, t1 = t0 + 1.1;
        const s = seg(X(ax + dx * t0), ay + dy * t0, X(ax + dx * t1), ay + dy * t1, L0, 'drop', { e: 0.3 });
        const d = { id: (m ? 'dr' : 'dl') + i, bank: m ? 'right' : 'left', seg: s, down: false, level: 0 };
        s.ref = d; drops.push(d);
      }
    }
    // MOON standups on the front face
    const LET = Array.isArray(L.letters) ? L.letters : (L.letters || 'VOID').split('');
    (LET.length === 5 ? [[2.2, 3.6], [5.0, 6.4], [7.8, 9.2], [10.6, 12.0], [13.4, 14.8]] : [[3.2, 4.6], [6.4, 7.8], [11.0, 12.4], [13.6, 15.0]]).forEach((p, i) => {
      const s = seg(p[0], EDGE - 0.16, p[1], EDGE - 0.16, L0, 'standup', { e: 0.35, onFace: true });
      const t = { id: 'moon' + i, idx: i, seg: s, lit: false, letter: LET[i] }; s.ref = t; standups.push(t);
    });
    // ---- signature features, one set per table
    const LV = l => (l ? L1 : L0);
    (L.walls || []).forEach(w => seg(w[0], w[1], w[2], w[3], LV(w[4]), 'wall', { tag: 'laneGuide', e: 0.4 }));
    (L.arcs || []).forEach(a => {            // [cx, cy, r, deg0, deg1, level]
      const n = Math.max(6, Math.round(Math.abs(a[4] - a[3]) / 9));
      for (let i = 0; i < n; i++) {
        const t0 = (a[3] + (a[4] - a[3]) * i / n) * Math.PI / 180, t1 = (a[3] + (a[4] - a[3]) * (i + 1) / n) * Math.PI / 180;
        seg(a[0] + a[2] * Math.cos(t0), a[1] + a[2] * Math.sin(t0), a[0] + a[2] * Math.cos(t1), a[1] + a[2] * Math.sin(t1), LV(a[5]), 'wall', { tag: 'laneGuide', e: 0.3 });
      }
    });
    (L.saucers || []).forEach(o => saucers.push(Object.assign({ r: 0.6, level: 0, eject: [6, -8] }, o, { mask: LV(o.level) })));
    (L.shots || []).forEach(o => rollovers.push(Object.assign({ r: 0.6, level: 0, kind: 'shot', points: 2000, hour: true }, o, { mask: LV(o.level) })));
    (L.drones || []).forEach((d, i) => circs.push({ id: 'drone' + i, x: d[0], y: d[1], x0: d[0], amp: d[2], speed: d[3], phase: i * 2.4, vx: 0, r: 0.62, mask: LV(d[4]), level: d[4] || 0, kind: 'drone' }));
    (L.rows || []).forEach(o => {            // a straight row of drop targets
      const len = Math.hypot(o.bx - o.ax, o.by - o.ay), dx = (o.bx - o.ax) / len, dy = (o.by - o.ay) / len, w = len / o.n;
      for (let i = 0; i < o.n; i++) {
        const sg = seg(o.ax + dx * (i * w + 0.07), o.ay + dy * (i * w + 0.07), o.ax + dx * ((i + 1) * w - 0.07), o.ay + dy * ((i + 1) * w - 0.07), LV(o.level), 'drop', { e: 0.3 });
        const d = { id: o.bank + i, bank: o.bank, seg: sg, down: false, level: o.level || 0, num: o.ordered ? i + 1 : 0, face: o.face };
        sg.ref = d; drops.push(d);
      }
    });
    const gate = L.gate ? seg(L.gate[0], L.gate[1], L.gate[2], L.gate[3], L0, 'nogate', { oneSided: true, e: 0.5, tag: 'nogate' }) : null;
    const disc = L.disc ? Object.assign({ angle: 0 }, L.disc) : null;
    (L.lower || [[9.4, 21.6, 0.95, 'spiral2']]).forEach((b, i) => circs.push({ id: 'bumpL' + i, x: b[0], y: b[1], r: b[2], mask: L0, kind: 'bumper', level: 0, cap: b[3] || 'spiral2' }));
    (L.posts || []).forEach((b, i) => circs.push({ id: 'post' + i, x: b[0], y: b[1], r: 0.42, mask: L0, kind: 'post', level: 0 }));
    saucers.push({ id: 'crypt', x: 2.1, y: 23.6, r: 0.6, mask: L0, level: 0, eject: [11, -9] });
    seg(0.6, 25.5, 2.3, 24.7, L0, 'wall', { tag: 'backstop', e: 0.2 });

    // ---- upper playfield
    seg(0.6, 30.8, 5.3, 28.294, L1, 'wall', { tag: 'upGuide', e: 0.35 });
    seg(RAMP.x0, 30.43, 11.9, 28.294, L1, 'wall', { tag: 'upGuide', e: 0.35 });
    flippers.push({ id: 'UL', side: -1, px: 5.4, py: 27.9, len: 2.4, r: 0.3, mask: L1, rest: -0.49, up: 0.49, angle: 0, omega: 0, pressed: false, level: 1 });
    flippers.push({ id: 'UR', side: 1, px: 11.8, py: 27.9, len: 2.4, r: 0.3, mask: L1, rest: Math.PI + 0.49, up: Math.PI - 0.49, angle: 0, omega: 0, pressed: false, level: 1 });
    (L.upper || [[7.3, 34.4, 0.9, 'eye'], [13.2, 35.9, 0.9, 'eye'], [10.65, 33.3, 0.8, 'spiral']]).forEach((b, i) => circs.push({ id: 'bump' + i, x: b[0], y: b[1], r: b[2], mask: L1, kind: 'bumper', level: 1, cap: b[3] || 'spiral' }));
    saucers.push({ id: 'lock', x: 2.8, y: 33.8, r: 0.62, mask: L1, level: 1, eject: [9, -12] });
    seg(1.95, 34.25, 3.2, 34.9, L1, 'wall', { tag: 'backstop', e: 0.15 });
    if (L.upperBank !== false) {
      const ax = 16.6, ay = 33.0, bx = 15.4, by = 36.4, len = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / len, dy = (by - ay) / len, nx = dy * -1, ny = dx; // faces left-down
      const fx = -Math.abs(nx), fy = -Math.abs(ny);
      seg(ax - 0.3 * fx, ay - 0.3 * fy, bx - 0.3 * fx, by - 0.3 * fy, L1, 'wall', { tag: 'bankBack', e: 0.3 });
      seg(ax - 0.3 * fx, ay - 0.3 * fy, ax, ay, L1, 'wall', { tag: 'bankBack' });
      seg(bx - 0.3 * fx, by - 0.3 * fy, bx, by, L1, 'wall', { tag: 'bankBack' });
      for (let i = 0; i < 3; i++) {
        const t0 = 0.05 + i * 1.2, t1 = t0 + 1.05;
        const s = seg(ax + dx * t0, ay + dy * t0, ax + dx * t1, ay + dy * t1, L1, 'drop', { e: 0.3 });
        const d = { id: 'du' + i, bank: 'upper', seg: s, down: false, level: 1 };
        s.ref = d; drops.push(d);
      }
    }
    for (const f of flippers) f.angle = f.rest;
    return { segs, circs, flippers, drops, standups, saucers, rollovers, gate, disc };
  }

  class Pinball {
    constructor(seed, layout) {
      this.layout = layout || {}; this.G = this.layout.g || G;
      this.t = buildTable(this.layout);
      this.rng = seed === undefined ? Math.random : mulberry(seed);
      this.events = [];
      this.acc = 0;
      this.time = 0;
      this.state = 'attract';
      this.balls = [];
      this.highScore = 0;
      this.resetGame();
      this.state = 'attract';
    }
    resetGame() {
      this.score = 0; this.ballNum = 1; this.maxBalls = 3;
      this.mult = 1; this.hour = 0; this.hoursThisBall = 0;
      this.locks = 0; this.lockLit = false; this.multiball = false; this.jackpot = 25000;
      this.witching = 0; this.saveTimer = 0; this.plunge = null;
      this.pending = []; this.balls = []; this.bonusShow = 0;
      for (const d of this.t.drops) { d.down = false; d.seg.active = true; }
      for (const s of this.t.standups) s.lit = false;
      this.bankTimers = {};
      this.laneLit = { inL: false, inR: false };
      this.gateOpen = 0; this.kickLit = !!this.layout.kickback; this.msgCd = 0; this.seqOk = true;
    }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    start() {
      this.resetGame(); this.state = 'playing';
      this.emit('start'); this.serve(false);
    }
    serve(auto) {
      const b = { x: 18.8, y: 2.3, vx: 0, vy: 0, layer: L1, air: 0, fall: 0, held: null, cool: 0, still: 0, id: Math.floor(this.rng() * 1e9), rampFrom: null, spin: 0 };
      this.balls.push(b);
      this.emit('serve');
      if (auto) this.pending.push({ t: 0.9, fn: () => this.launch(0.85) });
      return b;
    }
    add(points) { const p = points * (this.witching > 0 ? 2 : 1) * (this.layout.pairDouble && this.multiball && this.balls.length >= 2 ? 2 : 1); this.score += p; return p; }
    advanceHour(n) {
      for (let i = 0; i < (n || 1); i++) {
        this.hour++; this.hoursThisBall++;
        this.emit('hour', { hour: this.hour });
        if (this.hour >= 12) {
          this.hour = 0; this.witching = 30; this.lockLit = true;
          this.score += 25000;
          this.emit('witching');
        }
      }
    }
    setFlipper(side, on) {
      for (const f of this.t.flippers) {
        if ((side === 'L') === (f.side < 0)) {
          if (on && !f.pressed && this.state === 'playing') this.emit('flipper', { id: f.id });
          f.pressed = on && this.state === 'playing';
        }
      }
    }
    plungeStart() { if (this.state === 'playing' && !this.plunge) this.plunge = { t: 0 }; }
    plungeRelease() {
      if (!this.plunge) return;
      const p = Math.min(1, this.plunge.t / 0.9); this.plunge = null;
      this.launch(p);
    }
    plungePower() { return this.plunge ? Math.min(1, this.plunge.t / 0.9) : 0; }
    ballInLane() { return this.balls.some(b => b.x > 18.2 && b.y < 4 && Math.hypot(b.vx, b.vy) < 4); }
    launch(p) {
      let any = false;
      for (const b of this.balls) {
        if (b.x > 18.2 && b.y < 4 && Math.hypot(b.vx, b.vy) < 4) { b.vy = 56 + 24 * p; b.vx = 0; any = true; }
      }
      if (any) {
        this.emit('launch', { power: p });
        if (!this.multiball && this.saveTimer <= 0 && !this.savedThisBall) { this.saveTimer = 14; this.savedThisBall = true; }
      }
    }
    update(dt) {
      if (dt > 0.05) dt = 0.05;
      this.acc += dt;
      while (this.acc >= DT) { this.step(DT); this.acc -= DT; }
    }
    step(dt) {
      this.time += dt;
      if (this.plunge) this.plunge.t += dt;
      for (let i = this.pending.length - 1; i >= 0; i--) {
        const p = this.pending[i]; p.t -= dt;
        if (p.t <= 0) { this.pending.splice(i, 1); p.fn(); }
      }
      if (this.witching > 0) { this.witching -= dt; if (this.witching <= 0) { this.witching = 0; this.emit('witchingEnd'); } }
      if (this.saveTimer > 0 && this.balls.some(b => b.x < 18.2)) this.saveTimer -= dt;
      const T = this.t;
      if (this.gateOpen > 0) this.gateOpen -= dt;
      if (T.gate) T.gate.active = !(this.gateOpen > 0 || this.multiball);
      if (T.disc) T.disc.angle += T.disc.omega * dt;
      for (const c of T.circs) if (c.kind === 'drone') { const a = this.time * c.speed + c.phase; c.x = c.x0 + c.amp * Math.sin(a); c.vx = c.amp * c.speed * Math.cos(a); }
      for (const f of T.flippers) {
        const target = f.pressed ? f.up : f.rest, sp = f.pressed ? 36 : 20;
        const d = target - f.angle, stepA = sp * dt;
        const prev = f.angle;
        if (Math.abs(d) <= stepA) f.angle = target; else f.angle += Math.sign(d) * stepA;
        f.omega = (f.angle - prev) / dt;
      }
      if (this.state !== 'playing') return;
      for (let bi = this.balls.length - 1; bi >= 0; bi--) {
        const b = this.balls[bi];
        if (b.cool > 0) b.cool -= dt;
        if (b.held) {
          b.held.t -= dt;
          const s = b.held.s; b.x += (s.x - b.x) * Math.min(1, dt * 14); b.y += (s.y - b.y) * Math.min(1, dt * 14);
          if (b.held.t <= 0) this.releaseSaucer(b, bi);
          continue;
        }
        const g = b.layer === LR ? this.G + G_RAMP : this.G;
        b.vy -= g * dt;
        const drag = 1 - 0.1 * dt; b.vx *= drag; b.vy *= drag;
        let sp = Math.hypot(b.vx, b.vy);
        if (sp > MAXV) { b.vx *= MAXV / sp; b.vy *= MAXV / sp; sp = MAXV; }
        const oy = b.y;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.air > 0) b.air -= dt;
        // layer changes
        const inRamp = b.x > RAMP.x0 && b.x < 18.2 && b.y > RAMP.y0 && b.y < RAMP.y1 + R;
        if (b.layer === LR) {
          if (!inRamp) {
            if (b.y >= RAMP.y1 + R) {
              b.layer = L1;
              if (b.rampFrom === 'bottom') this.onRamp(b);
            } else b.layer = L0;
            b.rampFrom = null;
          } else if ((oy - 22.4) * (b.y - 22.4) < 0) { this.add(100); this.emit('spinner', { speed: Math.abs(b.vy) }); }
        } else if (inRamp) {
          b.rampFrom = b.layer === L0 ? 'bottom' : 'top'; b.layer = LR;
        } else if (b.layer === L1 && b.x < 18.2 && b.y < EDGE - R - 0.02) {
          b.layer = L0; b.air = 0.22; b.fall = 0.0001;
        }
        if (b.fall > 0) { b.fall += dt; if (b.fall > 0.24) { b.fall = 0; this.emit('land', { x: b.x, y: b.y }); } }
        // segments
        for (const s of T.segs) {
          if (!s.active || !(s.mask & b.layer)) continue;
          if (b.air > 0 && s.onFace) continue;
          const dx = s.bx - s.ax, dy = s.by - s.ay;
          let t = ((b.x - s.ax) * dx + (b.y - s.ay) * dy) / (dx * dx + dy * dy);
          if (s.oneSided && (dx * (b.y - s.ay) - dy * (b.x - s.ax)) < 0) continue;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const cx = s.ax + dx * t, cy = s.ay + dy * t;
          let nx = b.x - cx, ny = b.y - cy; const d2 = nx * nx + ny * ny;
          if (d2 >= R * R) continue;
          let d = Math.sqrt(d2);
          if (d < 1e-6) { const l = Math.hypot(dx, dy); nx = -dy / l; ny = dx / l; d = 0; } else { nx /= d; ny /= d; }
          b.x = cx + nx * R; b.y = cy + ny * R;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            const imp = -vn;
            let e = imp < 1.4 ? 0 : s.e;
            b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
            // a little tangential friction
            const tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty;
            if (imp > 1.4) { b.vx -= vt * 0.03 * tx; b.vy -= vt * 0.03 * ty; }
            this.onSegHit(s, b, imp, nx, ny, t);
          }
        }
        // posts and bumpers
        for (const c of T.circs) {
          if (!(c.mask & b.layer)) continue;
          let nx = b.x - c.x, ny = b.y - c.y; const rr = c.r + R, d2 = nx * nx + ny * ny;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 1e-6; nx /= d; ny /= d;
          b.x = c.x + nx * rr; b.y = c.y + ny * rr;
          const vn = (b.vx - (c.vx || 0)) * nx + b.vy * ny;
          if (vn < 0) { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; }
          if (c.kind === 'drone' && vn < -2 && !(c.cd > this.time)) {
            c.cd = this.time + 0.5; c.hit = this.time; this.add(this.layout.dronePoints || 1500); if (!(c.hourCd > this.time)) { c.hourCd = this.time + 5; this.advanceHour(1); } this.emit('drone', { id: c.id });
          }
          if (c.kind === 'bumper' && vn < -1.0) {
            b.vx += nx * 24; b.vy += ny * 24;
            this.add(500); this.emit('bumper', { id: c.id, x: c.x, y: c.y });
          }
        }
        // flippers
        for (const f of T.flippers) {
          if (!(f.mask & b.layer)) continue;
          const dx = Math.cos(f.angle) * f.len, dy = Math.sin(f.angle) * f.len;
          let t = ((b.x - f.px) * dx + (b.y - f.py) * dy) / (f.len * f.len);
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const cx = f.px + dx * t, cy = f.py + dy * t;
          let nx = b.x - cx, ny = b.y - cy; const rr = R + f.r, d2 = nx * nx + ny * ny;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 1e-6; nx /= d; ny /= d;
          b.x = cx + nx * rr; b.y = cy + ny * rr;
          const rx = cx - f.px, ry = cy - f.py;
          const svx = -f.omega * ry, svy = f.omega * rx;
          const vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
          if (vn < 0) {
            const e = (-vn < 2) ? 0 : (f.omega !== 0 ? 0.55 : 0.32);
            b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
            const tx = -ny, ty = nx, vt = (b.vx - svx) * tx + (b.vy - svy) * ty;
            if (-vn > 2) { b.vx -= vt * 0.08 * tx; b.vy -= vt * 0.08 * ty; }
            if (-vn > 6) this.emit('knock', { v: -vn, x: b.x, y: b.y });
          }
        }
        // saucers
        if (b.cool <= 0) for (const s of T.saucers) {
          if (!(s.mask & b.layer) || b.air > 0) continue;
          if (Math.hypot(b.x - s.x, b.y - s.y) < s.r && Math.hypot(b.vx, b.vy) < 34) {
            b.held = { s, t: 0.9 }; b.vx = b.vy = 0;
            this.onSaucer(s, b);
            break;
          }
        }
        // rollovers
        for (const r of T.rollovers) {
          if (!(r.mask & b.layer)) continue;
          const inside = Math.hypot(b.x - r.x, b.y - r.y) < r.r;
          if (inside && !(r.cd > this.time)) {
            r.cd = this.time + 0.6;
            if (r.kind === 'inlane') { this.add(1000); this.laneLit[r.id] = true; this.emit('rollover', { id: r.id }); }
            else if (r.kind === 'outlane') {
              this.add(3000); this.emit('rollover', { id: r.id });
              if (this.kickLit && r.id === 'outL') { this.kickLit = false; b.vx = 0.4; b.vy = 50; this.emit('kickback'); }
            } else if (Math.hypot(b.vx, b.vy) >= (r.minSpeed || 0)) {
              const p = this.add(r.points); if (r.hour) this.advanceHour(1);
              this.emit('shot', { id: r.id, label: r.label, points: p });
            } else r.cd = 0;
          }
        }
        if (T.disc && b.layer === L0 && !(b.air > 0)) {
          const D = T.disc, ddx = b.x - D.x, ddy = b.y - D.y;
          if (ddx * ddx + ddy * ddy < D.r * D.r) {
            const k = Math.min(1, 3.2 * dt);
            b.vx += (-D.omega * ddy - b.vx) * k; b.vy += (D.omega * ddx - b.vy) * k;
            if (!(D.cd > this.time)) { D.cd = this.time + 0.8; this.add(750); this.emit('disc'); }
          }
        }
        // stuck guard
        if (Math.hypot(b.vx, b.vy) < 0.6 && !(b.x > 18.2 && b.y < 4)) {
          b.still += dt;
          if (b.still > 3.5 && !this.t.flippers.some(f => f.pressed)) { b.vx += (this.rng() - 0.5) * 12; b.vy += 6 + this.rng() * 6; b.still = 0; }
        } else b.still = 0;
        b.spin += sp * dt;
        // drain / out of bounds
        if ((b.layer === L0 && b.y < 1.5) || b.x < -1 || b.x > 21 || b.y > 43 || b.y < -1 || isNaN(b.x)) {
          this.balls.splice(bi, 1); this.onDrain(b);
        }
      }
      // ball vs ball
      const B = this.balls;
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
        const a = B[i], c = B[j];
        if (a.layer !== c.layer || a.held || c.held) continue;
        let nx = c.x - a.x, ny = c.y - a.y; const d2 = nx * nx + ny * ny;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2); nx /= d; ny /= d;
        const o = (2 * R - d) / 2; a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) { const k = -rv * 0.95; a.vx -= k * nx; a.vy -= k * ny; c.vx += k * nx; c.vy += k * ny; if (-rv > 4) this.emit('click', { v: -rv }); }
      }
      // timed bank resets
      for (const k in this.bankTimers) {
        if (this.bankTimers[k] > 0) {
          this.bankTimers[k] -= dt;
          if (this.bankTimers[k] <= 0) {
            // never raise a target into a ball: wait until the bank is clear
            let clear = true;
            for (const d of T.drops) if (d.bank === k) for (const b of this.balls) {
              const sg = d.seg, mx = (sg.ax + sg.bx) / 2, my = (sg.ay + sg.by) / 2;
              if ((sg.mask & b.layer) && Math.hypot(b.x - mx, b.y - my) < 1.6) clear = false;
            }
            if (!clear) { this.bankTimers[k] = 0.2; continue; }
            for (const d of T.drops) if (d.bank === k) { d.down = false; d.seg.active = true; }
            this.emit('bankReset', { bank: k });
          }
        }
      }
    }
    onSegHit(s, b, imp, nx, ny, t) {
      if (s.kind === 'sling') {
        if (imp > 2.2 && t > 0.12 && t < 0.88) {
          b.vx += nx * 22; b.vy += ny * 22; this.add(110);
          this.emit('sling', { id: s.id });
        }
      } else if (s.kind === 'nogate') {
        if (imp > 3 && this.msgCd < this.time) { this.msgCd = this.time + 1.5; this.emit('denied', { why: 'gate' }); }
      } else if (s.kind === 'drop') {
        if (imp > 3 && s.ref.num && s.ref.num !== 1 + this.t.drops.filter(x => x.bank === s.ref.bank && x.down).length) {
          this.add(100); if (this.msgCd < this.time) { this.msgCd = this.time + 1.5; this.emit('denied', { why: 'order', next: 1 + this.t.drops.filter(x => x.bank === s.ref.bank && x.down).length }); }
        } else if (imp > 3) {
          const d = s.ref; d.down = true; s.active = false;
          this.add(1500); this.emit('drop', { id: d.id, bank: d.bank });
          this.advanceHour(1);
          if (this.t.drops.filter(x => x.bank === d.bank).every(x => x.down)) {
            this.add(d.bank === 'upper' ? 10000 : 5000);
            this.lockLit = true; this.bankTimers[d.bank] = 1.4;
            if (this.t.gate && d.num) this.gateOpen = 25;
            this.emit('bank', { bank: d.bank, gate: !!(this.t.gate && d.num) });
          }
        }
      } else if (s.kind === 'standup') {
        if (imp > 2.5) {
          const m = s.ref;
          if (this.layout.seq && !m.lit && m.idx !== this.t.standups.findIndex(x => !x.lit)) this.seqOk = false;
          this.add(m.lit ? 500 : 1000);
          if (!m.lit) { m.lit = true; this.advanceHour(1); }
          this.emit('standup', { id: m.id });
          if (this.t.standups.every(x => x.lit)) {
            for (const x of this.t.standups) x.lit = false;
            if (this.mult < 5) this.mult++;
            if (this.layout.kickback) this.kickLit = true;
            if (this.layout.dice) { this.lockLit = true; this.add(10000); }
            if (this.layout.seq) { if (this.seqOk) { this.lockLit = true; const p = this.add(20000); this.emit('perfect', { points: p }); } this.seqOk = true; }
            this.add(5000); this.emit('moon', { mult: this.mult });
          }
        }
      } else if (imp > 5) this.emit('knock', { v: imp, x: b.x, y: b.y });
    }
    onRamp(b) {
      if (this.multiball) { const p = this.add(this.jackpot); this.emit('jackpot', { points: p }); this.jackpot += 5000; }
      else { this.add(3000); this.emit('ramp'); }
      this.advanceHour(1);
    }
    onSaucer(s, b) {
      if (s.id === 'lock' && this.lockLit && !this.multiball) {
        this.locks++; this.add(5000);
        if (this.locks >= (this.layout.mbBalls || 3)) {
          this.locks = 0; this.lockLit = false; this.multiball = true; this.jackpot = 25000;
          this.saveTimer = 10; b.held.t = 1.6;
          this.emit('multiball');
          this.pending.push({ t: 2.4, fn: () => this.ejectExtra(s) });
          if ((this.layout.mbBalls || 3) > 2) this.pending.push({ t: 3.3, fn: () => this.ejectExtra(s) });
        } else {
          b.held.lock = true; b.held.t = 0.8;
          this.emit('lock', { n: this.locks });
        }
      } else if (s.id === 'crypt') {
        if (this.layout.dice) {
          const d1 = 1 + Math.floor(this.rng() * 6), d2 = 1 + Math.floor(this.rng() * 6), p = this.add((d1 + d2) * 1000 * (d1 === d2 ? 2 : 1));
          this.advanceHour(1); if (d1 === d2 || d1 + d2 >= 7) this.lockLit = true;
          this.emit('crypt', { points: p, dice: [d1, d2] });
        } else {
          const p = this.add((1 + Math.floor(this.rng() * 10)) * 1000);
          this.advanceHour(1); this.emit('crypt', { points: p });
        }
      } else { const p = this.add(s.points || 2500); if (s.hour) this.advanceHour(1); this.emit('saucer', { id: s.id, label: s.label, points: p }); }
    }
    ejectExtra(s) {
      if (this.state !== 'playing') return;
      const b = { x: s.x, y: s.y, vx: s.eject[0] + (this.rng() - 0.5) * 3, vy: s.eject[1], layer: s.mask, air: 0, fall: 0, held: null, cool: 0.7, still: 0, id: Math.floor(this.rng() * 1e9), rampFrom: null, spin: 0 };
      this.balls.push(b); this.emit('eject', { id: s.id });
    }
    releaseSaucer(b, bi) {
      const s = b.held.s;
      if (b.held.lock) {
        this.balls.splice(bi, 1);
        this.serve(false);
        return;
      }
      b.held = null; b.cool = 0.7;
      if (s.warp) { b.x = s.warp[0]; b.y = s.warp[1]; b.layer = s.warp[2] ? L1 : L0; b.vx = s.warp[3] + (this.rng() - 0.5) * 2; b.vy = s.warp[4]; this.emit('eject', { id: s.id }); return; }
      b.vx = s.eject[0] + (this.rng() - 0.5) * 3; b.vy = s.eject[1];
      this.emit('eject', { id: s.id });
    }
    onDrain(b) {
      this.emit('drain');
      if (this.multiball) {
        if (this.saveTimer > 0) { this.serve(true); this.emit('ballsave'); return; }
        if (this.balls.length <= 1) { this.multiball = false; this.emit('multiballEnd'); }
        if (this.balls.length >= 1) return;
      }
      if (this.balls.length > 0) return;
      if (this.saveTimer > 0) { this.saveTimer = 0; this.serve(true); this.emit('ballsave'); return; }
      // end of ball
      const bonus = this.hoursThisBall * 500 * this.mult;
      this.score += bonus;
      this.emit('bonus', { bonus, hours: this.hoursThisBall, mult: this.mult });
      this.hoursThisBall = 0; this.witching = 0; this.savedThisBall = false;
      this.laneLit = { inL: false, inR: false }; this.kickLit = !!this.layout.kickback;
      this.ballNum++;
      if (this.ballNum > this.maxBalls) {
        this.state = 'gameover';
        if (this.score > this.highScore) this.highScore = this.score;
        for (const f of this.t.flippers) f.pressed = false;
        this.emit('gameover', { score: this.score });
      } else {
        this.mult = 1;
        this.pending.push({ t: 1.6, fn: () => { if (this.state === 'playing') this.serve(false); } });
      }
    }
    ballHeight(b) {
      if (b.layer === LR) return H * Math.max(0, Math.min(1, (b.y - RAMP.y0) / (RAMP.y1 - RAMP.y0)));
      if (b.layer === L1) return b.x > 18.2 ? H * Math.max(0, Math.min(1, (b.y - 20) / 12)) : H;
      if (b.fall > 0) { const k = b.fall / 0.24; return H * Math.max(0, 1 - k * k); }
      return 0;
    }
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  root.WH = { Pinball, R, H, L0, L1, LR, RAMP, EDGE, MIR };
})(typeof window !== 'undefined' ? window : globalThis);
