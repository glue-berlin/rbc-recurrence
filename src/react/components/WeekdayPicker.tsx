/**
 * WeekdayPicker — a row of toggleable day buttons (S M T W T F S).
 *
 * Headless-first: unstyled by default. Apply your own className or
 * import the optional styles: `import 'rbc-recurrence/react/styles.css'`
 *
 * Ported and generalised from use-weeklyInput.jsx.
 */

import React from 'react';

const DEFAULT_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface WeekdayPickerProps {
  /** Currently selected weekday indices (0=Sun … 6=Sat). */
  value: number[];
  /** Called with the new selection when a day is toggled. */
  onChange: (days: number[]) => void;
  /** Override button labels (must be 7 items). @default ['S','M','T','W','T','F','S'] */
  labels?: string[];
  /** Extra className applied to the container div. */
  className?: string;
  /** Extra className applied to each day button. */
  dayClassName?: string;
  /** Extra className applied to a selected day button. */
  selectedClassName?: string;
  /** Disable all interaction. */
  disabled?: boolean;
  /** Accessible label for the group. */
  'aria-label'?: string;
}

/**
 * A row of S M T W T F S toggle buttons for selecting weekdays.
 *
 * @example
 * <WeekdayPicker value={[1, 3, 5]} onChange={setDays} />
 */
export function WeekdayPicker({
  value,
  onChange,
  labels = DEFAULT_LABELS,
  className,
  dayClassName,
  selectedClassName,
  disabled,
  'aria-label': ariaLabel = 'Select days of the week',
}: WeekdayPickerProps) {
  const toggle = (index: number) => {
    if (disabled) return;
    const next = value.includes(index)
      ? value.filter((d) => d !== index)
      : [...value, index];
    onChange(next);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`rbc-recurrence-weekday-picker${className ? ` ${className}` : ''}`}
      data-testid="weekday-picker"
    >
      {labels.map((label, index) => {
        const isSelected = value.includes(index);
        const cls = [
          'rbc-recurrence-day-btn',
          dayClassName,
          isSelected && 'rbc-recurrence-day-btn--selected',
          isSelected && selectedClassName,
          disabled && 'rbc-recurrence-day-btn--disabled',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={index}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`${isSelected ? 'Deselect' : 'Select'} ${DAY_NAMES[index] ?? ''}`}
            className={cls}
            onClick={() => toggle(index)}
            disabled={disabled}
            data-day={index}
            data-selected={isSelected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
