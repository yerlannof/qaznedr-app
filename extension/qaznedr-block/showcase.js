// Showcase of the full plugin (T-0220, 24.11): on a few blocks, for keys with the showcase flag only.
// 1) Soviet geological maps drawn over the portal's own map (switch + transparency), 2) rights on the block from our
// dated snapshot, 3) a chat with a geologist that answers from the block's report volumes. Internal, not for buyers.
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const R = 6378137;
  const merc = (lon, lat) => [R * lon * Math.PI / 180, R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];

  const st = { on: new Set(), opacity: 0.65, imgs: new Map(), view: null, sc: null, bounds: null, canvas: null, chats: new Map() };

  addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.source !== 'qz-bridge') return;
    st.view = ev.data;
    draw();
  });

  function canvas() {
    if (st.canvas) return st.canvas;
    const c = document.createElement('canvas');
    c.id = 'qaznedr-overlay';
    c.style.cssText = 'position:fixed;pointer-events:none;z-index:2147482000;left:0;top:0';
    document.documentElement.appendChild(c);
    st.canvas = c;
    return c;
  }

  function draw() {
    const v = st.view;
    if (!v || !st.sc) { if (st.canvas) st.canvas.style.display = 'none'; return; }
    const c = canvas();
    const [left, top, w, h] = v.rect;
    const dpr = devicePixelRatio || 1;
    c.style.display = '';
    c.style.left = left + 'px'; c.style.top = top + 'px'; c.style.width = w + 'px'; c.style.height = h + 'px';
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (v.proj !== 'EPSG:3857' || Math.abs(v.rot) > 1e-6) return; // only the portal's normal north-up web map
    const px = (lon, lat) => { const [x, y] = merc(lon, lat); return [(x - v.center[0]) / v.res + w / 2, (v.center[1] - y) / v.res + h / 2]; };
    g.globalAlpha = st.opacity;
    for (const m of st.sc.maps) {
      const img = st.imgs.get(m.id);
      if (!st.on.has(m.id) || !img || !img.complete) continue;
      const [x0, y0] = px(m.bounds[0], m.bounds[3]);
      const [x1, y1] = px(m.bounds[2], m.bounds[1]);
      g.drawImage(img, x0, y0, x1 - x0, y1 - y0);
    }
    g.globalAlpha = 1;
    if (st.bounds) {
      const [x0, y0] = px(st.bounds[0], st.bounds[3]);
      const [x1, y1] = px(st.bounds[2], st.bounds[1]);
      g.lineWidth = 2.5; g.strokeStyle = '#c8962e'; g.setLineDash([6, 4]);
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }
  }

  async function loadImg(code, id) {
    if (st.imgs.has(id)) return true;
    const r = await chrome.runtime.sendMessage({ type: 'scmap', code, id }).catch(() => ({ error: 'fail' }));
    if (!r || !r.dataUrl) return false;
    const img = new Image();
    await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = r.dataUrl; });
    st.imgs.set(id, img);
    return true;
  }

  function html(d) {
    const sc = d.showcase;
    if (!st.on.size && sc.maps[0]) st.on.add(sc.maps[0].id); // first map on by default
    const r = sc.rights || {};
    const maps = sc.maps.map((m) => `<label class="sm"><input type="checkbox" data-map="${esc(m.id)}"${st.on.has(m.id) ? ' checked' : ''}>
      <span><b>${esc(m.title)}</b><i>${esc(m.note)}</i></span></label>`).join('');
    const items = (r.items || []).map((x) => `<li>${esc(x)}</li>`).join('') || '<li>ограничений в срезе нет</li>';
    const apps = (r.apps || []).length ? r.apps.map((x) => `<li>${esc(x)}</li>`).join('') : '<li>заявок на разведку нет</li>';
    const chats = (st.chats.get(d.code) || []).map(chatHtml).join('');
    return `<div class="sc"><div class="sct">ВИТРИНА · ${esc(sc.title)}</div>
      <div class="l">Карты поверх портала</div>${maps}
      <div class="sr"><span>Прозрачность</span><input type="range" class="qz-op" min="10" max="100" value="${Math.round(st.opacity * 100)}"></div>
      <div class="l">Права по блоку · срез ${esc(r.date || '')}</div><ul class="ul">${items}</ul>
      <div class="l">Заявки на разведку · кабинет ${esc(r.apps_date || '')}</div><ul class="ul">${apps}</ul>
      <div class="l">ПУГФН · снимок кабинета ${esc(r.pugfn_date || '')}</div><ul class="ul"><li>${esc(r.pugfn || '')}</li></ul>
      <div class="note">${esc(r.note || '')}</div>
      <div class="l">Спросить геолога по томам блока</div>
      <div class="qa">${chats}</div>
      <textarea class="qz-q" rows="2" maxlength="600" placeholder="Например: какие содержания вольфрама в канавах?"></textarea>
      <button class="btn pr qz-ask" type="button">Спросить</button>
      <div class="note">Отвечает Claude по текстам советских отчётов района, со ссылкой «том, страница». Ответ — 1–3 минуты. «В тексте нет» ≠ «в томе нет».</div></div>`;
  }

  function chatHtml(c) {
    const src = (c.sources || []).map((s) => `<li>${esc(s.vol)}${s.page ? ', стр. ' + esc(s.page) : ''}${s.title ? ' — ' + esc(s.title) : ''}</li>`).join('');
    const ans = c.answer ? esc(c.answer).replace(/\n/g, '<br>') : c.status === 'error' ? 'Не получилось ответить, спросите ещё раз.' : 'Думаю над ответом…';
    return `<div class="q">${esc(c.q)}</div><div class="a">${ans}${src ? `<ul class="ul src">${src}</ul>` : ''}</div>`;
  }

  function wire(body, d, rerender) {
    st.sc = d.showcase;
    st.bounds = self.QaznedrBlock.blockBounds(d.code);
    for (const m of st.sc.maps) if (st.on.has(m.id)) loadImg(d.code, m.id).then(draw);
    body.querySelectorAll('input[data-map]').forEach((el) => el.addEventListener('change', () => {
      const id = el.getAttribute('data-map');
      if (el.checked) { st.on.add(id); loadImg(d.code, id).then(draw); } else { st.on.delete(id); draw(); }
    }));
    const op = body.querySelector('.qz-op');
    if (op) op.addEventListener('input', () => { st.opacity = op.value / 100; draw(); });
    const btn = body.querySelector('.qz-ask');
    const ta = body.querySelector('.qz-q');
    if (btn) btn.addEventListener('click', async () => {
      const q = ta.value.trim();
      if (q.length < 3) return;
      btn.disabled = true;
      const list = st.chats.get(d.code) || [];
      const item = { q, status: 'new' };
      list.push(item); st.chats.set(d.code, list); rerender();
      const r = await chrome.runtime.sendMessage({ type: 'chat', code: d.code, q }).catch(() => ({ error: 'fail' }));
      if (!r || !r.id) { item.status = 'error'; item.answer = r && r.error === 'limit' ? `На сегодня вопросы закончились (${r.perDay} в сутки).` : null; rerender(); return; }
      for (let i = 0; i < 60; i++) {
        await new Promise((ok) => setTimeout(ok, 5000));
        const g = await chrome.runtime.sendMessage({ type: 'chatget', id: r.id }).catch(() => null);
        if (g && (g.status === 'done' || g.status === 'error')) { Object.assign(item, g); break; }
      }
      if (item.status !== 'done' && !item.answer) { item.status = 'error'; item.answer = 'Ответа нет за 5 минут: наша машина, видимо, выключена. Вопрос остался в очереди.'; }
      rerender();
    });
    draw();
  }

  function clear() { st.sc = null; st.bounds = null; draw(); }

  const CSS = `.sc{margin-top:14px;padding-top:12px;border-top:2px solid #c8962e}.sct{font-weight:700;color:#8a6414;margin-bottom:8px;font-size:12.5px;letter-spacing:.04em}
  .sm{display:flex;gap:8px;align-items:flex-start;padding:5px 0;cursor:pointer}.sm b{display:block;font-weight:600;font-size:13px}.sm i{display:block;font-style:normal;color:#7a8592;font-size:11.5px}
  .sr{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:6px 0 10px}.sr input{flex:1}
  .ul{margin:4px 0 10px;padding-left:18px;font-size:13px}.ul li{margin:2px 0}
  .qz-q{width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #d6dbe3;border-radius:8px;padding:8px;font:13px system-ui}
  .q{margin-top:8px;font-weight:600;font-size:13px}.a{background:#f6f7f9;border-radius:8px;padding:8px;font-size:13px;margin-top:4px}.src{color:#5b6573;font-size:12px}`;

  root.QaznedrShowcase = { html, wire, clear, CSS };
})(typeof self !== 'undefined' ? self : this);
