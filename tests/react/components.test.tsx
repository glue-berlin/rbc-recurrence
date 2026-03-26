/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekdayPicker } from '../../src/react/components/WeekdayPicker.js';
import { MonthlyOptions } from '../../src/react/components/MonthlyOptions.js';
import { YearlyOptions } from '../../src/react/components/YearlyOptions.js';
import { RecurrenceEditor } from '../../src/react/components/RecurrenceEditor.js';
import { ActiveRules } from '../../src/react/components/ActiveRules.js';
import type { ActiveRulesItem } from '../../src/react/components/ActiveRules.js';

describe('WeekdayPicker', () => {
  it('renders 7 buttons', () => {
    render(<WeekdayPicker value={[]} onChange={() => {}} />);
    const buttons = screen.getAllByRole('checkbox');
    expect(buttons).toHaveLength(7);
  });

  it('marks selected days', () => {
    render(<WeekdayPicker value={[1, 3]} onChange={() => {}} />);
    const buttons = screen.getAllByRole('checkbox');
    expect(buttons[1]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[3]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when a day is clicked', () => {
    const onChange = vi.fn();
    render(<WeekdayPicker value={[]} onChange={onChange} />);
    const buttons = screen.getAllByRole('checkbox');
    fireEvent.click(buttons[1]!); // click Monday
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('deselects when clicking a selected day', () => {
    const onChange = vi.fn();
    render(<WeekdayPicker value={[1, 3]} onChange={onChange} />);
    const buttons = screen.getAllByRole('checkbox');
    fireEvent.click(buttons[1]!); // deselect Monday
    expect(onChange).toHaveBeenCalledWith([3]);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(<WeekdayPicker value={[]} onChange={onChange} disabled />);
    const buttons = screen.getAllByRole('checkbox');
    fireEvent.click(buttons[1]!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('MonthlyOptions', () => {
  const startDate = new Date('2024-01-15'); // 3rd Monday of January 2024

  it('renders options as radio buttons by default', () => {
    render(
      <MonthlyOptions startDate={startDate} value="day" onChange={() => {}} />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
  });

  it('shows lastDay option when startDate is last day of month', () => {
    // Jan 31 is last day of January
    const lastDay = new Date('2024-01-31');
    render(
      <MonthlyOptions startDate={lastDay} value="lastDay" onChange={() => {}} />,
    );
    const radios = screen.getAllByRole('radio');
    const labels = radios.map((r) => r.closest('label')?.textContent ?? '');
    expect(labels.some((l) => l.includes('Last day'))).toBe(true);
  });

  it('does not show day option for 31st (ambiguous)', () => {
    const day31 = new Date('2024-01-31');
    render(
      <MonthlyOptions startDate={day31} value="weekday" onChange={() => {}} />,
    );
    const radios = screen.getAllByRole('radio');
    const labels = radios.map((r) => r.closest('label')?.textContent ?? '');
    expect(labels.some((l) => l.includes('Monthly on day 31'))).toBe(false);
  });

  it('renders as select when asSelect=true', () => {
    render(
      <MonthlyOptions startDate={startDate} value="day" onChange={() => {}} asSelect />,
    );
    expect(screen.getByTestId('monthly-options-select')).toBeTruthy();
  });

  it('calls onChange when a pattern is selected', () => {
    const onChange = vi.fn();
    render(
      <MonthlyOptions startDate={startDate} value="day" onChange={onChange} />,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalled();
  });
});

describe('YearlyOptions', () => {
  const startDate = new Date('2024-11-28'); // 4th Thursday of November

  it('renders options as radio buttons by default', () => {
    render(
      <YearlyOptions startDate={startDate} value="date" onChange={() => {}} />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('shows date and weekday options', () => {
    render(
      <YearlyOptions startDate={startDate} value="date" onChange={() => {}} />,
    );
    const radios = screen.getAllByRole('radio');
    const labels = radios.map((r) => r.closest('label')?.textContent ?? '');
    expect(labels.some((l) => l.includes('November 28'))).toBe(true);
    expect(labels.some((l) => l.includes('fourth Thursday'))).toBe(true);
  });

  it('renders as select when asSelect=true', () => {
    render(
      <YearlyOptions startDate={startDate} value="date" onChange={() => {}} asSelect />,
    );
    expect(screen.getByTestId('yearly-options-select')).toBeTruthy();
  });

  it('calls onChange when a pattern is selected', () => {
    const onChange = vi.fn();
    render(
      <YearlyOptions startDate={startDate} value="date" onChange={onChange} />,
    );
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalledWith('weekday');
  });
});

describe('ActiveRules', () => {
  const items: ActiveRulesItem[] = [
    {
      id: 'standup',
      title: 'Daily Standup',
      rule: {
        startDate: new Date('2024-01-01'),
        interval: 1,
        period: 'week',
        end: { type: 'never' },
        weekly: { days: [1, 2, 3, 4, 5] },
      },
      color: '#6366f1',
    },
    {
      id: 'review',
      title: 'Sprint Review',
      rule: {
        startDate: new Date('2024-01-01'),
        interval: 2,
        period: 'week',
        end: { type: 'never' },
        weekly: { days: [5] },
      },
    },
  ];

  it('renders all items with titles and descriptions', () => {
    render(<ActiveRules items={items} />);
    expect(screen.getByText('Daily Standup')).toBeTruthy();
    expect(screen.getByText('Sprint Review')).toBeTruthy();
    expect(screen.getByTestId('active-rules-item-standup')).toBeTruthy();
    expect(screen.getByTestId('active-rules-item-review')).toBeTruthy();
  });

  it('calls onRemove(id) when remove button clicked', () => {
    const onRemove = vi.fn();
    render(<ActiveRules items={items} onRemove={onRemove} />);
    fireEvent.click(screen.getByTestId('active-rules-remove-standup'));
    expect(onRemove).toHaveBeenCalledWith('standup');
  });

  it('calls onSelect(id) when item clicked', () => {
    const onSelect = vi.fn();
    render(<ActiveRules items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('active-rules-item-review'));
    expect(onSelect).toHaveBeenCalledWith('review');
  });

  it('hides remove buttons when onRemove not provided', () => {
    render(<ActiveRules items={items} />);
    expect(screen.queryByTestId('active-rules-remove-standup')).toBeNull();
    expect(screen.queryByTestId('active-rules-remove-review')).toBeNull();
  });

  it('shows color dot when color is set', () => {
    render(<ActiveRules items={items} />);
    const item = screen.getByTestId('active-rules-item-standup');
    const dot = item.querySelector('.rbc-recurrence-active-rules-dot');
    expect(dot).not.toBeNull();
    // Second item has no color
    const item2 = screen.getByTestId('active-rules-item-review');
    const dot2 = item2.querySelector('.rbc-recurrence-active-rules-dot');
    expect(dot2).toBeNull();
  });

  it('applies custom className', () => {
    render(<ActiveRules items={items} className="my-list" />);
    const root = screen.getByTestId('active-rules');
    expect(root.className).toContain('my-list');
  });

  it('passes describeOptions to describe()', () => {
    render(<ActiveRules items={items} describeOptions={{ includeStart: true }} />);
    // With includeStart, both descriptions should include "starting"
    expect(screen.getAllByText(/starting/)).toHaveLength(2);
  });
});

describe('RecurrenceEditor', () => {
  it('renders the editor', () => {
    render(<RecurrenceEditor />);
    expect(screen.getByTestId('recurrence-editor')).toBeTruthy();
  });

  it('shows description when rule is valid', () => {
    render(<RecurrenceEditor />);
    // Default rule should be valid (week, Mon, never)
    expect(screen.getByTestId('description')).toBeTruthy();
  });

  it('calls onValidChange when rule changes', () => {
    const onValidChange = vi.fn();
    render(<RecurrenceEditor onValidChange={onValidChange} />);
    // Default rule is valid → should have been called on mount
    expect(onValidChange).toHaveBeenCalled();
  });

  it('shows weekday picker for weekly period', () => {
    render(<RecurrenceEditor />);
    expect(screen.getByTestId('weekday-picker')).toBeTruthy();
  });

  it('calls onChange with rule, isValid, and schedule', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]).toEqual(expect.objectContaining({ period: 'week' }));
    expect(lastCall?.[1]).toBe(true);
    expect(lastCall?.[2]).toBeUndefined(); // no schedule by default
  });

  it('shows monthly options when period is month', () => {
    render(<RecurrenceEditor initialRule={{ period: 'month', monthly: { pattern: 'day' } }} />);
    const select = screen.getByTestId('period-select');
    expect(select).toHaveValue('month');
    expect(screen.getByTestId('monthly-options-select')).toBeTruthy();
  });

  it('does not show weekday picker when period is month', () => {
    render(<RecurrenceEditor initialRule={{ period: 'month', monthly: { pattern: 'day' } }} />);
    expect(screen.queryByTestId('weekday-picker')).toBeNull();
  });

  it('updates interval via input', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const input = screen.getByTestId('interval-input');
    fireEvent.change(input, { target: { value: '3' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]).toEqual(expect.objectContaining({ interval: 3 }));
  });

  it('switches end type to "on" and shows date input', () => {
    render(<RecurrenceEditor />);
    const select = screen.getByTestId('end-type-select');
    fireEvent.change(select, { target: { value: 'on' } });
    expect(screen.getByTestId('end-on-input')).toBeTruthy();
  });

  it('switches end type to "after" and shows occurrences input', () => {
    render(<RecurrenceEditor />);
    const select = screen.getByTestId('end-type-select');
    fireEvent.change(select, { target: { value: 'after' } });
    expect(screen.getByTestId('end-after-input')).toBeTruthy();
  });

  it('updates end occurrences', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const endSelect = screen.getByTestId('end-type-select');
    fireEvent.change(endSelect, { target: { value: 'after' } });
    const input = screen.getByTestId('end-after-input');
    fireEvent.change(input, { target: { value: '5' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]).toEqual(
      expect.objectContaining({
        end: expect.objectContaining({ type: 'after', occurrences: 5 }),
      }),
    );
  });

  it('changes period selection', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const select = screen.getByTestId('period-select');
    fireEvent.change(select, { target: { value: 'day' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]).toEqual(expect.objectContaining({ period: 'day' }));
  });

  it('renders custom actions via renderActions', () => {
    render(
      <RecurrenceEditor
        renderActions={({ isValid }) => (
          <button data-testid="save-btn" disabled={!isValid}>
            Save
          </button>
        )}
      />,
    );
    expect(screen.getByTestId('save-btn')).toBeTruthy();
  });

  it('applies className to root', () => {
    render(<RecurrenceEditor className="my-custom" />);
    const root = screen.getByTestId('recurrence-editor');
    expect(root.className).toContain('my-custom');
  });

  it('shows yearly options when period is year', () => {
    render(<RecurrenceEditor initialRule={{ period: 'year', yearly: { pattern: 'date' } }} />);
    expect(screen.getByTestId('yearly-options-select')).toBeTruthy();
  });

  it('auto-initializes monthly config when switching from week to month', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const select = screen.getByTestId('period-select');
    fireEvent.change(select, { target: { value: 'month' } });
    // Should auto-set monthly config and be valid
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]?.monthly).toEqual({ pattern: 'day' });
  });

  it('auto-initializes yearly config when switching to year', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const select = screen.getByTestId('period-select');
    fireEvent.change(select, { target: { value: 'year' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]?.yearly).toEqual({ pattern: 'date' });
  });

  it('renders start time and end time inputs', () => {
    render(<RecurrenceEditor />);
    expect(screen.getByTestId('start-time-input')).toBeTruthy();
    expect(screen.getByTestId('end-time-input')).toBeTruthy();
  });

  it('pre-populates schedule from initialSchedule', () => {
    render(<RecurrenceEditor initialSchedule={{ startTime: '09:00', endTime: '10:30' }} />);
    expect(screen.getByTestId('start-time-input')).toHaveValue('09:00');
    expect(screen.getByTestId('end-time-input')).toHaveValue('10:30');
  });

  it('passes schedule through onChange', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    fireEvent.change(screen.getByTestId('start-time-input'), { target: { value: '13:00' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[2]).toEqual(expect.objectContaining({ startTime: '13:00' }));
  });

  it('passes schedule through onValidChange', () => {
    const onValidChange = vi.fn();
    render(<RecurrenceEditor onValidChange={onValidChange} initialSchedule={{ startTime: '14:00', endTime: '15:00' }} />);
    // Trigger a change so the effect fires
    fireEvent.change(screen.getByTestId('interval-input'), { target: { value: '2' } });
const lastCall = onValidChange.mock.calls[onValidChange.mock.calls.length - 1];
    expect(lastCall?.[1]).toEqual({ startTime: '14:00', endTime: '15:00' });
  });

  it('updates start date input', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const input = screen.getByTestId('start-date-input');
    fireEvent.change(input, { target: { value: '2025-06-15' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]?.startDate).toBeInstanceOf(Date);
  });

  it('updates end date when end type is on', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    // Switch to "on" end type
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'on' } });
    // Update end date
    fireEvent.change(screen.getByTestId('end-on-input'), { target: { value: '2025-12-31' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]?.end?.type).toBe('on');
  });

  it('switches back to never end type', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    // Switch to after first
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'after' } });
    // Switch back to never
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'never' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall?.[0]?.end?.type).toBe('never');
  });

  it('hides weekday picker when showWeekdayPicker=false', () => {
    render(<RecurrenceEditor showWeekdayPicker={false} />);
    // Default period is week, but picker should be hidden
    expect(screen.queryByTestId('weekday-picker')).toBeNull();
  });

  it('hides monthly options when showMonthlyOptions=false', () => {
    render(<RecurrenceEditor initialRule={{ period: 'month', monthly: { pattern: 'day' } }} showMonthlyOptions={false} />);
    expect(screen.queryByTestId('monthly-options-select')).toBeNull();
  });

  it('hides yearly options when showYearlyOptions=false', () => {
    render(<RecurrenceEditor initialRule={{ period: 'year', yearly: { pattern: 'date' } }} showYearlyOptions={false} />);
    expect(screen.queryByTestId('yearly-options-select')).toBeNull();
  });

  it('hides schedule inputs when showSchedule=false', () => {
    render(<RecurrenceEditor showSchedule={false} />);
    expect(screen.queryByTestId('start-time-input')).toBeNull();
    expect(screen.queryByTestId('end-time-input')).toBeNull();
  });

  it('hides description when showDescription=false', () => {
    render(<RecurrenceEditor showDescription={false} />);
    expect(screen.queryByTestId('description')).toBeNull();
  });

  it('shows all sections by default', () => {
    render(<RecurrenceEditor />);
    expect(screen.getByTestId('weekday-picker')).toBeTruthy();
    expect(screen.getByTestId('start-time-input')).toBeTruthy();
    expect(screen.getByTestId('description')).toBeTruthy();
  });
});
