// GET /api/inspect?mint=<address> : the mint account read from Solana mainnet, with Jupiter's name and picture
const { rpc, jup, T22, SPL, B58 } = require('./_rpc');
module.exports = async (req, res) => {
  const mint = String((req.query && req.query.mint) || '').trim();
  res.setHeader('access-control-allow-origin', '*');
  if (!B58.test(mint)) return res.status(400).json({ ok: false, error: 'That is not a Solana address.' });
  try {
    const [acc, tk] = await Promise.all([
      rpc('getAccountInfo', [mint, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
      jup('/tokens/v2/search?query=' + mint).catch(() => null),
    ]);
    const v = acc && acc.value;
    if (!v) return res.status(404).json({ ok: false, error: 'No account at that address on mainnet.' });
    if (v.owner !== T22 && v.owner !== SPL) return res.status(200).json({ ok: false, error: 'That address is not a token mint (owner ' + v.owner + ').' });
    const p = v.data && v.data.parsed; if (!p || p.type !== 'mint') return res.status(200).json({ ok: false, error: 'That is a token account, not a mint. Paste the token\'s mint address.' });
    const i = p.info, t = Array.isArray(tk) ? tk.find(x => x.id === mint) : null;
    const uiSupply = Number(i.supply) / Math.pow(10, i.decimals || 0);
    res.setHeader('cache-control', 's-maxage=20, stale-while-revalidate=60');
    res.status(200).json({
      ok: true, mint, slot: acc.context && acc.context.slot, program: v.data.program, owner: v.owner, decimals: i.decimals, supply: i.supply, uiSupply,
      mintAuthority: i.mintAuthority || null, freezeAuthority: i.freezeAuthority || null, extensions: i.extensions || [],
      token: t ? { name: t.name, symbol: t.symbol, icon: t.icon, mcap: t.mcap ?? null, price: t.usdPrice ?? null, verified: !!t.isVerified } : null,
    });
  } catch (e) { res.status(502).json({ ok: false, error: 'The chain read failed: ' + String(e.message || e).slice(0, 160) }); }
};
