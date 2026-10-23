// GET /api/pump : real pump.fun coins right now. Trending (Jupiter's 5m + 1h trending lists, pump.fun only) and the newest launches,
// plus a chain check of how many of them carry a transfer hook (read with getMultipleAccounts, jsonParsed).
const { rpc, jup, T22 } = require('./_rpc');
const pick = t => ({
  mint: t.id, name: String(t.name || '').slice(0, 40), symbol: String(t.symbol || '').slice(0, 14),
  // pump.fun's own image CDN has every coin's picture (Jupiter's ipfs.io links often fail); Jupiter's link stays as a fallback
  icon: 'https://images.pump.fun/coin-image/' + t.id + '?variant=86x86', alt: t.icon && !/ipfs\.io\//.test(t.icon) ? t.icon : null,
  mcap: t.mcap ?? null, ch5m: t.stats5m?.priceChange ?? null, ch1h: t.stats1h?.priceChange ?? null,
  holders: t.holderCount ?? null, born: Date.parse(t.firstPool?.createdAt || t.createdAt || '') || null, bonded: !!t.graduatedPool, t22: t.tokenProgram === T22,
});
module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  try {
    const [a, b, c] = await Promise.all(['/tokens/v2/toptrending/5m?limit=100', '/tokens/v2/toptrending/1h?limit=100', '/tokens/v2/recent'].map(p => jup(p).catch(() => [])));
    const BAD = /fuck|shit|cunt|n[i1]gg|fag|retard|t[i1]tt?(y|ie|s)|porn|sex|\bcum|rape|nazi|hitler|kkk|pedo|whore|slut|dick|cock|pussy|bitch/i;
    const isPump = t => t && t.id && (t.launchpad === 'pump.fun' || /pump$/.test(t.id)) && !BAD.test((t.name || '') + ' ' + (t.symbol || ''));
    const seen = new Set(), trending = [];
    for (const t of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) if (isPump(t) && !seen.has(t.id)) { seen.add(t.id); trending.push(pick(t)); }
    const fresh = (Array.isArray(c) ? c : []).filter(isPump).map(pick).sort((x, y) => (y.born || 0) - (x.born || 0));
    const T = trending.slice(0, 28), F = fresh.slice(0, 24);
    if (!T.length && !F.length) throw new Error('no pump.fun coins in the feed right now');
    // chain check: does any of them have a transfer hook?
    let checked = 0, hooks = null;
    try {
      // in chunks of 10 (publicnode's cap for getMultipleAccounts)
      const all = [...T, ...F], chunks = []; for (let i = 0; i < all.length; i += 10) chunks.push(all.slice(i, i + 10));
      const rs = await Promise.all(chunks.map(ch => rpc('getMultipleAccounts', [ch.map(t => t.mint), { encoding: 'jsonParsed', commitment: 'confirmed' }], 7000)));
      const value = rs.flatMap(r => r.value || []);
      hooks = 0;
      value.forEach((acc, k) => {
        if (!acc) return; checked++; const i = acc.data?.parsed?.info; const t = all[k]; t.t22 = acc.owner === T22;
        const h = (i?.extensions || []).find(e => e.extension === 'transferHook'); t.hook = !!(h && h.state && h.state.programId); if (t.hook) hooks++;
      });
    } catch (e) { hooks = null; }
    res.setHeader('cache-control', 's-maxage=20, stale-while-revalidate=60');
    res.status(200).json({ ok: true, at: Date.now(), trending: T, fresh: F, checked, hooks });
  } catch (e) { res.status(502).json({ ok: false, error: String(e.message || e).slice(0, 160), trending: [], fresh: [] }); }
};
