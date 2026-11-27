// Popup: manual block number or coordinate — works even if the portal page changes.
(async function () {
  const { blockCode, parseDms, isBlockCode } = self.QaznedrBlock;
  const HINT = {
    ru: 'Номер блока с карты или координата (СК-42): 48.4998 82.4115 или 48° 29′ 59″ : 82° 24′ 41″',
    kz: 'Картадағы блок нөмірі немесе координата (СК-42): 48.4998 82.4115',
    en: 'Block number from the map or a coordinate (SK-42): 48.4998 82.4115',
    zh: '地图上的区块编号或坐标（СК-42）：48.4998 82.4115',
  };
  const KEY = {
    ru: { hint: 'Вставьте ключ доступа, который вам прислали, и нажмите OK.', ok: 'Ключ сохранён.', bad: 'Это не похоже на ключ: проверьте, что скопировали целиком.', set: 'Ключ доступа есть', change: 'сменить' },
    kz: { hint: 'Сізге жіберілген кілтті қойып, OK басыңыз.', ok: 'Кілт сақталды.', bad: 'Бұл кілтке ұқсамайды: толық көшірілгенін тексеріңіз.', set: 'Кілт бар', change: 'ауыстыру' },
    en: { hint: 'Paste the access key you were sent and press OK.', ok: 'Key saved.', bad: 'This does not look like a key: check it was copied in full.', set: 'Access key is set', change: 'change' },
    zh: { hint: '粘贴发给您的访问密钥，然后点 OK。', ok: '密钥已保存。', bad: '这不像密钥：请检查是否完整复制。', set: '已有访问密钥', change: '更换' },
  };
  let { lang } = await chrome.storage.local.get('lang');
  lang = self.QaznedrPanel.pickLang(lang);
  const panel = self.QaznedrPanel.mount(document.getElementById('panel'), true);
  document.getElementById('panel').style.display = 'none';
  const paintLang = () => {
    document.querySelectorAll('.lang a').forEach((a) => a.classList.toggle('on', a.dataset.l === lang));
    document.getElementById('hint').textContent = HINT[lang];
  };
  async function paintKey(msg) {
    const { key } = await chrome.storage.local.get('key');
    const k = KEY[lang];
    document.getElementById('k').hidden = !!key && !msg;
    document.getElementById('khint').textContent = msg || (key ? '' : k.hint);
    const line = document.getElementById('keyline');
    line.innerHTML = '';
    if (key) {
      line.append(`${k.set} (…${key.slice(-4)}) · `);
      const a = document.createElement('a'); a.textContent = k.change;
      a.addEventListener('click', () => { document.getElementById('k').hidden = false; document.getElementById('khint').textContent = k.hint; });
      line.append(a);
    }
  }
  paintLang();
  paintKey();
  document.getElementById('k').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = document.getElementById('kv').value.trim();
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(v)) { paintKey(KEY[lang].bad); return; }
    await chrome.storage.local.set({ key: v });
    document.getElementById('kv').value = '';
    await paintKey(KEY[lang].ok);
    document.getElementById('k').hidden = true;
  });
  document.querySelectorAll('.lang a').forEach((a) => a.addEventListener('click', async () => {
    lang = a.dataset.l; await chrome.storage.local.set({ lang }); paintLang(); paintKey();
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
