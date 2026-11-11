/* Treechat HTML-ordinal bridge. When this page is minted as an ordinal and shown inside Treechat, the viewer can
   tip the creator through Treechat's wallet. Outside Treechat nothing here does anything.
   Protocol: https://treechat.com/treechat-ordinal (raw postMessage form, so no library needs loading). */
(function () {
  'use strict';
  const inFrame = (() => { try { return window.parent && window.parent !== window; } catch (e) { return true; } })();
  let seq = 0;
  // one request to the parent page; resolves with its result, rejects with its error or on timeout
  function call(type, name, args, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!inFrame) return reject(new Error('Not inside Treechat'));
      const id = 'rhp-' + Date.now().toString(36) + '-' + (++seq);
      const timer = setTimeout(() => { window.removeEventListener('message', onMsg); reject(new Error('No answer from Treechat')); }, timeoutMs);
      function onMsg(ev) {
        const d = ev.data;
        if (ev.source !== window.parent || !d || d.type !== type || d.isInvocation !== false || d.id !== id) return;
        clearTimeout(timer); window.removeEventListener('message', onMsg);
        if (d.status === 'success') resolve(d.result); else { const err = new Error(d.description || 'Treechat refused the request'); err.code = d.code; reject(err); }
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ type, isInvocation: true, id, call: name, args: args || {} }, '*');
    });
  }
  // base58check P2PKH address -> locking script hex (76a914<hash160>88ac). Mainnet addresses only.
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  async function p2pkh(address) {
    if (typeof address !== 'string' || !/^1[1-9A-HJ-NP-Za-km-z]{24,33}$/.test(address)) throw new Error('Not a mainnet payment address');
    let n = 0n; for (const ch of address) n = n * 58n + BigInt(B58.indexOf(ch));
    let hex = n.toString(16); if (hex.length % 2) hex = '0' + hex;
    for (const ch of address) { if (ch === '1') hex = '00' + hex; else break; }
    if (hex.length !== 50 || hex.slice(0, 2) !== '00') throw new Error('Not a mainnet payment address');
    if (window.crypto && window.crypto.subtle) {
      const bytes = new Uint8Array(21); for (let i = 0; i < 21; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      const h = new Uint8Array(await crypto.subtle.digest('SHA-256', await crypto.subtle.digest('SHA-256', bytes)));
      const sum = Array.from(h.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (sum !== hex.slice(42)) throw new Error('Payment address failed its checksum');
    }
    return '76a914' + hex.slice(2, 42) + '88ac';
  }
  let ctxPromise = null;
  const api = {
    // Treechat's context for this ordinal, or null when the page is not running inside Treechat
    context() { if (!ctxPromise) ctxPromise = call('TREECHAT', 'getContext', {}, 2000).catch(() => null); return ctxPromise; },
    // who a tip goes to: the ordinal's creator, or its current owner if the creator is unknown
    async payee() {
      const c = await api.context(); if (!c) return null;
      for (const who of [c.creator, c.owner]) if (who && typeof who.address === 'string') return { address: who.address, username: who.username || null };
      return null;
    },
    // ask the viewer's Treechat wallet to pay `sats` to the payee. Treechat shows its own confirmation.
    async tip(sats) {
      const to = await api.payee(); if (!to) throw new Error('Treechat did not say who to pay');
      const lockingScript = await p2pkh(to.address);
      return call('CWI', 'createAction', { description: 'Tip for Ruth Heasman Pinball', outputs: [{ lockingScript, satoshis: sats, outputDescription: 'Tip to the artist' }] }, 10 * 60 * 1000);
    },
    p2pkh
  };
  window.WHTreechat = api;
})();
