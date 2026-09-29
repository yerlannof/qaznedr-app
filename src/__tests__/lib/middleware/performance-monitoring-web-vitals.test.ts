import { PerformanceMonitoringService } from '@/lib/middleware/performance-monitoring';
import { sentryMiningService } from '@/lib/monitoring/sentry-service';

jest.mock('@/lib/monitoring/sentry-service', () => ({
  MiningMetric: { API_REQUEST_PROCESSED: 'api_request_processed' },
  MiningErrorType: {},
  sentryMiningService: {
    trackMetric: jest.fn(),
    addMiningBreadcrumb: jest.fn(),
  },
}));

const trackMetric = sentryMiningService.trackMetric as jest.Mock;

describe('PerformanceMonitoringService Web Vitals', () => {
  const service = PerformanceMonitoringService.getInstance();

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['INP', 0, 'good'],
    ['INP', 200, 'good'],
    ['INP', 500, 'needs_improvement'],
    ['INP', 501, 'poor'],
    ['FID', 100, 'good'],
    ['FCP', 1800, 'good'],
    ['LCP', 4000, 'needs_improvement'],
    ['CLS', 0.25, 'needs_improvement'],
    ['TTFB', 800, 'good'],
    ['TTFB', 1800, 'needs_improvement'],
  ] as const)('reports %s=%s as %s', (name, value, category) => {
    service.trackWebVitals({ [name]: value });
    expect(trackMetric).toHaveBeenCalledWith(
      expect.anything(),
      value,
      expect.anything(),
      expect.objectContaining({
        metric_type: name.toLowerCase(),
        performance_category: category,
      })
    );
  });

  it('rejects malformed and negative values while keeping valid metrics', () => {
    service.trackWebVitals({
      INP: -1,
      FCP: Number.NaN,
      LCP: Number.POSITIVE_INFINITY,
      CLS: 0,
      TTFB: 0,
    });
    expect(trackMetric).toHaveBeenCalledTimes(2);
    expect(trackMetric.mock.calls.map((call) => call[3].metric_type)).toEqual([
      'cls',
      'ttfb',
    ]);
  });
});
