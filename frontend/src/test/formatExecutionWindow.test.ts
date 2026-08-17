import { describe, it, expect } from 'vitest';
import { formatExecutionWindow } from '../components/WorkflowRunTimelineStepper';

describe('formatExecutionWindow Utility', () => {
  describe('Edge cases and empty/invalid values', () => {
    it('returns "Immediate" for null, undefined, 0, negative numbers, and NaN', () => {
      expect(formatExecutionWindow(undefined)).toBe('Immediate');
      expect(formatExecutionWindow(null as any)).toBe('Immediate');
      expect(formatExecutionWindow(0)).toBe('Immediate');
      expect(formatExecutionWindow(-5)).toBe('Immediate');
      expect(formatExecutionWindow(NaN)).toBe('Immediate');
    });
  });

  describe('Explicit Minutes Unit (waitUnit: "m")', () => {
    it('formats 0.5 hours with unit "m" as "30 Mins"', () => {
      expect(formatExecutionWindow(0.5, 'm')).toBe('30 Mins');
    });

    it('formats 1/60 hours with unit "m" as "1 Min" (singular)', () => {
      expect(formatExecutionWindow(1 / 60, 'm')).toBe('1 Min');
    });

    it('formats 45 minutes correctly', () => {
      expect(formatExecutionWindow(0.75, 'm')).toBe('45 Mins');
    });
  });

  describe('Explicit Hours Unit (waitUnit: "h")', () => {
    it('formats 1 hour with unit "h" as "1 Hour" (singular)', () => {
      expect(formatExecutionWindow(1, 'h')).toBe('1 Hour');
    });

    it('formats 12 hours with unit "h" as "12 Hours"', () => {
      expect(formatExecutionWindow(12, 'h')).toBe('12 Hours');
    });

    it('formats fractional hours with unit "h" cleanly (e.g. 1.5 Hours)', () => {
      expect(formatExecutionWindow(1.5, 'h')).toBe('1.5 Hours');
    });
  });

  describe('Explicit Days Unit (waitUnit: "d")', () => {
    it('formats 24 hours with unit "d" as "1 Day" (singular)', () => {
      expect(formatExecutionWindow(24, 'd')).toBe('1 Day');
    });

    it('formats 48 hours with unit "d" as "2 Days"', () => {
      expect(formatExecutionWindow(48, 'd')).toBe('2 Days');
    });

    it('formats 36 hours with unit "d" as "1.5 Days"', () => {
      expect(formatExecutionWindow(36, 'd')).toBe('1.5 Days');
    });
  });

  describe('Legacy Inference (waitUnit omitted / undefined)', () => {
    it('infers minutes when waitHours is strictly less than 1 hour', () => {
      expect(formatExecutionWindow(0.5)).toBe('30 Mins');
      expect(formatExecutionWindow(1 / 60)).toBe('1 Min');
      expect(formatExecutionWindow(0.75)).toBe('45 Mins');
    });

    it('infers days when waitHours >= 24 and is an exact multiple of 24', () => {
      expect(formatExecutionWindow(24)).toBe('1 Day');
      expect(formatExecutionWindow(48)).toBe('2 Days');
      expect(formatExecutionWindow(72)).toBe('3 Days');
    });

    it('formats as hours when waitHours is non-zero, >= 1, and not an exact multiple of 24', () => {
      expect(formatExecutionWindow(1)).toBe('1 Hour');
      expect(formatExecutionWindow(6)).toBe('6 Hours');
      expect(formatExecutionWindow(12)).toBe('12 Hours');
      expect(formatExecutionWindow(18)).toBe('18 Hours');
      expect(formatExecutionWindow(36)).toBe('36 Hours');
    });
  });
});
