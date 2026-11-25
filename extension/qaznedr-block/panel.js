// Panel of the Qaznedr block extension: renders into a closed Shadow DOM, never touches the host page's styles.
(function (root) {
  const SITE = 'https://qaznedr.kz';
  const ruPl = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
  const T = {
    ru: {
      block: 'Блок', area: 'Советские отчёты, блок и 5 км вокруг', objects: 'объектов в отчётах',
      stage: 'Высшая стадия изученности', reports: 'Отчётов фонда с объектами на листе 1:100 000', order: 'Заказать справку по блоку',
      about: 'Что такое Qaznedr →', empty: 'В нашей базе точек рядом нет. Это не значит, что в фонде пусто — закажите поиск по листу.', nodata: 'нет данных',
      vols: (n) => `${ruPl(n, 'отчёт', 'отчёта', 'отчётов')} геологов по этому листу 1:100 000`, volsWide: (n) => `${ruPl(n, 'отчёт', 'отчёта', 'отчётов')} по площади вокруг (лист 1:200 000)`,
      soon: 'Точек рядом в нашей базе пока нет. Справку по блоку соберём по этим отчётам за 1–2 дня.',
      prec: 'Точность точек', precs: { A: 'до 0,5 км', B: 'до 3 км', C: 'грубо, 3–5 км' },
      note: 'Названия, координаты и содержания — в справке. Данные — обработка советских геологических отчётов, не сведения о правах. Qaznedr не связан с e-qazyna и Министерством.',
      left: (n, d) => `Осталось сегодня: ${n} из ${d}`, limit: (d) => `Бесплатно — ${d} новых блоков в сутки, на сегодня всё. Справку по блоку можно заказать.`,
      wait: 'Загружаю…', fail: 'Сервер Qaznedr не ответил. Попробуйте ещё раз.', blocked: 'Ключ этой установки отключён: блоки шли подряд по сетке. Напишите нам.',
      installs: 'Слишком много новых установок из этой сети за сутки. Попробуйте завтра.', nometal: 'металл не указан',
      nokey: 'Нужен ключ доступа. Нажмите на значок Qaznedr справа вверху в браузере и вставьте ключ, который вам прислали.', badcode: 'Не понял номер блока или координату.', privacy: 'Конфиденциальность', broken: 'Не работает?', more: 'Ещё',
      stages: { 'месторождение': 'месторождение', 'проявление': 'проявление', 'точка минерализации': 'точка минерализации', 'тип не определён': 'тип не определён' },
    },
    kz: {
      block: 'Блок', area: 'Кеңестік есептер, блок және 5 км айналасы', objects: 'есептердегі объектілер',
      stage: 'Зерттелудің ең жоғары сатысы', reports: '1:100 000 парағындағы объектілері бар қор есептері', order: 'Блок бойынша анықтама тапсыру',
      about: 'Qaznedr деген не →', empty: 'Біздің базада жақын маңда нүкте жоқ. Бұл қорда жоқ деген сөз емес — парақ бойынша іздеу тапсырыңыз.', nodata: 'дерек жоқ',
      vols: () => 'осы 1:100 000 парағы бойынша геологтар есебі', volsWide: () => 'айналадағы аумақ бойынша есеп (1:200 000 парағы)',
      soon: 'Біздің базада жақын маңда нүкте әзірге жоқ. Блок бойынша анықтаманы осы есептер негізінде 1–2 күнде дайындаймыз.',
      prec: 'Нүктелер дәлдігі', precs: { A: '0,5 км-ге дейін', B: '3 км-ге дейін', C: 'дөрекі, 3–5 км' },
      note: 'Атаулар, координаттар және құрамдар — анықтамада. Деректер — кеңестік геологиялық есептерді өңдеу, құқықтар туралы мәлімет емес. Qaznedr e-qazyna және Министрлікпен байланысты емес.',
      left: (n, d) => `Бүгін қалды: ${n} / ${d}`, limit: (d) => `Тегін — тәулігіне ${d} жаңа блок, бүгінге бітті. Блок бойынша анықтама тапсыруға болады.`,
      wait: 'Жүктелуде…', fail: 'Qaznedr сервері жауап бермеді. Қайталап көріңіз.', blocked: 'Бұл орнатудың кілті өшірілді: блоктар тор бойымен қатар жүрді. Бізге жазыңыз.',
      installs: 'Бұл желіден бір тәулікте жаңа орнату тым көп. Ертең көріңіз.', nometal: 'металл көрсетілмеген',
      nokey: 'Кіру кілті керек. Браузердің оң жақ жоғарғы бұрышындағы Qaznedr белгісін басып, сізге жіберілген кілтті қойыңыз.', badcode: 'Блок нөмірі немесе координата танылмады.', privacy: 'Құпиялылық', broken: 'Жұмыс істемей ме?', more: 'Тағы',
      stages: { 'месторождение': 'кен орны', 'проявление': 'кен білінісі', 'точка минерализации': 'минералдану нүктесі', 'тип не определён': 'түрі анықталмаған' },
    },
    en: {
      block: 'Block', area: 'Soviet reports, the block and 5 km around', objects: 'objects in reports',
      stage: 'Highest stage of study', reports: 'Archive reports with objects on the 1:100,000 sheet', order: 'Order a block report',
      about: 'What is Qaznedr →', empty: 'No points near here in our database. That does not mean the archive is empty — order a sheet search.', nodata: 'no data',
      vols: (n) => `geologists’ report${n === 1 ? '' : 's'} on this 1:100,000 sheet`, volsWide: (n) => `report${n === 1 ? '' : 's'} on the surrounding area (1:200,000 sheet)`,
      soon: 'No points near here in our database yet. We will put together a block report from these reports in 1–2 days.',
      prec: 'Point accuracy', precs: { A: 'within 0.5 km', B: 'within 3 km', C: 'rough, 3–5 km' },
      note: 'Names, coordinates and grades are in the report. Data come from processing Soviet geological reports, not from licence records. Qaznedr is not affiliated with e-qazyna or the Ministry.',
      left: (n, d) => `Left today: ${n} of ${d}`, limit: (d) => `Free: ${d} new blocks a day, used up for today. You can order a block report.`,
      wait: 'Loading…', fail: 'The Qaznedr server did not answer. Please try again.', blocked: 'This install key is switched off: blocks went one after another along the grid. Write to us.',
      installs: 'Too many new installs from this network today. Try tomorrow.', nometal: 'commodity not stated',
      nokey: 'An access key is needed. Click the Qaznedr icon at the top right of the browser and paste the key you were sent.', badcode: 'Could not read the block number or coordinate.', privacy: 'Privacy', broken: 'Not working?', more: 'More',
      stages: { 'месторождение': 'deposit', 'проявление': 'occurrence', 'точка минерализации': 'mineralisation point', 'тип не определён': 'type not stated' },
    },
  };
  const METAL_EN = {
    'Золото': 'Gold', 'Серебро': 'Silver', 'Медь': 'Copper', 'Свинец': 'Lead', 'Цинк': 'Zinc', 'Молибден': 'Molybdenum',
    'Вольфрам': 'Tungsten', 'Олово': 'Tin', 'Железо': 'Iron', 'Марганец': 'Manganese', 'Хром': 'Chromium', 'Никель': 'Nickel',
    'Кобальт': 'Cobalt', 'Титан': 'Titanium', 'Ванадий': 'Vanadium', 'Уран': 'Uranium', 'Ртуть': 'Mercury', 'Сурьма': 'Antimony',
    'Мышьяк': 'Arsenic', 'Висмут': 'Bismuth', 'Бериллий': 'Beryllium', 'Тантал': 'Tantalum', 'Ниобий': 'Niobium', 'Литий': 'Lithium',
    'Цирконий': 'Zirconium', 'Платина': 'Platinum', 'Алюминий': 'Aluminium', 'Редкие земли': 'Rare earths', 'Фосфориты': 'Phosphorite',
    'Уголь': 'Coal', 'Барит': 'Barite', 'Флюорит': 'Fluorite', 'Графит': 'Graphite', 'Кварц': 'Quartz', 'Бокситы': 'Bauxite',
    'Асбест': 'Asbestos', 'Тальк': 'Talc', 'Гипс': 'Gypsum', 'Бентонит': 'Bentonite', 'Каолин': 'Kaolin', 'Соли': 'Salts',
    'Волластонит': 'Wollastonite', 'Цеолиты': 'Zeolites', 'Вермикулит': 'Vermiculite',
    'Германий': 'Germanium', 'Галлий': 'Gallium', 'Индий': 'Indium', 'Кадмий': 'Cadmium', 'Теллур': 'Tellurium', 'Селен': 'Selenium',
    'Скандий': 'Scandium', 'Рубидий': 'Rubidium', 'Цезий': 'Caesium', 'Стронций': 'Strontium', 'Известняк': 'Limestone', 'Песок': 'Sand',
    'Глины': 'Clays', 'Полиметаллы': 'Base metals', 'Мрамор': 'Marble', 'Доломит': 'Dolomite', 'Слюда': 'Mica', 'Гранат': 'Garnet',
    'Кварциты': 'Quartzite', 'Пьезокварц': 'Piezoquartz', 'Магнезит': 'Magnesite', 'Строительный камень': 'Building stone',
    'Алмазы': 'Diamonds', 'Корунд': 'Corundum', 'Алунит': 'Alunite', 'Андалузит': 'Andalusite', 'Огнеупорное сырьё': 'Refractory raw materials',
  };
  const METAL_KZ = {
    'Золото': 'Алтын', 'Серебро': 'Күміс', 'Медь': 'Мыс', 'Свинец': 'Қорғасын', 'Цинк': 'Мырыш', 'Железо': 'Темір',
    'Уголь': 'Көмір', 'Уран': 'Уран', 'Вольфрам': 'Вольфрам', 'Молибден': 'Молибден', 'Олово': 'Қалайы', 'Никель': 'Никель',
    'Марганец': 'Марганец', 'Хром': 'Хром', 'Фосфориты': 'Фосфорит', 'Редкие земли': 'Сирек жерлер',
  };
  const metalName = (m, lang) => (lang === 'en' ? METAL_EN[m] : lang === 'kz' ? METAL_KZ[m] : null) || m;

  function pickLang(stored) {
    if (stored && T[stored]) return stored;
    const n = (navigator.language || 'ru').slice(0, 2);
    return n === 'kk' ? 'kz' : n === 'en' ? 'en' : 'ru';
  }

  const CSS = `
  :host{all:initial}
  .p{position:fixed;left:110px;top:200px;width:300px;max-width:calc(100vw - 32px);z-index:2147483000;background:#fff;border-radius:14px;
     box-shadow:0 12px 40px rgba(20,30,50,.28);overflow:hidden;border:1px solid #e1e5ec;font:13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#16202b}
  .p.inline{position:static;width:auto;box-shadow:none;border:0;border-radius:0}
  .h{background:#16202b;color:#fff;padding:7px 12px;display:flex;align-items:center;gap:8px;cursor:move;user-select:none}.inline .h{cursor:default}
  .logo{width:20px;height:20px;border-radius:50%;border:2px solid #c8962e;display:grid;place-items:center;color:#c8962e;font-weight:700;font-size:12px}
  .h b{font-size:14px;letter-spacing:.06em}.x{margin-left:auto;background:none;border:0;color:#fff;opacity:.6;font-size:20px;cursor:pointer;line-height:1}
  .b{padding:10px 12px;max-height:calc(100vh - 290px);overflow:auto}
  .p.inline .b{max-height:none}
  .l{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7684}
  .c{font:600 15px/1.3 ui-monospace,Consolas,monospace;margin:1px 0 8px;user-select:all}
  .big{display:flex;align-items:baseline;gap:6px;margin:0 0 2px}.big b{font-size:24px}.big span{color:#3b4450}
  .chips{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}.chip{padding:2px 8px;border-radius:999px;background:#f1ece2;color:#6a4b12;font-size:12px}
  .r{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-top:1px solid #eef0f4}
  .btn{display:block;text-align:center;padding:8px;border-radius:8px;font-weight:600;margin-top:8px;text-decoration:none}
  .pr{background:#c8962e;color:#fff}.se{background:#eef2f7;color:#16202b}
  .msg{margin:6px 0 4px;color:#3b4450}
  .note{font-size:11px;color:#7a8592;margin-top:8px;line-height:1.4}.more{margin-top:6px}.more summary{cursor:pointer;font-size:11.5px;color:#7a8592;list-style:none;text-align:center}.more summary::-webkit-details-marker{display:none}.more summary::after{content:' ▾'}.more[open] summary::after{content:' ▴'}
  .f{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;font-size:11.5px;color:#7a8592;margin-top:8px}.f a{color:#7a8592}`;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function bodyHtml(state, lang) {
    const t = T[lang];
    const L = lang === 'kz' ? 'kz' : lang;
    const order = `${SITE}/${L}/contact?block=${encodeURIComponent(state.code || '')}`;
    let h = `<div class="l">${t.block}</div><div class="c">${esc(state.code || '—')}</div>`;
    if (state.kind === 'wait') return h + `<div class="msg">${t.wait}</div>`;
    if (state.kind === 'error') {
      if (state.error === 'bad_code') return h + `<div class="msg">${t.badcode}</div>`;
      if (state.error === 'no_key') return h + `<div class="msg">${t.nokey}</div>`;
      const m = state.error === 'limit' ? t.limit(state.perDay || 15) : state.error === 'blocked' ? t.blocked
        : state.error === 'too_many_installs' ? t.installs : t.fail;
      return h + `<div class="msg">${m}</div><a class="btn pr" target="_blank" rel="noopener" href="${order}">${t.order}</a>`;
    }
    const d = state.data;
    h += `<div class="l">${t.area}</div>`;
    if (d.found) {
      const chips = (d.metals.length ? d.metals.map((m) => `<span class="chip">${esc(metalName(m, lang))}</span>`).join('')
        : `<span class="chip">${t.nometal}</span>`) + (d.more > 0 ? `<span class="chip">+${esc(d.more)}</span>` : '');
      h += `<div class="big"><b>${esc(d.n)}</b><span>${t.objects}</span></div><div class="chips">${chips}</div>`
        + `<div class="r"><span>${t.stage}</span><b>${esc(t.stages[d.stage] || d.stage)}</b></div>`
        + (d.prec ? `<div class="r"><span>${t.prec}</span><b>${esc(t.precs[d.prec] || d.prec)}</b></div>` : '');
    } else if (d.sheetVolumes > 0 || d.sheetVolumesWide > 0) {
      // Ерлан 26.11 «не пусто + по спросу»: вместо «пусто» — сколько отчётов у нас по листу и срок справки
      const own = d.sheetVolumes > 0; const n = Number(own ? d.sheetVolumes : d.sheetVolumesWide);
      h += `<div class="big"><b>${esc(n)}</b><span>${own ? t.vols(n) : t.volsWide(n)}</span></div>`
        + `<div class="msg">${t.soon}</div>`;
    } else {
      h += `<div class="msg">${t.empty}</div>`;
    }
    if (d.found || d.sheetReports > 0) {
      h += `<div class="r"><span>${t.reports} ${esc(d.sheet)}</span><b>${d.sheetReports > 0 ? esc(d.sheetReports) : t.nodata}</b></div>`;
    }
    if (d.showcase && root.QaznedrShowcase) h += root.QaznedrShowcase.html(d);
    if (d.showcase && root.QaznedrCost) h += root.QaznedrCost.html(); // calculator: showcase keys first (T-0220, 25.11)
    h += `<a class="btn pr" target="_blank" rel="noopener" href="${order}">${t.order}</a>`
      + `<details class="more"><summary>${t.more}</summary>` // Мухтар 25.11: панель компактнее — сноска, лимит и ссылки под «Ещё»
      + `<a class="btn se" target="_blank" rel="noopener" href="${SITE}/${L}">${t.about}</a>`
      + `<div class="note">${t.note}</div>`
      + `<div class="f"><span>${d.unlimited ? 'Без лимита · тестировщик' : t.left(d.left, d.perDay)}</span><span><a target="_blank" rel="noopener" href="${SITE}/${L}/legal/extension">${t.privacy}</a> · <a target="_blank" rel="noopener" href="${SITE}/${L}/contact?block=${encodeURIComponent(d.code)}">${t.broken}</a></span></div></details>`;
    return h;
  }

  /** Mount (or reuse) the panel. `inline` = inside the popup, no fixed position and no close button. */
  function mount(host, inline) {
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `<style>${CSS}${root.QaznedrShowcase ? root.QaznedrShowcase.CSS : ''}${root.QaznedrCost ? root.QaznedrCost.CSS : ''}</style><div class="p${inline ? ' inline' : ''}"><div class="h"><div class="logo">Q</div><b>QAZNEDR</b>${inline ? '' : '<button class="x" aria-label="close">×</button>'}</div><div class="b"></div></div>`;
    const body = shadow.querySelector('.b');
    const x = shadow.querySelector('.x');
    if (x) x.addEventListener('click', () => { host.style.display = 'none'; });
    if (!inline) { // drag by the header so the portal's own side list stays visible; position is remembered
      const box = shadow.querySelector('.p');
      const head = shadow.querySelector('.h');
      // the body scrolls inside the window whatever the panel's position (24.11: on an 800 px screen its bottom was cut off)
      const fit = () => { body.style.maxHeight = Math.max(160, innerHeight - box.getBoundingClientRect().top - 70) + 'px'; };
      const place = (l, t) => {
        box.style.left = Math.max(0, Math.min(l, innerWidth - 120)) + 'px';
        box.style.top = Math.max(0, Math.min(t, innerHeight - 60)) + 'px';
        fit();
      };
      addEventListener('resize', fit);
      fit();
      try { chrome.storage.local.get('pos').then((v) => { if (v.pos) place(v.pos.l, v.pos.t); }); } catch (e) { /* popup or no storage */ }
      head.addEventListener('pointerdown', (ev) => {
        if (ev.target.closest('.x')) return;
        const r = box.getBoundingClientRect(); const dx = ev.clientX - r.left; const dy = ev.clientY - r.top;
        head.setPointerCapture(ev.pointerId);
        const move = (m) => place(m.clientX - dx, m.clientY - dy);
        const up = () => {
          head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', up);
          const b = box.getBoundingClientRect(); try { chrome.storage.local.set({ pos: { l: b.left, t: b.top } }); } catch (e) { /* ignore */ }
        };
        head.addEventListener('pointermove', move); head.addEventListener('pointerup', up);
      });
    }
    return {
      show(state, lang) {
        host.style.display = '';
        const render = () => {
          body.innerHTML = bodyHtml(state, pickLang(lang));
          if (root.QaznedrCost) root.QaznedrCost.wire(body, render);
          const sc = root.QaznedrShowcase;
          if (!sc || inline) return;
          if (state.kind === 'data' && state.data.showcase) sc.wire(body, state.data, render);
          else sc.clear();
        };
        render();
      },
    };
  }

  root.QaznedrPanel = { mount, pickLang, T };
})(typeof self !== 'undefined' ? self : this);
