import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekdayPicker } from '../../src/react/components/WeekdayPicker.js';
import { MonthlyOptions } from '../../src/react/components/MonthlyOptions.js';
import { RecurrenceEditor } from '../../src/react/components/RecurrenceEditor.js';

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

  it('calls onChange with rule and isValid', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'week' }),
      true,
    );
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
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 3 }),
      expect.any(Boolean),
    );
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
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        end: expect.objectContaining({ type: 'after', occurrences: 5 }) as unknown,
      }),
      expect.any(Boolean),
    );
  });

  it('changes period selection', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const select = screen.getByTestId('period-select');
    fireEvent.change(select, { target: { value: 'day' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'day' }),
      expect.any(Boolean),
    );
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

  it('updates start date input', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    const input = screen.getByTestId('start-date-input');
    fireEvent.change(input, { target: { value: '2025-06-15' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(Date) as unknown,
      }),
      expect.any(Boolean),
    );
  });

  it('updates end date when end type is on', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    // Switch to "on" end type
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'on' } });
    // Update end date
    fireEvent.change(screen.getByTestId('end-on-input'), { target: { value: '2025-12-31' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        end: expect.objectContaining({ type: 'on' }) as unknown,
      }),
      expect.any(Boolean),
    );
  });

  it('switches back to never end type', () => {
    const onChange = vi.fn();
    render(<RecurrenceEditor onChange={onChange} />);
    // Switch to after first
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'after' } });
    // Switch back to never
    fireEvent.change(screen.getByTestId('end-type-select'), { target: { value: 'never' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        end: expect.objectContaining({ type: 'never' }) as unknown,
      }),
      expect.any(Boolean),
    );
  });
});
