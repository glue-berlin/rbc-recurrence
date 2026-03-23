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
});
