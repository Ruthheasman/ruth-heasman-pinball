/* Pinball jukebox — boot, table select, input, HUD, music and the frame loop. */
(function () {
  'use strict';
  const BUILD = '1.0.0';
  const $ = id => document.getElementById(id);
  const app = $('app'), hud = $('hud'), toastEl = $('toast');
  const startEl = $('start'), overEl = $('over'), playBtn = $('play'), againBtn = $('again'), launchBtn = $('launch'), posterEl = $('poster'), stripEl = $('strip'), music = $('music');
  const params = new URLSearchParams(location.search), debug = params.get('debug') === '1';
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  const THEMES = window.WHThemes;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no storage */ } } };
  // ?table=war picks a table, ?table=random picks any, ?tables=dread,war,paper picks one of those at random
  const pool = (params.get('tables') || '').split(',').map(x => THEMES.findIndex(t => t.id === x.trim())).filter(i => i >= 0);
  let idx = pool.length ? pool[Math.floor(Math.random() * pool.length)] : params.get('table') === 'random' ? Math.floor(Math.random() * THEMES.length)
    : Math.max(0, THEMES.findIndex(t => t.id === (params.get('table') || store.get('pinball-table'))));
  // events for a host page (rewards, leaderboards): a window 'pinball' event, and postMessage when embedded in a frame
  function tell(type, extra) {
    const detail = Object.assign({ source: 'ruth-heasman-pinball', type, table: theme.id, title: theme.title, score: game ? game.score : 0, ball: game ? Math.min(game.ballNum, game.maxBalls) : 0 }, extra || {});
    try { window.dispatchEvent(new CustomEvent('pinball', { detail })); if (window.parent && window.parent !== window) window.parent.postMessage(detail, '*'); } catch (e) { /* host not listening */ }
  }
  let theme = THEMES[idx], builtId = null, game = null, render = null, canvas = $('gl');
  let paused = false, time = 0, toastT = 0, bbMsg = '', ready = false, muted = false, looping = false;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hiKey = () => 'pinball-hi-' + theme.id;
  const hi = () => parseInt(store.get(hiKey()) || '0', 10) || 0;

  function toast(text, secs) { toastEl.textContent = text; toastEl.classList.add('on'); toastT = secs || 2.2; }
  function showHi() { const h = hi(); for (const el of document.querySelectorAll('.hi')) el.textContent = h ? 'HIGH SCORE ' + fmt(h) : 'NO HIGH SCORE YET'; }

  // ---- table select
  function select(i) {
    idx = (i + THEMES.length) % THEMES.length; theme = THEMES[idx]; store.set('pinball-table', theme.id);
    posterEl.style.backgroundImage = 'url(' + theme.art + ')'; posterEl.setAttribute('aria-label', theme.title);
    for (const b of stripEl.children) b.setAttribute('aria-pressed', String(b.dataset.id === theme.id));
    const cur = stripEl.children[idx]; if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    app.style.setProperty('--display', theme.type.display); app.style.setProperty('--dw', theme.type.weight ? '700' : '400'); app.dataset.type = theme.font;
    app.style.setProperty('--bone', theme.pal[0]); app.style.setProperty('--amber', theme.pal[1]); app.style.setProperty('--teal', theme.pal[2]);
    $('meterName').textContent = theme.w.meter; showHi();
  }
  THEMES.forEach((t, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'thumb'; b.dataset.id = t.id; b.id = 'thumb-' + t.id;
    b.style.backgroundImage = 'url(' + t.thumb + ')'; b.setAttribute('aria-label', t.title); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => select(i)); stripEl.appendChild(b);
  });
  $('prev').addEventListener('click', () => select(idx - 1)); $('next').addEventListener('click', () => select(idx + 1));

  function build() {
    return new Promise((res, rej) => {
      const img = new Image(); img.onload = () => {
        try {
          if (render) render.destroy();
          const fresh = document.createElement('canvas'); fresh.id = 'gl'; fresh.setAttribute('aria-label', theme.title + ' pinball table'); canvas.replaceWith(fresh); canvas = fresh;
          game = new window.WH.Pinball(undefined, theme.layout); game.highScore = hi();
          render = window.WHRender.init(canvas, game, img, theme); builtId = theme.id; sizeNow(); window.__dread = { game };
          res();
        } catch (err) { rej(err); }
      }; img.onerror = () => rej(new Error('The artwork for this table did not load.')); img.src = theme.art;
    });
  }
  function playMusic() {
    if (music.dataset.id !== theme.id) { music.dataset.id = theme.id; music.src = theme.track; }
    music.muted = muted; music.volume = 0.7; const p = music.play(); if (p && p.catch) p.catch(() => { /* no track for this table yet */ });
  }
  function start() {
    if (!ready) return;
    window.WHAudio.unlock(); playBtn.disabled = true; againBtn.disabled = true;
    const go = () => { startEl.hidden = true; overEl.hidden = true; paused = false; playBtn.disabled = false; againBtn.disabled = false; playBtn.textContent = 'Play'; game.start(); playMusic(); if (!looping) { looping = true; requestAnimationFrame(loop); } };
    if (builtId === theme.id) return go();
    playBtn.textContent = 'Loading';
    setTimeout(() => build().then(go).catch(err => { playBtn.disabled = false; playBtn.textContent = 'Play'; $('keys').textContent = 'This table could not start. ' + (err && err.message ? err.message : ''); }), 30);
  }
  function menu() { if (game) { game.state = 'attract'; game.balls.length = 0; for (const s of ['L', 'R']) game.setFlipper(s, false); } music.pause(); overEl.hidden = true; startEl.hidden = false; launchBtn.hidden = true; playBtn.focus(); }
  playBtn.addEventListener('click', start); againBtn.addEventListener('click', start);
  $('change').addEventListener('click', menu); $('tables').addEventListener('click', menu);

  function hudUpdate() {
    $('score').textContent = fmt(game.score);
    $('ball').textContent = Math.min(game.ballNum, game.maxBalls) + '/' + game.maxBalls;
    $('dread').textContent = game.witching > 0 ? 'FULL' : game.hour + '/12';
    $('dreadWrap').classList.toggle('hot', game.witching > 0);
    $('mult').textContent = '×' + game.mult;
  }
  function onEvent(e) {
    const w = theme.w;
    switch (e.type) {
      case 'start': toast(theme.title); bbMsg = ''; tell('start'); break;
      case 'witching': toast(w.full, 3); break;
      case 'bank': toast(e.gate ? 'Approved. The ramp is open.' : 'Lock is lit'); break;
      case 'shot': case 'saucer': if (e.label) toast(e.label + ' ' + fmt(e.points), 1.6); break;
      case 'denied': toast(e.why === 'gate' ? 'Computer says no. File forms 1 to 4.' : 'Wrong form. File number ' + e.next + '.', 1.8); break;
      case 'kickback': toast('Kickback'); break;
      case 'perfect': toast('In order. ' + fmt(e.points) + ' and the lock is lit.', 3); break;
      case 'lock': toast('Ball ' + e.n + ' locked'); break;
      case 'multiball': toast(w.mb + ' Multiball', 3.5); break;
      case 'jackpot': toast('Jackpot ' + fmt(e.points), 2.6); break;
      case 'ramp': toast('Ramp 3,000', 1.4); break;
      case 'moon': toast(w.set + ' · bonus ×' + e.mult); break;
      case 'crypt': toast(e.dice ? 'Rolled ' + e.dice[0] + ' and ' + e.dice[1] + ' · ' + fmt(e.points) : w.saucer + ' ' + fmt(e.points), e.dice ? 2.2 : 1.6); break;
      case 'ballsave': toast('Ball saved'); break;
      case 'bonus': toast(pick(w.drain) + ' Bonus ' + fmt(e.bonus), 3); tell('ballend', { bonus: e.bonus }); break;
      case 'gameover':
        tell('gameover', { score: e.score, highScore: Math.max(e.score, hi()) });
        if (e.score > hi()) store.set(hiKey(), String(e.score));
        $('overTitle').textContent = pick(w.over); $('final').textContent = fmt(e.score); showHi(); bbMsg = 'GAME OVER';
        setTimeout(() => { if (game.state === 'gameover' && startEl.hidden) { overEl.hidden = false; againBtn.focus(); } }, 1400);
        break;
    }
  }
  function lit(id, t) {
    const g = game, blink = hz => (Math.sin(t * hz * 6.283) > 0 ? 1 : 0.05);
    if (id === 'dreadGlow') return g.witching > 0 ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
    if (id.indexOf('dread') === 0) {
      const n = +id.slice(5);
      if (g.witching > 0) return (Math.floor(t * 10) + n) % 3 === 0 ? 1 : 0.3;
      if (g.state !== 'playing') return (Math.floor(t * 5) + 12 - n) % 12 < 3 ? 0.9 : 0.06;
      return n <= g.hour ? 1 : 0.05;
    }
    if (id.indexOf('mult') === 0) return g.mult >= +id.slice(4) ? 1 : 0.05;
    if (id === 'shoot') return g.saveTimer > 0 && g.state === 'playing' ? blink(3) : 0.04;
    if (id === 'inL' || id === 'inR') return g.laneLit[id] ? 1 : 0.05;
    if (id === 'ramp') return g.multiball ? blink(5) : 0.45 + 0.3 * Math.sin(t * 3);
    if (id === 'lockLit') return g.lockLit && !g.multiball ? blink(3) : 0.04;
    if (id === 'kick') return g.kickLit ? 1 : 0.05;
    if (id === 'lock1') return g.locks >= 1 ? 1 : 0.05;
    if (id === 'lock2') return g.locks >= 2 ? 1 : 0.05;
    if (id === 'bankL' || id === 'bankR' || id === 'bankU') return g.lockLit ? 0.1 : 0.4 + 0.3 * Math.sin(t * 4 + id.charCodeAt(4));
    return 0;
  }

  // ---- input
  const playing = () => game && game.state === 'playing';
  const KEYS = { ArrowLeft: 'L', KeyZ: 'L', KeyA: 'L', ShiftLeft: 'L', ArrowRight: 'R', Slash: 'R', KeyL: 'R', KeyM: 'R', ShiftRight: 'R' };
  window.addEventListener('keydown', e => {
    const inMenu = !startEl.hidden, launchKey = e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter';
    if (e.repeat) { if (KEYS[e.code] || launchKey) e.preventDefault(); return; }
    if (inMenu) {
      if (e.code === 'ArrowLeft') { select(idx - 1); e.preventDefault(); } else if (e.code === 'ArrowRight') { select(idx + 1); e.preventDefault(); }
      else if (launchKey && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); start(); }
      return;
    }
    if (KEYS[e.code]) { if (game) game.setFlipper(KEYS[e.code], true); e.preventDefault(); }
    else if (launchKey) {
      if (!playing()) { if (!overEl.hidden && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); start(); } return; }
      e.preventDefault(); game.plungeStart();
    } else if (e.code === 'KeyP' && playing()) { paused = !paused; if (paused) { toast('Paused', 9999); music.pause(); } else { toastT = 0.01; playMusic(); } }
    else if (e.code === 'Escape') menu();
  });
  window.addEventListener('keyup', e => {
    if (!game) return;
    if (KEYS[e.code]) game.setFlipper(KEYS[e.code], false);
    else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') game.plungeRelease();
  });
  const touches = new Map();
  const refreshTouch = () => { let L = false, Rr = false; for (const s of touches.values()) { if (s === 'L') L = true; else Rr = true; } if (game) { game.setFlipper('L', L); game.setFlipper('R', Rr); } };
  app.addEventListener('pointerdown', e => {
    if (paused) { paused = false; toastT = 0.01; playMusic(); }
    if (e.target.closest('button') || !playing()) return;
    window.WHAudio.unlock(); e.preventDefault();
    touches.set(e.pointerId, e.clientX < app.clientWidth / 2 ? 'L' : 'R'); refreshTouch();
  });
  const up = e => { if (touches.delete(e.pointerId)) refreshTouch(); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  app.addEventListener('contextmenu', e => e.preventDefault());
  launchBtn.addEventListener('pointerdown', e => { e.preventDefault(); window.WHAudio.unlock(); launchBtn.classList.add('down'); if (game) game.plungeStart(); try { launchBtn.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } });
  const lUp = () => { launchBtn.classList.remove('down'); if (game) game.plungeRelease(); };
  launchBtn.addEventListener('pointerup', lUp); launchBtn.addEventListener('pointercancel', lUp);
  $('mute').addEventListener('click', () => { muted = !muted; window.WHAudio.setMuted(muted); music.muted = muted; $('mute').textContent = muted ? '♪ off' : '♪ on'; $('mute').setAttribute('aria-pressed', String(muted)); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing() && !paused) { paused = true; music.pause(); toast('Paused. Press P or tap.', 9999); } });

  // ---- loop
  let last = 0, fps = 60, ms = 16;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    ms += (dt * 1000 - ms) * 0.05; fps = 1000 / ms;
    if (!startEl.hidden || !render) return;
    if (!paused) game.update(dt);
    for (const e of game.events) { render.fx(e); window.WHAudio.play(e); onEvent(e); }
    game.events.length = 0;
    if (toastT > 0 && toastT < 9000) { toastT -= dt; if (toastT <= 0) toastEl.classList.remove('on'); }
    hudUpdate();
    const inLane = playing() && game.ballInLane();
    if (launchBtn.hidden === inLane) launchBtn.hidden = !inLane;
    if (inLane) { const pw = Math.round(game.plungePower() * 100); launchBtn.style.setProperty('--p', pw); launchBtn.classList.toggle('full', pw >= 100); }
    const ballLabel = playing() ? 'BALL ' + Math.min(game.ballNum, game.maxBalls) + (game.multiball ? '  MULTIBALL' : game.witching > 0 ? '  ' + theme.w.meter.toUpperCase() + ' FULL' : '') : '';
    render.frame(dt, time, lit, { score: game.score, ball: ballLabel, msg: playing() ? '' : bbMsg });
    if (debug) {
      const b = game.balls[0], i = render.info();
      $('canary').textContent = 'fps ' + fps.toFixed(0) + '  ' + ms.toFixed(1) + 'ms\ntable ' + theme.id + '  state ' + game.state + (paused ? ' (paused)' : '') + '  balls ' + game.balls.length +
        '\nball0 ' + (b ? b.x.toFixed(2) + ', ' + b.y.toFixed(2) + ' L' + b.layer : '-') + '\nquality ' + i.stage + '  bloom ' + i.bloom + '  dpr ' + i.pr + '\nbuild ' + BUILD;
    }
  }
  function sizeNow() {
    const top = hud.offsetHeight;
    app.style.setProperty('--hud-height', top + 'px');
    app.style.setProperty('--toast-top', (top + 10) + 'px');
    if (render) render.resize(app.clientWidth, Math.max(1, app.clientHeight - top), 0);
  }
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(sizeNow);
    observer.observe(app); observer.observe(hud);
  } else window.addEventListener('resize', sizeNow);
  sizeNow();

  // ---- boot
  select(idx);
  const fonts = (document.fonts && document.fonts.load) ? Promise.all(['40px "Griffy"', '40px "IM Fell English SC"', '700 40px "Orbitron"', '40px "Special Elite"', '700 40px "Cinzel"'].map(f => document.fonts.load(f).catch(() => null))) : Promise.resolve();
  Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]).then(() => {
    if (!window.THREE) { playBtn.textContent = 'No 3D'; $('keys').textContent = 'The 3D library did not load, so the tables cannot start.'; return; }
    ready = true; playBtn.disabled = false; playBtn.textContent = 'Play';
    if (debug) $('canary').hidden = false;
    if (params.get('autostart') === '1') start();
  });
})();
