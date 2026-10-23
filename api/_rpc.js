// a tiny Solana JSON-RPC client with fallbacks (server side only)
const URLS = [process.env.RPC_URL, 'https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'].filter(Boolean);
async function rpc(method, params, timeout = 9000) {
  let last;
  for (const url of URLS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(timeout) });
      const j = await r.json(); if (j.error) throw new Error(j.error.message || 'rpc error'); return j.result;
    } catch (e) { last = e; }
  }
  throw last || new Error('no rpc');
}
async function jup(path, timeout = 6000) {
  const r = await fetch('https://lite-api.jup.ag' + path, { signal: AbortSignal.timeout(timeout), headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('jupiter ' + r.status); return r.json();
}
const T22 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', SPL = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
module.exports = { rpc, jup, T22, SPL, B58 };
