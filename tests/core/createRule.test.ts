import { describe, it, expect } from 'vitest';
import { createRule } from '../../src/core/createRule.js';

const d = (s: string) => new Date(s);

describe('createRule()', () => {
  it('creates a basic daily rule', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      period: 'day',
    });
    expect(rule.startDate).toEqual(d('2024-01-01'));
    expect(rule.interval).toBe(1);
    expect(rule.period).toBe('day');
    expect(rule.end).toEqual({ type: 'never' });
  });

  it('creates a weekly rule with days', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      period: 'week',
      weekly: { days: [1, 3, 5] },
    });
    expect(rule.weekly?.days).toEqual([1, 3, 5]);
  });

  it('Date end → { type: "on", date }', () => {
    const endDate = d('2024-12-31');
    const rule = createRule({
      start: d('2024-01-01'),
      end: endDate,
      period: 'day',
    });
    expect(rule.end).toEqual({ type: 'on', date: endDate });
  });

  it('number end → { type: "after", occurrences }', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      end: 10,
      period: 'day',
    });
    expect(rule.end).toEqual({ type: 'after', occurrences: 10 });
  });

  it('undefined end → { type: "never" }', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      period: 'day',
    });
    expect(rule.end).toEqual({ type: 'never' });
  });

  it('sets interval when provided', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      period: 'day',
      interval: 3,
    });
    expect(rule.interval).toBe(3);
  });

  it('includes excludeDates when provided', () => {
    const rule = createRule({
      start: d('2024-01-01'),
      period: 'day',
      excludeDates: [d('2024-01-05')],
    });
    expect(rule.excludeDates).toHaveLength(1);
  });

  it('throws on invalid rule (missing weekly config)', () => {
    expect(() =>
      createRule({
        start: d('2024-01-01'),
        period: 'week',
        // missing weekly.days
      }),
    ).toThrow('Invalid recurrence rule');
  });

  it('throws when end date is before start date', () => {
    expect(() =>
      createRule({
        start: d('2024-06-01'),
        end: d('2024-01-01'),
        period: 'day',
      }),
    ).toThrow('end.date must be after startDate');
  });

  it('creates a monthly rule', () => {
    const rule = createRule({
      start: d('2024-01-15'),
      period: 'month',
      monthly: { pattern: 'day' },
    });
    expect(rule.monthly?.pattern).toBe('day');
  });

  it('creates a yearly rule', () => {
    const rule = createRule({
      start: d('2024-12-25'),
      period: 'year',
      yearly: { pattern: 'date' },
    });
    expect(rule.yearly?.pattern).toBe('date');
  });
});
