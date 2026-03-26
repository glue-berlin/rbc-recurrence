import { describe, it, expect } from 'vitest';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (dateStr: string) => new Date(dateStr);

describe('Edge cases', () => {
  it('returns empty array when rangeEnd is before rangeStart', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1] },
    };
    const results = expand(rule, {
      rangeStart: d('2024-03-01'),
      rangeEnd: d('2024-01-01'),
    });
    expect(results).toHaveLength(0);
  });

  it('returns empty when end: after 0 occurrences (immediately done)', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 0 },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
    });
    expect(results).toHaveLength(0);
  });

  it('DST transition — March 10 2024 (US clocks spring forward)', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-03-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    const results = expand(rule, {
      rangeStart: d('2024-03-09'),
      rangeEnd: d('2024-03-12'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-03-09');
    expect(dates).toContain('2024-03-10');
    expect(dates).toContain('2024-03-11');
    expect(dates).toContain('2024-03-12');
  });

  it('monthly: handles months with fewer days correctly across a full year', () => {
    // Start Jan 31 — should clamp to last day of each shorter month
    const rule: RecurrenceRule = {
      startDate: d('2023-01-31'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'day' },
    };
    const results = expand(rule, {
      rangeStart: d('2023-01-01'),
      rangeEnd: d('2023-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2023-01-31');
    expect(dates).toContain('2023-02-28'); // Feb non-leap
    expect(dates).toContain('2023-03-31');
    expect(dates).toContain('2023-04-30'); // April only 30 days
  });

  it('weekly: interval=1, no occurrences in range before startDate', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-06-01'), // Saturday
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [6] },
    };
    // Range is before startDate — should return nothing
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-05-31'),
    });
    expect(results).toHaveLength(0);
  });

  it('respects excludeDates on the rule itself', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 7 },
      excludeDates: [d('2024-01-03'), d('2024-01-05')],
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).not.toContain('2024-01-03');
    expect(dates).not.toContain('2024-01-05');
    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-01-02');
    expect(dates).toContain('2024-01-04');
  });

  it('merges rule excludeDates with options excludeDates', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 7 },
      excludeDates: [d('2024-01-03')],
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
      excludeDates: [d('2024-01-05')],
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).not.toContain('2024-01-03');
    expect(dates).not.toContain('2024-01-05');
  });

  it('5 years of daily recurrence completes in < 100ms', () => {
    const rule: RecurrenceRule = {
      startDate: d('2020-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    const start = performance.now();
    const results = expand(rule, {
      rangeStart: d('2020-01-01'),
      rangeEnd: d('2025-01-01'),
    });
    const elapsed = performance.now() - start;
    expect(results.length).toBeGreaterThan(1800);
    expect(elapsed).toBeLessThan(100);
  });
});
