import { StrictMode } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { WebVitalsTracker } from '@/components/monitoring/WebVitalsTracker';
import { performanceMonitoring } from '@/lib/middleware/performance-monitoring';
import { sentryMiningService } from '@/lib/monitoring/sentry-service';

type Metric = { id: string; value: number };
const callbacks: Record<string, (metric: Metric) => void> = {};
let inpRegistrations = 0;
let mockLibraryFailure = false;

jest.mock('web-vitals', () => ({
  onCLS: (callback: (metric: Metric) => void) => {
    if (mockLibraryFailure) throw new Error('library unavailable');
    callbacks.CLS = callback;
  },
  onINP: (callback: (metric: Metric) => void) => {
    inpRegistrations++;
    callbacks.INP = callback;
  },
  onFCP: (callback: (metric: Metric) => void) => {
    callbacks.FCP = callback;
  },
  onLCP: (callback: (metric: Metric) => void) => {
    callbacks.LCP = callback;
  },
}));
jest.mock('@/lib/middleware/performance-monitoring', () => ({
  performanceMonitoring: { trackWebVitals: jest.fn() },
}));
jest.mock('@/lib/monitoring/sentry-service', () => ({
  sentryMiningService: { addMiningBreadcrumb: jest.fn() },
}));

const track = performanceMonitoring.trackWebVitals as jest.Mock;
const breadcrumb = sentryMiningService.addMiningBreadcrumb as jest.Mock;

describe('WebVitalsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(callbacks).forEach((key) => delete callbacks[key]);
    inpRegistrations = 0;
    mockLibraryFailure = false;
    Object.defineProperty(performance, 'getEntriesByType', {
      configurable: true,
      value: jest.fn().mockReturnValue([]),
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('reports INP by its own identity, updates, and distinct IDs without exact repeats', async () => {
    render(<WebVitalsTracker pageName="home" />);
    await waitFor(() => expect(callbacks.INP).toBeDefined());
    act(() => {
      callbacks.INP({ id: 'first', value: 200 });
      callbacks.INP({ id: 'first', value: 200 });
      callbacks.INP({ id: 'first', value: 500 });
      callbacks.INP({ id: 'bfcache', value: 200 });
    });
    expect(track.mock.calls).toEqual([
      [{ INP: 200 }, undefined],
      [{ INP: 500 }, undefined],
      [{ INP: 200 }, undefined],
    ]);
    expect(
      breadcrumb.mock.calls
        .filter((call) => String(call[0]).startsWith('Web Vital INP'))
        .map((call) => call[2].rating)
    ).toEqual(['good', 'needs-improvement', 'good']);
  });

  it('keeps CLS unitless and does not resend metrics on unload', async () => {
    render(<WebVitalsTracker />);
    await waitFor(() => expect(callbacks.CLS).toBeDefined());
    act(() => callbacks.CLS({ id: 'cls-1', value: 0.1 }));
    expect(
      breadcrumb.mock.calls.some((call) =>
        String(call[0]).includes('Web Vital CLS: 0.10 (good)')
      )
    ).toBe(true);
    window.dispatchEvent(new Event('beforeunload'));
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('keeps one library registration and uses the latest context after a prop update', async () => {
    const view = render(<WebVitalsTracker pageName="old" userId="one" />);
    await waitFor(() => expect(callbacks.INP).toBeDefined());
    view.rerender(<WebVitalsTracker pageName="new" userId="two" />);
    act(() => callbacks.INP({ id: 'updated-page', value: 0 }));
    expect(inpRegistrations).toBe(1);
    expect(track).toHaveBeenCalledWith({ INP: 0 }, 'two');
    expect(breadcrumb).toHaveBeenCalledWith(
      expect.stringContaining('Web Vital INP: 0.00ms (good)'),
      'api',
      expect.objectContaining({ page: 'new', userId: 'two' })
    );
  });

  it('ignores callbacks and delayed resource collection after cleanup', async () => {
    jest.useFakeTimers();
    Object.defineProperty(performance, 'getEntriesByType', {
      configurable: true,
      value: jest.fn().mockReturnValue([]),
    });
    const view = render(<WebVitalsTracker />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(callbacks.INP).toBeDefined();
    const resourceReadsBeforeUnmount = (
      performance.getEntriesByType as jest.Mock
    ).mock.calls.filter((call) => call[0] === 'resource').length;
    view.unmount();
    act(() => callbacks.INP({ id: 'late', value: 120 }));
    act(() => jest.advanceTimersByTime(2000));
    expect(track).not.toHaveBeenCalled();
    expect(breadcrumb).not.toHaveBeenCalled();
    expect(
      (performance.getEntriesByType as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'resource'
      )
    ).toHaveLength(resourceReadsBeforeUnmount);
  });

  it('reports zero CLS, disconnects manual fallback observers, and ignores late callbacks', async () => {
    mockLibraryFailure = true;
    const disconnect = jest.fn();
    const observerCallbacks: PerformanceObserverCallback[] = [];
    const originalObserver = window.PerformanceObserver;
    class MockObserver {
      constructor(callback: PerformanceObserverCallback) {
        observerCallbacks.push(callback);
      }
      observe = jest.fn();
      disconnect = disconnect;
    }
    Object.defineProperty(window, 'PerformanceObserver', {
      configurable: true,
      value: MockObserver,
    });
    try {
      const view = render(<WebVitalsTracker />);
      await waitFor(() => expect(observerCallbacks).toHaveLength(3));
      act(() =>
        observerCallbacks[1](
          {
            getEntries: () => [
              { hadRecentInput: true, value: 0.3 } as PerformanceEntry,
            ],
          } as PerformanceObserverEntryList,
          {} as PerformanceObserver
        )
      );
      expect(track).toHaveBeenCalledWith({ CLS: 0 }, undefined);
      jest.clearAllMocks();
      view.unmount();
      expect(disconnect).toHaveBeenCalledTimes(3);
      act(() =>
        observerCallbacks[0](
          {
            getEntries: () => [{ startTime: 123 } as PerformanceEntry],
          } as PerformanceObserverEntryList,
          {} as PerformanceObserver
        )
      );
      expect(track).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'PerformanceObserver', {
        configurable: true,
        value: originalObserver,
      });
    }
  });

  it('registers the web-vitals library once in StrictMode', async () => {
    render(
      <StrictMode>
        <WebVitalsTracker />
      </StrictMode>
    );
    await waitFor(() => expect(callbacks.INP).toBeDefined());
    expect(inpRegistrations).toBe(1);
  });
});
