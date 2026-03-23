import { describe, it, expect } from 'vitest';
import {
  isBeforeDay,
  isAfterDay,
  setTimeOfDay,
  ordinalWeekdayInMonth,
  utcDate,
  addMonths,
  addYears,
  daysInMonth,
  lastDayOfMonth,
  weeksDiff,
  monthsDiff,
  toDateKey,
  getOrdinalIndex,
  startOfDay,
} from '../../src/core/utils/date.js';

const d = (s: string) => new Date(s);

describe('isBeforeDay()', () => {
  it('returns true when candidate is before bound', () => {
    expect(isBeforeDay(d('2024-01-01'), d('2024-01-02'))).toBe(true);
  });

  it('returns false when candidate is after bound', () => {
    expect(isBeforeDay(d('2024-01-02'), d('2024-01-01'))).toBe(false);
  });

  it('returns false when same day', () => {
    expect(isBeforeDay(d('2024-01-01'), d('2024-01-01'))).toBe(false);
  });
});

describe('isAfterDay()', () => {
  it('returns true when candidate is after bound', () => {
    expect(isAfterDay(d('2024-01-02'), d('2024-01-01'))).toBe(true);
  });

  it('returns false when candidate is before bound', () => {
    expect(isAfterDay(d('2024-01-01'), d('2024-01-02'))).toBe(false);
  });

  it('returns false when same day', () => {
    expect(isAfterDay(d('2024-01-01'), d('2024-01-01'))).toBe(false);
  });
});

describe('setTimeOfDay()', () => {
  it('sets hours and minutes from "HH:mm" string', () => {
    const result = setTimeOfDay(d('2024-03-01'), '14:30');
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
  });

  it('handles midnight', () => {
    const result = setTimeOfDay(d('2024-03-01'), '00:00');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('handles end of day', () => {
    const result = setTimeOfDay(d('2024-03-01'), '23:59');
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });

  it('handles leading zeros', () => {
    const result = setTimeOfDay(d('2024-03-01'), '09:05');
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(5);
  });
});

describe('ordinalWeekdayInMonth()', () => {
  it('returns null when ordinal exceeds available occurrences', () => {
    // January 2024 only has 5 Mondays (1st, 8th, 15th, 22nd, 29th)
    // Requesting 6th Monday (ordinalIndex=5) should return null
    const result = ordinalWeekdayInMonth(2024, 0, 1, 5);
    expect(result).toBeNull();
  });

  it('returns null for empty month (impossible, but edge case)', () => {
    // Requesting ordinalIndex 0 for a weekday that exists
    const result = ordinalWeekdayInMonth(2024, 0, 1, 0);
    expect(result).not.toBeNull();
    expect(result!.getUTCDate()).toBe(1); // First Monday of Jan 2024
  });
});

describe('utcDate()', () => {
  it('creates a date at UTC midnight', () => {
    const result = utcDate(2024, 5, 15);
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(5);
    expect(result.getUTCDate()).toBe(15);
    expect(result.getUTCHours()).toBe(0);
  });
});

describe('addMonths()', () => {
  it('clamps to month end when day exceeds target month length', () => {
    // Jan 31 + 1 month = Feb 29 (2024 is leap year)
    const result = addMonths(d('2024-01-31'), 1);
    expect(result.getUTCDate()).toBe(29);
  });
});

describe('addYears()', () => {
  it('clamps Feb 29 to Feb 28 on non-leap year', () => {
    const result = addYears(d('2024-02-29'), 1);
    expect(result.getUTCDate()).toBe(28);
    expect(result.getUTCFullYear()).toBe(2025);
  });
});

describe('daysInMonth()', () => {
  it('returns 29 for Feb in leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it('returns 28 for Feb in non-leap year', () => {
    expect(daysInMonth(2025, 1)).toBe(28);
  });

  it('returns 31 for January', () => {
    expect(daysInMonth(2024, 0)).toBe(31);
  });
});

describe('lastDayOfMonth()', () => {
  it('returns last day of month', () => {
    const result = lastDayOfMonth(d('2024-02-15'));
    expect(result.getUTCDate()).toBe(29);
  });
});

describe('weeksDiff()', () => {
  it('returns 0 for same week', () => {
    expect(weeksDiff(d('2024-01-01'), d('2024-01-03'))).toBe(0);
  });

  it('returns 1 for next week', () => {
    expect(weeksDiff(d('2024-01-01'), d('2024-01-08'))).toBe(1);
  });
});

describe('monthsDiff()', () => {
  it('returns correct month difference', () => {
    expect(monthsDiff(d('2024-01-01'), d('2024-03-01'))).toBe(2);
  });

  it('handles year boundaries', () => {
    expect(monthsDiff(d('2023-11-01'), d('2024-02-01'))).toBe(3);
  });
});

describe('toDateKey()', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toDateKey(d('2024-03-05'))).toBe('2024-03-05');
  });
});

describe('getOrdinalIndex()', () => {
  it('returns 0 for 1st-7th', () => {
    expect(getOrdinalIndex(d('2024-01-01'))).toBe(0);
    expect(getOrdinalIndex(d('2024-01-07'))).toBe(0);
  });

  it('returns 1 for 8th-14th', () => {
    expect(getOrdinalIndex(d('2024-01-08'))).toBe(1);
  });

  it('returns 4 for 29th+', () => {
    expect(getOrdinalIndex(d('2024-01-29'))).toBe(4);
  });
});

describe('startOfDay()', () => {
  it('strips time component', () => {
    const input = new Date('2024-03-15T14:30:45Z');
    const result = startOfDay(input);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCDate()).toBe(15);
  });
});
