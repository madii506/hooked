// temporary: brand renders through the Vercel AI Gateway (OIDC, no key). Fixed prompts only.
const P = {
  pfp1: 'A cute but slightly creepy small black jumping spider peeking over the top edge of a glowing white browser window at night, only its fuzzy round head, two huge glossy front eyes reflecting soft ice-blue light and its front legs gripping the edge are visible, dark navy background with a faint spider web, high-end 3D character render, soft rim light, cinematic lighting, shallow depth of field, centered composition, square, no text, no letters, no logo',
  pfp2: 'Portrait of an adorable black jumping spider character with big shiny round black eyes that glow faintly ice blue, fuzzy dark fur with subtle blue rim light, peeking over the edge of a laptop screen in a dark room, the screen glow lights its face from below, premium 3D animated film still, moody, cinematic, centered, square, clean dark background, no text, no letters',
  pfp3: 'Minimal iconic mascot: a small round black spider with two big glowing ice-blue eyes peeking over a white horizontal ledge, legs hooked over the edge, pure deep black background, soft glow, glossy 3D render, high detail, centered, square, no text',
  banner1: 'Ultra-wide cinematic night scene: a huge delicate spider web stretched across the dark, glowing white browser windows and web pages caught in the web like flies, a few small black jumping spiders with glowing ice-blue eyes crawling on the silk threads, dew drops sparkling, deep navy and black palette, the left third of the image is calm empty dark space, high-end 3D render, volumetric light, shallow depth of field, no text, no letters, no logos',
  banner2: 'Wide panoramic night scene seen from inside the internet: an enormous glowing spider web made of thin light threads connecting floating browser windows, tiny black spiders with ice-blue glowing eyes lurking on the threads, soft fog, deep dark blue background, empty dark space on the left side, cinematic 3D render, no text, no letters',
};
module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  const id = String(req.query.id || ''), prompt = P[id]; if (!prompt) return res.status(400).json({ ok: false, error: 'unknown id', ids: Object.keys(P) });
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
