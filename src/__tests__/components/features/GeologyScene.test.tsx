import { act, fireEvent, render, screen } from '@testing-library/react';
import GeologyScene from '@/components/features/GeologyScene';
import { translate } from '@/lib/i18n/translations';

type Media = MediaQueryList & { update: (matches: boolean) => void };
let desktop: Media;
let reduced: Media;
let top: number;

function media(initial: boolean): Media {
  const listeners = new Set<() => void>();
  return {
    matches: initial,
    addEventListener: jest.fn((_, cb) => listeners.add(cb)),
    removeEventListener: jest.fn((_, cb) => listeners.delete(cb)),
    update(matches: boolean) {
      Object.assign(this, { matches });
      listeners.forEach((cb) => cb());
    },
  } as unknown as Media;
}

beforeEach(() => {
  window.sessionStorage.clear();
  jest.useFakeTimers();
  desktop = media(true);
  reduced = media(false);
  top = 64;
  window.matchMedia = jest.fn((query) =>
    query.includes('reduced-motion') ? reduced : desktop
  );
  Object.defineProperty(window, 'innerHeight', {
    value: 900,
    configurable: true,
  });
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(
      () => ({ top, height: 2508, bottom: top + 2508 }) as DOMRect
    );
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function scroll(y: number) {
  top = y;
  act(() => {
    fireEvent.scroll(window);
    jest.advanceTimersByTime(20);
  });
}

it('follows desktop scroll in both directions without moving keyboard focus', () => {
  render(<GeologyScene locale="ru" />);
  const buttons = screen.getAllByRole('button');
  buttons[0].focus();
  expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  scroll(-900);
  expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  scroll(-1608);
  expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
  scroll(64);
  expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  expect(buttons[0]).toHaveFocus();
});

it('lets a mobile visitor select a stage without scrolling, and retains it on locale change', () => {
  desktop.update(false);
  const { rerender } = render(<GeologyScene locale="ru" />);
  fireEvent.click(screen.getAllByRole('button')[2]);
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(window.scrollTo).not.toHaveBeenCalled();
  scroll(-900);
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  rerender(<GeologyScene locale="zh" />);
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    screen.getByText(translate('zh', 'geologyScene.stage3Title'))
  ).toBeVisible();
});

it('uses static explanations and no controls when reduced motion is preferred', () => {
  reduced.update(true);
  render(<GeologyScene locale="en" />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  for (const stage of [1, 2, 3]) {
    expect(
      screen.getByText(translate('en', `geologyScene.stage${stage}Title`))
    ).toBeVisible();
  }
  expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'static');
});

it('reacts to preference and viewport changes and cleans up subscriptions', () => {
  const { unmount } = render(<GeologyScene locale="en" />);
  act(() => reduced.update(true));
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  act(() => {
    desktop.update(false);
    reduced.update(false);
  });
  expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'manual');
  unmount();
  expect(desktop.removeEventListener).toHaveBeenCalledWith(
    'change',
    expect.any(Function)
  );
  expect(reduced.removeEventListener).toHaveBeenCalledWith(
    'change',
    expect.any(Function)
  );
});

it('restores the selected stage after a locale route remount', () => {
  desktop.update(false);
  const first = render(<GeologyScene locale="ru" />);
  fireEvent.click(screen.getAllByRole('button')[2]);
  first.unmount();
  render(<GeologyScene locale="zh" />);
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it('does not require browser storage to select a stage', () => {
  desktop.update(false);
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Storage disabled');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage disabled');
  });
  render(<GeologyScene locale="en" />);
  fireEvent.click(screen.getAllByRole('button')[1]);
  expect(screen.getAllByRole('button')[1]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it('selects the desktop stage only when the scroll reaches it', () => {
  render(<GeologyScene locale="ru" />);
  fireEvent.click(screen.getAllByRole('button')[2]);
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 1672 * 0.83,
    behavior: 'smooth',
  });
  expect(screen.getAllByRole('button')[0]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  scroll(-1608);
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it.each(['ru', 'kz', 'en', 'zh'])(
  'has localized scene labels in %s',
  (locale) => {
    render(<GeologyScene locale={locale} />);
    for (const key of [
      'disclaimer',
      'surface',
      'contacts',
      'base',
      ...[1, 2, 3].flatMap((n) => [
        `stage${n}Title`,
        `stage${n}Body`,
        `stage${n}Question`,
        `stage${n}Label`,
      ]),
    ]) {
      const path = `geologyScene.${key}`;
      expect(translate(locale, path)).not.toBe(path);
      if (locale !== 'ru')
        expect(translate(locale, path)).not.toBe(translate('ru', path));
    }
    expect(
      screen.getByText(translate(locale, 'geologyScene.disclaimer'))
    ).toBeVisible();
  }
);

it('updates the layer pose inside a stage and retraces it immediately on reverse scroll', () => {
  render(<GeologyScene locale="ru" />);
  const section = screen.getByRole('region');
  scroll(64 - 1672 * 0.2);
  expect(Number(section.style.getPropertyValue('--lift'))).toBeCloseTo(1 / 6);
  scroll(64 - 1672 * 0.25);
  expect(Number(section.style.getPropertyValue('--lift'))).toBeCloseTo(1 / 3);
  scroll(64 - 1672 * 0.2);
  expect(Number(section.style.getPropertyValue('--lift'))).toBeCloseTo(1 / 6);
  expect(Number(section.style.getPropertyValue('--focus'))).toBe(0);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

it('clamps fast jumps to both endpoints even outside the viewport', () => {
  render(<GeologyScene locale="ru" />);
  const section = screen.getByRole('region');
  scroll(-4000);
  expect(section.style.getPropertyValue('--lift')).toBe('1');
  expect(section.style.getPropertyValue('--focus')).toBe('1');
  expect(screen.getAllByRole('button')[2]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  scroll(1500);
  expect(section.style.getPropertyValue('--lift')).toBe('0');
  expect(section.style.getPropertyValue('--focus')).toBe('0');
  expect(screen.getAllByRole('button')[0]).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

it('opens the surface before the base, then focuses the revealed contact', () => {
  render(<GeologyScene locale="en" />);
  const section = screen.getByRole('region');
  scroll(64 - 1672 * 0.1);
  expect(section.style.getPropertyValue('--lift')).toBe('0');
  scroll(64 - 1672 * 0.3);
  expect(Number(section.style.getPropertyValue('--lift'))).toBeCloseTo(0.5);
  expect(section.style.getPropertyValue('--drop')).toBe('0');
  expect(section.style.getPropertyValue('--focus')).toBe('0');
  scroll(64 - 1672 * 0.55);
  expect(section.style.getPropertyValue('--lift')).toBe('1');
  expect(Number(section.style.getPropertyValue('--drop'))).toBeCloseTo(0.5);
  expect(section.style.getPropertyValue('--focus')).toBe('0');
  scroll(64 - 1672 * 0.825);
  expect(section.style.getPropertyValue('--drop')).toBe('1');
  expect(Number(section.style.getPropertyValue('--focus'))).toBeCloseTo(0.5);
});

it('takes the middle-stage button to the approved timeline landmark', () => {
  render(<GeologyScene locale="en" />);
  fireEvent.click(screen.getAllByRole('button')[1]);
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 1672 * 0.53,
    behavior: 'smooth',
  });
});

it('uses the approved realistic artwork with a connected contact marker', () => {
  const { container } = render(<GeologyScene locale="en" />);
  const images = [...container.querySelectorAll('img')];
  expect(images).toHaveLength(3);
  images.forEach((image) =>
    expect(image.getAttribute('src')).toContain('geology-realistic.png')
  );
  expect(container.querySelector('svg path')).toHaveAttribute(
    'd',
    'M 740 365 H 710 L 500 545'
  );
});
