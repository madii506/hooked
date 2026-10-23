// hooked: the page. Intro, hero labels, the pipeline, rule cards, the simulator, the live inspector, the launch rulebook.
import { createStage } from './scene.js?v=5';
import { initFx } from './fx.js?v=5';
import { initBg } from './bg.js?v=5';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const html = document.documentElement, mob = innerWidth < 900;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3), easeIn = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * k;
const back = k => { if (k <= 0) return 0; if (k >= 1) return 1; const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
// coin pictures: pump.fun coins come from pump.fun's own image CDN first, the listed link second; anything that fails hides quietly
const pic = (mint, icon, lazy = true) => { const pf = /pump$/.test(mint || '') ? 'https://images.pump.fun/coin-image/' + mint + '?variant=86x86' : null, a = pf || icon, b = pf && icon && !/ipfs\.io\//.test(icon) ? icon : '';
  return a ? `<img src="${esc(a)}" alt="" ${lazy ? 'loading="lazy"' : ''} referrerpolicy="no-referrer" data-alt="${esc(b)}" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else{this.style.visibility='hidden'}">` : '<img alt="">'; };
const usd = v => v == null ? '—' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + v.toFixed(0);

// ---------- the stage and the intro ----------
const HERO_X = mob ? 0 : -3.9;
const intro = html.classList.contains('intro');
const stage = createStage($('#stage'), intro ? { hookY: 16, coinDrop: -27, reveal: 0, camTarget: HERO_X, camX: HERO_X, camPath: [0, 8.5, 32, 0, -2, 0] } : { camTarget: HERO_X, camX: HERO_X, autoDrip: true });
const S = stage.S;
// the intro: no words, one catch. The water draws itself in, the line drops the hook straight through the surface,
// the coin rises to it under the water, two bites, the strike pulls it out in a burst of spray, it swings and drips,
// the camera looks closely at the rule on the coin, a ring runs across the whole sea, and the camera pulls back to the page.
const smooth = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
function camAt(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) { const [t0, a] = K[i], [t1, b] = K[i + 1]; if (t <= t1) { const k = smooth((t - t0) / (t1 - t0)); return a.map((v, j) => v + (b[j] - v) * k); } }
  return K[K.length - 1][1];
}
function runIntro() {
  const bar = $('.i-line i'), T0 = performance.now(), END = 11.2, R = 13, o = (a, y = 1) => [Math.sin(a) * R, y, Math.cos(a) * R];
  const K = [
    [0.0, [0, 8.5, 32, 0, -2, 0]], [1.95, [0, 3.0, 23.5, 0, -.3, 0]],         // the sea draws in, wide and high; the hook lowers into view
    [2.7, [0, .7, 16.5, 0, -2.5, 0]], [4.05, [-2.6, .05, 13.5, 0, -2.9, 0]],   // down at the waterline as the hook goes in; the coin rises below
    [4.75, [0, 1.9, 17.5, 0, .75, 0]],                                           // the strike: look up with it
    [5.9, [...o(.62, 1.2), 0, -.2, 0]], [6.9, [...o(-.42, .5), 0, -.3, 0]],     // around the catch
    [7.6, [1.05, -.08, 5.5, 0, -.22, 0]], [8.6, [.65, -.12, 5.0, 0, -.22, 0]],  // the rule on the coin
    [END - .3, [HERO_X, .9, 18.5, HERO_X, 1.05, 0]],
  ];
  const ev = new Set(), once = (k, t, at, fn) => { if (t >= at && !ev.has(k)) { ev.add(k); fn(); } };
  const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  let done = false;
  const finish = () => {
    if (done) return; done = true; S.camPath = null; S.camX = HERO_X; S.hookY = 0; S.coinDrop = 0; S.reveal = 999; S.spin = 0; S.coinHide = false; S.camTarget = HERO_X; S.lookY = S.lookYs = 1.05; S.autoDrip = true;
    $('#intro').classList.add('out'); html.classList.remove('intro'); setTimeout(() => $('#intro').remove(), 900);
    setTimeout(() => $$('.tag').forEach(t => t.classList.add('on')), 900); setTimeout(() => FX.revealHero(), 250);
  };
  $('#iSkip').onclick = finish; addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') finish(); }, { once: true });
  const step = () => {
    if (done) return; const t = (performance.now() - T0) / 1000;
    bar.style.transform = `scaleX(${Math.min(1, t / END)})`;
    S.camPath = camAt(K, t);
    S.reveal = t < 2.7 ? 72 * Math.pow(Math.min(1, t / 2.7), 1.6) : 999;
    // the hook: falls through the surface, bobs, two bites, the strike, then settles into place
    let y;
    if (t < .9) y = 12;
    else if (t < 2.15) y = 12 - 8.8 * ease((t - .9) / 1.0) + .12 * Math.sin((t - .9) * 5) * smooth((t - 1.6) / .4);
    else if (t < 2.62) { const k = (t - 2.15) / .47; y = 3.2 - 7.4 * k * k; }
    else if (t < 4.3) y = -4.2 - .3 * Math.sin((t - 2.62) * 7) * Math.exp(-(t - 2.62) * 2.6) - .3 * gauss(t, 3.62, .05) - .45 * gauss(t, 3.98, .05);
    else if (t < 4.72) y = -4.2 + 5.1 * ease((t - 4.3) / .42);
    else y = .9 * (1 - back((t - 4.72) / 1.5));
    S.hookY = y;
    // the coin comes up to the hook under the water, then rides it out
    S.coinDrop = (-11 - y + .2) * (t < 2.7 ? 1 : 1 - ease((t - 2.7) / 1.05));   // from deep water up to the bend
    S.coinHide = t < 2.7; S.spin = t > 7.7 && t < 8.5 ? Math.PI * 2 * smooth((t - 7.7) / .8) : 0;
    once('bite1', t, 3.62, () => stage.drip(1.0, 0, .1)); once('bite2', t, 3.98, () => stage.drip(1.0, 0, .14));
    once('kick', t, 4.5, () => { S.pendV = -1.25; });
    [5.2, 5.75, 6.3, 6.85].forEach((at, i) => once('d' + i, t, at, () => { const w = stage.coinWorld(); w.y -= .55; stage.dropFrom(w); }));
    once('ring', t, 8.45, () => { stage.drip(0, 0, .4); stage.pulse(); });
    if (t > END) return finish();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const FX = initFx(stage); const BG = initBg();
if (intro) runIntro(); else { $$('.tag').forEach(t => t.classList.add('on')); FX.revealHero(); }

// hero labels with leader lines, pinned to the 3D hook
const lc = $('#leaders'), lx = lc.getContext('2d');
const fitL = () => { const d = Math.min(2, devicePixelRatio || 1), r = lc.getBoundingClientRect(); lc.width = r.width * d; lc.height = r.height * d; lx.setTransform(d, 0, 0, d, 0, 0); };
fitL(); addEventListener('resize', fitL);
const TAGS = [{ el: $('#tagCoin'), a: 'coin', dx: -250, dy: 84, side: 'r' }, { el: $('#tagEye'), a: 'eye', dx: 70, dy: -40, side: 'l' }, { el: $('#tagSea'), a: 'bend', dx: 120, dy: 150, side: 'l' }];
S.onFrame = screen => {
  if (mob) return; const r = lc.getBoundingClientRect(); lx.clearRect(0, 0, r.width, r.height); if (html.classList.contains('intro')) return;
  lx.strokeStyle = 'rgba(17,17,17,.75)'; lx.fillStyle = '#111'; lx.lineWidth = 1;
  for (const t of TAGS) {
    const p = screen(stage.hook.anchors[t.a]); const lxp = p.x + t.dx, lyp = p.y + t.dy, w = t.el.offsetWidth;
    t.el.style.transform = `translate(${t.side === 'r' ? lxp - w : lxp}px, ${lyp - 30}px)`;
    lx.beginPath(); lx.arc(p.x, p.y, 2.5, 0, 7); lx.fill();
    lx.beginPath(); lx.moveTo(p.x, p.y); lx.lineTo(lxp, lyp); lx.lineTo(t.side === 'r' ? lxp - w : lxp + w, lyp); lx.stroke();
  }
};
// the rule on the coin label cycles, typed
const RULES_TXT = ['MAX BUY 1% · FIRST 10 MIN', 'MAX WALLET 2% · UNTIL DAY 7', 'BUY COOLDOWN 30S · FIRST HOUR', 'DEV LOCK · 30 DAYS'];
let rti = 0; setInterval(() => { if (document.hidden) return; rti = (rti + 1) % RULES_TXT.length; stage.drip(0, 0, .12); const s = RULES_TXT[rti], el = $('#ruleTxt'); let k = 0; const ty = () => { el.textContent = s.slice(0, ++k); if (k < s.length) setTimeout(ty, 22); }; ty(); }, 3400);

// nav: solid after the top, the section you're in is lit
addEventListener('scroll', () => $('#nav').classList.toggle('solid', scrollY > 40), { passive: true });
const navIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
['how', 'rules', 'sim', 'inspect', 'launch', 'faq'].forEach(id => navIO.observe(document.getElementById(id)));
const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { threshold: .12 });
$$('.rv').forEach(el => rvIO.observe(el));

// ---------- 02 the pipeline: transfers flow through the token into the hook ----------
(function pipeline() {
  const svg = $('#pipeSvg'), NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const nodes = [];
  const box = (x, y, w, h, t1, t2, dark, id) => { const g0 = el('g', { class: 'node', 'data-n': id }); nodes.push(g0);
    el('rect', { x, y, width: w, height: h, rx: 14, fill: dark ? '#111' : '#eeeeec', stroke: '#111', 'stroke-width': 1.2 }, g0);
    const a = el('text', { x: x + w / 2, y: y + h / 2 - 4, 'text-anchor': 'middle', 'font-family': 'JBM, monospace', 'font-size': 13, 'font-weight': 800, 'letter-spacing': 1.5, fill: dark ? '#fff' : '#111' }, g0); a.textContent = t1;
    const b = el('text', { x: x + w / 2, y: y + h / 2 + 15, 'text-anchor': 'middle', 'font-family': 'JBM, monospace', 'font-size': 10.5, 'letter-spacing': 1, fill: dark ? '#aaa' : '#767676' }, g0); b.textContent = t2; };
  const path = (d, dash) => el('path', { d, fill: 'none', stroke: '#111', 'stroke-width': 1.2, 'stroke-dasharray': dash || '3 5', opacity: .55 });
  path('M150 150 H 330'); path('M500 150 H 620'); path('M800 150 C 860 150 860 70 920 70'); path('M800 150 C 860 150 860 230 920 230');
  box(20, 110, 130, 80, 'WALLET', 'buy · sell · send', false, 0); box(330, 110, 170, 80, 'TOKEN-2022', 'transfer instruction', false, 1); box(620, 100, 180, 100, 'HOOK', 'max_buy(1%)', true, 2);
  box(920, 40, 160, 60, '✓ LANDS', 'inside the rule', false, 3); box(920, 200, 160, 60, '✕ REVERTS', 'nothing moves', false, 3);
  window.__pipeStep = i => nodes.forEach(n => { const on = i == null || +n.dataset.n === i; n.classList.toggle('on', i != null && on); n.classList.toggle('dim', !on); });
  const lbl = el('text', { x: 710, y: 228, 'text-anchor': 'middle', 'font-family': 'JBM, monospace', 'font-size': 10.5, fill: '#767676', 'letter-spacing': 1 }); lbl.textContent = 'checks every transfer';
  const pts = []; const g = el('g', {});
  const along = (d, k) => { const p = el('path', { d, fill: 'none' }, g); const L = p.getTotalLength(), q = p.getPointAtLength(L * k); p.remove(); return q; };
  const P1 = 'M150 150 H 620', UP = 'M800 150 C 860 150 860 70 920 70', DN = 'M800 150 C 860 150 860 230 920 230';
  let last = 0, vis = false; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(svg);
  function frame(now) {
    requestAnimationFrame(frame); if (!vis) return;
    if (now - last > 850) { last = now; const amt = Math.random() < .3 ? +(1 + Math.random() * 2.5).toFixed(1) : +(.1 + Math.random() * .85).toFixed(2);
      const c = el('circle', { r: 6, fill: '#111' }, g), t = el('text', { 'font-family': 'JBM, monospace', 'font-size': 10.5, 'font-weight': 700, fill: '#111' }, g); t.textContent = amt + '%'; pts.push({ c, t, t0: now, amt }); }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i], k = (now - p.t0) / 2600, ok = p.amt <= 1; let q;
      if (k < .62) q = along(P1, k / .62); else if (k < .7) q = { x: 620 + (k - .62) / .08 * 180, y: 150 }; else q = along(ok ? UP : DN, Math.min(1, (k - .7) / .3));
      p.c.setAttribute('cx', q.x); p.c.setAttribute('cy', q.y); p.t.setAttribute('x', q.x - 14); p.t.setAttribute('y', q.y - 12);
      if (k > .66) { p.c.setAttribute('fill', ok ? '#138a4a' : '#c23a2b'); p.t.setAttribute('fill', ok ? '#138a4a' : '#c23a2b'); }
      if (k > .62 && k < .7) { p.c.setAttribute('fill', '#fff'); }
      if (k >= 1.05) { p.c.remove(); p.t.remove(); pts.splice(i, 1); }
    }
  }
  requestAnimationFrame(frame);
})();

// ---------- 03 the rule cards, each with a small live drawing ----------
const RULES = [
  { id: 'maxbuy', k: 'ANTI-SNIPER', name: 'MAX BUY', d: 'No single buy bigger than a share of supply while the launch is young. Snipers and bundles can\'t take half the supply in the first block.', stops: ['snipers in block one', 'bundled wallets', 'one wallet taking the curve'], params: [['cap', '1% of supply'], ['window', 'first 10 min'], ['sunset', 'your choice']], cant: ['block a sell', 'outlive its window'],
    code: '<span class="k">if</span> now &lt; launch + window {\n    require!(amount &lt;= supply * cap)   <span class="c">// over it: reverts</span>\n}' },
  { id: 'maxwallet', k: 'ANTI-WHALE', name: 'MAX WALLET', d: 'No wallet can hold more than a share of supply until the date you set. A buy that would push a wallet over the cap reverts.', stops: ['whales cornering supply', 'one wallet setting the price', 'slow accumulation'], params: [['cap', '2% per wallet'], ['until', 'day 7'], ['sunset', 'your choice']], cant: ['shrink a wallet', 'block a sell'],
    code: '<span class="k">if</span> now &lt; until {\n    require!(dest_balance &lt;= supply * cap)   <span class="c">// after the transfer</span>\n}' },
  { id: 'cooldown', k: 'ANTI-BOT', name: 'BUY COOLDOWN', d: 'One buy per wallet every few seconds for the first hour. Bots that spam buys block by block get stopped.', stops: ['buy-spam bots', 'block-by-block laddering', 'volume bots in hour one'], params: [['gap', '30 seconds'], ['window', 'first hour'], ['sunset', 'your choice']], cant: ['slow a normal buyer', 'block a sell'],
    code: '<span class="k">if</span> now &lt; launch + window {\n    require!(now - last_buy[owner] &gt;= gap)\n    last_buy[owner] = now\n}' },
  { id: 'devlock', k: 'ANTI-DUMP', name: 'DEV LOCK', d: 'The creator\'s own tokens can\'t move until the lock ends. Not a promise in a tweet: the transfer simply fails.', stops: ['the creator dumping', 'a dev bag moved to a new wallet', 'rug by selling into buyers'], params: [['wallet', 'the creator'], ['lock', '30 days'], ['sunset', 'the lock end']], cant: ['touch anyone else', 'extend itself'],
    code: '<span class="k">if</span> source_owner == creator {\n    require!(now &gt;= unlock_at)   <span class="c">// locked until then</span>\n}' },
];
function drawRule(x, W, H, t, kind) {
      const base = H - 18;
      x.strokeStyle = 'rgba(17,17,17,.25)'; x.beginPath(); x.moveTo(12, base); x.lineTo(W - 12, base); x.stroke();
      if (kind === 'maxbuy') {
        const cap = base - (H - 40) * .45; x.setLineDash([3, 4]); x.strokeStyle = '#111'; x.beginPath(); x.moveTo(12, cap); x.lineTo(W - 12, cap); x.stroke(); x.setLineDash([]);
        x.fillStyle = '#111'; x.fillText('CAP 1%', W - 56, cap - 9);
        const n = 12, step = Math.floor(t * 1.4); for (let i = 0; i < n; i++) { const xx = 22 + i * (W - 44) / (n - 1), seedv = Math.abs(Math.sin((i + step) * 12.9898) * 43758.5453) % 1, h = (H - 44) * (.10 + .62 * Math.pow(seedv, 1.6));
          const over = base - h < cap;
          if (over) { x.strokeStyle = '#c23a2b'; x.setLineDash([2, 3]); x.strokeRect(xx - 5, base - h, 10, h); x.setLineDash([]); x.fillStyle = '#c23a2b'; x.fillText('✕', xx - 3, base - h - 8); }
          else { x.fillStyle = '#111'; x.fillRect(xx - 5, base - h, 10, h); } }
      } else if (kind === 'maxwallet') {
        const cap = base - (H - 40) * .7; x.setLineDash([3, 4]); x.strokeStyle = '#111'; x.beginPath(); x.moveTo(12, cap); x.lineTo(W - 12, cap); x.stroke(); x.setLineDash([]); x.fillStyle = '#767676'; x.fillText('CAP 2%', 14, cap - 8);
        for (let i = 0; i < 6; i++) { const xx = 24 + i * (W - 48) / 5, want = (H - 40) * (.3 + .6 * ((i * .37 + .2) % 1)) * Math.min(1, (t * .35 + i * .13) % 1.4), h = Math.min(want, base - cap);
          x.strokeStyle = '#111'; x.strokeRect(xx - 9, base - h, 18, h); x.fillStyle = 'rgba(17,17,17,.08)'; x.fillRect(xx - 9, base - h, 18, h);
          if (want > base - cap) { x.fillStyle = '#c23a2b'; x.fillText('✕', xx - 3, cap - 9); } }
      } else if (kind === 'cooldown') {
        const lanes = [['BOT', 16], ['BOT', 22], ['YOU', 78]], CD = 64; lanes.forEach(([nm, gap], l) => {
          const y = 30 + l * (H - 56) / 2; x.strokeStyle = 'rgba(17,17,17,.18)'; x.beginPath(); x.moveTo(12, y); x.lineTo(W - 12, y); x.stroke(); x.fillStyle = '#767676'; x.fillText(nm, 14, y - 10);
          const off = (t * 26) % gap; let win = -1e9;
          for (let xx = 12 - off - gap * 4; xx < W - 12; xx += gap) { if (xx < 12) { if (xx - win >= CD) win = xx; continue; }
            if (xx - win >= CD) { win = xx; x.fillStyle = 'rgba(17,17,17,.08)'; x.fillRect(xx, y - 6, Math.min(CD, W - 12 - xx), 12); x.fillStyle = '#111'; x.beginPath(); x.arc(xx, y, 3.5, 0, 7); x.fill(); }
            else { x.strokeStyle = '#c23a2b'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(xx - 3, y - 3); x.lineTo(xx + 3, y + 3); x.moveTo(xx - 3, y + 3); x.lineTo(xx + 3, y - 3); x.stroke(); x.lineWidth = 1; } } });
      } else if (kind === 'devlock') {
        const unlock = .64, ph = (t * .12) % 1, ux = 12 + (W - 24) * unlock, nx = 12 + (W - 24) * ph;
        x.fillStyle = 'rgba(17,17,17,.06)'; x.fillRect(12, 20, ux - 12, base - 20); x.strokeStyle = '#111'; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(ux, 16); x.lineTo(ux, base); x.stroke(); x.setLineDash([]);
        x.fillStyle = '#767676'; x.fillText('LOCKED', 18, 30); x.fillText('UNLOCKED', ux + 6, 30); x.fillStyle = '#111'; x.fillText('DEV WALLET', 18, base - 12);
        x.strokeStyle = 'rgba(17,17,17,.6)'; x.beginPath(); x.moveTo(nx, 20); x.lineTo(nx, base); x.stroke();
        [.14, .30, .46].forEach((f, k) => { const ax = 12 + (W - 24) * f, y = 56 + (k % 2) * 22; if (ax > nx) return; x.strokeStyle = '#c23a2b'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ax - 4, y - 4); x.lineTo(ax + 4, y + 4); x.moveTo(ax - 4, y + 4); x.lineTo(ax + 4, y - 4); x.stroke(); x.lineWidth = 1; x.fillStyle = '#c23a2b'; x.fillText('SELL', ax + 8, y); });
        [.80].forEach(f => { const ax = 12 + (W - 24) * f, y = 66; if (ax > nx) return; x.fillStyle = '#111'; x.beginPath(); x.arc(ax, y, 3.5, 0, 7); x.fill(); x.fillText('SELL', ax + 8, y); });
      }
}
(function rules() {
  let cur = 0, t0 = performance.now(), hold = false; const DUR = 7000;
  $('#rTabs').innerHTML = RULES.map((r, i) => `<button type="button" class="rtab" data-i="${i}"><span class="i">0${i + 1}</span><span><b>${r.name}</b><span>${r.k}</span></span><em>${r.params[0][1]}</em></button>`).join('');
  $$('.rtab').forEach(b => b.onclick = () => set(+b.dataset.i));
  [$('#rDet'), $('#rTabs')].forEach(el => { el.addEventListener('pointerenter', () => hold = true); el.addEventListener('pointerleave', () => { hold = false; t0 = performance.now() - (performance.now() - t0); }); });
  function set(i) {
    cur = i; t0 = performance.now(); const r = RULES[i];
    $$('.rtab').forEach((b, k) => b.classList.toggle('on', k === i));
    $('#rTag').textContent = `RULE 0${i + 1} · ${r.k}`; $('#rK').textContent = r.k; $('#rName').textContent = r.name; $('#rDesc').textContent = r.d;
    $('#rStops').innerHTML = r.stops.map(x => `<li>${esc(x)}</li>`).join(''); $('#rCant').innerHTML = r.cant.map(x => `<li>${esc(x)}</li>`).join('');
    $('#rParams').innerHTML = r.params.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join(''); $('#rCode').innerHTML = r.code;
    const d = $('#rDet'); d.classList.remove('swap'); void d.offsetWidth; d.classList.add('swap');
  }
  set(0);
  const c = $('#rCv'), x = c.getContext('2d'); let vis = false; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(c);
  let paused = 0, last = performance.now();
  const f = now => { requestAnimationFrame(f); const dt = now - last; last = now; if (!vis) return;
    if (hold) t0 += dt; else if (now - t0 > DUR) set((cur + 1) % RULES.length);
    $('#rProg').style.width = Math.min(100, (now - t0) / DUR * 100) + '%';
    const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(r.width * d)) { c.width = r.width * d; c.height = r.height * d; }
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, r.width, r.height);
    x.save(); x.translate(40, 34); drawRule(x, r.width - 80, r.height - 58, now / 1000, RULES[cur].id); x.restore(); };
  requestAnimationFrame(f);
})();

// ---------- 01 the launch timeline: when each threat hits, when each rule is on ----------
(function timeline() {
  const T = [0, 60, 600, 3600, 86400, 604800, 2592000], LAB = ['0', '1m', '10m', '1h', '1d', '7d', '30d'];
  const X = sec => { if (sec <= 0) return 0; for (let i = 0; i < T.length - 1; i++) if (sec <= T[i + 1]) { const a = i === 0 ? 0 : Math.log(T[i]), b = Math.log(T[i + 1]), v = i === 0 ? sec / T[1] : (Math.log(sec) - a) / (b - a); return (i + v) / 6 * 100; } return 100; };
  $('#tlAxis').innerHTML = LAB.map((l, i) => `<span style="left:${i / 6 * 100}%">${l}</span>`).join('');
  const ROWS = [['SNIPERS', 'buy the curve in block one', [0, 120], [0, 600], 'MAX BUY · 10 MIN'], ['BOTS', 'spam buys, block after block', [0, 3600], [0, 3600], 'BUY COOLDOWN · 1 H'], ['WHALES', 'corner the supply', [600, 604800], [0, 604800], 'MAX WALLET · 7 D'], ['DEV DUMP', 'sells the creator bag', [3600, 2592000], [0, 2592000], 'DEV LOCK · 30 D']];
  $('#tlRows').innerHTML = ROWS.map(([n, d, th, ru, rl], i) => `<div class="tl-row"><div class="tl-lab"><b>${n}</b><span>${d}</span></div><div class="tl-track"><i class="tl-threat" style="left:${X(th[0])}%;width:${X(th[1]) - X(th[0])}%;transition-delay:${.15 + i * .18}s"></i><i class="tl-rule" style="left:${X(ru[0])}%;width:${X(ru[1]) - X(ru[0])}%;transition-delay:${.9 + i * .22}s"><em>${rl}</em></i></div></div>`).join('');
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { $('#timeline').classList.add('go'); io.disconnect(); } }, { threshold: .35 }).observe($('#timeline'));
})();

// ---------- 02 the story: scrolling the steps lights the pipeline and the code ----------
(function story() {
  const set = i => { $$('#howSteps li').forEach(l => l.classList.toggle('on', +l.dataset.s === i)); $$('.st').forEach(s2 => s2.classList.toggle('on', +s2.dataset.s === i)); $$('#howCode .ln').forEach(l => l.classList.toggle('on', +l.dataset.s === i)); window.__pipeStep && window.__pipeStep(i); };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.s); }), { rootMargin: '-48% 0px -48% 0px' });
  $$('.st').forEach(s2 => io.observe(s2)); $$('#howSteps li').forEach(l => l.onclick = () => { const st = $(`.st[data-s="${l.dataset.s}"]`); scrollTo({ top: st.getBoundingClientRect().top + scrollY - innerHeight * .4, behavior: 'smooth' }); });
  set(0);
})();

// ---------- 04 the simulator ----------
(function sim() {
  const cv = $('#simCv'), x = cv.getContext('2d'), log = $('#simLog');
  const P = { maxbuy: { cap: 1, win: 10 }, maxwallet: { cap: 2 }, cooldown: { cd: 30 }, devlock: { days: 30 } };
  const DEF = { maxbuy: [['cap', 'max buy', .25, 5, .25, '%'], ['win', 'window', 1, 60, 1, ' min']], maxwallet: [['cap', 'max wallet', .5, 5, .25, '%']], cooldown: [['cd', 'cooldown', 5, 120, 5, 's']], devlock: [['days', 'lock', 1, 90, 1, ' days']] };
  let rule = 'maxbuy', ev = [], t0 = performance.now(), seed = 1, pass = 0, fail = 0, big = 0, wallets = {};
  $('#simRule').innerHTML = RULES.map(r => `<button type="button" data-r="${r.id}"${r.id === rule ? ' class="on"' : ''}>${r.name}</button>`).join('');
  $$('#simRule button').forEach(b => b.onclick = () => { rule = b.dataset.r; $$('#simRule button').forEach(y => y.classList.toggle('on', y === b)); params(); reset(); });
  function params() { $('#simParams').innerHTML = DEF[rule].map(([k, l, a, b, s, u]) => `<div class="prm"><label>${l}<b id="pv_${k}">${P[rule][k]}${u}</b></label><input type="range" min="${a}" max="${b}" step="${s}" value="${P[rule][k]}" data-k="${k}" data-u="${u}"></div>`).join('');
    $$('#simParams input').forEach(i => i.oninput = () => { P[rule][i.dataset.k] = +i.value; $('#pv_' + i.dataset.k).textContent = i.value + i.dataset.u; reset(); }); }
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function reset() { ev = []; t0 = performance.now(); seed = 7; pass = fail = big = 0; wallets = {}; log.innerHTML = ''; stats(); }
  $('#simReset').onclick = reset;
  function stats() { $('#sPass').textContent = pass; $('#sFail').textContent = fail; $('#sBig').textContent = big ? big.toFixed(2) + '%' : '—'; $('#sShare').textContent = pass + fail ? Math.round(fail / (pass + fail) * 100) + '%' : '—'; }
  const LEN = 26;   // seconds of animation for one simulated launch
  function spawn(simMin) {   // a simulated transfer at minute simMin of the launch
    const early = simMin < 3, w = early && rnd() < .5 ? 'sniper' + Math.floor(rnd() * 4) : rnd() < .12 ? 'bot' + Math.floor(rnd() * 2) : 'w' + Math.floor(rnd() * 60);
    let amt = early ? (w.startsWith('sniper') ? 1.5 + rnd() * 4 : .1 + rnd() * 1.2) : .02 + Math.pow(rnd(), 2.2) * 2.4;
    let side = 'buy'; if (rule === 'devlock' && rnd() < .14) { side = 'dev sell'; amt = .5 + rnd() * 3; }
    let ok = true, why = '';
    if (rule === 'maxbuy' && side === 'buy' && simMin < P.maxbuy.win && amt > P.maxbuy.cap) { ok = false; why = `${amt.toFixed(2)}% > ${P.maxbuy.cap}%`; }
    if (rule === 'maxwallet' && side === 'buy') { const h = (wallets[w] || 0) + amt; if (h > P.maxwallet.cap) { ok = false; why = `wallet would hold ${h.toFixed(2)}%`; } else wallets[w] = h; }
    if (rule === 'cooldown' && side === 'buy') { const lastT = wallets[w]; const gapS = lastT == null ? 1e9 : (simMin - lastT) * 60; if (w.startsWith('bot')) amt = .05 + rnd() * .2; if (simMin < 60 && gapS < P.cooldown.cd) { ok = false; why = `${gapS.toFixed(0)}s since last buy`; } else wallets[w] = simMin; }
    if (rule === 'devlock' && side === 'dev sell') { ok = false; why = `creator locked for ${P.devlock.days} days`; }   // the simulated hour is well inside any lock
    if (ok) pass++; else { fail++; big = Math.max(big, amt); }
    ev.push({ simMin, amt, ok, w, side, at: performance.now() }); stats();
    const row = document.createElement('div'); row.className = ok ? 'ok' : 'no'; row.innerHTML = `<span>${esc(side)} ${amt.toFixed(2)}%${why ? ' · ' + esc(why) : ''}</span><b>${ok ? 'passed' : 'reverted'}</b>`;
    log.prepend(row); while (log.children.length > 8) log.lastChild.remove();
  }
  let vis = false, nextAt = 0, seenOnce = false, hiddenAt = 0; new IntersectionObserver(e => { const v = e[0].isIntersecting; if (v && !seenOnce) { seenOnce = true; reset(); } if (!v && vis) hiddenAt = performance.now(); if (v && !vis && hiddenAt) { t0 += performance.now() - hiddenAt; ev.forEach(z => z.at += performance.now() - hiddenAt); } vis = v; }).observe(cv);
  function frame(now) {
    requestAnimationFrame(frame); if (!vis) return;
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(r.width * d)) { cv.width = r.width * d; cv.height = r.height * d; }
    x.setTransform(d, 0, 0, d, 0, 0); const W = r.width, H = r.height; x.clearRect(0, 0, W, H);
    const span = rule === 'devlock' ? 60 : 60, k = (now - t0) / 1000 / LEN, simNow = Math.min(span, k * span);
    if (k < 1 && now > nextAt) { nextAt = now + (simNow < 3 ? 90 : 260) + Math.random() * 120; spawn(simNow); }
    if (k > 1.25) reset();
    const L = 54, R = W - 24, T = 40, B = H - 46, X = m => L + (R - L) * m / span, Y = a => B - (B - T) * Math.min(1, a / 6);
    x.font = '600 10px JBM, monospace'; x.fillStyle = '#767676'; x.strokeStyle = 'rgba(17,17,17,.12)'; x.lineWidth = 1;
    for (let m = 0; m <= span; m += 10) { x.beginPath(); x.moveTo(X(m), T); x.lineTo(X(m), B); x.stroke(); x.fillText(m + 'm', X(m) - 8, B + 18); }
    for (let a = 0; a <= 6; a += 1) { x.beginPath(); x.moveTo(L, Y(a)); x.lineTo(R, Y(a)); x.stroke(); x.fillText(a + '%', L - 30, Y(a) + 3); }
    x.fillStyle = '#111'; x.fillText(rule === 'maxwallet' ? 'BUY SIZE · SHARE OF SUPPLY' : rule === 'cooldown' ? 'BUYS · SHARE OF SUPPLY' : 'TRANSFER SIZE · SHARE OF SUPPLY', L, T - 18); x.fillText('MINUTES SINCE LAUNCH (SIMULATED)', R - 230, B + 36);
    // the rule drawn on the chart
    x.strokeStyle = '#111'; x.setLineDash([4, 5]);
    if (rule === 'maxbuy') { x.fillStyle = 'rgba(17,17,17,.05)'; x.fillRect(L, T, X(P.maxbuy.win) - L, B - T); x.beginPath(); x.moveTo(L, Y(P.maxbuy.cap)); x.lineTo(X(P.maxbuy.win), Y(P.maxbuy.cap)); x.stroke(); x.setLineDash([]); x.fillStyle = '#111'; x.fillText(`MAX BUY ${P.maxbuy.cap}% · FIRST ${P.maxbuy.win} MIN`, L + 8, T + 14); x.fillStyle = '#767676'; x.fillText('CAP', X(P.maxbuy.win) + 6, Y(P.maxbuy.cap) + 3); }
    else if (rule === 'maxwallet') { x.beginPath(); x.moveTo(L, Y(P.maxwallet.cap)); x.lineTo(R, Y(P.maxwallet.cap)); x.stroke(); x.setLineDash([]); x.fillStyle = '#111'; x.fillText(`MAX WALLET ${P.maxwallet.cap}% · WALLET SIZE AFTER EACH BUY`, L + 8, T + 14); }
    else if (rule === 'cooldown') { x.setLineDash([]); x.fillStyle = 'rgba(17,17,17,.05)'; x.fillRect(L, T, R - L, B - T); x.fillStyle = '#111'; x.fillText(`ONE BUY PER WALLET EVERY ${P.cooldown.cd}S`, L + 8, T + 14); }
    else { x.setLineDash([]); x.fillStyle = 'rgba(17,17,17,.05)'; x.fillRect(L, T, R - L, B - T); x.fillStyle = '#111'; x.fillText(`DEV LOCKED · ${P.devlock.days} DAYS`, L + 8, T + 14); }
    x.setLineDash([]);
    // now-line
    x.strokeStyle = 'rgba(17,17,17,.5)'; x.beginPath(); x.moveTo(X(simNow), T); x.lineTo(X(simNow), B); x.stroke();
    for (const e of ev) {
      const a = Math.max(0, Math.min(1, (now - e.at) / 400)), px = X(e.simMin), py = Y(e.amt);
      if (e.ok) { x.fillStyle = e.side === 'buy' ? '#111' : '#111'; x.beginPath(); x.arc(px, py, 3.2 * a, 0, 7); x.fill(); }
      else { x.strokeStyle = '#c23a2b'; x.lineWidth = 1.6; const s = 4.5 * a; x.beginPath(); x.moveTo(px - s, py - s); x.lineTo(px + s, py + s); x.moveTo(px - s, py + s); x.lineTo(px + s, py - s); x.stroke(); x.lineWidth = 1;
        if (now - e.at < 900 && now >= e.at) { x.strokeStyle = `rgba(194,58,43,${1 - (now - e.at) / 900})`; x.beginPath(); x.arc(px, py, 6 + (now - e.at) / 40, 0, 7); x.stroke(); } }
    }
  }
  params(); reset(); requestAnimationFrame(frame);
})();

// ---------- 05 the inspector: a real read of any mint ----------
const T22 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const EXT = {
  transferHook: s => s.programId ? ['warn', 'Transfer hook', `Every transfer calls program <code>${esc(s.programId)}</code>, which can make it fail.${s.authority ? ` <b>${short(s.authority)}</b> can swap that program.` : ' Nobody can change it.'}`] : ['ok', 'Transfer hook (empty)', 'The hook slot exists but no program is set, so transfers aren\'t checked.' + (s.authority ? ` <b>${short(s.authority)}</b> can set one later.` : '')],
  transferFeeConfig: s => { const f = (s.newerTransferFee || s.olderTransferFee || {}); const bps = f.transferFeeBasisPoints ?? 0, au = s.transferFeeConfigAuthority; return [bps > 0 || au ? 'warn' : 'ok', 'Transfer fee', bps > 0 ? `${(bps / 100).toFixed(2)}% of every transfer is withheld as a fee.${au ? ` <b>${short(au)}</b> can change it.` : ''}` : `Set to 0% right now.${au ? ` <b>${short(au)}</b> can raise it later.` : ' Nobody can change it.'}`]; },
  permanentDelegate: s => ['bad', 'Permanent delegate', s.delegate ? `<b>${short(s.delegate)}</b> can move or burn tokens from any wallet, including yours.` : 'A delegate slot with no address set.'],
  mintCloseAuthority: s => ['warn', 'Mint close authority', s.closeAuthority ? `<b>${short(s.closeAuthority)}</b> can close the mint (only once supply is zero).` : 'No one can close the mint.'],
  defaultAccountState: s => [s.accountState === 'frozen' ? 'bad' : 'ok', 'Default account state', s.accountState === 'frozen' ? 'New wallets start frozen until someone unfreezes them.' : 'New wallets start usable.'],
  nonTransferable: () => ['bad', 'Non-transferable', 'The token can\'t be transferred at all.'],
  pausableConfig: s => ['bad', 'Pausable', `${s.authority ? `<b>${short(s.authority)}</b>` : 'An authority'} can pause every transfer.${s.paused ? ' <b>Transfers are paused right now.</b>' : ''}`],
  confidentialTransferMint: () => ['warn', 'Confidential transfers', 'Balances and amounts can be hidden from view.'],
  confidentialTransferFeeConfig: () => ['warn', 'Confidential transfer fees', 'Fees on hidden transfers are hidden too.'],
  confidentialMintBurn: () => ['warn', 'Confidential mint and burn', 'Supply changes can be hidden.'],
  interestBearingConfig: s => ['ok', 'Interest bearing', `Shows ${((s.currentRate || 0) / 100).toFixed(2)}% interest in wallets. Display only: raw balances don't change.`],
  scaledUiAmountConfig: () => ['ok', 'Scaled UI amount', 'Display scaling only. Raw balances don\'t change.'],
  metadataPointer: () => ['ok', 'Metadata pointer', 'Points to where the name and picture live.'],
  tokenMetadata: s => ['ok', 'Token metadata', `Name and symbol stored on the mint${s.name ? `: <b>${esc(s.name)}</b>` : ''}.${s.updateAuthority ? ` <b>${short(s.updateAuthority)}</b> can edit them.` : ''}`],
  groupPointer: () => ['ok', 'Group pointer', 'Part of a token group.'], groupMemberPointer: () => ['ok', 'Group member pointer', 'Member of a token group.'],
  tokenGroup: () => ['ok', 'Token group', 'A collection of tokens.'], tokenGroupMember: () => ['ok', 'Token group member', 'A member of a collection.'],
};
const IC = { ok: '✓', warn: '!', bad: '✕' };
function render(j) {
  if (!j.ok) return `<div class="empty"><b>Couldn't read that.</b><br>${esc(j.error || 'unknown error')}</div>`;
  const rows = [], ext = j.extensions || [];
  for (const e of ext) { const f = EXT[e.extension]; rows.push(f ? f(e.state || {}) : ['warn', e.extension, 'An extension the inspector doesn\'t know yet.']); }
  if (j.mintAuthority) rows.push(['warn', 'Mint authority', `<b>${short(j.mintAuthority)}</b> can still create new tokens.`]); else rows.push(['ok', 'Mint authority', 'Revoked: supply is fixed.']);
  if (j.freezeAuthority) rows.push(['warn', 'Freeze authority', `<b>${short(j.freezeAuthority)}</b> can freeze any wallet's tokens.`]); else rows.push(['ok', 'Freeze authority', 'Revoked: nobody can freeze wallets.']);
  const lv = rows.some(r => r[0] === 'bad') ? 'bad' : rows.some(r => r[0] === 'warn') ? 'warn' : 'ok';
  const V = { ok: 'CLEAN', warn: 'CAUTION', bad: 'CONTROLLED' }[lv];
  const tk = j.token || {}, prog = j.program === 'spl-token-2022' ? 'Token-2022' : j.program === 'spl-token' ? 'SPL Token (classic)' : j.program;
  return `<div class="verdict">${pic(j.mint, tk.icon, false)}<div><div class="vn">${esc(tk.name || 'Unnamed token')}${tk.symbol ? ' · $' + esc(tk.symbol) : ''}</div><div class="vm">${esc(j.mint)}</div></div><span class="vbadge ${lv}">${V}</span></div>
    <div class="facts"><div><small>program</small><b>${esc(prog)}</b></div><div><small>extensions</small><b>${ext.length}</b></div><div><small>supply</small><b>${j.uiSupply != null ? Number(j.uiSupply).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</b></div><div><small>market cap</small><b>${usd(tk.mcap)}</b></div></div>
    <div class="exts">${rows.map(([l, n, dsc]) => `<div class="ext"><span class="ic ${l}">${IC[l]}</span><span class="en">${esc(n)}</span><span class="ed">${dsc}</span></div>`).join('')}</div>
    <p class="dim" style="font-size:12.5px;margin-top:10px">Read from the mint account on Solana mainnet just now${j.slot ? ` (slot ${j.slot.toLocaleString('en-US')})` : ''}. CONTROLLED means someone other than you can move, block or freeze holders' tokens.</p>`;
}
async function inspect(m) {
  m = (m || '').trim(); if (!m) return; $('#mint').value = m; $('#out').innerHTML = '<div class="empty">Reading the chain…</div>';
  try { const r = await fetch('/api/inspect?mint=' + encodeURIComponent(m)); const j = await r.json(); $('#out').innerHTML = render(j); }
  catch (e) { $('#out').innerHTML = `<div class="empty"><b>The inspector didn't answer.</b><br>${esc(e.message)}</div>`; }
}
$('#go').onclick = () => inspect($('#mint').value); $('#mint').onkeydown = e => { if (e.key === 'Enter') inspect($('#mint').value); };
const EX = [['USDC · classic SPL', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'], ['PYUSD · Token-2022', '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo']];
$('#examples').innerHTML = 'try ' + EX.map(([n, m]) => `<button type="button" data-m="${m}">${n}</button>`).join('');
$$('#examples button').forEach(b => b.onclick = () => inspect(b.dataset.m));
(async function board() {
  try {
    const j = await (await fetch('/api/board')).json(); const L = j.tokens || [];
    $('#boardMeta').textContent = L.length ? `${L.length} found among Jupiter's trending and top tokens · ${new Date().toLocaleTimeString()}` : 'none right now among Jupiter\'s trending lists';
    $('#board').innerHTML = L.length ? L.map(t => `<div class="bi" data-m="${esc(t.mint)}">${pic(t.mint, t.icon)}<div><b>${esc(t.symbol ? '$' + t.symbol : t.name || short(t.mint))}</b><small>${esc(t.name || '')} · ${usd(t.mcap)}</small></div><span class="x">${esc((t.tags || []).slice(0, 2).join(' · ') || 'token-2022')}</span></div>`).join('') : '<div class="empty">No Token-2022 coins in Jupiter\'s trending lists right now.</div>';
    $$('#board .bi').forEach(b => b.onclick = () => { inspect(b.dataset.m); $('#inspect').scrollIntoView({ behavior: 'smooth' }); });
  } catch (e) { $('#boardMeta').textContent = 'offline: ' + e.message; }
})();

// ---------- 06 the launch rulebook ----------
(function launch() {
  const L = { maxbuy: { on: true, cap: 1, win: 10 }, maxwallet: { on: true, cap: 2 }, cooldown: { on: false, cd: 30 }, devlock: { on: false, days: 30 } };
  const F = { maxbuy: [['cap', 'max buy %', .25, 5, .25], ['win', 'for the first (min)', 1, 120, 1]], maxwallet: [['cap', 'max wallet %', .5, 10, .5]], cooldown: [['cd', 'seconds between buys', 5, 300, 5]], devlock: [['days', 'lock days', 1, 365, 1]] };
  try { const s = JSON.parse(localStorage.getItem('hooked_rulebook') || 'null'); if (s && s.L) { Object.assign(L, s.L); $('#lName').value = s.name || ''; $('#lSym').value = s.sym || ''; $('#lSun').value = s.sun || '7'; } } catch (e) {}
  $('#lRules').innerHTML = RULES.map(r => `<div class="lr${L[r.id].on ? ' on' : ''}" data-r="${r.id}"><div class="top"><span class="sw"></span><b>${r.name}</b><span class="k2">${r.k.toLowerCase()}</span></div><div class="bd">${F[r.id].map(([k, l, a, b, s]) => `<label>${l}<input type="number" min="${a}" max="${b}" step="${s}" value="${L[r.id][k]}" data-k="${k}"></label>`).join('')}</div></div>`).join('');
  $$('.lr').forEach(el => { el.querySelector('.top').onclick = () => { const r = el.dataset.r; L[r].on = !L[r].on; el.classList.toggle('on', L[r].on); book(); };
    el.querySelectorAll('input').forEach(i => i.oninput = () => { L[el.dataset.r][i.dataset.k] = +i.value; book(); }); });
  ['#lName', '#lSym', '#lSun'].forEach(s => $(s).addEventListener('input', book));
  $('#lImg').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#lPv').style.backgroundImage = `url(${r.result})`; $('#lPv').textContent = ''; }; r.readAsDataURL(f); };
  function book() {
    const nm = $('#lName').value.trim() || 'Your coin', sym = ($('#lSym').value.trim() || 'TICKER').toUpperCase().replace(/[^A-Z0-9]/g, ''), sun = $('#lSun').value;
    $('#lFile').textContent = sym.toLowerCase() + '.rulebook';
    const c = s => `<span class="c">${s}</span>`, k = s => `<span class="k">${s}</span>`, v = s => `<span class="v">${s}</span>`;
    const lines = [c('# written into the hook at launch · immutable'), `${k('token')}   = ${v('"' + esc(nm) + '"')}`, `${k('ticker')}  = ${v('"$' + esc(sym) + '"')}`, `${k('program')} = ${v('"token-2022 + transfer hook"')}`, ''];
    if (L.maxbuy.on) lines.push(k('[max_buy]'), `cap      = ${v(L.maxbuy.cap + '%')}  ${c('# of supply, per transfer')}`, `window   = ${v(L.maxbuy.win + ' min')}  ${c('# from launch')}`, '');
    if (L.maxwallet.on) lines.push(k('[max_wallet]'), `cap      = ${v(L.maxwallet.cap + '%')}  ${c('# of supply, per wallet')}`, '');
    if (L.cooldown.on) lines.push(k('[buy_cooldown]'), `seconds  = ${v(L.cooldown.cd)}  ${c('# per wallet, first hour')}`, '');
    if (L.devlock.on) lines.push(k('[dev_lock]'), `days     = ${v(L.devlock.days)}  ${c("# creator's tokens can't move")}`, '');
    if (!RULES.some(r => L[r.id].on)) lines.push(c('# no rule picked: switch one on'), '');
    lines.push(k('[sunset]'), `after    = ${v(sun + (sun === '1' ? ' day' : ' days'))}  ${c('# then a plain token')}`, k('[never]'), `block_sells = ${v('false')}  ${c('# not possible on hooked')}`);
    $('#lBook').innerHTML = lines.join('\n');
    try { localStorage.setItem('hooked_rulebook', JSON.stringify({ L, name: $('#lName').value, sym: $('#lSym').value, sun })); } catch (e) {}
    const st = [!!($('#lName').value.trim() && $('#lSym').value.trim()), RULES.some(r => L[r.id].on), true, $('#lState').classList.contains('on')];
    const curStep = st.findIndex(v => !v); $$('#lSteps li').forEach((li, i) => { li.classList.toggle('done', st[i] && i !== 2); li.classList.toggle('on', i === (curStep < 0 ? 3 : curStep)); });
  }
  book(); $('#lGo').onclick = () => { $('#lState').classList.add('on'); book(); };
})();

// ---------- the end: slow ripples ----------
(function end() {
  const c = $('#endCv'), x = c.getContext('2d'); let vis = false; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(c);
  function f(now) { requestAnimationFrame(f); if (!vis) return; const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(r.width * d)) { c.width = r.width * d; c.height = r.height * d; }
    x.setTransform(d, 0, 0, d, 0, 0); const W = r.width, H = r.height; x.clearRect(0, 0, W, H); const t = now / 1000;
    for (let i = 0; i < 9; i++) { const k = ((t * .12 + i / 9) % 1), rr = 40 + k * Math.max(W, H) * .7; x.strokeStyle = `rgba(17,17,17,${.28 * (1 - k)})`; x.lineWidth = 1; x.beginPath(); x.ellipse(W / 2, H / 2, rr, rr * .32, 0, 0, 7); x.stroke(); } }
  requestAnimationFrame(f);
})();

// ---------- the ticker: real pump.fun coins right now (trending + just launched), checked on-chain for a transfer hook ----------
(function ticker() {
  const box = $('#tick'); if (!box) return;
  const rows = $$('#tick .tk-row').map((r, i) => ({ el: r, k: r.dataset.k, tr: r.querySelector('.tk-track'), off: 0, w: 0, dir: i ? 1 : -1, hov: false, sp: 1, items: [] }));
  const pct = v => v == null ? '' : `<span class="ch ${v >= 0 ? 'up' : 'dn'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v) >= 100 ? Math.round(Math.abs(v)) : Math.abs(v).toFixed(1)}%</span>`;
  const ago = ms => { const s = Math.max(1, Math.round(ms / 1000)); return s < 60 ? s + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd'; };
  const chip = (t, fresh) => `<a class="tc" href="https://pump.fun/coin/${encodeURIComponent(t.mint)}" target="_blank" rel="noopener" title="${esc(t.name)} on pump.fun">`
    + (t.icon ? `<img src="${esc(t.icon)}" alt="" decoding="async" referrerpolicy="no-referrer" data-alt="${esc(t.alt || '')}" data-l="${esc((t.symbol || '?')[0].toUpperCase())}">` : `<i class="ph">${esc((t.symbol || '?')[0].toUpperCase())}</i>`)
    + `<span class="nm">${esc(t.name)}</span><span class="sy">$${esc(t.symbol)}</span>`
    + `<span class="mc">${t.mcap ? usd(t.mcap) : 'new'}</span>`
    + (fresh ? `<span class="ag" data-born="${t.born || ''}">${t.born ? ago(Date.now() - t.born) : ''}</span>` : pct(t.ch1h ?? t.ch5m))
    + `<span class="hk ${t.hook ? 'on' : ''}">${t.hook ? 'hook' : t.t22 ? 't22 · no hook' : 'spl'}</span></a>`;
  function fill(R, list) {
    if (R.hov) { R.pending = list; return; }
    if (!list.length) { R.tr.innerHTML = `<span class="tk-empty">nothing in the feed right now</span>`; R.w = 0; return; }
    const one = list.map(t => chip(t, R.k === 'fresh')).join(''); R.tr.innerHTML = one; const vw = R.el.querySelector('.tk-vp').offsetWidth || innerWidth;
    const w1 = R.tr.scrollWidth; let reps = 1; while ((reps < 2 || R.tr.scrollWidth < vw + w1) && reps < 10) { R.tr.insertAdjacentHTML('beforeend', one); reps++; }
    R.w = (R.tr.scrollWidth + 8) / reps; R.off = R.off % (R.w || 1); R.reps = reps;
  }
  // a picture that fails: try the second source, then the coin's letter
  box.addEventListener('error', e => { const im = e.target; if (im.tagName !== 'IMG') return; if (im.dataset.alt) { const u = im.dataset.alt; im.dataset.alt = ''; im.src = u; return; }
    const i = document.createElement('i'); i.className = 'ph'; i.textContent = im.dataset.l || '?'; im.replaceWith(i); }, true);
  let lastAt = 0;
  async function load() {
    try {
      const d = await fetch('/api/pump').then(r => r.json()); if (!d.ok) throw new Error(d.error || 'feed offline');
      fill(rows[0], d.trending || []); fill(rows[1], d.fresh || []); lastAt = d.at || Date.now();
      const all = [...(d.trending || []), ...(d.fresh || [])], t22 = all.filter(t => t.t22).length;
      $('#tkStat').innerHTML = d.hooks == null ? `${all.length} live coins · on-chain check offline right now`
        : `<b>${d.checked}</b> live coins read on-chain · <b>${t22}</b> already Token-2022 · <b class="z">${d.hooks}</b> with a transfer hook`;
    } catch (e) { $('#tkStat').textContent = 'pump.fun feed offline right now · ' + String(e.message || e).slice(0, 80); }
  }
  load(); setInterval(() => { if (!document.hidden) load(); }, 30000);
  setInterval(() => { if (lastAt) $('#tkAt').textContent = 'updated ' + ago(Date.now() - lastAt) + ' ago'; $$('#tick .ag').forEach(a => { const b = +a.dataset.born; if (b) a.textContent = ago(Date.now() - b); }); }, 1000);
  rows.forEach(R => { const vp = R.el.querySelector('.tk-vp'); vp.addEventListener('pointerenter', () => { R.hov = true; }); vp.addEventListener('pointerleave', () => { R.hov = false; if (R.pending) { const p = R.pending; R.pending = null; fill(R, p); } }); });
  let lastY = scrollY, v = 0, prev = performance.now(), vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(box);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function f(now) { requestAnimationFrame(f); const dt = Math.min(.05, (now - prev) / 1000); prev = now; const dy = scrollY - lastY; lastY = scrollY; v += (dy - v) * .1; if (!vis || RM) return;
    rows.forEach(R => { if (!R.w) return; R.sp += ((R.hov ? 0 : 1) - R.sp) * Math.min(1, dt * 4); R.off += R.dir * R.sp * (38 + Math.min(600, Math.abs(v) * 22)) * dt;
      const o = ((R.off % R.w) + R.w) % R.w; R.tr.style.transform = `translate3d(${-o}px,0,0)`; }); })(prev);
})();
