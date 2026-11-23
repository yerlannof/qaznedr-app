// Service worker: the only place that talks to qaznedr.kz. Holds the personal access key
// (pilot: each participant gets their own key and pastes it into the extension window).
const API = 'https://qaznedr.kz/api/ext';

async function fingerprint() {
  const n = self.navigator;
  const raw = [n.userAgent, n.language, (n.languages || []).join(','), n.hardwareConcurrency, n.deviceMemory,
    Intl.DateTimeFormat().resolvedOptions().timeZone, n.platform || ''].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

async function block(code) {
  const { key } = await chrome.storage.local.get('key');
  if (!key) return { error: 'no_key' };
  const fp = await fingerprint();
  const r = await fetch(`${API}/block/${encodeURIComponent(code)}`, { headers: { 'x-qz-key': key, 'x-qz-fp': fp } });
  const j = await r.json().catch(() => ({}));
  if (r.ok) return { data: j };
  return { error: j.error || 'fail', perDay: j.perDay };
}

async function call(path, init) {
  const { key } = await chrome.storage.local.get('key');
  if (!key) return { error: 'no_key' };
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...(init && init.headers), 'x-qz-key': key } });
  return r;
}

// Showcase (T-0220): overlay picture as a data URL (messages carry JSON only), chat queue.
async function showcaseMap(code, id) {
  const r = await call(`/showcase/${encodeURIComponent(code)}/${encodeURIComponent(id)}`);
  if (!(r instanceof Response) || !r.ok) return { error: 'fail' };
  const buf = new Uint8Array(await r.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return { dataUrl: 'data:image/jpeg;base64,' + btoa(bin) };
}

async function chatAsk(code, q) {
  const r = await call('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, q }) });
  if (!(r instanceof Response)) return r;
  return r.json().catch(() => ({ error: 'fail' }));
}

async function chatGet(id) {
  const r = await call(`/chat/${encodeURIComponent(id)}`);
  if (!(r instanceof Response)) return r;
  return r.json().catch(() => ({ error: 'fail' }));
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  const done = (p) => { p.then(reply, () => reply({ error: 'fail' })); return true; };
  if (msg && msg.type === 'scmap' && typeof msg.code === 'string' && typeof msg.id === 'string') return done(showcaseMap(msg.code, msg.id));
  if (msg && msg.type === 'chat' && typeof msg.code === 'string' && typeof msg.q === 'string') return done(chatAsk(msg.code, msg.q));
  if (msg && msg.type === 'chatget' && (typeof msg.id === 'number' || typeof msg.id === 'string')) return done(chatGet(msg.id));
  if (msg && msg.type === 'block' && typeof msg.code === 'string') {
    block(msg.code).then(reply, () => reply({ error: 'fail' }));
    return true;
  }
  return false;
});
