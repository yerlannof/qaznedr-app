// Popup: manual block number or coordinate — works even if the portal page changes.
(async function () {
  const { blockCode, parseDms, isBlockCode } = self.QaznedrBlock;
  const HINT = {
    ru: 'Номер блока с карты или координата (СК-42): 48.4998 82.4115 или 48° 29′ 59″ : 82° 24′ 41″',
    kz: 'Картадағы блок нөмірі немесе координата (СК-42): 48.4998 82.4115',
    en: 'Block number from the map or a coordinate (SK-42): 48.4998 82.4115',
  };
  let { lang } = await chrome.storage.local.get('lang');
  lang = self.QaznedrPanel.pickLang(lang);
  const panel = self.QaznedrPanel.mount(document.getElementById('panel'), true);
  document.getElementById('panel').style.display = 'none';
  const paintLang = () => {
    document.querySelectorAll('.lang a').forEach((a) => a.classList.toggle('on', a.dataset.l === lang));
    document.getElementById('hint').textContent = HINT[lang];
  };
  paintLang();
  document.querySelectorAll('.lang a').forEach((a) => a.addEventListener('click', async () => {
    lang = a.dataset.l; await chrome.storage.local.set({ lang }); paintLang();
  }));

  function toCode(q) {
    const s = q.trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ');
    const latin = s.replace(/[а-яё]/gi, (c) => ({ 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'М': 'M', 'К': 'K', 'Л': 'L', 'Н': 'N', 'м': 'M', 'к': 'K', 'л': 'L', 'н': 'N' })[c] || c)
      .replace(/^([klmn])/, (c) => c.toUpperCase()).replace(/\s/g, '');
    if (isBlockCode(latin)) return latin;
    const dms = parseDms(s);
    if (dms) return blockCode(dms.lon, dms.lat);
    const m = s.match(/^(-?\d{2}(?:[.,]\d+)?)[\s,;:]+(-?\d{2}(?:[.,]\d+)?)$/);
    if (m) return blockCode(+m[2].replace(',', '.'), +m[1].replace(',', '.'));
    return null;
  }

  document.getElementById('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = toCode(document.getElementById('q').value);
    document.getElementById('panel').style.display = '';
    if (!code) { panel.show({ kind: 'error', code: '', error: 'bad_code' }, lang); return; }
    panel.show({ kind: 'wait', code }, lang);
    const res = await chrome.runtime.sendMessage({ type: 'block', code }).catch(() => ({ error: 'fail' }));
    panel.show(res && res.data ? { kind: 'data', code, data: res.data } : { kind: 'error', code, ...res }, lang);
  });
})();
