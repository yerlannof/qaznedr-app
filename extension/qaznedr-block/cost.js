// "How much does it cost" (T-0220, 25.11): money for an exploration licence on solid minerals, by the number of blocks.
// Counted in the browser from the text of the law, nothing is sent anywhere. Rates as of 2026:
//   minimum exploration spend — Subsoil Code art. 192 p.2; money on account at filing = year-1 minimum (art. 187 p.5 pp.1);
//   liquidation security — art. 198 + Methodology No. 373 (720 MRP per block, years 1–6; 1 170 MRP, years 7–11);
//   block fee — Tax Code 2026 art. 621 p.1 (per block per year, by licence month and block count);
//   signing bonus — Tax Code art. 762 (100 MRP); extension with 10+ blocks — give up at least 40 % (art. 193 p.3).
// MRP 2026 = 4 325 tenge (Law No. 239-VIII art. 7); every year a new MRP, so tenge after 2026 will be higher.
// Same numbers as data/intake/inbox/2026-10-05_RAZBOR_SASYKBULAK_CONTOUR/license_money.py in the research repo.
(function (root) {
  const MRP = 4325;
  const MAX = 200;
  // art. 192 p.2: [years from, to] → [1 block, 2–5, 6–10, each block over 10]
  const SPEND = [[1, 3, 1200, 1800, 2300, 120], [4, 6, 1200, 2300, 3500, 180], [7, 8, 1800, 3500, 5800, 230],
    [9, 10, 2300, 5800, 8000, 350], [11, 99, 3500, 8000, 11500, 460]];

  function minSpend(year, n) {
    for (const [a, b, one, two5, six10, extra] of SPEND) {
      if (year >= a && year <= b) return n === 1 ? one : n <= 5 ? two5 : n <= 10 ? six10 : six10 + extra * (n - 10);
    }
    throw new RangeError('year ' + year);
  }

  /** Tax Code art. 621 p.1: MRP per block per year for licence month `m` with `n` blocks. */
  function feeRate(m, n) {
    if (m <= 36) return n < 70 ? 15 : n < 120 ? 30 : 40;
    if (m <= 60) return n < 60 ? 23 : n < 100 ? 50 : 60;
    if (m <= 84) return n < 50 ? 32 : n < 100 ? 60 : 80;
    return n < 30 ? 60 : n < 80 ? 80 : 100;
  }

  /** Block fee for licence year `y`, month by month (rate / 12 × blocks), in MRP. */
  function feeYear(y, n) {
    let s = 0;
    for (let m = (y - 1) * 12 + 1; m <= y * 12; m++) s += feeRate(m, n) * n / 12;
    return Math.round(s * 100) / 100;
  }

  function calc(n) {
    n = Math.max(1, Math.min(MAX, Math.floor(Number(n) || 1)));
    const years = [];
    for (let y = 1; y <= 6; y++) years.push({ y, spend: minSpend(y, n), fee: feeYear(y, n) });
    const spend6 = years.reduce((a, r) => a + r.spend, 0);
    const fee6 = years.reduce((a, r) => a + r.fee, 0);
    const keep = n >= 10 ? n - Math.ceil(n * 0.4) : n; // art. 193 p.3 applies from 10 blocks
    return {
      n, mrp: MRP,
      account: minSpend(1, n), security: 720 * n, bonus: 100,
      years, spend6, fee6, total6: spend6 + fee6 + 100,
      ext: { keep, giveUp: n - keep, spend7: minSpend(7, keep), security: 1170 * keep },
    };
  }

  const tg = (mrp) => (mrp * MRP / 1e6).toFixed(2).replace('.', ',') + ' млн ₸';
  const num = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const st = { n: 1 };

  function html() {
    const c = calc(st.n);
    const row = (name, mrp, law) => `<div class="cr"><span>${name}<i>${law}</i></span><b>${tg(mrp)}<i>${num(mrp)} МРП</i></b></div>`;
    const yrs = c.years.map((r) => `<tr><td>${r.y}</td><td>${tg(r.spend)}</td><td>${tg(r.fee)}</td></tr>`).join('');
    const ext = c.n >= 10
      ? `Продление после 6 лет (до 5 лет): отдать не меньше 40 % блоков — останется ${c.ext.keep} из ${c.n}; мин. расходы в 7-й год ${tg(c.ext.spend7)}, обеспечение ${tg(c.ext.security)} (1 170 МРП за блок). <i>ст. 193 п.3</i>`
      : 'Продление после 6 лет (до 5 лет); при 10 блоках и больше надо отдать не меньше 40 %. <i>ст. 193 п.3</i>';
    return `<div class="cs"><div class="sct">СКОЛЬКО СТОИТ · лицензия на разведку ТПИ</div>
      <div class="cn"><span>Блоков в одной заявке</span><button class="qz-m" aria-label="меньше">−</button><input class="qz-n" type="number" min="1" max="${MAX}" value="${c.n}"><button class="qz-p" aria-label="больше">+</button></div>
      <div class="l">До выдачи, разово</div>
      ${row('Деньги на счёте при подаче', c.account, 'ст. 187 п.5: мин. расходы 1-го года, 30 дней подряд за 3 мес. до подачи')}
      ${row('Обеспечение ликвидации', c.security, 'ст. 198, Методика № 373: 720 МРП за блок; гарантия банка, залог вклада или страховка')}
      ${row('Подписной бонус', c.bonus, 'НК ст. 762: в 10 рабочих дней после выдачи')}
      <div class="l">Каждый год</div>
      <table class="ct"><tr><th>год</th><th>мин. расходы<i>ст. 192 п.2</i></th><th>плата за блоки<i>НК ст. 621</i></th></tr>${yrs}
      <tr class="tt"><td>6 лет</td><td>${tg(c.spend6)}</td><td>${tg(c.fee6)}</td></tr></table>
      <div class="cr tot"><span>Всего за 6 лет<i>расходы + плата + бонус; обеспечение не трата, считается отдельно</i></span><b>${tg(c.total6)}</b></div>
      <div class="cx">${ext}</div>
      <div class="cw">Одна заявка = одна лицензия. Соседний блок отдельной заявкой — свои мин. расходы (1 блок = 1 200 МРП в год); 2–5 блоков в одной заявке = 1 800. Число блоков решать до подачи.</div>
      <div class="cx">МРП 2026 = 4 325 ₸. Каждый год МРП новый, после 2026 суммы будут выше. Расчёт по тексту закона на 2026 год, не консультация юриста.</div></div>`;
  }

  function wire(body, rerender) {
    const box = body.querySelector('.cs');
    if (!box) return;
    const set = (n) => {
      const top = body.scrollTop;
      st.n = Math.max(1, Math.min(MAX, Math.floor(Number(n) || 1)));
      rerender();
      body.scrollTop = top;
    };
    box.querySelector('.qz-m').addEventListener('click', () => set(st.n - 1));
    box.querySelector('.qz-p').addEventListener('click', () => set(st.n + 1));
    const inp = box.querySelector('.qz-n');
    inp.addEventListener('change', () => set(inp.value));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') set(inp.value); });
  }

  const CSS = `
  .cs{margin:12px 0 4px;padding:10px 12px;border:1px solid #e6dcc6;border-radius:10px;background:#fcfaf5}
  .cs .l{margin-top:10px}
  .cn{display:flex;align-items:center;gap:6px;margin:6px 0 2px}.cn span{flex:1;font-weight:600}
  .cn button{width:28px;height:28px;border-radius:7px;border:1px solid #d9cfb8;background:#fff;font-size:16px;cursor:pointer;color:#6a4b12}
  .cn input{width:56px;height:28px;border:1px solid #d9cfb8;border-radius:7px;text-align:center;font:inherit;font-weight:700}
  .cr{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid #efe8d9}
  .cr span,.cr b{display:flex;flex-direction:column}.cr b{text-align:right;white-space:nowrap}
  .cs i{font-style:normal;font-weight:400;font-size:11.5px;color:#7a8290;line-height:1.3}
  .ct{width:100%;border-collapse:collapse;font-size:13px;margin-top:2px}
  .ct th{text-align:right;font-weight:600;font-size:12px;padding:2px 0 4px}.ct th:first-child,.ct td:first-child{text-align:left}
  .ct th i{display:block}.ct td{text-align:right;padding:3px 0;border-top:1px solid #efe8d9;white-space:nowrap}
  .ct .tt td{font-weight:700}
  .cr.tot{margin-top:6px;border-top:2px solid #e6dcc6}.cr.tot b{font-size:15px}
  .cw{margin:8px 0 4px;padding:7px 9px;border-radius:8px;background:#fff4dc;color:#5c430f;font-size:12.5px}
  .cx{font-size:12px;color:#5a6270;margin-top:6px}`;

  const api = { calc, minSpend, feeYear, html, wire, CSS, st };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QaznedrCost = api;
})(typeof self !== 'undefined' ? self : this);
