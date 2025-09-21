import {
  formatPrice,
  formatArea,
  formatDate,
  formatNumber,
} from '@/lib/utils/format';

describe('Format Utils', () => {
  describe('formatPrice', () => {
    it('formats price with currency symbol', () => {
      expect(formatPrice(1000000)).toBe('1 000 000 ₸');
      expect(formatPrice(500000)).toBe('500 000 ₸');
      expect(formatPrice(0)).toBe('Договорная');
      expect(formatPrice(null)).toBe('Договорная');
    });

    it('formats large prices correctly', () => {
      expect(formatPrice(1000000000)).toBe('1 000 000 000 ₸');
      expect(formatPrice(99999999)).toBe('99 999 999 ₸');
    });
  });

  describe('formatArea', () => {
    it('formats area with km² unit', () => {
      expect(formatArea(100)).toBe('100 км²');
      expect(formatArea(1500)).toBe('1 500 км²');
      expect(formatArea(0)).toBe('0 км²');
    });

    it('formats decimal areas correctly', () => {
      expect(formatArea(100.5)).toBe('100.5 км²');
      expect(formatArea(1234.56)).toBe('1 234.56 км²');
    });
  });

  describe('formatDate', () => {
    it('formats date in Russian locale', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toMatch(/15.*2024/);
    });

    it('returns empty string for null date', () => {
      expect(formatDate(null as any)).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1 000');
      expect(formatNumber(1000000)).toBe('1 000 000');
      expect(formatNumber(123456789)).toBe('123 456 789');
    });

    it('handles zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1 000');
    });
  });
});
