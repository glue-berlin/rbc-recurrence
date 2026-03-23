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
      expect(rule.end.date.getFullYear()).toBe(2024);
      expect(rule.end.date.getMonth()).toBe(11); // December
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
