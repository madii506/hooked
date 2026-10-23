// hooked: the page background is water. A fine line grid floats on a height field: the pointer leaves a wake,
// a click drops a stone, the water scrolls with the page, and every section sends a ripple when it arrives.
// Cards light up under the pointer.
export function initBg() {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, MOB = innerWidth < 900;
  const c = document.createElement('canvas'); c.id = 'bgfx'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  const x = c.getContext('2d'); const CELL = MOB ? 22 : 18, G = 2, DAMP = .972;
  let W, H, D, cols, rows, a, b, acc = 0, base = 0;
  function fit() {
    D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0);
    cols = Math.ceil(W / CELL) + 4; rows = Math.ceil(H / CELL) + 4; a = new Float32Array(cols * rows); b = new Float32Array(cols * rows);
  }
  fit(); addEventListener('resize', fit);
  // a disturbance at screen point (px, py)
  function poke(px, py, r, amp) {
    const ci = px / CELL + 1, cj = (py + acc) / CELL + 1, R = Math.ceil(r);
    for (let j = Math.max(1, Math.floor(cj - R)); j <= Math.min(rows - 2, Math.ceil(cj + R)); j++)
      for (let i = Math.max(1, Math.floor(ci - R)); i <= Math.min(cols - 2, Math.ceil(ci + R)); i++) {
        const d = Math.hypot(i - ci, j - cj); if (d <= r) a[j * cols + i] += amp * Math.cos(d / r * Math.PI / 2);
      }
  }
  function step() {
    for (let j = 1; j < rows - 1; j++) for (let i = 1, k = j * cols + 1; i < cols - 1; i++, k++) {
      const n = ((a[k - 1] + a[k + 1] + a[k - cols] + a[k + cols]) * .5 - b[k]) * DAMP; b[k] = n;
    }
    const t = a; a = b; b = t;
  }
  // the water moves with the page: shift whole rows as the page scrolls
  function shift(n) {
    if (Math.abs(n) >= rows) { a.fill(0); b.fill(0); return; }
    for (const f of [a, b]) { if (n > 0) { f.copyWithin(0, n * cols); f.fill(0, (rows - n) * cols); } else { f.copyWithin(-n * cols, 0, (rows + n) * cols); f.fill(0, 0, -n * cols); } }
  }
  let mx = -999, my = -999, lmx = 0, lmy = 0, inside = false, lastY = scrollY;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; inside = true; }, { passive: true });
  document.addEventListener('pointerleave', () => { inside = false; });
  addEventListener('pointerdown', e => { if (e.target.closest('#stage, input, select, textarea')) return; poke(e.clientX, e.clientY, 3.2, 260); }, { passive: true });
  addEventListener('touchstart', e => { const t = e.touches[0]; if (t) poke(t.clientX, t.clientY, 3, 200); }, { passive: true });
  addEventListener('scroll', () => {
    const dy = scrollY - lastY; lastY = scrollY; acc += dy; let n = 0; while (acc >= CELL) { acc -= CELL; n++; } while (acc < 0) { acc += CELL; n--; } if (n) { shift(n); base = (((base + n) % G) + G) % G; }
    if (inside && Math.abs(dy) > 2) poke(mx, my, 1.6, Math.min(70, Math.abs(dy) * 1.2));   // the page slides under a resting pointer: a wake
  }, { passive: true });
  // each section arrives with a ripple from its number
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const r = e.target.getBoundingClientRect(); poke(r.left + r.width / 2, r.top + r.height / 2, 3, 300); }), { rootMargin: '0px 0px -30% 0px' });
  document.querySelectorAll('.sn').forEach(el => io.observe(el));

  // cards: a soft light follows the pointer
  const SPOT = '.vs-col, .pipe, .rule, .simctl, .simview, .insp, .board, .lform, .tl, .rdet, .rtab, .simstats, .story-vis, details, .verdict';
  document.querySelectorAll(SPOT).forEach(el => el.classList.add('spot'));
  addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('.spot'); if (!el) return; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

  if (RM) { draw(); addEventListener('resize', draw); return; }
  const hero = document.querySelector('.hero');
  let prev = performance.now(), simT = 0, amb = 0;
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.05, (now - prev) / 1000); prev = now;
    // the pointer's wake
    if (inside) { const sp = Math.hypot(mx - lmx, my - lmy); if (sp > 1) poke(mx, my, 1.5, Math.min(60, sp * 1.6)); }
    lmx = mx; lmy = my;
    amb += dt; if (amb > 2.4) { amb = 0; poke(Math.random() * W, Math.random() * H, 2, 70); }
    simT += dt; let n = 0; while (simT > 1 / 60 && n < 3) { step(); simT -= 1 / 60; n++; } if (n === 3) simT = 0;
    if (hero && hero.getBoundingClientRect().bottom >= H - 2) return;   // hidden behind the hero
    draw();
  }
  function hAt(i, j) { return a[j * cols + i]; }
  function pt(i, j) {   // grid point (i, j) displaced by the slope of the water (it refracts) and pushed a little by the pointer
    const k = j * cols + i; let gx = (a[k + 1] - a[k - 1]) * .055, gy = (a[k + cols] - a[k - cols]) * .055;
    gx = Math.max(-12, Math.min(12, gx)); gy = Math.max(-12, Math.min(12, gy));
    let px = (i - 1) * CELL + gx, py = (j - 1) * CELL - acc + gy;
    if (inside) { const dx = px - mx, dy = py - my, d = Math.hypot(dx, dy); if (d < 150 && d > .1) { const f = (1 - d / 150) ** 2 * 14; px += dx / d * f; py += dy / d * f; } }
    return [px, py];
  }
  function draw() {
    x.clearRect(0, 0, W, H); x.lineWidth = 1;
    // base grid
    x.strokeStyle = 'rgba(17,17,17,.055)'; x.beginPath();
    const j0 = 1 + ((G - ((1 + base) % G)) % G);
    for (let j = j0; j < rows - 1; j += G) { for (let i = 1; i < cols - 1; i++) { const [px, py] = pt(i, j); i === 1 ? x.moveTo(px, py) : x.lineTo(px, py); } }
    for (let i = 1; i < cols - 1; i += G) { for (let j = 1; j < rows - 1; j++) { const [px, py] = pt(i, j); j === 1 ? x.moveTo(px, py) : x.lineTo(px, py); } }
    x.stroke();
    // the ripples themselves: brighter segments where the water moves, in three strengths
    const B = [[], [], []];
    for (let j = j0; j < rows - 1; j += G) for (let i = 1; i < cols - 2; i++) { const h = Math.abs(hAt(i, j)) + Math.abs(hAt(i + 1, j)); if (h > 14) B[h > 90 ? 2 : h > 40 ? 1 : 0].push(i, j, i + 1, j); }
    for (let i = 1; i < cols - 1; i += G) for (let j = 1; j < rows - 2; j++) { const h = Math.abs(hAt(i, j)) + Math.abs(hAt(i, j + 1)); if (h > 14) B[h > 90 ? 2 : h > 40 ? 1 : 0].push(i, j, i, j + 1); }
    [.09, .16, .26].forEach((al, q) => { const L = B[q]; if (!L.length) return; x.strokeStyle = `rgba(17,17,17,${al})`; x.beginPath();
      for (let k = 0; k < L.length; k += 4) { const p = pt(L[k], L[k + 1]), q2 = pt(L[k + 2], L[k + 3]); x.moveTo(p[0], p[1]); x.lineTo(q2[0], q2[1]); } x.stroke(); });
  }
  requestAnimationFrame(frame);
  return { poke };
}
