// temporary: brand renders through the Vercel AI Gateway (OIDC, no key). Fixed prompts only.
const P = {
  pfp1: 'Grainy flash photograph taken in a pitch-dark room at 3am: an unsettling pale spider-like creature with long thin jointed legs and a cluster of eight small glowing ice-blue eyes peers over the top edge of a glowing computer monitor, the screen light catches its eyes, it is watching you, uncanny, eerie, found footage aesthetic, heavy film grain, harsh on-camera flash, deep black background, centered, square, no text, no letters',
  pfp2: 'Analog horror still: a weird hairless grey spider creature with too many glossy black eyes and two glowing ice-blue pupils hangs upside down on a silk thread in front of a dark computer screen full of tiny lines of text, the text reflects in its eyes, creepy, uncanny, night vision trail camera look, heavy noise, black background, centered portrait, square, no text, no letters',
  pfp3: 'Extreme close-up of an uncanny spider face emerging from total darkness, eight eyes of different sizes, the two big front eyes glowing pale ice-blue and reflecting a web browser full of text, fine pale hairs, macro photography, eerie, cinematic, deep black background, centered, square, no text, no letters',
  banner1: 'Ultra-wide trail camera night photo inside the internet: an endless dark hallway of glowing old computer monitors showing web pages, long thin pale spider-like creatures with clusters of glowing ice-blue eyes crawl over the monitors and along silk threads strung between them, eerie, uncanny, found footage, heavy grain, slight infrared tint, the left third is empty darkness, no text, no letters',
  banner2: 'Ultra-wide eerie scene: a giant spider web in a pitch-black void with glowing browser windows caught in it like insects, a few pale long-legged spider creatures with clusters of glowing ice-blue eyes lurk at the edges watching the pages, harsh flash photography, film grain, unsettling, cinematic, the left third is empty darkness, no text, no letters',
};
module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  const id = String(req.query.id || ''), prompt = P[id] || (req.query.p ? String(req.query.p).slice(0, 900) : null); if (!prompt) return res.status(400).json({ ok: false, error: 'unknown id', ids: Object.keys(P) });
  const model = String(req.query.m || 'bfl/flux-pro-1.1'), size = id.startsWith('banner') ? (req.query.size || '1536x512') : (req.query.size || '1024x1024');
  const token = process.env.VERCEL_OIDC_TOKEN || req.headers['x-vercel-oidc-token'] || process.env.AI_GATEWAY_API_KEY;
  if (!token) return res.status(500).json({ ok: false, error: 'no OIDC token in this deployment' });
  try {
    const r = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, n: 1, size, seed: req.query.seed ? +req.query.seed : undefined, response_format: 'b64_json' }) });
    const j = await r.json().catch(() => null);
    const b64 = j && j.data && j.data[0] && (j.data[0].b64_json || null), url = j && j.data && j.data[0] && j.data[0].url;
    if (b64) { res.setHeader('content-type', 'image/png'); res.setHeader('cache-control', 'public, s-maxage=31536000'); return res.end(Buffer.from(b64, 'base64')); }
    if (url) { const im = await fetch(url); res.setHeader('content-type', im.headers.get('content-type') || 'image/png'); res.setHeader('cache-control', 'public, s-maxage=31536000'); return res.end(Buffer.from(await im.arrayBuffer())); }
    return res.status(502).json({ ok: false, status: r.status, body: JSON.stringify(j).slice(0, 600) });
  } catch (e) { return res.status(502).json({ ok: false, error: String(e.message || e).slice(0, 300) }); }
};
module.exports.config = { maxDuration: 60 };
