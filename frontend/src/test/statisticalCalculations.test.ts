import { describe, it, expect } from 'vitest';
import {
  calculateColumnStatistics,
  computeMetricForColumn,
  parseNumericValue,
} from '../utils/statisticalCalculations';

describe('statisticalCalculations utility', () => {
  describe('parseNumericValue', () => {
    it('parses plain numbers and strings with currency and commas', () => {
      expect(parseNumericValue(100)).toBe(100);
      expect(parseNumericValue('100')).toBe(100);
      expect(parseNumericValue('$1,250.50')).toBe(1250.5);
      expect(parseNumericValue(' 45.2% ')).toBe(45.2);
      expect(parseNumericValue('-15.75')).toBe(-15.75);
    });

    it('returns null for empty or non-numeric strings', () => {
      expect(parseNumericValue('')).toBeNull();
      expect(parseNumericValue('   ')).toBeNull();
      expect(parseNumericValue('N/A')).toBeNull();
      expect(parseNumericValue('Dallas DC')).toBeNull();
    });
  });

  describe('computeMetricForColumn', () => {
    const rawGrid = [
      ['SKU', 'Quantity', 'Price', 'Location'],
      ['SKU-001', '10', '$100.00', 'Dallas'],
      ['SKU-002', '20', '$200.00', 'Houston'],
      ['SKU-003', '30', '$200.00', 'Austin'],
      ['SKU-004', '40', '$500.00', 'Dallas'],
    ];

    it('computes mean (average) correctly', () => {
      // Quantity values: 10, 20, 30, 40 -> sum 100, mean 25
      const result = computeMetricForColumn(rawGrid, 'Quantity', 'mean');
      expect(result).not.toBeNull();
      expect(result?.numericValue).toBe(25);
      expect(result?.formatted).toBe('25.00');
    });

    it('computes median correctly for even number of items', () => {
      // Quantity values: 10, 20, 30, 40 -> median (20+30)/2 = 25
      const result = computeMetricForColumn(rawGrid, 'Quantity', 'median');
      expect(result).not.toBeNull();
      expect(result?.numericValue).toBe(25);
      expect(result?.formatted).toBe('25.00');
    });

    it('computes median correctly for odd number of items', () => {
      const oddGrid = [
        ['Price'],
        ['10'],
        ['20'],
        ['50'],
      ];
      const result = computeMetricForColumn(oddGrid, 'Price', 'median');
      expect(result?.numericValue).toBe(20);
    });

    it('computes mode correctly', () => {
      // Price values: 100, 200, 200, 500 -> mode 200
      const result = computeMetricForColumn(rawGrid, 'Price', 'mode');
      expect(result).not.toBeNull();
      expect(result?.numericValue).toBe(200);
      expect(result?.formatted).toContain('200.00');
    });

    it('computes percentage total and sample row share', () => {
      // Quantity values: 10, 20, 30, 40 -> total 100
      const result = computeMetricForColumn(rawGrid, 'Quantity', 'percentage');
      expect(result).not.toBeNull();
      expect(result?.numericValue).toBe(100);
      expect(result?.formatted).toContain('Sum: 100');
    });

    it('returns null gracefully when column is not found or has no numeric data', () => {
      expect(computeMetricForColumn(rawGrid, 'NonExistent', 'mean')).toBeNull();
      expect(computeMetricForColumn(rawGrid, 'Location', 'mean')).toBeNull();
      expect(computeMetricForColumn([], 'Price', 'mean')).toBeNull();
    });
  });

  describe('calculateColumnStatistics', () => {
    const rawGrid = [
      ['Qty'],
      ['10'],
      ['20'],
      ['20'],
      ['50'],
    ];

    it('returns comprehensive statistics dictionary for column', () => {
      const stats = calculateColumnStatistics(rawGrid, 'Qty');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(4);
      expect(stats?.sum).toBe(100);
      expect(stats?.mean).toBe(25);
      expect(stats?.median).toBe(20);
      expect(stats?.mode).toBe(20);
    });
  });
});
