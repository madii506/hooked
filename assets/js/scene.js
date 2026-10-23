// hooked: the 3D scene. A wireframe fishing hook on its line, a coin caught in the bend, a wireframe sea that ripples.
// Built from plain line segments over background-coloured occluders, so it reads like a technical drawing.
import * as THREE from './three.module.min.js';

const BG = 0xeeeeec, INK = 0x111111;

// ---------- geometry helpers ----------
function frameRing(p, t, r, segs) {           // a ring of points around p, perpendicular to tangent t (curves live in the xy plane)
  const n = new THREE.Vector3(-t.y, t.x, 0).normalize(), b = new THREE.Vector3(0, 0, 1), out = [];
  for (let k = 0; k < segs; k++) { const a = (k / segs) * Math.PI * 2; out.push(p.clone().addScaledVector(n, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r)); }
  return out;
}
function tube(points, radii, { segs = 10, ringEvery = 3, closed = false } = {}) {
  const rings = points.map((p, i) => {
    const a = points[Math.max(0, i - 1)], c = points[Math.min(points.length - 1, i + 1)];
    let t = c.clone().sub(a); if (closed && (i === 0 || i === points.length - 1)) t = points[1].clone().sub(points[points.length - 2]);
    return frameRing(p, t.normalize(), radii[i], segs);
  });
  const L = [], T = [], V = [];
  rings.forEach((R, i) => { if (i % ringEvery === 0 || i === rings.length - 1) for (let k = 0; k < segs; k++) { const a = R[k], b = R[(k + 1) % segs]; L.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < segs; k++) { const a = rings[i][k], b = rings[i + 1][k]; L.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  rings.forEach(R => R.forEach(p => V.push(p.x, p.y, p.z)));
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < segs; k++) {
    const a = i * segs + k, b = i * segs + (k + 1) % segs, c = (i + 1) * segs + k, d = (i + 1) * segs + (k + 1) % segs; T.push(a, c, b, b, c, d);
  }
  const lines = new THREE.BufferGeometry(); lines.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
  const solid = new THREE.BufferGeometry(); solid.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); solid.setIndex(T);
  return { lines, solid };
}
const occluder = () => new THREE.MeshBasicMaterial({ color: BG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const lineMat = (o = 1) => new THREE.LineBasicMaterial({ color: INK, transparent: o < 1, opacity: o, fog: true });
const ghostMat = () => new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .1, depthTest: false, fog: true });
function wire(geo, group, { ghost = true, opacity = 1 } = {}) {
  const solid = new THREE.Mesh(geo.solid, occluder()); group.add(solid);
  if (ghost) { const g = new THREE.LineSegments(geo.lines, ghostMat()); g.renderOrder = -1; group.add(g); }
  const l = new THREE.LineSegments(geo.lines, lineMat(opacity)); group.add(l); return { solid, l };
}

// ---------- the hook ----------
export const SHANK = 2.7, TR = .14;
function hookCurve() {
  const P = [], R = [];
  for (let k = 0; k < 46; k++) { const t = k / 45; P.push(new THREE.Vector3(1, SHANK - SHANK * t, 0)); R.push(TR); }
  for (let k = 1; k <= 120; k++) { const a = -Math.PI * k / 120; P.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0)); R.push(TR); }
  for (let k = 1; k <= 48; k++) { const t = k / 48; P.push(new THREE.Vector3(-1, .98 * t, 0)); R.push(TR * Math.pow(1 - t, .85) + .002); }
  return { P, R };
}
function glyphTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.font = '800 380px "JetBrains Mono", ui-monospace, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 14; x.strokeStyle = '#111'; x.strokeText('§', 256, 280);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function makeCoin(r = .6, th = .11) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 64, 1), occluder()); cyl.rotation.x = Math.PI / 2; g.add(cyl);
  const L = [], circle = (rr, z) => { for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, b = (k + 1) / 72 * Math.PI * 2; L.push(rr * Math.cos(a), rr * Math.sin(a), z, rr * Math.cos(b), rr * Math.sin(b), z); } };
  circle(r, th / 2); circle(r, -th / 2); circle(r * .84, th / 2 + .001); circle(r * .58, th / 2 + .001); circle(r * .84, -th / 2 - .001);
  for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2; L.push(r * Math.cos(a), r * Math.sin(a), th / 2, r * Math.cos(a), r * Math.sin(a), -th / 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
  const gh = new THREE.LineSegments(geo, ghostMat()); gh.renderOrder = -1; g.add(gh); g.add(new THREE.LineSegments(geo, lineMat()));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.05, r * 1.05), new THREE.MeshBasicMaterial({ map: glyphTexture(), transparent: true, depthWrite: false }));
  face.position.z = th / 2 + .004; g.add(face);
  return g;
}
export function makeHook() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const { P, R } = hookCurve(); wire(tube(P, R, { segs: 10, ringEvery: 3 }), body);
  const E = [], ER = [], ec = new THREE.Vector3(1, SHANK + .4, 0);
  for (let k = 0; k <= 64; k++) { const a = -Math.PI / 2 + k / 64 * Math.PI * 2; E.push(new THREE.Vector3(ec.x + .3 * Math.cos(a), ec.y + .3 * Math.sin(a), 0)); ER.push(.1); }
  wire(tube(E, ER, { segs: 8, ringEvery: 2, closed: true }), body);
  const line = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1, SHANK + .7, 0), new THREE.Vector3(1, 60, 0)]);
  body.add(new THREE.Line(line, lineMat()));
  const coin = makeCoin(); coin.position.set(0, -.2, 0); coin.rotation.set(.04, .18, .02); body.add(coin);
  return { group: g, body, coin, anchors: { eye: new THREE.Vector3(1, SHANK + .4, 0), coin: new THREE.Vector3(0, -.2, 0), point: new THREE.Vector3(-1, .98, 0), bend: new THREE.Vector3(0, -1, 0) } };
}

// ---------- the sea: a line grid displaced by ripples, in a shader ----------
function makeSea(W = 90, D = 70, step = 1.1) {
  const L = [], seg = .55;
  for (let z = -10; z <= D; z += step) for (let x = -W / 2; x < W / 2; x += seg) L.push(x, 0, z, x + seg, 0, z);
  for (let x = -W / 2; x <= W / 2; x += step) for (let z = -10; z < D; z += seg) L.push(x, 0, z, x, 0, z + seg);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
  const uni = { uTime: { value: 0 }, uR: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -99, 0)) }, uCol: { value: new THREE.Color(INK) }, uNear: { value: 16 }, uFar: { value: 60 }, uOpacity: { value: .55 }, uCam: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false,
    vertexShader: `uniform float uTime; uniform vec4 uR[8]; varying float vD;
      void main(){ vec3 p = position; float h = 0.0;
        for(int i=0;i<8;i++){ vec4 r = uR[i]; float age = uTime - r.z; if(age < 0.0 || age > 9.0) continue;
          float d = distance(p.xz, r.xy); float front = age * 2.4; float e = exp(-abs(d - front) * 1.4) * exp(-age * .32);
          h += r.w * e * sin((d - front) * 3.2); }
        h += .035 * sin(p.x * .35 + uTime * .6) * sin(p.z * .3 + uTime * .4);
        p.y += h; vec4 mv = modelViewMatrix * vec4(p, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uNear; uniform float uFar; uniform float uOpacity; varying float vD;
      void main(){ float f = 1.0 - smoothstep(uNear, uFar, vD); float n = smoothstep(9.0, 17.0, vD); gl_FragColor = vec4(uCol, uOpacity * f * f * (.25 + .75 * n)); }`,
  });
  const sea = new THREE.LineSegments(geo, mat); return { sea, uni };
}
function makeRings() {   // flat ripple circles on the water, expanding and fading
  const pool = [];
  for (let i = 0; i < 6; i++) {
    const pts = []; for (let k = 0; k <= 128; k++) { const a = k / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false }));
    l.userData = { t0: -99 }; pool.push(l);
  }
  return pool;
}

// ---------- the stage ----------
export function createStage(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG, 16, 50);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 200);
  const hook = makeHook(); scene.add(hook.group);
  const SEA_Y = -2.75; const { sea, uni } = makeSea(); sea.position.y = SEA_Y; scene.add(sea);
  const rings = makeRings(); rings.forEach(r => { r.position.y = SEA_Y + .01; scene.add(r); });
  let ri = 0, rti = 0;
  const S = { t: 0, hookY: 0, coinDrop: 0, camX: 0, camTarget: 0, look: new THREE.Vector3(0, .4, 0), lookY: 1.05, lookYs: 1.05, mx: 0, my: 0, smx: 0, smy: 0, swing: 1, visible: true, seaOn: 1, ...opts };
  function drip(x = 0, z = 0, amp = .22) {
    uni.uR.value[ri % 8].set(x, z, S.t, amp); ri++;
    for (let k = 0; k < 3; k++) { const r = rings[rti++ % rings.length]; r.position.x = x; r.position.z = z; r.userData = { t0: S.t + k * .35, amp }; }
  }
  function size() {
    const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix();
  }
  size(); addEventListener('resize', size);
  new IntersectionObserver(es => { S.visible = es[0].isIntersecting; }).observe(canvas);
  addEventListener('pointermove', e => { S.mx = e.clientX / innerWidth * 2 - 1; S.my = e.clientY / innerHeight * 2 - 1; });
  // click the sea: a drip where you clicked
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SEA_Y), hit = new THREE.Vector3();
  function dripAt(cx, cy, amp = .2) {
    const r = canvas.getBoundingClientRect(); ray.setFromCamera({ x: (cx - r.left) / r.width * 2 - 1, y: -(cy - r.top) / r.height * 2 + 1 }, cam);
    if (ray.ray.intersectPlane(plane, hit)) { if (amp < .1) { uni.uR.value[ri % 8].set(hit.x, hit.z, S.t, amp); ri++; } else drip(hit.x, hit.z, amp); }
  }
  canvas.addEventListener('pointerdown', e => dripAt(e.clientX, e.clientY, .2));
  // project a point of the hook to screen pixels (for the labels)
  const tmp = new THREE.Vector3();
  function screen(v) { tmp.copy(v).applyMatrix4(hook.body.matrixWorld).project(cam); const r = canvas.getBoundingClientRect(); return { x: (tmp.x + 1) / 2 * r.width, y: (1 - tmp.y) / 2 * r.height }; }
  let last = performance.now(), auto = 0;
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!S.visible) return; S.t += dt;
    S.smx += (S.mx - S.smx) * Math.min(1, dt * 2.2); S.smy += (S.my - S.smy) * Math.min(1, dt * 2.2);
    S.camX += (S.camTarget - S.camX) * Math.min(1, dt * 1.6);
    // the hook hangs and swings a little on its line; it turns toward the pointer
    const sw = S.swing;
    S.reels = (S.reels || 0) + ((S.reel || 0) - (S.reels || 0)) * Math.min(1, dt * 5); hook.group.position.y = S.hookY + S.reels * 5.5;
    hook.group.rotation.z = (.05 * Math.sin(S.t * .9) + .02 * Math.sin(S.t * 2.3)) * sw;
    hook.group.rotation.y = .35 + .25 * Math.sin(S.t * .25) * sw + S.smx * .35;
    hook.group.rotation.x = .04 * Math.sin(S.t * .7) * sw - S.smy * .06;
    // the coin drops into the bend (intro), then sits
    hook.coin.position.y = -.2 + S.coinDrop; hook.coin.rotation.z = .02 + S.coinDrop * .8;
    cam.position.set(S.camX + S.smx * .6, .9 - S.smy * .35, 18.5);
    S.lookYs += (S.lookY - S.lookYs) * Math.min(1, dt * 1.6); cam.lookAt(S.camX + S.look.x, S.lookYs, 0);
    uni.uTime.value = S.t; uni.uOpacity.value = .5 * S.seaOn;
    rings.forEach(r => { const a = S.t - r.userData.t0; if (a < 0 || a > 5) { r.material.opacity = 0; return; } const s = .3 + a * 1.9; r.scale.set(s, 1, s); r.material.opacity = .5 * (1 - a / 5) * S.seaOn; });
    auto += dt; if (S.autoDrip && auto > 4.2) { auto = 0; drip(0, 0, .16); }
    renderer.render(scene, cam);
    if (S.onFrame) S.onFrame(screen);
  }
  requestAnimationFrame(frame);
  return { S, drip, dripAt, hook, screen, cam, renderer, SEA_Y };
}
