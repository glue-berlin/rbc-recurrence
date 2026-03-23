import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecurrenceForm } from '../../src/react/hooks/useRecurrenceForm.js';

describe('useRecurrenceForm', () => {
  it('initialises with default state', () => {
    const { result } = renderHook(() => useRecurrenceForm());
    expect(result.current.rule.period).toBe('week');
    expect(result.current.rule.interval).toBe(1);
    expect(result.current.rule.end.type).toBe('never');
    expect(result.current.rule.startDate).toBeInstanceOf(Date);
  });

  it('initialises with provided initialRule', () => {
    const { result } = renderHook(() =>
      useRecurrenceForm({
        initialRule: {
          period: 'month',
          interval: 2,
          monthly: { pattern: 'day' },
        },
      }),
    );
    expect(result.current.rule.period).toBe('month');
    expect(result.current.rule.interval).toBe(2);
  });

  it('setField updates a single field', () => {
    const { result } = renderHook(() => useRecurrenceForm());

    act(() => {
      result.current.setField('interval', 3);
    });

    expect(result.current.rule.interval).toBe(3);
  });

  it('reset restores default state', () => {
    const { result } = renderHook(() => useRecurrenceForm());

    act(() => {
      result.current.setField('interval', 5);
    });
    expect(result.current.rule.interval).toBe(5);

    act(() => {
      result.current.reset();
    });
    expect(result.current.rule.interval).toBe(1);
    expect(result.current.rule.period).toBe('week');
  });

  it('reset with new initial rule', () => {
    const { result } = renderHook(() => useRecurrenceForm());

    act(() => {
      result.current.reset({ period: 'day', interval: 7 });
    });

    expect(result.current.rule.period).toBe('day');
    expect(result.current.rule.interval).toBe(7);
  });

  it('isValid is true for default state', () => {
    const { result } = renderHook(() => useRecurrenceForm());
    expect(result.current.isValid).toBe(true);
  });

  it('isValid is false for invalid state', () => {
    const { result } = renderHook(() => useRecurrenceForm());

    act(() => {
      result.current.setField('weekly', { days: [] });
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.validation.errors.length).toBeGreaterThan(0);
  });

  it('description is non-empty for valid rule', () => {
    const { result } = renderHook(() => useRecurrenceForm());
    expect(result.current.description.length).toBeGreaterThan(0);
  });

  it('description is empty for invalid rule', () => {
    const { result } = renderHook(() => useRecurrenceForm());

    act(() => {
      result.current.setField('weekly', { days: [] });
    });

    expect(result.current.description).toBe('');
  });
});
