// Runs in the page's own world on the public contracts map only (showcase, T-0220). Finds the portal's OpenLayers map
// object through the React tree and reports its current view (centre, resolution, size) after each render, so the
// extension can draw its overlay in the right place. Reads nothing else and changes nothing on the page.
(function () {
  if (window.top !== window || window.__qzBridge) return;
  window.__qzBridge = true;
  const isMap = (o) => o && typeof o === 'object' && typeof o.getView === 'function' && typeof o.getPixelFromCoordinate === 'function';

  function findMap() {
    let el = document.querySelector('.ol-viewport');
    for (let up = 0; el && up < 8; up++, el = el.parentElement) {
      const k = Object.keys(el).find((n) => n.startsWith('__reactFiber$'));
      if (!k) continue;
      for (let f = el[k], d = 0; f && d < 80; f = f.return, d++) {
        for (const src of [f.memoizedProps, f.stateNode]) {
          if (!src || typeof src !== 'object') continue;
          for (const v of Object.values(src)) if (isMap(v)) return v;
        }
        for (let h = f.memoizedState, i = 0; h && i < 40; h = h.next, i++) {
          const s = h.memoizedState;
          const c = s && typeof s === 'object' && 'current' in s ? s.current : s;
          if (isMap(c)) return c;
        }
      }
    }
    return null;
  }

  let map = null, queued = false;
  function post() {
    queued = false;
    const v = map.getView();
    const vp = map.getViewport().getBoundingClientRect();
    window.postMessage({ source: 'qz-bridge', proj: v.getProjection().getCode(), center: v.getCenter(),
      res: v.getResolution(), rot: v.getRotation(), rect: [vp.left, vp.top, vp.width, vp.height] }, location.origin);
  }
  function schedule() { if (!queued && map) { queued = true; requestAnimationFrame(post); } }

  let tries = 0;
  const timer = setInterval(() => {
    map = findMap();
    if (map || ++tries > 120) {
      clearInterval(timer);
      if (!map) return;
      map.on('postrender', schedule);
      addEventListener('resize', schedule);
      addEventListener('scroll', schedule, true);
      schedule();
    }
  }, 500);
})();
