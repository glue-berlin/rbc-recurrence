import { describe, it, expect } from 'vitest';
import { toRRuleString } from '../../src/rrule/toRRule.js';
import { fromRRuleString } from '../../src/rrule/fromRRule.js';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (s: string) => new Date(s);

describe('toRRuleString()', () => {
  it('generates correct RRULE for weekly Mon/Wed/Fri', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1, 3, 5] },
    };
    const str = toRRuleString(rule);
    expect(str).toContain('FREQ=WEEKLY');
    expect(str).toContain('BYDAY=MO,WE,FR');
    expect(str).not.toContain('INTERVAL=1'); // omitted when 1
  });

  it('includes INTERVAL when > 1', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 2,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1] },
    };
    expect(toRRuleString(rule)).toContain('INTERVAL=2');
  });

  it('includes UNTIL for end: on', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'on', date: d('2024-12-31') },
    };
    expect(toRRuleString(rule)).toContain('UNTIL=20241231');
  });

  it('includes COUNT for end: after', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 7 },
    };
    expect(toRRuleString(rule)).toContain('COUNT=7');
  });

  it('monthly day → BYMONTHDAY', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'day' },
    };
    expect(toRRuleString(rule)).toContain('BYMONTHDAY=15');
  });

  it('monthly lastDay → BYMONTHDAY=-1', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-31'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'lastDay' },
    };
    expect(toRRuleString(rule)).toContain('BYMONTHDAY=-1');
  });

  it('monthly weekday → BYDAY with ordinal', () => {
    // Jan 15 2024 is 3rd Monday
    const rule: RecurrenceRule = {
      startDate: d('2024-01-15'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'weekday' },
    };
    const str = toRRuleString(rule);
    expect(str).toContain('BYDAY=3MO');
  });

  it('monthly lastWeekday → BYDAY=-1XX', () => {
    // Jan 26 2024 is last Friday
    const rule: RecurrenceRule = {
      startDate: d('2024-01-26'),
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'lastWeekday' },
    };
    const str = toRRuleString(rule);
    expect(str).toContain('BYDAY=-1FR');
  });

  it('yearly date → BYMONTH + BYMONTHDAY', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-12-25'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
      yearly: { pattern: 'date' },
    };
    const str = toRRuleString(rule);
    expect(str).toContain('FREQ=YEARLY');
    expect(str).toContain('BYMONTH=12');
    expect(str).toContain('BYMONTHDAY=25');
  });

  it('yearly weekday → BYMONTH + BYDAY with ordinal', () => {
    // Nov 28 2024 is 4th Thursday
    const rule: RecurrenceRule = {
      startDate: d('2024-11-28'),
      interval: 1,
      period: 'year',
      end: { type: 'never' },
      yearly: { pattern: 'weekday' },
    };
    const str = toRRuleString(rule);
    expect(str).toContain('BYMONTH=11');
    expect(str).toContain('BYDAY=4TH');
  });
});

describe('fromRRuleString()', () => {
  it('parses FREQ=WEEKLY;BYDAY=MO,WE,FR', () => {
    const rule = fromRRuleString(
      'DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR',
    );
    expect(rule.period).toBe('week');
    expect(rule.weekly?.days).toEqual(expect.arrayContaining([1, 3, 5]));
  });

  it('parses INTERVAL=2', () => {
    const rule = fromRRuleString('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO');
    expect(rule.interval).toBe(2);
  });

  it('parses UNTIL', () => {
    const rule = fromRRuleString('RRULE:FREQ=DAILY;UNTIL=20241231T000000Z');
    expect(rule.end.type).toBe('on');
    if (rule.end.type === 'on') {
      expect(rule.end.date.getUTCFullYear()).toBe(2024);
      expect(rule.end.date.getUTCMonth()).toBe(11); // December
    }
  });

  it('parses COUNT', () => {
    const rule = fromRRuleString('RRULE:FREQ=DAILY;COUNT=10');
    expect(rule.end.type).toBe('after');
    if (rule.end.type === 'after') {
      expect(rule.end.occurrences).toBe(10);
    }
  });

  it('throws on missing FREQ', () => {
    expect(() => fromRRuleString('RRULE:BYDAY=MO')).toThrow();
  });

  it('parses monthly BYMONTHDAY=-1 as lastDay', () => {
    const rule = fromRRuleString('RRULE:FREQ=MONTHLY;BYMONTHDAY=-1');
    expect(rule.period).toBe('month');
    expect(rule.monthly?.pattern).toBe('lastDay');
  });

  it('parses monthly BYMONTHDAY=15 as day', () => {
    const rule = fromRRuleString('RRULE:FREQ=MONTHLY;BYMONTHDAY=15');
    expect(rule.period).toBe('month');
    expect(rule.monthly?.pattern).toBe('day');
  });

  it('parses monthly BYDAY=1MO as weekday', () => {
    const rule = fromRRuleString('RRULE:FREQ=MONTHLY;BYDAY=1MO');
    expect(rule.period).toBe('month');
    expect(rule.monthly?.pattern).toBe('weekday');
  });

  it('parses monthly BYDAY=-1FR as lastWeekday', () => {
    const rule = fromRRuleString('RRULE:FREQ=MONTHLY;BYDAY=-1FR');
    expect(rule.period).toBe('month');
    expect(rule.monthly?.pattern).toBe('lastWeekday');
  });

  it('parses monthly without BYMONTHDAY or BYDAY as day pattern', () => {
    const rule = fromRRuleString('RRULE:FREQ=MONTHLY');
    expect(rule.monthly?.pattern).toBe('day');
  });

  it('throws on malformed monthly BYDAY', () => {
    expect(() => fromRRuleString('RRULE:FREQ=MONTHLY;BYDAY=INVALID')).toThrow('Malformed');
  });

  it('parses yearly with BYDAY as weekday pattern', () => {
    const rule = fromRRuleString('RRULE:FREQ=YEARLY;BYDAY=4TH;BYMONTH=11');
    expect(rule.period).toBe('year');
    expect(rule.yearly?.pattern).toBe('weekday');
  });

  it('parses yearly without BYDAY as date pattern', () => {
    const rule = fromRRuleString('RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25');
    expect(rule.period).toBe('year');
    expect(rule.yearly?.pattern).toBe('date');
  });

  it('defaults to startDate weekday when weekly has no BYDAY', () => {
    const rule = fromRRuleString('DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY');
    // Jan 1 2024 is Monday (UTC day 1)
    expect(rule.weekly?.days).toEqual([1]);
  });

  it('parses DTSTART with TZID parameter', () => {
    const rule = fromRRuleString(
      'DTSTART;TZID=America/New_York:20240601T090000\nRRULE:FREQ=DAILY',
    );
    expect(rule.startDate.getUTCFullYear()).toBe(2024);
    expect(rule.startDate.getUTCMonth()).toBe(5); // June
    expect(rule.startDate.getUTCDate()).toBe(1);
  });

  it('parses DTSTART with VALUE=DATE parameter', () => {
    const rule = fromRRuleString(
      'DTSTART;VALUE=DATE:20240315\nRRULE:FREQ=WEEKLY;BYDAY=FR',
    );
    expect(rule.startDate.getUTCFullYear()).toBe(2024);
    expect(rule.startDate.getUTCMonth()).toBe(2); // March
    expect(rule.startDate.getUTCDate()).toBe(15);
  });
});

describe('EXDATE serialization', () => {
  it('toRRuleString serializes excludeDates as EXDATE', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
      excludeDates: [d('2024-01-05'), d('2024-01-10')],
    };
    const str = toRRuleString(rule);
    expect(str).toContain('EXDATE:');
    expect(str).toContain('20240105');
    expect(str).toContain('20240110');
  });

  it('toRRuleString omits EXDATE when no excludeDates', () => {
    const rule: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'never' },
    };
    expect(toRRuleString(rule)).not.toContain('EXDATE');
  });

  it('fromRRuleString parses EXDATE line', () => {
    const rule = fromRRuleString(
      'DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY\nEXDATE:20240105T000000Z,20240110T000000Z',
    );
    expect(rule.excludeDates).toHaveLength(2);
    expect(rule.excludeDates![0]!.getUTCDate()).toBe(5);
    expect(rule.excludeDates![1]!.getUTCDate()).toBe(10);
  });

  it('fromRRuleString returns no excludeDates when no EXDATE', () => {
    const rule = fromRRuleString('RRULE:FREQ=DAILY');
    expect(rule.excludeDates).toBeUndefined();
  });

  it('EXDATE round-trip preserves excluded dates', () => {
    const original: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 10 },
      excludeDates: [d('2024-01-03'), d('2024-01-07')],
    };
    const parsed = fromRRuleString(toRRuleString(original));
    const opts = { rangeStart: d('2024-01-01'), rangeEnd: d('2024-01-31') };
    const originalDates = expand(original, opts).map((r) => r.date.toISOString().slice(0, 10));
    const parsedDates = expand(parsed, opts).map((r) => r.date.toISOString().slice(0, 10));
    expect(parsedDates).toEqual(originalDates);
    expect(originalDates).not.toContain('2024-01-03');
    expect(originalDates).not.toContain('2024-01-07');
  });
});

describe('Round-trip: toRRuleString → fromRRuleString → expand', () => {
  it('weekly rule produces identical occurrences', () => {
    const original: RecurrenceRule = {
      startDate: d('2024-01-01'),
      interval: 2,
      period: 'week',
      end: { type: 'after', occurrences: 6 },
      weekly: { days: [1, 5] }, // Mon, Fri
    };

    const rruleStr = toRRuleString(original);
    const parsed = fromRRuleString(rruleStr);

    const opts = { rangeStart: d('2024-01-01'), rangeEnd: d('2024-12-31') };
    const originalDates = expand(original, opts).map((r) =>
      r.date.toISOString().slice(0, 10),
    );
    const parsedDates = expand(parsed, opts).map((r) =>
      r.date.toISOString().slice(0, 10),
    );

    expect(parsedDates).toEqual(originalDates);
  });
});
