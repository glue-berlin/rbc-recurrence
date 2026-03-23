import { describe, it, expect } from 'vitest';
import { expand } from '../../src/core/expand.js';
import type { RecurrenceRule } from '../../src/core/types.js';

const d = (dateStr: string) => new Date(dateStr);

describe('Daily recurrence', () => {
  const rule: RecurrenceRule = {
    startDate: d('2024-01-01'),
    interval: 1,
    period: 'day',
    end: { type: 'never' },
  };

  it('generates every day in range', () => {
    const results = expand(rule, {
      rangeStart: d('2024-01-01'),
      rangeEnd: d('2024-01-07'),
    });
    expect(results).toHaveLength(7);
    expect(results[0]!.date.toISOString().slice(0, 10)).toBe('2024-01-01');
    expect(results[6]!.date.toISOString().slice(0, 10)).toBe('2024-01-07');
  });

  it('respects interval=3 (every 3 days)', () => {
    const results = expand(
      { ...rule, interval: 3 },
      { rangeStart: d('2024-01-01'), rangeEnd: d('2024-01-31') },
    );
    const dates = results.map((r) => r.date.toISOString().slice(0, 10));
    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-01-04');
    expect(dates).toContain('2024-01-07');
    expect(dates).not.toContain('2024-01-02');
    expect(dates).not.toContain('2024-01-03');
  });

  it('stops after N occurrences', () => {
    const results = expand(
      { ...rule, end: { type: 'after', occurrences: 5 } },
      { rangeStart: d('2024-01-01'), rangeEnd: d('2024-12-31') },
    );
    expect(results).toHaveLength(5);
  });

  it('handles far-future range efficiently', () => {
    const start = performance.now();
    const results = expand(rule, {
      rangeStart: d('2029-01-01'),
      rangeEnd: d('2029-01-31'),
    });
    const elapsed = performance.now() - start;
    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100); // should be fast
  });
});
