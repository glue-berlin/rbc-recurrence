import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecurringEvents } from '../../src/react/hooks/useRecurringEvents.js';
import type { RecurringEvent } from '../../src/core/types.js';

const d = (s: string) => new Date(s);

function makeSeries(overrides: Partial<RecurringEvent> = {}): RecurringEvent {
  return {
    id: 'test-series',
    rule: {
      startDate: d('2024-01-01'),
      interval: 1,
      period: 'day',
      end: { type: 'after', occurrences: 10 },
    },
    eventData: { title: 'Test Event' },
    durationMinutes: 60,
    ...overrides,
  };
}

describe('useRecurringEvents', () => {
  it('returns events and onRangeChange', () => {
    const { result } = renderHook(() =>
      useRecurringEvents([makeSeries()]),
    );
    expect(result.current.events).toBeDefined();
    expect(typeof result.current.onRangeChange).toBe('function');
  });

  it('expands recurring events within visible range', () => {
    const series = makeSeries({
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 5 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    // Set range to March 2024
    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-31'),
      });
    });

    expect(result.current.events.length).toBe(5);
    const first = result.current.events[0]!;
    expect(first).toHaveProperty('_seriesId', 'test-series');
    expect(first).toHaveProperty('_occurrenceId');
    expect(first).toHaveProperty('_occurrenceIndex');
  });

  it('handles array-based onRangeChange (RBC week/day view)', () => {
    const series = makeSeries({
      rule: {
        startDate: d('2024-03-04'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 3 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    // Array of dates (like RBC week view)
    act(() => {
      result.current.onRangeChange([
        d('2024-03-03'),
        d('2024-03-04'),
        d('2024-03-05'),
        d('2024-03-06'),
        d('2024-03-07'),
        d('2024-03-08'),
        d('2024-03-09'),
      ]);
    });

    expect(result.current.events.length).toBe(3);
  });

  it('merges oneTimeEvents with expanded events', () => {
    const series = makeSeries({
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 2 },
      },
    });

    const oneTimeEvents = [
      { title: 'Static', start: d('2024-03-15'), end: d('2024-03-15') },
    ];

    const { result } = renderHook(() =>
      useRecurringEvents([series], { oneTimeEvents }),
    );

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-31'),
      });
    });

    // 2 recurring + 1 static
    expect(result.current.events.length).toBe(3);
  });

  it('applies schedule times when provided', () => {
    const series = makeSeries({
      schedule: { startTime: '09:00', endTime: '10:30' },
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 1 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-01'),
      });
    });

    const event = result.current.events[0]!;
    expect(event.start.getHours()).toBe(9);
    expect(event.end.getHours()).toBe(10);
    expect(event.end.getMinutes()).toBe(30);
  });

  it('handles sub-day duration without schedule', () => {
    const series = makeSeries({
      durationMinutes: 90, // 1.5 hours
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 1 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-01'),
      });
    });

    const event = result.current.events[0]!;
    const durationMs = event.end.getTime() - event.start.getTime();
    expect(durationMs).toBe(90 * 60 * 1000);
  });

  it('handles multi-day duration (>= 1440 minutes)', () => {
    const series = makeSeries({
      durationMinutes: 2880, // 2 days
      rule: {
        startDate: d('2024-03-01'),
        interval: 7,
        period: 'day',
        end: { type: 'after', occurrences: 1 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-07'),
      });
    });

    const event = result.current.events[0]!;
    const diffDays =
      (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(2);
  });

  it('re-expands when recurringEvents change', () => {
    const series1 = makeSeries({
      id: 's1',
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 2 },
      },
    });
    const series2 = makeSeries({
      id: 's2',
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 3 },
      },
    });

    const { result, rerender } = renderHook(
      ({ events }) => useRecurringEvents(events),
      { initialProps: { events: [series1] } },
    );

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-31'),
      });
    });

    const countBefore = result.current.events.length;

    rerender({ events: [series1, series2] });

    expect(result.current.events.length).toBeGreaterThan(countBefore);
  });

  it('respects bufferDays option', () => {
    // Series starts just outside the visible range, but within buffer
    const series = makeSeries({
      rule: {
        startDate: d('2024-02-28'), // 2 days before range
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 1 },
      },
    });

    const { result } = renderHook(() =>
      useRecurringEvents([series], { bufferDays: 7 }),
    );

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-31'),
      });
    });

    // Should be found because buffer extends range to Feb 23
    expect(result.current.events.length).toBe(1);
  });

  it('generates stable occurrence IDs', () => {
    const series = makeSeries({
      id: 'my-series',
      rule: {
        startDate: d('2024-03-01'),
        interval: 1,
        period: 'day',
        end: { type: 'after', occurrences: 2 },
      },
    });

    const { result } = renderHook(() => useRecurringEvents([series]));

    act(() => {
      result.current.onRangeChange({
        start: d('2024-03-01'),
        end: d('2024-03-31'),
      });
    });

    const ids = result.current.events.map((e) => (e as { _occurrenceId: string })._occurrenceId);
    expect(ids[0]).toMatch(/^my-series::/);
    expect(ids[1]).toMatch(/^my-series::/);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
