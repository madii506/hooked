// hooked: motion. A hook-on-a-line cursor, split-text reveals, scrambled labels, a depth gauge, a scroll-driven marquee,
// tilting cards, magnetic buttons, and the hero reeling in as you scroll.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(pointer: fine)').matches && innerWidth > 900;
let mx = innerWidth / 2, my = innerHeight / 2, mIn = false;
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; mIn = true; }, { passive: true });
document.addEventListener('pointerleave', () => { mIn = false; });

// ---------- split text: every word rises out of a mask ----------
export function split(el) {
  if (!el || el.dataset.split) return; el.dataset.split = 1; let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          const o = document.createElement('span'); o.className = 'w'; const inner = document.createElement('span'); inner.textContent = w; inner.style.setProperty('--i', i++); o.appendChild(inner); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el); el.classList.add('split');
}

// ---------- scramble: mono labels decode into place ----------
const GL = '!<>-_\\/[]{}=+*^?#§01';
export function scramble(el, dur = 700) {
  if (!el || RM) return; const final = el.textContent, t0 = performance.now(); if (!final.trim()) return;
  const step = now => { const k = Math.min(1, (now - t0) / dur); let s = '';
    for (let i = 0; i < final.length; i++) { const c = final[i]; s += c === ' ' || i / final.length < k ? c : GL[(Math.random() * GL.length) | 0]; }
    el.textContent = s; if (k < 1) requestAnimationFrame(step); else el.textContent = final; };
  requestAnimationFrame(step);
}

// ---------- the cursor: a small hook hanging on a line from the top of the screen ----------
function cursor() {
  if (!FINE || RM) return; document.documentElement.classList.add('fxcur');
  const c = document.createElement('canvas'); c.id = 'cur'; document.body.appendChild(c); const x = c.getContext('2d');
  let W, H, D; const fit = () => { D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); }; fit(); addEventListener('resize', fit);
  const N = 26, P = Array.from({ length: N }, (_, i) => ({ x: mx, y: -40 + (my + 40) * i / (N - 1), px: mx, py: -40 + (my + 40) * i / (N - 1) }));
  let ax = mx, hover = 0, hv = 0, pulse = 0;
  addEventListener('pointerdown', () => { pulse = 1; });
  document.addEventListener('pointerover', e => { hover = e.target.closest('a,button,summary,input,select,label,.bi,.lr .top,#stage') ? 1 : 0; });
  function frame() {
    requestAnimationFrame(frame); x.clearRect(0, 0, W, H); if (!mIn) return;
    ax += (mx - ax) * .06; const len = Math.hypot(mx - ax, my + 40) * 1.04 / (N - 1);
    for (let i = 1; i < N; i++) { const p = P[i], vx = (p.x - p.px) * .96, vy = (p.y - p.py) * .96; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + .35; }
    for (let it = 0; it < 8; it++) {
      P[0].x = ax; P[0].y = -40; P[N - 1].x = mx; P[N - 1].y = my;
      for (let i = 0; i < N - 1; i++) { const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - len) / d * .5;
        if (i > 0) { a.x += dx * diff; a.y += dy * diff; } if (i + 1 < N - 1) { b.x -= dx * diff; b.y -= dy * diff; } }
    }
    x.strokeStyle = 'rgba(17,17,17,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < N - 1; i++) { const q = P[i], r = P[i + 1]; x.quadraticCurveTo(q.x, q.y, (q.x + r.x) / 2, (q.y + r.y) / 2); } x.lineTo(mx, my); x.stroke();
    // the hook, hanging from the pointer, swinging with the line
    const a = Math.atan2(P[N - 1].y - P[N - 4].y, P[N - 1].x - P[N - 4].x) - Math.PI / 2;
    hv += (hover - hv) * .2; x.save(); x.translate(mx, my); x.rotate(Math.max(-.7, Math.min(.7, a * .8)));
    x.strokeStyle = '#111'; x.lineWidth = 1.6; x.lineCap = 'round';
    x.beginPath(); x.arc(0, 0, 2.6, 0, 7); x.stroke();
    x.beginPath(); x.moveTo(0, 2.6); x.lineTo(0, 15); x.arc(-5.5, 15, 5.5, 0, Math.PI); x.lineTo(-11, 9); x.stroke();
    x.beginPath(); x.moveTo(-13, 11); x.lineTo(-11, 7.5); x.lineTo(-9, 11); x.stroke();
    x.restore();
    if (hv > .02) { x.strokeStyle = `rgba(17,17,17,${.6 * hv})`; x.beginPath(); x.arc(mx, my, 14 + 6 * hv, 0, 7); x.stroke(); }
    if (pulse > .01) { x.strokeStyle = `rgba(17,17,17,${pulse})`; x.beginPath(); x.arc(mx, my, 6 + (1 - pulse) * 30, 0, 7); x.stroke(); pulse *= .9; }
  }
  requestAnimationFrame(frame);
}

// ---------- the depth gauge: a hook that sinks as you scroll ----------
function depth() {
  if (innerWidth < 1100) return;
  const g = document.createElement('div'); g.id = 'depth'; g.innerHTML = '<i></i><b><svg viewBox="0 0 24 34"><circle cx="15" cy="3" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 5.5V24a6 6 0 0 1-12 0v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M1.2 20.6 3 17l1.8 3.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></b><span>0000 M</span>';
  document.body.appendChild(g); const hook = g.querySelector('b'), lab = g.querySelector('span'), line = g.querySelector('i');
  let cur = 0;
  const f = () => { requestAnimationFrame(f); const max = document.documentElement.scrollHeight - innerHeight, k = max > 0 ? scrollY / max : 0; cur += (k - cur) * .12;
    const y = 70 + cur * (innerHeight - 160); hook.style.transform = `translateY(${y}px) rotate(${Math.sin(performance.now() / 900) * 4}deg)`; line.style.height = (y + 4) + 'px';
    lab.style.transform = `translateY(${y + 40}px)`; lab.textContent = String(Math.round(cur * 4200)).padStart(4, '0') + ' M'; };
  requestAnimationFrame(f);
}

// ---------- a marquee that runs with your scroll ----------
function marquee() {
  const m = $('#marq'); if (!m) return; const rows = $$('#marq .mrow'); let off = 0, v = 0, lastY = scrollY;
  rows.forEach(r => { r.innerHTML = r.innerHTML.repeat(4); });
  const f = () => { requestAnimationFrame(f); const dy = scrollY - lastY; lastY = scrollY; v += (dy - v) * .1; off += 0.6 + Math.abs(v) * .35;
    rows.forEach((r, i) => { const w = r.scrollWidth / 4; const o = (i ? -1 : 1) * ((off % w)); r.style.transform = `translateX(${i ? o - w : o - w}px) skewX(${Math.max(-12, Math.min(12, -v * .4))}deg)`; }); };
  if (!RM) requestAnimationFrame(f);
}

// ---------- cards tilt toward the pointer; buttons pull toward it ----------
function tilt() {
  if (!FINE || RM) return;
  $$('.vs-col, .rtab, .bi').forEach(el => {
    el.classList.add('tilt');
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg'); el.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg'); el.style.setProperty('--gx', (px * 100) + '%'); el.style.setProperty('--gy', (py * 100) + '%'); });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
  $$('.btn, .cta').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

// ---------- the promises get struck out, the rules type in ----------
function promises() {
  const vs = $('.vs'); if (!vs) return;
  new IntersectionObserver((es, io) => { if (!es[0].isIntersecting) return; io.disconnect();
    $$('.promises li').forEach((li, i) => setTimeout(() => li.classList.add('struck'), 300 + i * 260));
    $$('.enforced li').forEach((li, i) => setTimeout(() => { li.classList.add('typed'); const c = li.querySelector('code'), s = c.dataset.t || c.textContent; c.dataset.t = s; let k = 0; const ty = () => { c.textContent = s.slice(0, ++k); if (k < s.length) setTimeout(ty, 18); }; ty(); }, 1300 + i * 380));
  }, { threshold: .35 }).observe(vs);
}

// ---------- the hero reels in as you scroll; the water wakes under the pointer ----------
function hero(stage) {
  const copy = $('.hero-copy'), hero = $('.hero'); if (!stage || !hero) return;
  let lastWake = 0;
  $('#stage').addEventListener('pointermove', e => { const n = performance.now(); if (n - lastWake > 140) { lastWake = n; stage.dripAt(e.clientX, e.clientY, .045); } });
  const f = () => { requestAnimationFrame(f); const k = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
    stage.S.reel = k; if (copy && innerWidth > 900 && !document.documentElement.classList.contains('intro')) { copy.style.transform = `translateY(calc(-50% - ${k * 120}px))`; copy.style.opacity = String(1 - k * 1.4); } };
  requestAnimationFrame(f);
}

export function initFx(stage) {
  $$('h2').forEach(split); split($('.hero-copy h1'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target);
    if (e.target.matches('h2, h1')) e.target.classList.add('shown');
    else { e.target.classList.add('drawn'); e.target.querySelectorAll('.lbl').forEach(l => scramble(l)); } }), { threshold: .2 });
  $$('h2').forEach(h => io.observe(h)); $$('.hd').forEach(h => { const s = h.children[1]; if (s) s.classList.add('lbl'); io.observe(h); });
  cursor(); depth(); marquee(); tilt(); promises(); hero(stage);
  return { revealHero: () => { const h = $('.hero-copy h1'); h && h.classList.add('shown'); scramble($('.eyebrow .eb'), 900); } };
}
