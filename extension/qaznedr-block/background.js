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

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'block' && typeof msg.code === 'string') {
    block(msg.code).then(reply, () => reply({ error: 'fail' }));
    return true;
  }
  return false;
});
