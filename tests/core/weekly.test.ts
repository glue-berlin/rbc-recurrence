import { describe, it, expect } from 'vitest';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (dateStr: string) => new Date(dateStr);

describe('Weekly recurrence', () => {
  const baseRule: RecurrenceRule = {
    startDate: d('2024-01-01'), // Monday
    interval: 1,
    period: 'week',
    end: { type: 'never' },
    weekly: { days: [1] }, // Monday
  };

  it('generates every Monday within the range', () => {
    const results = expand(baseRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
    });
    expect(results.map((r) => r.date.toISOString().slice(0, 10))).toEqual([
      '2024-01-01',
      '2024-01-08',
      '2024-01-15',
      '2024-01-22',
      '2024-01-29',
    ]);
  });

  it('generates Mon/Wed/Fri for weekly rule', () => {
    const rule: RecurrenceRule = {
      ...baseRule,
      weekly: { days: [1, 3, 5] }, // Mon, Wed, Fri
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-07'),
    });
    expect(results.map((r) => r.date.toISOString().slice(0, 10))).toEqual([
      '2024-01-01', // Mon
      '2024-01-03', // Wed
      '2024-01-05', // Fri
    ]);
  });

  it('respects interval=2 (every 2 weeks)', () => {
    const rule: RecurrenceRule = {
      ...baseRule,
      interval: 2,
      weekly: { days: [1] },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-02-05'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    // Jan 1, Jan 15, Jan 29
    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-01-15');
    expect(dates).toContain('2024-01-29');
    expect(dates).not.toContain('2024-01-08');
    expect(dates).not.toContain('2024-01-22');
  });

  it('stops after N occurrences', () => {
    const rule: RecurrenceRule = {
      ...baseRule,
      end: { type: 'after', occurrences: 3 },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-12-31'),
    });
    expect(results).toHaveLength(3);
  });

  it('stops on a specific date', () => {
    const rule: RecurrenceRule = {
      ...baseRule,
      end: { type: 'on', date: d('2024-01-22') },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toEqual(['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22']);
  });

  it('excludes specified dates', () => {
    const results = expand(baseRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
      excludeDates: [d('2024-01-08'), d('2024-01-22')],
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).not.toContain('2024-01-08');
    expect(dates).not.toContain('2024-01-22');
    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-01-15');
  });

  it('returns empty array when no days selected', () => {
    const rule: RecurrenceRule = { ...baseRule, weekly: { days: [] } };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-31'),
    });
    expect(results).toHaveLength(0);
  });

  it('works when rangeStart is months after startDate', () => {
    const results = expand(baseRule, {
      rangeStart: d('2025-03-01'),
      rangeEnd: d('2025-03-31'),
    });
    // All results should be Mondays
    for (const r of results) {
      expect(r.date.getUTCDay()).toBe(1);
    }
    expect(results.length).toBeGreaterThan(0);
  });

  it('occurrenceIndex is monotonically increasing', () => {
    const results = expand(baseRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-03-31'),
    });
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.occurrenceIndex).toBeGreaterThan(results[i - 1]!.occurrenceIndex);
    }
  });

  it('occurrenceIndex is correct after fast-forward for far-future range', () => {
    // Every week on Mon starting Jan 1 2024 (which is a Monday)
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1] }, // Monday only
    };

    // Query a range far in the future — triggers fast-forward
    const results = expand(rule, {
      rangeStart: d('2025-01-01'),
      rangeEnd: d('2025-01-31'),
    });

    // Jan 1 2024 to Jan 1 2025 ≈ 52 weeks = 52 Mondays
    // First result should have occurrenceIndex ≈ 52, not 0
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.occurrenceIndex).toBeGreaterThanOrEqual(52);
  });

  it('occurrenceIndex accounts for partial first week', () => {
    // Start on Wednesday, recur on Mon/Wed/Fri
    const rule: RecurrenceRule = {
      startDate: d('2024-01-03'), // Wednesday
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1, 3, 5] }, // Mon, Wed, Fri
    };

    // First week: only Wed(3) and Fri(5) count (Mon is before startDate)
    // So first week = 2 occurrences, subsequent weeks = 3 each
    const results = expand(rule, {
      rangeStart: d('2024-01-03'),
      rangeEnd: d('2024-01-12'),
    });

    // Jan 3 (Wed) = index 0, Jan 5 (Fri) = index 1
    // Jan 8 (Mon) = index 2, Jan 10 (Wed) = index 3, Jan 12 (Fri) = index 4
    expect(results[0]!.occurrenceIndex).toBe(0);
    expect(results[1]!.occurrenceIndex).toBe(1);
    expect(results[2]!.occurrenceIndex).toBe(2);
  });

  it('end: after respects correct count with fast-forward', () => {
    // Every week on Mon, only 5 occurrences
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'after', occurrences: 5 },
      weekly: { days: [1] },
    };

    // Query far future — should return 0 results since all 5 occurred in Jan/Feb 2024
    const results = expand(rule, {
      rangeStart: d('2025-01-01'),
      rangeEnd: d('2025-12-31'),
    });

    expect(results).toHaveLength(0);
  });
});
