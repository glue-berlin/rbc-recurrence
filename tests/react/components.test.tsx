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
});
