// GET /api/board : Token-2022 coins among Jupiter's trending and top lists right now, with a summary of their extensions
const { rpc, jup, T22 } = require('./_rpc');
const TAG = { transferHook: s => s.programId ? 'hook' : null, transferFeeConfig: s => { const f = s.newerTransferFee || s.olderTransferFee || {}; return f.transferFeeBasisPoints ? 'fee ' + (f.transferFeeBasisPoints / 100) + '%' : null; },
  permanentDelegate: s => s.delegate ? 'delegate' : null, pausableConfig: () => 'pausable', nonTransferable: () => 'soulbound', defaultAccountState: s => s.accountState === 'frozen' ? 'frozen start' : null, interestBearingConfig: () => 'interest' };
module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  try {
    const lists = await Promise.all(['/tokens/v2/toptrending/1h?limit=100', '/tokens/v2/toporganicscore/1h?limit=100', '/tokens/v2/toptraded/1h?limit=100', '/tokens/v2/recent'].map(p => jup(p).catch(() => [])));
    const seen = new Map(); for (const L of lists) for (const t of (Array.isArray(L) ? L : [])) if (t && t.id && !seen.has(t.id)) seen.set(t.id, t);
    let cand = [...seen.values()]; const flagged = cand.filter(t => t.tokenProgram === T22); if (flagged.length || cand.some(t => t.tokenProgram)) cand = flagged;
    cand = cand.slice(0, 100);
    const out = [];
    if (cand.length) {
      const r = await rpc('getMultipleAccounts', [cand.map(t => t.id), { encoding: 'jsonParsed', commitment: 'confirmed' }]);
      (r.value || []).forEach((a, k) => {
        if (!a || a.owner !== T22) return; const i = a.data && a.data.parsed && a.data.parsed.info; if (!i) return; const t = cand[k];
        const tags = []; for (const e of (i.extensions || [])) { const f = TAG[e.extension]; const v = f && f(e.state || {}); if (v) tags.push(v); }
        out.push({ mint: t.id, name: t.name, symbol: t.symbol, icon: t.icon, mcap: t.mcap ?? null, tags, n: (i.extensions || []).length });
      });
    }
    out.sort((a, b) => (b.mcap || 0) - (a.mcap || 0));
    res.setHeader('cache-control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ ok: true, at: Date.now(), checked: cand.length, tokens: out.slice(0, 12) });
  } catch (e) { res.status(502).json({ ok: false, error: String(e.message || e).slice(0, 160), tokens: [] }); }
};
