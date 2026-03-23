import { describe, it, expect } from 'vitest';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (dateStr: string) => new Date(dateStr);

describe('Yearly recurrence — pattern: date', () => {
  const rule: RecurrenceRule = {
    startDate: d('2024-12-25'),
    interval: 1,
    period: 'year',
    end: { type: 'never' },
    yearly: { pattern: 'date' },
  };

  it('generates Dec 25 every year', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2030-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-12-25');
    expect(dates).toContain('2025-12-25');
    expect(dates).toContain('2026-12-25');
    expect(results).toHaveLength(7);
  });

  it('handles Feb 29 on leap years — clamps to Feb 28 on non-leap', () => {
    const leapRule: RecurrenceRule = {
      ...rule,
      startDate: d('2024-02-29'),
    };
    const results = expand(leapRule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2028-12-31'),
    });
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-02-29'); // leap
    expect(dates).toContain('2025-02-28'); // clamped
    expect(dates).toContain('2026-02-28');
    expect(dates).toContain('2027-02-28');
    expect(dates).toContain('2028-02-29'); // leap
  });
});

describe('Yearly recurrence — pattern: weekday', () => {
  // 3rd Thursday of November (US Thanksgiving 2024 = Nov 21)
  const rule: RecurrenceRule = {
    startDate: d('2024-11-21'),
    interval: 1,
    period: 'year',
    end: { type: 'after', occurrences: 3 },
    yearly: { pattern: 'weekday' },
  };

  it('generates the 3rd Thursday of November each year', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2030-12-31'),
    });
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.date.getUTCDay()).toBe(4); // Thursday
      expect(r.date.getUTCMonth()).toBe(10); // November
    }
  });
});

describe('Yearly recurrence — edge cases', () => {
  it('handles 5th weekday occurrence that does not exist in some years', () => {
    // Start on the 5th Saturday of March 2024 (March 30)
    // Some years won't have a 5th Saturday in March
    const rule: RecurrenceRule = {
      startDate: d('2024-03-30'),
      interval: 1,
      period: 'year',
      end: { type: 'after', occurrences: 5 },
      yearly: { pattern: 'weekday' },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2035-12-31'),
    });
    // Should skip years where the 5th Saturday doesn't exist
    for (const r of results) {
      expect(r.date.getUTCDay()).toBe(6); // Saturday
    }
  });

  it('end: on condition stops expansion', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-12-25'),
      interval: 1,
      period: 'year',
      end: { type: 'on', date: d('2026-12-31') },
      yearly: { pattern: 'date' },
    };
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2030-12-31'),
    });
    expect(results).toHaveLength(3); // 2024, 2025, 2026
  });
});
