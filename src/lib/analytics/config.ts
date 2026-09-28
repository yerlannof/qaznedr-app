// Public measurement IDs are not secrets. A missing ID keeps that provider off.
export const GA4_MEASUREMENT_ID = 'G-HPGRR5049G';
export const YANDEX_METRIKA_ID: number | null = 113126250;

export function isAnalyticsHost(host: string): boolean {
  return host === 'qaznedr.kz';
}
