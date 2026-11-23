// Block code of the e-qazyna exploration grid for a point in EPSG:4284 (Pulkovo 1942, degrees).
// Same arithmetic as the portal's public grid script (ol-react-components/razgrafka/razgrafka.js):
// sheet 1:1 000 000 (6°×4°) → 1:100 000 (12×12) → 10′ (3×2, a b v / g d e) → 5′ (2×2, a b / v g) → 1′ (5×5).
// Names are Latin, as the portal prints them: M-44-129-(10e-5a-5).
(function (root) {
  const ROW = ['K', 'L', 'M', 'N'];
  const L10 = ['a', 'b', 'v', 'g', 'd', 'e'];
  const L5 = ['a', 'b', 'v', 'g'];
  const EPS = 1e-9;

  function blockCode(lon, lat) {
    if (!(lon >= 42 && lon < 90 && lat >= 40 && lat < 56)) return null;
    // Work in whole minutes to avoid float drift at cell borders.
    const mx = Math.floor((lon - 42) * 60 + EPS); // 0..2879
    const my = Math.floor((lat - 40) * 60 + EPS); // 0..959
    const sx = Math.floor(mx / 360), sy = Math.floor(my / 240); // 1:1M sheet (6° = 360′, 4° = 240′)
    const rx = mx - sx * 360, ry = my - sy * 240;
    const hx = Math.floor(rx / 30), hy = Math.floor(ry / 20); // 1:100k: 30′ × 20′
    const n100 = (11 - hy) * 12 + (hx + 1);
    const ax = rx - hx * 30, ay = ry - hy * 20;
    const tx = Math.floor(ax / 10), ty = Math.floor(ay / 10); // 10′
    const l10 = L10[(1 - ty) * 3 + tx];
    const bx = ax - tx * 10, by = ay - ty * 10;
    const fx = Math.floor(bx / 5), fy = Math.floor(by / 5); // 5′
    const l5 = L5[(1 - fy) * 2 + fx];
    const cx = bx - fx * 5, cy = by - fy * 5; // 1′
    const n1 = (4 - cy) * 5 + (cx + 1);
    return `${ROW[sy]}-${38 + sx}-${n100}-(10${l10}-5${l5}-${n1})`;
  }

  // "48° 29′ 59.2933″ : 82° 24′ 41.5384″" → {lat, lon}; tolerant to ' " and spaces.
  function parseDms(text) {
    const re = /(\d{1,2})\s*°\s*(\d{1,2})\s*[′']\s*(\d{1,2}(?:[.,]\d+)?)\s*[″"]/g;
    const out = [];
    let m;
    while ((m = re.exec(text)) && out.length < 2) {
      out.push(+m[1] + +m[2] / 60 + +m[3].replace(',', '.') / 3600);
    }
    return out.length === 2 ? { lat: out[0], lon: out[1] } : null;
  }

  const BLOCK_RE = /^[KLMN]-(3[89]|4[0-5])-(\d{1,3})-\(10[abvgde]-5[abvg]-(\d{1,2})\)$/;
  function isBlockCode(s) {
    const m = BLOCK_RE.exec(s);
    return !!m && +m[2] >= 1 && +m[2] <= 144 && +m[3] >= 1 && +m[3] <= 25;
  }

  // Inverse of blockCode: [west, south, east, north] of the 1′ cell, in the same degrees.
  function blockBounds(code) {
    const m = /^([KLMN])-(\d{2})-(\d{1,3})-\(10([abvgde])-5([abvg])-(\d{1,2})\)$/.exec(code);
    if (!m) return null;
    const sy = ROW.indexOf(m[1]), sx = +m[2] - 38, n100 = +m[3] - 1, i10 = L10.indexOf(m[4]), i5 = L5.indexOf(m[5]), n1 = +m[6] - 1;
    const mx = sx * 360 + (n100 % 12) * 30 + (i10 % 3) * 10 + (i5 % 2) * 5 + (n1 % 5);
    const my = sy * 240 + (11 - Math.floor(n100 / 12)) * 20 + (1 - Math.floor(i10 / 3)) * 10 + (1 - Math.floor(i5 / 2)) * 5 + (4 - Math.floor(n1 / 5));
    const w = 42 + mx / 60, s = 40 + my / 60;
    return [w, s, w + 1 / 60, s + 1 / 60];
  }

  const api = { blockCode, blockBounds, parseDms, isBlockCode, BLOCK_RE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QaznedrBlock = api;
})(typeof self !== 'undefined' ? self : this);
