// Service worker: the only place that talks to qaznedr.kz. Holds the random install key.
const API = 'https://qaznedr.kz/api/ext';

async function fingerprint() {
  const n = self.navigator;
  const raw = [n.userAgent, n.language, (n.languages || []).join(','), n.hardwareConcurrency, n.deviceMemory,
    Intl.DateTimeFormat().resolvedOptions().timeZone, n.platform || ''].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

async function installKey(fp) {
  const { key } = await chrome.storage.local.get('key');
  if (key) return { key };
  const r = await fetch(`${API}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fp }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.key) return { error: j.error || 'fail' };
  await chrome.storage.local.set({ key: j.key });
  return { key: j.key };
}

async function block(code) {
  const fp = await fingerprint();
  let k = await installKey(fp);
  if (k.error) return { error: k.error };
  let r = await fetch(`${API}/block/${encodeURIComponent(code)}`, { headers: { 'x-qz-key': k.key, 'x-qz-fp': fp } });
  if (r.status === 401) { // key lost on the server side: register once more
    await chrome.storage.local.remove('key');
    k = await installKey(fp);
    if (k.error) return { error: k.error };
    r = await fetch(`${API}/block/${encodeURIComponent(code)}`, { headers: { 'x-qz-key': k.key, 'x-qz-fp': fp } });
  }
  const j = await r.json().catch(() => ({}));
  if (r.ok) return { data: j };
  return { error: j.error || 'fail', perDay: j.perDay };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'block' && typeof msg.code === 'string') {
    block(msg.code).then(reply, () => reply({ error: 'fail' }));
    return true;
  }
  return false;
});
