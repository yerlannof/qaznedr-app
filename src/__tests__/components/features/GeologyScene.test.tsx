import { act, fireEvent, render, screen } from '@testing-library/react';
import GeologyScene from '@/components/features/GeologyScene';
import { translate } from '@/lib/i18n/translations';

type Media = MediaQueryList & { update: (matches: boolean) => void };
let reduced: Media;
let short: Media;
let centers: number[];
let scrollIntoView: jest.Mock;

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
  jest.useFakeTimers();
  reduced = media(false);
  short = media(false);
  centers = [400, 900, 1400];
  window.matchMedia = jest.fn((query) =>
    query.includes('reduced-motion') ? reduced : short
  );
  Object.defineProperty(window, 'innerHeight', {
    value: 900,
    configurable: true,
  });
  scrollIntoView = jest.fn();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const index = Number(this.getAttribute('data-step'));
      const center = this.hasAttribute('data-step') ? centers[index] : 0;
      return {
        top: center - 200,
        height: 400,
        bottom: center + 200,
      } as DOMRect;
    });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function scroll(nextCenters: number[]) {
  centers = nextCenters;
  act(() => {
    fireEvent.scroll(window);
    jest.advanceTimersByTime(20);
  });
}

it('keeps all three explanations in native document flow', () => {
  render(<GeologyScene locale="ru" />);
  const steps = screen.getAllByRole('article');
  expect(steps).toHaveLength(3);
  steps.forEach((step, index) => {
    expect(step).toBeVisible();
    expect(step).not.toHaveAttribute('hidden');
    expect(step).toHaveAttribute('data-step', String(index));
  });
  expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'scroll');
});

it('derives the active step and smooth layer pose from actual step positions in both directions', () => {
  render(<GeologyScene locale="ru" />);
  const section = screen.getByRole('region');
  const controls = screen.getAllByRole('button');
  controls[0].focus();
  scroll([100, 600, 1100]);
  expect(controls[1]).toHaveAttribute('aria-pressed', 'true');
  expect(Number(section.style.getPropertyValue('--lift'))).toBeCloseTo(0.79);
  scroll([-400, 100, 600]);
  expect(controls[2]).toHaveAttribute('aria-pressed', 'true');
  expect(section.style.getPropertyValue('--lift')).toBe('1');
  scroll([400, 900, 1400]);
  expect(controls[0]).toHaveAttribute('aria-pressed', 'true');
  expect(controls[0]).toHaveFocus();
});

it('scrolls a manual stage control to its in-flow explanation without changing focus', () => {
  render(<GeologyScene locale="zh" />);
  const button = screen.getAllByRole('button')[2];
  button.focus();
  fireEvent.click(button);
  expect(scrollIntoView).toHaveBeenCalledWith({
    behavior: 'smooth',
    block: 'start',
  });
  expect(button).toHaveFocus();
  expect(screen.getAllByRole('article')[2]).toBeVisible();
});

it('keeps all explanations expanded and disables motion for short screens or reduced motion', () => {
  const { rerender } = render(<GeologyScene locale="en" />);
  act(() => short.update(true));
  expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'static');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  screen.getAllByRole('article').forEach((step) => expect(step).toBeVisible());
  act(() => {
    short.update(false);
    reduced.update(true);
  });
  rerender(<GeologyScene locale="en" />);
  expect(screen.getByRole('region')).toHaveAttribute('data-mode', 'static');
  expect(
    screen.getByText(translate('en', 'geologyScene.stage3Title'))
  ).toBeVisible();
});

it('keeps localized labels and existing realistic layers across locale changes', () => {
  const { container, rerender } = render(<GeologyScene locale="ru" />);
  rerender(<GeologyScene locale="zh" />);
  for (const stage of [1, 2, 3]) {
    expect(
      screen.getByText(translate('zh', `geologyScene.stage${stage}Title`))
    ).toBeVisible();
  }
  expect(
    screen.getByText(translate('zh', 'geologyScene.disclaimer'))
  ).toBeVisible();
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
