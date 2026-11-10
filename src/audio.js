/* Existential Dread — synthesised sound. Starts on the first key press or tap. */
(function () {
  'use strict';
  let ctx = null, master = null, noiseBuf = null, muted = false;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, freq, q, vol, delay, type) {
    const t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  const bell = (f, vol, delay, dur) => { tone(f, f, dur || 1.1, 'sine', vol, delay); tone(f * 2.76, f * 2.76, (dur || 1.1) * 0.5, 'sine', vol * 0.35, delay); tone(f * 5.4, f * 5.4, 0.2, 'sine', vol * 0.2, delay); };
  const arp = (notes, step, type, vol) => notes.forEach((n, i) => tone(n, n, 0.16, type || 'triangle', vol || 0.2, i * step));
  const S = {
    flipper() { noise(0.05, 1400, 1.2, 0.5); tone(120, 60, 0.07, 'sine', 0.5); },
    knock(e) { const v = Math.min(1, e.v / 50); noise(0.03, 2600, 2, 0.08 + v * 0.25); },
    click() { noise(0.02, 4200, 3, 0.25); },
    bumper() { tone(220, 70, 0.12, 'square', 0.22); noise(0.06, 900, 1, 0.5); bell(1320, 0.16, 0, 0.3); },
    sling() { noise(0.05, 1800, 1.5, 0.5); tone(330, 110, 0.08, 'triangle', 0.3); },
    drop() { tone(180, 90, 0.09, 'sine', 0.5); noise(0.04, 700, 1, 0.5); bell(784, 0.14, 0.02, 0.5); },
    standup() { bell(988, 0.2, 0, 0.6); noise(0.02, 3000, 2, 0.2); },
    rollover() { tone(1175, 1568, 0.12, 'triangle', 0.18); },
    spinner() { noise(0.03, 5200, 6, 0.14); },
    ramp() { arp([523, 659, 784, 1047], 0.06, 'triangle', 0.22); },
    hour() { bell(440, 0.1, 0, 0.9); },
    bank() { arp([392, 523, 659, 784, 1047], 0.05, 'square', 0.12); },
    bankReset() { noise(0.08, 500, 1, 0.4); tone(90, 140, 0.08, 'sine', 0.4); },
    moon() { arp([659, 831, 988, 1319], 0.08, 'triangle', 0.22); },
    crypt() { tone(110, 55, 0.5, 'sawtooth', 0.14); bell(330, 0.12, 0.1, 1.2); },
    saucer() { tone(160, 80, 0.2, 'sine', 0.4); },
    lock() { arp([330, 415, 494], 0.12, 'triangle', 0.25); bell(165, 0.2, 0.3, 1.6); },
    eject() { noise(0.08, 800, 1, 0.5); tone(90, 200, 0.1, 'sine', 0.5); },
    multiball() { for (let i = 0; i < 12; i++) bell([196, 247, 294, 370][i % 4] * (i > 7 ? 2 : 1), 0.16, i * 0.11, 0.7); tone(55, 110, 1.4, 'sawtooth', 0.12); },
    jackpot() { arp([1047, 1319, 1568, 2093, 1568, 2093], 0.05, 'square', 0.14); bell(523, 0.2, 0, 1.2); },
    witching() { for (let i = 0; i < 4; i++) bell(147, 0.26, i * 0.5, 1.8); tone(73, 73, 2.2, 'sawtooth', 0.08); },
    launch(e) { noise(0.25, 300 + e.power * 900, 0.8, 0.5); tone(80, 300 + e.power * 300, 0.2, 'sawtooth', 0.12); },
    land() { noise(0.04, 500, 1, 0.4); tone(100, 60, 0.06, 'sine', 0.4); },
    drain() { tone(330, 55, 0.9, 'sawtooth', 0.14); tone(247, 41, 1.1, 'sine', 0.3, 0.05); },
    ballsave() { arp([784, 988, 1175], 0.07, 'triangle', 0.2); },
    bonus() { arp([262, 330, 392, 523, 659, 784], 0.09, 'triangle', 0.16); },
    gameover() { [220, 208, 196, 165, 110].forEach((f, i) => bell(f, 0.2, i * 0.32, 1.4)); },
    start() { arp([196, 294, 392, 587], 0.09, 'triangle', 0.2); },
    serve() { noise(0.06, 1200, 1, 0.25); }
  };
  let lastKnock = 0;
  window.WHAudio = {
    unlock: ensure,
    play(e) {
      const AL = { shot: 'ramp', drone: 'standup', disc: 'spinner', denied: 'bankReset', kickback: 'eject', perfect: 'jackpot' };
      if (AL[e.type]) e = Object.assign({}, e, { type: AL[e.type] });
      if (muted || !ctx || !S[e.type]) return;
      if (e.type === 'knock') { const n = performance.now(); if (n - lastKnock < 40) return; lastKnock = n; }
      try { S[e.type](e); } catch (err) { /* sound is optional */ }
    },
    setMuted(m) { muted = m; }, isMuted: () => muted
  };
})();
