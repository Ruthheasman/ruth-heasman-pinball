/* Existential Dread — Three.js cabinet. */
(function () {
  'use strict';
  const { R, H, L1, RAMP, EDGE } = window.WH;
  const A = window.WHArt;
  const LIN = h => new THREE.Color(h).convertSRGBToLinear();
  const V = (x, y, h) => new THREE.Vector3(x - 10, h || 0, 20.5 - y);

  function buildInserts(theme) {
    const CA = theme.pal[1], CB = theme.pal[2];
    const L = [];
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; L.push({ id: 'dread' + i, x: 9.4 + 3.92 * Math.sin(a), y: 14.2 + 3.92 * Math.cos(a), level: 0, r: 0.34, color: CA }); }
    for (let i = 0; i < 4; i++) L.push({ id: 'mult' + (i + 2), x: 7.3 + i * 1.4, y: 10.1, level: 0, r: 0.3, color: CB });
    L.push({ id: 'shoot', x: 9.4, y: 3.15, level: 0, r: 0.4, color: CA });
    L.push({ id: 'inL', x: 2.47, y: 9.4, level: 0, r: 0.3, color: CB }, { id: 'inR', x: 16.33, y: 9.4, level: 0, r: 0.3, color: CB });
    L.push({ id: 'ramp', x: 17.05, y: 20.9, level: 0, r: 0.4, color: CA });
    L.push({ id: 'bankL', x: 3.75, y: 14.0, level: 0, r: 0.3, color: CA }, { id: 'bankR', x: 15.05, y: 14.0, level: 0, r: 0.3, color: CA });
    L.push({ id: 'lockLit', x: 4.3, y: 33.2, level: 1, r: 0.38, color: CB });
    L.push({ id: 'lock1', x: 1.75, y: 36.3, level: 1, r: 0.3, color: CB }, { id: 'lock2', x: 2.75, y: 37.2, level: 1, r: 0.3, color: CB });
    if (theme.layout.upperBank !== false) L.push({ id: 'bankU', x: 14.75, y: 36.3, level: 1, r: 0.3, color: CA });
    if (theme.layout.kickback) L.push({ id: 'kick', x: 1.22, y: 10.2, level: 0, r: 0.3, color: CA });
    L.push({ id: 'dreadGlow', x: 9.4, y: 14.2, level: 0, r: 3.2, color: CA, noSocket: true, soft: true });
    return L;
  }

  function init(canvas, game, img, theme) {
    A.use(theme);
    const PA = new THREE.Color(theme.pal[1]).convertSRGBToLinear(), PB = new THREE.Color(theme.pal[2]).convertSRGBToLinear();
    const params = new URLSearchParams(location.search);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const T = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAniso; return t; };
    try {
      const pm = new THREE.PMREMGenerator(renderer), e = new THREE.CanvasTexture(A.env());
      e.mapping = THREE.EquirectangularReflectionMapping; e.encoding = THREE.sRGBEncoding;
      scene.environment = pm.fromEquirectangular(e).texture;
    } catch (err) { /* reflections are optional */ }

    const inserts = buildInserts(theme);
    const M = {
      iron: new THREE.MeshStandardMaterial({ color: LIN(0x222a31), metalness: 0.85, roughness: 0.42, envMapIntensity: 0.45 }),
      chrome: new THREE.MeshStandardMaterial({ color: LIN(0xdfe8ee), metalness: 1, roughness: 0.14 }),
      bone: new THREE.MeshStandardMaterial({ color: LIN(0xcfc8ae), metalness: 0, roughness: 0.55, envMapIntensity: 0.4 }),
      rubber: new THREE.MeshStandardMaterial({ color: LIN(0xd9d2b8), metalness: 0, roughness: 0.8 }),
      black: new THREE.MeshStandardMaterial({ color: LIN(0x06090d), metalness: 0.2, roughness: 0.7 }),
      wood: new THREE.MeshStandardMaterial({ map: T(A.wood()), metalness: 0.1, roughness: 0.55 })
    };
    M.wood.map.wrapS = M.wood.map.wrapT = THREE.RepeatWrapping; M.wood.map.repeat.set(4, 1);
    const add = (m, cast, recv) => { m.castShadow = cast !== false; m.receiveShadow = recv !== false; scene.add(m); return m; };

    function wall(ax, ay, bx, by, h0, h1, height, thick, mat) {
      const len = Math.hypot(bx - ax, by - ay), rise = h1 - h0, Lg = Math.hypot(len, rise);
      const m = new THREE.Mesh(new THREE.BoxGeometry(Lg, height, thick), mat);
      m.position.copy(V((ax + bx) / 2, (ay + by) / 2, (h0 + h1) / 2 + height / 2));
      m.rotation.order = 'YZX'; m.rotation.y = Math.atan2(by - ay, bx - ax); m.rotation.z = Math.atan2(rise, len);
      return add(m);
    }
    function quad(p, mat, uv) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([].concat(...p.map(v => [v.x, v.y, v.z])), 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv || [0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
      return add(new THREE.Mesh(g, mat), false, true);
    }
    function post(x, y, base, h, r, lit) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), M.bone); p.position.copy(V(x, y, base + h / 2)); add(p);
      if (lit) { const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.8, 12, 10), new THREE.MeshBasicMaterial({ color: PA.clone() })); b.position.copy(V(x, y, base + h + r * 0.3)); scene.add(b); bulbs.push(b); }
    }
    const bulbs = [];

    // ---- floors
    const lowerTex = T(A.lower(img, inserts, theme, game.t)), upperTex = T(A.upper(img, inserts, theme, game.t));
    const pfMat = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0, envMapIntensity: 0.35 });
    const lowerFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 26), pfMat(lowerTex));
    lowerFloor.rotation.x = -Math.PI / 2; lowerFloor.position.copy(V(10, 13, 0)); add(lowerFloor, false, true);
    {
      const sh = new THREE.Shape();
      sh.moveTo(0.6, EDGE); sh.lineTo(RAMP.x0, EDGE); sh.lineTo(RAMP.x0, RAMP.y1); sh.lineTo(18.2, RAMP.y1); sh.lineTo(18.2, 32); sh.lineTo(19.4, 32);
      for (let i = 1; i <= 48; i++) { const a = Math.PI * i / 48; sh.lineTo(10 + 9.4 * Math.cos(a), 32 + 9.4 * Math.sin(a)); }
      sh.closePath();
      const g = new THREE.ShapeGeometry(sh), uv = g.attributes.uv, pos = g.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 20, (pos.getY(i) - 26) / 15.6);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, pfMat(upperTex)); m.position.set(-10, H, 20.5); add(m, true, true);
    }
    {
      const under = new THREE.Mesh(new THREE.BoxGeometry(21.6, 3, 44.5), M.black); under.position.set(0, -1.52, -0.3); scene.add(under);
    }
    // front face of the upper level
    const faceM = new THREE.Mesh(new THREE.PlaneGeometry(15.3, H), new THREE.MeshStandardMaterial({ map: T(A.face(theme)), roughness: 0.5, metalness: 0.3 }));
    faceM.position.copy(V(8.25, EDGE, H / 2)); add(faceM, false, true);
    // shooter lane slope and ramp
    quad([V(18.2, 20, 0.01), V(19.4, 20, 0.01), V(19.4, 32, H), V(18.2, 32, H)], M.iron);
    const rampMat = new THREE.MeshStandardMaterial({ color: PB.clone().multiplyScalar(0.6), transparent: true, opacity: 0.38, roughness: 0.3, metalness: 0, envMapIntensity: 0.25, emissive: PB.clone().multiplyScalar(0.25), emissiveIntensity: 0.5, side: THREE.DoubleSide });
    quad([V(RAMP.x0, RAMP.y0, 0.02), V(18.2, RAMP.y0, 0.02), V(18.2, RAMP.y1, H), V(RAMP.x0, RAMP.y1, H)], rampMat);

    // ---- cabinet
    const sideH = H + 1.5;
    for (const x of [0.2, 19.8]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, sideH + 0.5, 43), M.wood); m.position.copy(V(x, 20.8, sideH / 2 - 0.25)); add(m); }
    { const m = new THREE.Mesh(new THREE.BoxGeometry(20.4, sideH + 0.5, 0.8), M.wood); m.position.copy(V(10, 42.2, sideH / 2 - 0.25)); add(m); }
    {
      const sh = new THREE.Shape(); sh.moveTo(-0.2, 32); sh.lineTo(0.6, 32);
      for (let i = 47; i >= 0; i--) { const a = Math.PI * i / 48; sh.lineTo(10 + 9.4 * Math.cos(a), 32 + 9.4 * Math.sin(a)); }
      sh.lineTo(20.2, 32); sh.lineTo(20.2, 42.2); sh.lineTo(-0.2, 42.2); sh.closePath();
      const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, M.black); m.position.set(-10, sideH, 20.5); add(m, true, true);
    }
    { const m = new THREE.Mesh(new THREE.BoxGeometry(21.2, 1.0, 0.9), M.chrome); m.position.copy(V(10, -0.45, 0.3)); add(m); }
    {
      const side = M.black, top = new THREE.MeshStandardMaterial({ map: T(A.apron(theme)), color: LIN(0xb8b8b8), roughness: 0.45, metalness: 0.2 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.6, 2.5), [side, side, top, side, side, side]);
      m.position.copy(V(9.4, 1.25, 0.3)); m.rotation.x = 0.06; add(m);
      const m2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.5), side); m2.position.copy(V(18.8, 0.75, 0.3)); add(m2);
    }
    // backglass
    const headY = sideH + 0.4, bgH = 12.75, bgW = 20.4;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(bgW, bgH), new THREE.MeshBasicMaterial({ map: T(A.backglass(img, theme)), color: LIN(0xd8d8d8) }));
    bg.position.copy(V(10, 42.7, headY + bgH / 2)); scene.add(bg);
    { const m = new THREE.Mesh(new THREE.BoxGeometry(bgW + 1.2, bgH + 1.2, 1.2), M.black); m.position.copy(V(10, 43.35, headY + bgH / 2)); scene.add(m); }
    const scoreCanvas = A.scorePanel(null, 0, '', '');
    const scoreTex = T(scoreCanvas);
    const scoreMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.15, 1.48), new THREE.MeshBasicMaterial({ map: scoreTex }));
    scoreMesh.position.copy(V(10, 42.66, headY + bgH * (1 - 0.908))); scene.add(scoreMesh);
    let lastScoreKey = '';

    // ---- walls from the physics table
    const dropMeshes = [], standMeshes = [];
    const dropTex = { bat: T(A.targetFace('bat', theme)), moon: T(A.targetFace('moon', theme)) };
    const wire = (s, base) => wall(s.ax, s.ay, s.bx, s.by, base, base, 0.5, 0.11, M.chrome);
    for (const s of game.t.segs) {
      const base = s.mask === L1 ? H : 0;
      if (s.kind === 'drop') {
        const len = Math.hypot(s.bx - s.ax, s.by - s.ay);
        const f = new THREE.MeshStandardMaterial({ map: s.ref.num ? T(A.targetFace(s.ref.num, theme)) : dropTex[s.ref.bank === 'upper' ? 'moon' : 'bat'], roughness: 0.5 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.9, 0.16), [M.bone, M.bone, M.bone, M.bone, f, f]);
        m.position.copy(V((s.ax + s.bx) / 2, (s.ay + s.by) / 2, base + 0.45)); m.rotation.y = Math.atan2(s.by - s.ay, s.bx - s.ax); add(m);
        dropMeshes.push({ d: s.ref, m, up: base + 0.45, y: base + 0.45 });
      } else if (s.kind === 'standup') {
        const mats = { off: new THREE.MeshStandardMaterial({ map: T(A.letter(s.ref.letter, false, theme)), roughness: 0.5 }), on: new THREE.MeshBasicMaterial({ map: T(A.letter(s.ref.letter, true, theme)) }) };
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.2), [M.iron, M.iron, M.iron, M.iron, mats.off, M.iron]);
        m.position.copy(V((s.ax + s.bx) / 2, EDGE - 0.08, 0.6)); add(m);
        standMeshes.push({ t: s.ref, m, mats });
      } else if (s.kind === 'gate') {
        wall(s.ax, s.ay, s.bx, s.by, base + 0.55, base + 0.55, 0.06, 0.06, M.chrome);
      } else if (s.kind === 'sling' || s.tag === 'slingSide') {
        wall(s.ax, s.ay, s.bx, s.by, 0.22, 0.22, 0.3, 0.13, M.rubber);
        post(s.ax, s.ay, 0, 0.72, 0.2, true);
      } else if (s.tag === 'arch') {
        wall(s.ax, s.ay, s.bx, s.by, H, H, 1.5, 0.3, M.iron);
      } else if (s.tag === 'laneGuide' || s.tag === 'backstop' || s.tag === 'upGuide') {
        wire(s, base);
      } else if (s.tag === 'bankBack') {
        wall(s.ax, s.ay, s.bx, s.by, base, base, 0.8, 0.16, M.iron);
      } else if (s.tag === 'rampRail') {
        wall(s.ax, s.ay, s.bx, s.by, 0, H, 0.75, 0.1, M.chrome);
      } else if (s.tag === 'laneWall') {
        wall(18.2, 0, 18.2, 20, 0, 0, 0.9, 0.12, M.iron); wall(18.2, 20, 18.2, 32, 0, H, 0.9, 0.12, M.iron);
      }
    }
    for (const p of [[1.1, 31.6], [15.4, 31.3], [4.6, 40.2], [15.4, 40.2], [10, 41.0]]) post(p[0], p[1], H, 0.6, 0.16, true);
    for (const p of [[1.0, 20.0], [1.0, 12.2], [17.8, 12.2]]) post(p[0], p[1], 0, 0.6, 0.16, true);

    // sling plastics
    const slingPl = {};
    for (const m of [0, 1]) {
      const X = x => m ? 18.8 - x : x, sh = new THREE.Shape();
      sh.moveTo(X(3.1), 11.2); sh.lineTo(X(3.1), 7.5); sh.lineTo(X(5.2), 6.4); sh.closePath();
      const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: PA.clone().multiplyScalar(0.55), transparent: true, opacity: 0.8, roughness: 0.3, envMapIntensity: 0.3, emissive: PA.clone(), emissiveIntensity: 0.12, side: THREE.DoubleSide });
      const me = new THREE.Mesh(g, mat); me.position.set(-10, 0.74, 20.5); add(me, true, false);
      slingPl[m ? 'slingR' : 'slingL'] = { mat, v: 0 };
    }

    // flippers
    const flipMeshes = game.t.flippers.map(f => {
      const outline = (rb, rt) => { const s = new THREE.Shape(); s.absarc(0, 0, rb, Math.PI / 2, Math.PI * 1.5, false); s.lineTo(f.len, -rt); s.absarc(f.len, 0, rt, -Math.PI / 2, Math.PI / 2, false); s.closePath(); return s; };
      const grp = new THREE.Group();
      const g1 = new THREE.ExtrudeGeometry(outline(f.r + 0.1, f.r - 0.03), { depth: 0.36, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 14 }); g1.rotateX(-Math.PI / 2);
      const body = new THREE.Mesh(g1, M.bone); body.position.y = 0.14; body.castShadow = true; grp.add(body);
      const g2 = new THREE.ExtrudeGeometry(outline(f.r + 0.2, f.r + 0.07), { depth: 0.26, bevelEnabled: false, curveSegments: 14 }); g2.rotateX(-Math.PI / 2);
      const band = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ color: PA.clone().multiplyScalar(0.9), roughness: 0.7 })); band.position.y = 0.12; band.castShadow = true; grp.add(band);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), M.chrome); cap.position.y = 0.6; grp.add(cap);
      grp.position.copy(V(f.px, f.py, f.level ? H : 0)); scene.add(grp);
      return { f, grp };
    });

    // bumpers
    const capTex = { eye: T(A.eyeCap(0.78, 0)), spiral: T(A.spiralCap(theme.pal[0])), spiral2: T(A.spiralCap(theme.pal[1])), vinyl: T(A.vinylCap(theme.pal[1])) };
    const bumpMeshes = {}, droneMeshes = [];
    for (const c of game.t.circs) {
      if (c.kind === 'drone') {
        const grp = new THREE.Group(), base = c.level ? H : 0;
        if (theme.layout.droneStyle === 'bat') {
          const dark = new THREE.MeshStandardMaterial({ color: LIN(0x2b2540), roughness: 0.75, side: THREE.DoubleSide }); grp.scale.setScalar(1.25);
          const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), dark); body.scale.set(0.8, 0.8, 1.25); body.position.y = 0.85; body.castShadow = true; grp.add(body);
          for (const sx of [-0.12, 0.12]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), dark); ear.position.set(sx, 1.08, 0.2); grp.add(ear); }
          const wsh = new THREE.Shape(); wsh.moveTo(0, 0.22); wsh.quadraticCurveTo(0.6, 0.5, 1.15, 0.3); wsh.quadraticCurveTo(0.98, 0.1, 0.98, -0.12); wsh.quadraticCurveTo(0.8, 0.04, 0.66, -0.18); wsh.quadraticCurveTo(0.5, 0.0, 0.34, -0.22); wsh.quadraticCurveTo(0.2, -0.04, 0, -0.2); wsh.closePath();
          const wg = new THREE.ShapeGeometry(wsh); wg.rotateX(-Math.PI / 2);
          const wings = [1, -1].map(sx => { const piv = new THREE.Group(); piv.position.set(sx * 0.15, 0.88, 0); const wm = new THREE.Mesh(wg, dark); wm.scale.x = sx; wm.castShadow = true; piv.add(wm); grp.add(piv); return piv; });
          const eye = new THREE.Group(); for (const sx of [-0.1, 0.1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: PA.clone() })); e.position.set(sx, 0, 0); eye.add(e); } eye.position.set(0, 0.93, 0.3); grp.add(eye);
          grp.position.copy(V(c.x, c.y, base)); scene.add(grp); droneMeshes.push({ c, grp, eye, base, wings }); continue;
        }
        const body = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 0.55, c.r * 0.7, 0.3, 16), M.iron); body.position.y = 0.75; body.castShadow = true; grp.add(body);
        for (const q of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const rot = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 0.42, c.r * 0.42, 0.05, 14), M.black); rot.position.set(q[0] * c.r * 0.72, 0.92, q[1] * c.r * 0.72); rot.castShadow = true; grp.add(rot); }
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: PA.clone() })); eye.position.y = 0.95; grp.add(eye);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, 0.5, 18), new THREE.MeshStandardMaterial({ color: PA.clone().multiplyScalar(0.5), transparent: true, opacity: 0.35 })); stem.position.y = 0.25; grp.add(stem);
        grp.position.copy(V(c.x, c.y, base)); scene.add(grp); droneMeshes.push({ c, grp, eye, base }); continue;
      }
      if (c.kind === 'post') { const pm = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, 0.7, 20), M.rubber); pm.position.copy(V(c.x, c.y, 0.35)); add(pm); const cp = new THREE.Mesh(new THREE.SphereGeometry(c.r * 0.55, 14, 10), new THREE.MeshBasicMaterial({ color: PB.clone() })); cp.position.copy(V(c.x, c.y, 0.78)); scene.add(cp); continue; }
      const base = c.level ? H : 0, grp = new THREE.Group(); grp.position.copy(V(c.x, c.y, base));
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 1.04, c.r * 1.08, 0.14, 28), M.iron); skirt.position.y = 0.07; skirt.castShadow = true; grp.add(skirt);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 0.6, c.r * 0.66, 0.7, 20), M.bone); body.position.y = 0.45; body.castShadow = true; grp.add(body);
      const isEye = c.cap === 'eye', tex = capTex[c.cap] || capTex.spiral;
      const top = new THREE.MeshStandardMaterial({ map: tex, emissive: LIN(0xffffff), emissiveMap: tex, emissiveIntensity: 0.22, roughness: 0.25 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(c.r * 1.1, c.r * 1.02, 0.26, 32), [M.iron, top, M.iron]); cap.position.y = 0.93; cap.castShadow = true; grp.add(cap);
      scene.add(grp); bumpMeshes[c.id] = { c, grp, cap, top, v: 0, isEye, yaw: 0 };
    }
    // a silhouette that flies to and fro above the table (decoration only, the ball passes underneath)
    let flyer = null;
    if (theme.layout.flyer) {
      const F = theme.layout.flyer, tex = T(A.witch());
      const m = new THREE.Mesh(new THREE.PlaneGeometry(F.size, F.size * 0.625), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); m.renderOrder = 5;
      m.rotation.x = -Math.PI / 2 + 0.25; m.castShadow = true;
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
      scene.add(m); flyer = { m, F };
    }
    // spinning disc and the NO gate
    let discMesh = null, gateMesh = null;
    if (game.t.disc) {
      const d = game.t.disc; discMesh = new THREE.Mesh(new THREE.CircleGeometry(d.r, 48), new THREE.MeshStandardMaterial({ map: T(A.vinylCap(theme.pal[1])), roughness: 0.35, metalness: 0.2 }));
      discMesh.rotation.x = -Math.PI / 2; discMesh.position.copy(V(d.x, d.y, 0.03)); discMesh.receiveShadow = true; scene.add(discMesh);
    }
    if (game.t.gate) {
      const s = game.t.gate; gateMesh = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(s.bx - s.ax), 0.8, 0.16), new THREE.MeshStandardMaterial({ color: LIN(0xff3b30), emissive: LIN(0xff3b30), emissiveIntensity: 0.6, roughness: 0.4 }));
      gateMesh.position.copy(V((s.ax + s.bx) / 2, s.ay, 0.4)); gateMesh.castShadow = true; scene.add(gateMesh);
    }
    // saucers
    for (const s of game.t.saucers) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(s.r + 0.05, 0.07, 8, 28), M.chrome); ring.rotation.x = Math.PI / 2; ring.position.copy(V(s.x, s.y, (s.level ? H : 0) + 0.05)); add(ring, false, false);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(s.r, 24), new THREE.MeshBasicMaterial({ color: LIN(0x010203) })); hole.rotation.x = -Math.PI / 2; hole.position.copy(V(s.x, s.y, (s.level ? H : 0) + 0.012)); scene.add(hole);
    }
    // locked balls shown beside the lock
    const ballGeo = new THREE.SphereGeometry(R, 36, 24);
    const ballMat = new THREE.MeshStandardMaterial({ color: LIN(0xffffff), metalness: 1, roughness: 0.07, envMapIntensity: 1.6 });
    const lockedBalls = [[1.75, 36.3], [2.75, 37.2]].map(p => { const m = new THREE.Mesh(ballGeo, ballMat); m.position.copy(V(p[0], p[1], H + R)); m.visible = false; add(m, true, false); return m; });
    const ballMeshes = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(ballGeo, ballMat); m.visible = false; add(m, true, false); return m; });
    // plunger and spinner
    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 14), M.chrome); plunger.rotation.x = Math.PI / 2; add(plunger);
    const spinner = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.05), new THREE.MeshStandardMaterial({ color: PA.clone(), metalness: 0.6, roughness: 0.3, emissive: PA.clone(), emissiveIntensity: 0.3 }));
    spinner.position.copy(V(17.05, 22.4, 0.95)); add(spinner); let spinV = 0;

    // inserts
    const softTex = (() => { const c = A.canvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    const insertMeshes = {};
    for (const it of inserts) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(it.color).convertSRGBToLinear(), map: softTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
      const m = new THREE.Mesh(new THREE.CircleGeometry(it.r * (it.soft ? 1 : 1.5), 24), mat); m.rotation.x = -Math.PI / 2;
      m.position.copy(V(it.x, it.y, (it.level ? H : 0) + 0.02)); scene.add(m); insertMeshes[it.id] = { it, mat, cur: 0 };
    }

    // ---- lights
    scene.add(new THREE.HemisphereLight(0xa9cfe6, 0x0a1016, 0.85));
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.2); sun.position.set(-9, 36, 26); sun.target.position.set(0, 0, -2); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 30, bottom: -30, near: 5, far: 110 }); scene.add(sun);
    const warm = new THREE.PointLight(new THREE.Color(theme.pal[1]).lerp(new THREE.Color(0xffd0a0), 0.45), 0.9, 30); warm.position.copy(V(10, 34, 7)); scene.add(warm);
    const cool = new THREE.PointLight(new THREE.Color(theme.pal[2]), 0.55, 26); cool.position.copy(V(10, 9, 6)); scene.add(cool);
    let flash = 0;

    // ---- camera
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 400);
    const shake = new THREE.Vector3(); let camBase = new THREE.Vector3(), camTarget = new THREE.Vector3();
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function fit(w, h, topPx) {
      const aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
      const wide = aspect > 0.95, el = (wide ? 40 : 60) * Math.PI / 180;
      const pts = [];
      for (const x of [-10.7, 10.7]) { pts.push(new THREE.Vector3(x, 0, 21.4), new THREE.Vector3(x, sideH, -21.9), new THREE.Vector3(x, sideH, 21), new THREE.Vector3(x, headY + bgH + 0.5, -22.6)); }
      const top = 1 - 2 * topPx / h, v = new THREE.Vector3();
      const ok = (tz, d) => {
        camera.position.set(0, Math.sin(el) * d, tz + Math.cos(el) * d); camera.lookAt(0, wide ? 5 : 1.5, tz); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
        for (const p of pts) { v.copy(p).project(camera); if (Math.abs(v.x) > 0.97 || v.y < -0.96 || v.y > top) return false; }
        return true;
      };
      let best = null;
      for (let tz = -12; tz <= 8; tz += 0.5) {
        let lo = 20, hi = 260; if (!ok(tz, hi)) continue;
        for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(tz, mid)) hi = mid; else lo = mid; }
        if (!best || hi < best.d) best = { tz, d: hi };
      }
      if (!best) best = { tz: 0, d: 120 };
      camBase.set(0, Math.sin(el) * best.d, best.tz + Math.cos(el) * best.d); camTarget.set(0, wide ? 5 : 1.5, best.tz);
      camera.position.copy(camBase); camera.lookAt(camTarget);
    }

    // ---- post-processing
    let composer = null, bloom = null, bloomOff = false;
    const wantBloom = params.get('bloom') !== '0';
    function makeComposer(w, h) {
      if (!wantBloom || !THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.ShaderPass || !THREE.GammaCorrectionShader) return;
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.35, 0.86); composer.addPass(bloom);
      composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    }
    let W = 1, Hh = 1;
    function resize(w, h, topPx) {
      W = w; Hh = h; renderer.setPixelRatio(pixelRatio); renderer.setSize(w, h, false);
      if (!composer && wantBloom && !bloomOff) makeComposer(w, h);
      if (composer) { composer.setPixelRatio(pixelRatio); composer.setSize(w, h); }
      fit(w, h, topPx || 0);
    }

    // ---- per-event effects
    function fx(e) {
      if (e.type === 'bumper') { const b = bumpMeshes[e.id]; if (b) b.v = 1; if (!reduceMotion) shake.set((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25); }
      else if (e.type === 'sling') { const s = slingPl[e.id]; if (s) s.v = 1; }
      else if (e.type === 'spinner') spinV = Math.min(60, 8 + e.speed);
      else if (e.type === 'multiball' || e.type === 'witching' || e.type === 'jackpot') flash = 1;
      else if (e.type === 'bank' || e.type === 'lock' || e.type === 'moon') flash = Math.max(flash, 0.5);
    }

    // ---- frame
    let slow = 0, frames = 0, stage = 0;
    function frame(dt, time, lit, ui) {
      for (const fm of flipMeshes) fm.grp.rotation.y = fm.f.angle;
      for (let i = 0; i < ballMeshes.length; i++) {
        const b = game.balls[i], m = ballMeshes[i];
        if (!b) { m.visible = false; continue; }
        m.visible = true; m.position.copy(V(b.x, b.y, game.ballHeight(b) + R + (b.held ? -0.22 : 0)));
      }
      lockedBalls.forEach((m, i) => { m.visible = game.locks > i && !game.multiball; });
      for (const d of dropMeshes) { const tgt = d.d.down ? d.up - 0.98 : d.up; d.y += (tgt - d.y) * Math.min(1, dt * (d.d.down ? 26 : 10)); d.m.position.y = d.y; }
      const nextLetter = game.layout.seq && game.seqOk ? game.t.standups.findIndex(x => !x.lit) : -1;
      for (const s of standMeshes) { const want = s.t.lit || (s.t.idx === nextLetter && Math.sin(time * 9) > 0) ? s.mats.on : s.mats.off; if (s.m.material[4] !== want) s.m.material[4] = want; }
      for (const d of droneMeshes) if (d.wings) { const f = 0.15 + 0.55 * Math.sin(time * 11 + d.c.phase); d.wings[0].rotation.z = f; d.wings[1].rotation.z = -f; }
      for (const d of droneMeshes) { d.grp.position.copy(V(d.c.x, d.c.y, d.base)); d.grp.position.y += 0.08 * Math.sin(time * 5 + d.c.phase); d.eye.scale.setScalar(game.time - (d.c.hit || -9) < 0.25 ? 2.6 : 1); }
      if (discMesh) discMesh.rotation.z = game.t.disc.angle;
      if (flyer) { const F = flyer.F, a = time * F.speed, mid = (F.x0 + F.x1) / 2, amp = (F.x1 - F.x0) / 2; flyer.m.position.copy(V(mid + amp * Math.sin(a), F.y + 0.5 * Math.sin(a * 2.3), H + F.h + 0.25 * Math.sin(time * 2.1))); flyer.m.scale.x = Math.cos(a) >= 0 ? 1 : -1; }
      if (gateMesh) { const tgt = game.t.gate.active ? 0.4 : -0.45; gateMesh.position.y += (tgt - gateMesh.position.y) * Math.min(1, dt * 10); }
      let near = null;
      for (const id in bumpMeshes) {
        const b = bumpMeshes[id]; b.v = Math.max(0, b.v - dt * 5);
        b.top.emissiveIntensity = 0.22 + b.v * 1.5; b.cap.position.y = 0.93 - b.v * 0.14; b.grp.scale.setScalar(1 + b.v * 0.05);
        if (b.isEye) {
          near = null; let nd = 1e9;
          for (const ball of game.balls) { const d = Math.hypot(ball.x - b.c.x, ball.y - b.c.y); if (d < nd) { nd = d; near = ball; } }
          const want = near ? Math.atan2(near.x - b.c.x, -(near.y - b.c.y)) : Math.sin(time * 0.6 + b.c.x) * 0.9;
          let dy = want - b.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
          b.yaw += dy * Math.min(1, dt * 7); b.cap.rotation.y = b.yaw;
        } else b.cap.rotation.y += dt * (0.6 + b.v * 14);
      }
      for (const id in slingPl) { const s = slingPl[id]; s.v = Math.max(0, s.v - dt * 6); s.mat.emissiveIntensity = 0.12 + s.v * 2.4; }
      for (const id in insertMeshes) { const m = insertMeshes[id]; const t = lit(id, time); m.cur += (t - m.cur) * Math.min(1, dt * 18); m.mat.opacity = m.cur * (m.it.soft ? 0.55 : 1); }
      const pp = game.plungePower(); plunger.position.copy(V(18.8, 0.55 - pp * 0.85, 0.45));
      spinV *= Math.max(0, 1 - dt * 1.6); spinner.rotation.x += spinV * dt;
      flash = Math.max(0, flash - dt * 1.8);
      const dread = game.witching > 0 ? 0.5 + 0.5 * Math.sin(time * 9) : 0;
      warm.intensity = 0.9 + flash * 3 + dread * 1.2; cool.intensity = 0.55 + flash * 2;
      for (let i = 0; i < bulbs.length; i++) bulbs[i].material.color.copy(PA).multiplyScalar(0.8 + 0.25 * Math.sin(time * 3 + i * 1.7) + flash * 0.6);
      const key = ui.score + '|' + ui.ball + '|' + ui.msg;
      if (key !== lastScoreKey) { lastScoreKey = key; A.scorePanel(scoreCanvas, ui.score, ui.ball, ui.msg); scoreTex.needsUpdate = true; }
      shake.multiplyScalar(Math.max(0, 1 - dt * 14));
      camera.position.copy(camBase).add(shake); camera.lookAt(camTarget);
      if (composer) composer.render(dt); else renderer.render(scene, camera);
      // step quality down if the device cannot keep up
      frames++; if (dt > 0.03) slow++;
      if (frames >= 150) {
        if (slow > 60 && stage < 3) {
          stage++;
          if (stage === 1) { pixelRatio = Math.min(pixelRatio, 1.25); resize(W, Hh, lastTop); }
          else if (stage === 2) { composer = null; bloomOff = true; renderer.outputEncoding = THREE.sRGBEncoding; }
          else { renderer.shadowMap.enabled = false; sun.castShadow = false; pixelRatio = 1; resize(W, Hh, lastTop); }
        }
        frames = 0; slow = 0;
      }
    }
    let lastTop = 0;
    return { frame, fx, destroy: () => { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* already gone */ } }, resize: (w, h, t) => { lastTop = t || 0; resize(w, h, lastTop); }, info: () => ({ calls: renderer.info.render.calls, stage, bloom: !!composer, pr: pixelRatio }) };
  }
  window.WHRender = { init };
})();
