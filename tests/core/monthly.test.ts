import { describe, it, expect } from 'vitest';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (dateStr: string) => new Date(dateStr);

describe('Monthly recurrence — pattern: day', () => {
  const rule: RecurrenceRule = {
    startDate: d('2024-01-15'),
    interval: 1,
    period: 'month',
    end: { type: 'never' },
    monthly: { pattern: 'day' },
  };

  it('generates the 15th of each month', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-06-30'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toEqual([
      '2024-01-15',
      '2024-02-15',
      '2024-03-15',
      '2024-04-15',
      '2024-05-15',
      '2024-06-15',
    ]);
  });

  it('clamps to month end when day > daysInMonth (Jan 31 → Feb 29 on leap year)', () => {
    const jan31Rule: RecurrenceRule = {
      ...rule,
      startDate: d('2024-01-31'),
    };
    const results = expand(jan31Rule, {
      rangeStart: d('2024-02-01'),
      rangeEnd: d('2024-02-29'),
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.date.toISOString().slice(0, 10)).toBe('2024-02-29');
  });

  it('clamps Jan 31 → Feb 28 on non-leap year', () => {
    const jan31Rule: RecurrenceRule = {
      ...rule,
      startDate: d('2023-01-31'),
    };
    const results = expand(jan31Rule, {
      rangeStart: d('2023-02-01'),
      rangeEnd: d('2023-02-28'),
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.date.toISOString().slice(0, 10)).toBe('2023-02-28');
  });

  it('respects interval=2 (every 2 months)', () => {
    const bimonthly: RecurrenceRule = { ...rule, interval: 2 };
    const results = expand(bimonthly, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-01-15');
    expect(dates).toContain('2024-03-15');
    expect(dates).toContain('2024-05-15');
    expect(dates).not.toContain('2024-02-15');
    expect(dates).not.toContain('2024-04-15');
  });
});

describe('Monthly recurrence — pattern: lastDay', () => {
  const rule: RecurrenceRule = {
    startDate: d('2024-01-31'),
    interval: 1,
    period: 'month',
    end: { type: 'never' },
    monthly: { pattern: 'lastDay' },
  };

  it('generates the last day of each month', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-04-30'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-01-31');
    expect(dates).toContain('2024-02-29'); // leap year
    expect(dates).toContain('2024-03-31');
    expect(dates).toContain('2024-04-30');
  });
});

describe('Monthly recurrence — pattern: weekday (Nth weekday)', () => {
  // 2024-01-01 is a Monday (day 1) — first Monday of January
  const rule: RecurrenceRule = {
    startDate: d('2024-01-01'),
    interval: 1,
    period: 'month',
    end: { type: 'never' },
    monthly: { pattern: 'weekday' },
  };

  it('generates the first Monday of each month', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-04-30'),
    });
    // Verify all results are Mondays
    for (const r of results) {
      expect(r.date.getDay()).toBe(1);
    }
    expect(results.length).toBe(4);
  });

  it('generates the 3rd Wednesday (2024-01-17 is 3rd Wednesday of Jan)', () => {
    const thirdWedRule: RecurrenceRule = {
      ...rule,
      startDate: d('2024-01-17'), // 3rd Wednesday
    };
    const results = expand(thirdWedRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-03-31'),
    });
    for (const r of results) {
      expect(r.date.getDay()).toBe(3); // Wednesday
      // Verify it's the 3rd Wednesday (day 15-21)
      expect(r.date.getDate()).toBeGreaterThanOrEqual(15);
      expect(r.date.getDate()).toBeLessThanOrEqual(21);
    }
  });
});

describe('Monthly recurrence — pattern: lastWeekday', () => {
  // 2024-01-26 is the last Friday of January 2024
  const rule: RecurrenceRule = {
    startDate: d('2024-01-26'),
    interval: 1,
    period: 'month',
    end: { type: 'never' },
    monthly: { pattern: 'lastWeekday' },
  };

  it('generates the last Friday of each month', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-04-30'),
    });
    for (const r of results) {
      expect(r.date.getDay()).toBe(5); // Friday
    }
    expect(results.length).toBe(4);
  });
});

describe('Monthly recurrence — end conditions', () => {
  const rule: RecurrenceRule = {
    startDate: d('2024-01-15'),
    interval: 1,
    period: 'month',
    end: { type: 'after', occurrences: 3 },
    monthly: { pattern: 'day' },
  };

  it('stops after N occurrences', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-12-31'),
    });
    expect(results).toHaveLength(3);
  });

  it('stops on date', () => {
    const onRule: RecurrenceRule = {
      ...rule,
      end: { type: 'on', date: d('2024-03-20') },
    };
    const results = expand(onRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-01-15');
    expect(dates).toContain('2024-02-15');
    expect(dates).toContain('2024-03-15');
    expect(dates).not.toContain('2024-04-15');
  });
});
