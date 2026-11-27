// Content script, public contracts map only. Reads the map's own cursor-coordinate pill at the moment of a click
// on the map, turns it into a block number locally and asks our background worker for the teaser.
// No requests to e-qazyna, no network interception, nothing read outside the map and the pill.
(function () {
  if (window.top !== window) return;
  const { blockCode, parseDms } = self.QaznedrBlock;
  let panel = null;
  let lastCode = null;
  let down = null;

  function pillText() {
    for (const pill of document.querySelectorAll('.rounded-pill')) {
      if ((pill.textContent.match(/°/g) || []).length === 2) return pill.textContent;
    }
    // Fallback if the class changes: a short element inside the map with two ° ′ ″ values.
    const viewport = document.querySelector('.ol-viewport');
    const scope = (viewport && viewport.parentElement) || document.body;
    for (const el of scope.querySelectorAll('div,span')) {
      if (el.childElementCount === 0 && el.textContent.length < 80 && (el.textContent.match(/°/g) || []).length === 2) return el.textContent;
    }
    return '';
  }

  function ensurePanel() {
    if (panel) return panel;
    const host = document.createElement('div');
    host.id = 'qaznedr-block-panel';
    document.documentElement.appendChild(host);
    panel = self.QaznedrPanel.mount(host, false);
    return panel;
  }

  async function show(code) {
    const stored = (await chrome.storage.local.get('lang')).lang;
    const seg = (location.pathname.split('/')[1] || '').toLowerCase();
    const lang = stored || (seg === 'kk' || seg === 'kz' ? 'kz' : seg === 'en' ? 'en' : seg === 'zh' ? 'zh' : 'ru');
    const p = ensurePanel();
    p.show({ kind: 'wait', code }, lang);
    const res = await chrome.runtime.sendMessage({ type: 'block', code }).catch(() => ({ error: 'fail' }));
    if (code !== lastCode) return; // a newer click won
    p.show(res && res.data ? { kind: 'data', code, data: res.data } : { kind: 'error', code, ...res }, lang);
  }

  document.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; }, true);
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('.ol-viewport')) return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return; // a drag, not a click
    const pt = parseDms(pillText());
    if (!pt) return;
    const code = blockCode(pt.lon, pt.lat);
    if (!code) return;
    lastCode = code;
    show(code);
  }, true);
})();
