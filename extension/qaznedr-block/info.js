// «Tap any block» (T-0220, 27.11): the block report for showcase keys — objects within 5 km with names, fund report
// volumes, pages and a short quote, plus the volumes of the 1:100 000 sheet. The server sends `info` only to installs with
// the showcase flag (Erlan 27.11 «Да, только ключам показа»); for everyone else it is null and nothing here renders.
// Measurements 27.11 (PLATFORM PLAN rule): only quotes checked against the scan for this object are shown; others give the page and what is on it; no holder
// names or rights text; a point less accurate than 2 km is marked «approximately».
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const T = {
    ru: {
      kinds: { 'описание': 'описание объекта', 'таблица': 'таблица', 'каталог': 'строка каталога', 'оглавление': 'оглавление' },
      pageOnly: (p, k, n) => `стр. PDF ${p} — ${k}${n ? ', есть числа' : ''}; цитату покажем после сверки со сканом`,
      cov: 'Изученность по нашей базе', lights: { green: 'много материала', yellow: 'по блоку мало, по листу есть', grey: 'по листу почти ничего' },
      orderN: (n) => `стоит заказать томов: ${n}`, blind: 'Не видно: вторые книги томов, которых нет в базе, и объекты без координат.', full: 'Полный разбор →',
      title: 'Справка по блоку — что есть в отчётах', km: (k) => `${k} км`, approx: (a) => `примерно, ±${a} км`,
      vol: (n, y) => `Отчёт фонда № ${n}${y ? `, ${y}` : ''}`, pages: 'стр. PDF', sign: (n, s) => `знак № ${n} на карте ПИ ${s}`,
      scan: (p) => `стр. PDF ${p} · прочитано со скана`, ocr: (p) => `стр. PDF ${p} · текст распознавания, не сверен со сканом`,
      moreObj: (n) => `и ещё ${n} в 5 км`, sheet: (s) => `Тома фонда по листу ${s}`, own: 'по листу', wide: 'через лист 1:200 000',
      moreVols: (n) => `и ещё ${n}`, allVols: (n) => `все тома листа (${n})`, thin: 'По блоку мало: точек из отчётов в 5 км нет. Вот что есть по листу — эти тома стоит заказать.',
      none: 'По листу в нашей базе томов нет — нужен поиск по каталогу фонда.', nopages: 'страницы не размечены',
      tgf: { SEVER: 'ТГФ Север', VOSTOK: 'ТГФ Восток', ZAPAD: 'ТГФ Запад', YUG: 'ТГФ Юг', TSENTR: 'ТГФ Центр', CENTER: 'ТГФ Центр' }, book: 'кн.',
      cav: 'Оговорки авторов', cavPg: (p) => `PDF стр. ${p} · дословно со скана`,
    },
    kz: {
      kinds: { 'описание': 'нысан сипаттамасы', 'таблица': 'кесте', 'каталог': 'каталог жолы', 'оглавление': 'мазмұны' },
      pageOnly: (p, k, n) => `PDF бет ${p} — ${k}${n ? ', сандар бар' : ''}; үзіндіні сканмен салыстырған соң көрсетеміз`,
      cov: 'Біздің база бойынша зерттелуі', lights: { green: 'материал көп', yellow: 'блок бойынша аз, парақ бойынша бар', grey: 'парақ бойынша жоқтың қасы' },
      orderN: (n) => `тапсыруға тұрарлық том: ${n}`, blind: 'Көрінбейді: базада жоқ томның екінші кітаптары және координатасыз объектілер.', full: 'Толық талдау →',
      title: 'Блок бойынша анықтама — есептерде не бар', km: (k) => `${k} км`, approx: (a) => `шамамен, ±${a} км`,
      vol: (n, y) => `Қор есебі № ${n}${y ? `, ${y}` : ''}`, pages: 'PDF бет', sign: (n, s) => `${s} ПҚ картасындағы № ${n} белгі`,
      scan: (p) => `PDF бет ${p} · сканнан оқылған`, ocr: (p) => `PDF бет ${p} · танылған мәтін, сканмен салыстырылмаған`,
      moreObj: (n) => `5 км ішінде тағы ${n}`, sheet: (s) => `${s} парағы бойынша қор томдары`, own: 'парақ бойынша', wide: '1:200 000 парағы арқылы',
      moreVols: (n) => `тағы ${n}`, allVols: (n) => `парақтың барлық томдары (${n})`, thin: 'Блок бойынша аз: 5 км ішінде есептерден нүкте жоқ. Парақ бойынша барлары — осы томдарды тапсыруға болады.',
      none: 'Біздің базада парақ бойынша том жоқ — қор каталогы бойынша іздеу керек.', nopages: 'беттер белгіленбеген',
      tgf: { SEVER: 'ТГҚ Солтүстік', VOSTOK: 'ТГҚ Шығыс', ZAPAD: 'ТГҚ Батыс', YUG: 'ТГҚ Оңтүстік', TSENTR: 'ТГҚ Орталық', CENTER: 'ТГҚ Орталық' }, book: 'кіт.',
      cav: 'Авторлардың ескертпелері', cavPg: (p) => `PDF бет ${p} · сканнан сөзбе-сөз`,
    },
    en: {
      kinds: { 'описание': 'object description', 'таблица': 'table', 'каталог': 'catalogue entry', 'оглавление': 'contents' },
      pageOnly: (p, k, n) => `PDF p. ${p} — ${k}${n ? ', with figures' : ''}; quote shown once checked against the scan`,
      cov: 'How well our database covers it', lights: { green: 'plenty of material', yellow: 'little on the block, some on the sheet', grey: 'almost nothing on the sheet' },
      orderN: (n) => `volumes worth ordering: ${n}`, blind: 'Not visible: second books of volumes missing from the database, and objects without coordinates.', full: 'Full analysis →',
      title: 'Block report — what the reports say', km: (k) => `${k} km`, approx: (a) => `approximate, ±${a} km`,
      vol: (n, y) => `Archive report No. ${n}${y ? `, ${y}` : ''}`, pages: 'PDF p.', sign: (n, s) => `symbol No. ${n} on the minerals map ${s}`,
      scan: (p) => `PDF p. ${p} · read from the scan`, ocr: (p) => `PDF p. ${p} · recognised text, not checked against the scan`,
      moreObj: (n) => `and ${n} more within 5 km`, sheet: (s) => `Archive volumes on sheet ${s}`, own: 'on the sheet', wide: 'via the 1:200,000 sheet',
      moreVols: (n) => `and ${n} more`, allVols: (n) => `all volumes of the sheet (${n})`, thin: 'Little on this block: no report points within 5 km. Here is what the sheet has — these volumes are worth ordering.',
      none: 'No volumes on this sheet in our database — an archive catalogue search is needed.', nopages: 'pages not marked',
      tgf: { SEVER: 'TGF North', VOSTOK: 'TGF East', ZAPAD: 'TGF West', YUG: 'TGF South', TSENTR: 'TGF Centre', CENTER: 'TGF Centre' }, book: 'book',
      cav: "Authors' caveats", cavPg: (p) => `PDF p. ${p} · verbatim from the scan`,
    },
    zh: {
      kinds: { 'описание': '矿点描述', 'таблица': '表格', 'каталог': '目录条目', 'оглавление': '目录' },
      pageOnly: (p, k, n) => `PDF 第 ${p} 页 — ${k}${n ? '，含数据' : ''}；与扫描件核对后显示引文`,
      cov: '本库资料覆盖程度', lights: { green: '资料丰富', yellow: '区块资料少，图幅有资料', grey: '图幅几乎没有资料' },
      orderN: (n) => `值得订购的报告卷册：${n}`, blind: '看不到的：库中缺少的卷册第二册，以及没有坐标的矿点。', full: '完整分析 →',
      title: '区块资料 — 报告中有什么', km: (k) => `${k} 公里`, approx: (a) => `大约，±${a} 公里`,
      vol: (n, y) => `地质资料库报告 № ${n}${y ? `，${y} 年` : ''}`, pages: 'PDF 页', sign: (n, s) => `${s} 矿产图上的 № ${n} 号符号`,
      scan: (p) => `PDF 第 ${p} 页 · 据扫描件读出（俄文原文）`, ocr: (p) => `PDF 第 ${p} 页 · 识别文本（俄文），未与扫描件核对`,
      moreObj: (n) => `5 公里内另有 ${n} 个`, sheet: (s) => `${s} 图幅的资料库卷册`, own: '本图幅', wide: '经 1:200 000 图幅',
      moreVols: (n) => `另有 ${n} 卷`, allVols: (n) => `本图幅全部卷册（${n}）`, thin: '本区块资料少：5 公里内没有报告中的矿点。以下是本图幅已有资料——这些卷册值得订购。',
      none: '本库中没有本图幅的卷册——需要按资料库目录检索。', nopages: '页码未标注',
      tgf: { SEVER: '北部地区地质资料库', VOSTOK: '东部地区地质资料库', ZAPAD: '西部地区地质资料库', YUG: '南部地区地质资料库', TSENTR: '中部地区地质资料库', CENTER: '中部地区地质资料库' }, book: (k) => `第 ${k} 册`,
      cav: '作者的保留意见', cavPg: (p) => `PDF 第 ${p} 页 · 扫描件逐字原文（俄文）`,
    },
  };

  const CSS = `
  .qi{margin-top:10px;border-top:2px solid #c8962e;padding-top:8px}
  .qi h4{margin:0 0 6px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#6a4b12}
  .qi details.o{border:1px solid #eef0f4;border-radius:8px;padding:5px 7px;margin:5px 0}
  .qi details.o summary{cursor:pointer;list-style:none}.qi details.o summary::-webkit-details-marker{display:none}
  .qi .on{font-weight:600}.qi .ok{color:#6b7684;font-size:12px;white-space:nowrap}
  .qi .om{font-size:12px;color:#3b4450;margin-top:2px}.qi .ap{color:#a2560b;font-size:11.5px}
  .qi .s{margin-top:5px;font-size:12px}.qi .s b{font-weight:600}.qi .t{color:#3b4450}
  .qi .pg{color:#6b7684;font-size:11.5px}
  .qi .cav{margin-top:6px;padding:5px 7px;border-left:3px solid #b9773a;background:#fbf4ec;font-size:12px}
  .qi .cav b{display:block;font-size:11px;letter-spacing:.03em;text-transform:uppercase;color:#7a4a17;margin-bottom:2px}
  .qi .cav q{display:block;margin:3px 0 1px;color:#26303b;quotes:'«' '»'}
  .qi blockquote{margin:4px 0 2px;padding:4px 7px;border-left:3px solid #e1d5bd;background:#faf7f1;font-size:12px;line-height:1.4;color:#26303b}
  .qi .lb{font-size:11px;color:#6b7684}.qi .lb.w{color:#a2560b}
  .qi .v{display:flex;gap:6px;padding:3px 0;border-top:1px solid #f1f3f6;font-size:12px}.qi .v .n{white-space:nowrap;font-weight:600}
  .qi .v .w{color:#8a94a1;white-space:nowrap}
  .qi .cv{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:8px;margin:2px 0 6px;font-size:12px}.qi .cv .dot{flex:0 0 12px;height:12px;border-radius:50%;margin-top:2px}
  .qi .cv.green{background:#eaf6ee}.qi .cv.green .dot{background:#2e9b55}.qi .cv.yellow{background:#fdf6e3}.qi .cv.yellow .dot{background:#d9a21b}.qi .cv.grey{background:#f1f3f6}.qi .cv.grey .dot{background:#9aa3ae}
  .qi .cw{color:#3b4450;margin-top:2px}.qi .cb{color:#7a8592;font-size:11px;margin-top:3px}.qi .cf{display:inline-block;margin-top:4px;color:#6a4b12;font-weight:600;text-decoration:none}.qi .vm summary{cursor:pointer;font-size:12px;color:#6a4b12;margin:4px 0}.qi .dim{color:#6b7684;font-size:12px;margin:4px 0}`;

  const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);

  function volNo(v, t) {
    const m = /^rgf_(\d+)(?:_TGF_([A-Z]+))?(?:_kn(\d+))?/.exec(v || '');
    if (!m) return esc(v || '');
    return esc(m[1]) + (m[2] ? ` (${esc(t.tgf[m[2]] || m[2])})` : '') + (m[3] ? `, ${typeof t.book === 'function' ? t.book(esc(m[3])) : `${t.book} ${esc(m[3])}`}` : '');
  }

  function srcHtml(s, t) {
    let h = `<div class="s"><b>${t.vol(volNo(s.vol, t), esc(s.year || ''))}</b>${s.author ? ` · ${esc(s.author)}` : ''}`;
    if (s.title) h += ` <span class="t">«${esc(s.title)}»</span>`;
    const pages = (s.pages || []).length ? `${t.pages} ${s.pages.map(esc).join(', ')}` : (s.map_sign ? '' : t.nopages);
    const sign = s.map_sign ? t.sign(esc(s.map_sign.n), esc(s.map_sign.sheet)) : '';
    if (pages || sign) h += `<div class="pg">${[pages, sign].filter(Boolean).join(' · ')}</div>`;
    if (s.page_only && !s.quote) h += `<div class="lb">${t.pageOnly(esc(s.page_only.page), esc(t.kinds[s.page_only.kind] || s.page_only.kind), s.page_only.num)}</div>`;
    if (s.quote && s.quote.text) {
      h += `<blockquote>${esc(s.quote.text)}</blockquote>`
        + `<div class="lb${s.quote.scan_read ? '' : ' w'}">${s.quote.scan_read ? t.scan(esc(s.quote.page)) : t.ocr(esc(s.quote.page))}</div>`;
    }
    return h + '</div>';
  }

  // ПЛАТФОРМА 27.11 «Оговорки авторов»: только дословная фраза автора про объект (сверена двумя читателями по скану или
  // взята из графы «что против» Булат-страницы); нет фразы — графы нет вовсе («возражений нет» мы не мерили)
  function cavHtml(cs, t) {
    if (!cs || !cs.length) return '';
    return `<div class="cav"><b>${t.cav}</b>` + cs.map((c) => `<q>${esc(c.text)}</q>`
      + `<div class="pg">${t.vol(volNo(c.vol, t), esc(c.year || ''))} · ${t.cavPg(esc(c.page))}</div>`).join('') + '</div>';
  }

  function html(d, lang, metalName, stageName) {
    const info = d && d.info;
    if (!info) return '';
    const t = T[lang] || T.ru;
    let h = `<div class="qi"><h4>${t.title}</h4>`;
    const L = info.light; // светофор БУЛАТ СТРАНИЦЫ (п.3): изученность по нашей базе, не перспективность
    if (L && t.lights[L.light]) {
      const why = lang === 'ru' ? L.why : lang === 'zh' ? (L.whyZh || '') : '';
      const href = L.page ? (/^https:\/\//.test(L.page) ? L.page : `https://qaznedr.kz/${String(L.page).replace(/^\/+/, '')}`) : '';
      h += `<div class="cv ${esc(L.light)}"><span class="dot"></span><div><b>${t.cov}: ${t.lights[L.light]}</b>`
        + (why ? `<div class="cw">${esc(why)}</div>` : '')
        + (L.orderN > 0 ? `<div class="cw">${t.orderN(esc(L.orderN))}</div>` : '')
        + `<div class="cb">${t.blind}</div>`
        + (href ? `<a class="cf" target="_blank" rel="noopener" href="${esc(href)}">${t.full}</a>` : '') + '</div></div>';
    }
    (info.objects || []).forEach((o, i) => {
      const metals = (o.metals || []).map((m) => esc(metalName(m))).join(', ');
      h += `<details class="o"${i === 0 ? ' open' : ''}><summary><span class="on">${esc(o.name)}</span> <span class="ok">· ${t.km(esc(o.km))}</span>`
        + `<div class="om">${[metals, esc(stageName(o.stage))].filter(Boolean).join(' · ')}`
        + `${o.approx ? ` · <span class="ap">${t.approx(esc(o.acc_km))}</span>` : ''}</div></summary>`
        + (o.src || []).map((s) => srcHtml(s, t)).join('') + cavHtml(o.caveats, t) + '</details>';
    });
    if (info.objectsMore > 0) h += `<div class="dim">${t.moreObj(esc(info.objectsMore))}</div>`;
    const vols = info.vols || [];
    if (!(info.objects || []).length) h += `<div class="dim">${vols.length ? t.thin : t.none}</div>`;
    if (vols.length) {
      const row = (v) => `<div class="v"><span class="n">№ ${volNo(v.vol, t)}</span><span>${esc(v.year || '')} ${v.title ? `«${esc(clip(v.title, 110))}»` : ''}</span>`
        + `<span class="w">${v.own ? t.own : t.wide}</span></div>`;
      const first = (info.objects || []).length ? 3 : 6; // с объектами список томов короче: панель узкая
      h += `<h4 style="margin-top:8px">${t.sheet(esc(d.sheet))}</h4>` + vols.slice(0, first).map(row).join('');
      if (vols.length > first) h += `<details class="vm"><summary>${t.allVols(vols.length + (info.volsMore || 0))}</summary>${vols.slice(first).map(row).join('')}</details>`;
      if (info.volsMore > 0 && vols.length <= first) h += `<div class="dim">${t.moreVols(esc(info.volsMore))}</div>`;
    }
    return h + '</div>';
  }

  root.QaznedrInfo = { html, CSS, T };
})(typeof self !== 'undefined' ? self : this);
