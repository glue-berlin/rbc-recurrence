import { describe, it, expect } from 'vitest';
import { describe as describeRule } from '../../src/core/describe.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (s: string) => new Date(s);

describe('describe()', () => {
  it('daily every 1 day', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    expect(describeRule(rule)).toBe('Every day');
  });

  it('daily every 3 days', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 3,
      period: 'day',
      end: { type: 'never' },
    };
    expect(describeRule(rule)).toBe('Every 3 days');
  });

  it('weekly on Mon Wed Fri', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1, 3, 5] },
    };
    expect(describeRule(rule)).toBe('Every week on Mon, Wed, Fri');
  });

  it('every 2 weeks', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 2,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1] },
    };
    expect(describeRule(rule)).toBe('Every 2 weeks on Mon');
  });

  it('monthly on day 15', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'day' },
    };
    expect(describeRule(rule)).toBe('Every month on the 15th');
  });

  it('monthly last day', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-31'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'lastDay' },
    };
    expect(describeRule(rule)).toBe('Every month on the last day');
  });

  it('monthly first Monday', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'), // first Monday of Jan
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'weekday' },
    };
    expect(describeRule(rule)).toBe('Every month on the first Monday');
  });

  it('monthly last Friday', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-26'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'lastWeekday' },
    };
    expect(describeRule(rule)).toBe('Every month on the last Friday');
  });

  it('yearly on March 15', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-03-15'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
      yearly: { pattern: 'date' },
    };
    expect(describeRule(rule)).toBe('Every year on March 15th');
  });

  it('includes end condition: after N', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 10 },
    };
    expect(describeRule(rule)).toBe('Every day, ending after 10 occurrences');
  });

  it('includes end condition: on date', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'on', date: d('2024-12-31') },
      weekly: { days: [1] },
    };
    expect(describeRule(rule)).toBe('Every week on Mon, until December 31, 2024');
  });
});
