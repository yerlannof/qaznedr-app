import { render } from '@testing-library/react';
import ZoneMap, {
  regionViewBox,
  zonePath,
} from '@/components/showcase/ZoneMap';
import { KZ_MAP, KZ_REGION_SHAPES, projectKz } from '@/lib/geo/kz-regions';

const zhambyl = { center_lat: 43.9, center_lon: 72.9, radius_km: 50 };
const vko = { center_lat: 49.5, center_lon: 81.0, radius_km: 50 };

function points(d: string) {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  return nums.reduce<[number, number][]>((acc, n, i) => {
    if (i % 2 === 0) acc.push([n, nums[i + 1]]);
    return acc;
  }, []);
}

it('draws only translucent circles: no centre marker, labels or coordinates', () => {
  const { container } = render(
    <ZoneMap zones={[zhambyl, vko]} label="Схема" />
  );
  const svg = container.querySelector('svg')!;
  expect(svg).toHaveAttribute('role', 'img');
  expect(svg).toHaveAttribute('aria-label', 'Схема');
  expect(container.querySelectorAll('[data-zone]')).toHaveLength(2);
  const tags = new Set(
    Array.from(svg.querySelectorAll('*')).map((el) => el.tagName.toLowerCase())
  );
  expect([...tags].sort()).toEqual(['g', 'path']);
  for (const el of Array.from(svg.querySelectorAll('*'))) {
    const names = el.getAttributeNames();
    expect(
      names.filter(
        (n) =>
          ![
            'd',
            'class',
            'data-zone',
            'data-region',
            'data-highlight',
            'aria-hidden',
          ].includes(n)
      )
    ).toEqual([]);
  }
});

it('draws the whole country by default', () => {
  const { container } = render(<ZoneMap zones={[zhambyl]} label="x" />);
  expect(container.querySelector('svg')).toHaveAttribute(
    'viewBox',
    `0 0 ${KZ_MAP.width} ${KZ_MAP.height}`
  );
  expect(container.querySelectorAll('[data-region]')).toHaveLength(
    KZ_REGION_SHAPES.length
  );
});

it('zooms to a region no closer than the whole circle', () => {
  const [x, y, w, h] = regionViewBox('zhambyl', [zhambyl]);
  for (const [px, py] of points(zonePath(zhambyl))) {
    expect(px).toBeGreaterThanOrEqual(x);
    expect(px).toBeLessThanOrEqual(x + w);
    expect(py).toBeGreaterThanOrEqual(y);
    expect(py).toBeLessThanOrEqual(y + h);
  }
  expect(w / h).toBeCloseTo(1.6, 5);
});

it('marks the named region and omits shapes outside the window', () => {
  const { container } = render(
    <ZoneMap zones={[zhambyl]} highlight="zhambyl" view="region" label="x" />
  );
  const regions = container.querySelectorAll('[data-region]');
  expect(regions.length).toBeLessThan(KZ_REGION_SHAPES.length);
  expect(container.querySelector('[data-region="zhambyl"]')).toHaveAttribute(
    'data-highlight',
    'true'
  );
});

it('keeps the circle radius true to kilometres', () => {
  const [cx] = projectKz(zhambyl.center_lon, zhambyl.center_lat);
  const xs = points(zonePath(zhambyl)).map(([px]) => px);
  const halfWidth = (Math.max(...xs) - Math.min(...xs)) / 2;
  const kmPerUnitX = 111.32 / (Math.cos((48 * Math.PI) / 180) * 20);
  const scale = Math.cos((zhambyl.center_lat * Math.PI) / 180);
  expect(halfWidth * kmPerUnitX * scale).toBeCloseTo(50, 0);
  expect(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2 - cx)).toBeLessThan(
    0.5
  );
});
