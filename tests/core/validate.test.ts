import { describe, it, expect } from 'vitest';
import { validate } from '../../src/core/validate.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (s: string) => new Date(s);

const valid: RecurrenceRule = {
  startDate: d('2024-01-01'),
  interval: 1,
  period: 'week',
  end: { type: 'never' },
  weekly: { days: [1] },
};

describe('validate()', () => {
  it('returns valid for a correct weekly rule', () => {
    expect(validate(valid).valid).toBe(true);
  });

  it('errors on invalid startDate', () => {
    const result = validate({ ...valid, startDate: new Date('bad') });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('startDate'))).toBe(true);
  });

  it('errors on interval < 1', () => {
    const result = validate({ ...valid, interval: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('interval'))).toBe(true);
  });

  it('errors when weekly.days is empty', () => {
    const result = validate({ ...valid, weekly: { days: [] } });
    expect(result.valid).toBe(false);
  });

  it('errors when monthly config is missing for period=month', () => {
    const rule: RecurrenceRule = {
      ...valid,
      period: 'month',
    };
    delete (rule as Partial<RecurrenceRule>).monthly;
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('monthly'))).toBe(true);
  });

  it('passes for valid monthly rule', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'day' },
    };
    expect(validate(rule).valid).toBe(true);
  });

  it('passes for end: after with valid occurrences', () => {
    const rule: RecurrenceRule = {
      ...valid,
      end: { type: 'after', occurrences: 5 },
    };
    expect(validate(rule).valid).toBe(true);
  });

  it('errors for end: after with 0 occurrences', () => {
    const rule: RecurrenceRule = {
      ...valid,
      end: { type: 'after', occurrences: 0 },
    };
    expect(validate(rule).valid).toBe(false);
  });

  it('errors when weekly.days contains index > 6', () => {
    const result = validate({ ...valid, weekly: { days: [1, 7] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('weekly.days'))).toBe(true);
  });

  it('errors when weekly.days contains negative index', () => {
    const result = validate({ ...valid, weekly: { days: [-1] } });
    expect(result.valid).toBe(false);
  });

  it('errors when weekly.days contains non-integer', () => {
    const result = validate({ ...valid, weekly: { days: [1.5] } });
    expect(result.valid).toBe(false);
  });

  it('errors when monthly.pattern is invalid', () => {
    const rule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month' as const,
      end: { type: 'never' as const },
      monthly: { pattern: 'invalid' as 'day' },
    };
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('monthly.pattern'))).toBe(true);
  });

  it('errors when yearly config is missing for period=year', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
    };
    delete (rule as Partial<RecurrenceRule>).yearly;
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('yearly'))).toBe(true);
  });

  it('errors when yearly.pattern is invalid', () => {
    const rule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'year' as const,
      end: { type: 'never' as const },
      yearly: { pattern: 'invalid' as 'date' },
    };
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('yearly.pattern'))).toBe(true);
  });

  it('passes for valid yearly rule', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-03-15'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
      yearly: { pattern: 'date' },
    };
    expect(validate(rule).valid).toBe(true);
  });

  it('errors on end: on with invalid date', () => {
    const rule: RecurrenceRule = {
      ...valid,
      end: { type: 'on', date: new Date('bad') },
    };
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('end.date'))).toBe(true);
  });

  it('errors on invalid period', () => {
    const rule = { ...valid, period: 'hourly' as 'day' };
    const result = validate(rule);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('period'))).toBe(true);
  });
});
