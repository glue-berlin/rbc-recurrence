import { describe, it, expect } from 'vitest';
import { nextOccurrence } from '../../src/core/nextOccurrence.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (s: string) => new Date(s);

describe('nextOccurrence()', () => {
  it('returns the next daily occurrence after a given date', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    const next = nextOccurrence(rule, d('2024-03-15'));
    expect(next?.toISOString().slice(0, 10)).toBe('2024-03-16');
  });

  it('returns the next weekly occurrence', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'), // Monday
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [5] }, // Friday
    };
    const next = nextOccurrence(rule, d('2024-01-01'));
    expect(next?.toISOString().slice(0, 10)).toBe('2024-01-05');
  });

  it('returns the next monthly occurrence', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'day' },
    };
    const next = nextOccurrence(rule, d('2024-03-16'));
    expect(next?.toISOString().slice(0, 10)).toBe('2024-04-15');
  });

  it('returns the next yearly occurrence', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-12-25'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
      yearly: { pattern: 'date' },
    };
    const next = nextOccurrence(rule, d('2024-12-26'));
    expect(next?.toISOString().slice(0, 10)).toBe('2025-12-25');
  });

  it('returns null when series has ended', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 5 },
    };
    // Series ends on Jan 5. Asking for next after Jan 10 → null
    const next = nextOccurrence(rule, d('2024-01-10'));
    expect(next).toBeNull();
  });

  it('returns null when end date has passed', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'on', date: d('2024-01-31') },
    };
    const next = nextOccurrence(rule, d('2024-02-15'));
    expect(next).toBeNull();
  });

  it('skips excluded dates', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
      excludeDates: [d('2024-01-02')],
    };
    const next = nextOccurrence(rule, d('2024-01-01'));
    expect(next?.toISOString().slice(0, 10)).toBe('2024-01-03');
  });

  it('defaults after to now', () => {
    const rule: RecurrenceRule = {
      startDate: d('2020-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    const next = nextOccurrence(rule);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(Date.now());
  });
});
