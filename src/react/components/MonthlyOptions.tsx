/**
 * MonthlyOptions — a select/radio group for choosing the monthly recurrence pattern.
 *
 * Dynamically generates options based on the startDate, matching the UX from
 * use-monthlyInput.js.
 *
 * @example
 * <MonthlyOptions startDate={new Date('2024-03-15')} value="weekday" onChange={setPattern} />
 * // renders:
 * //  ○ Monthly on day 15
 * //  ○ Monthly on the third Friday
 */

import React, { useId, useMemo } from 'react';
import type { MonthlyPattern } from '../../core/types.js';
import { getOrdinalIndex } from '../../core/utils/date.js';

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinalWord(index: number): string {
  return ['first', 'second', 'third', 'fourth', 'fifth'][index] ?? `${index + 1}th`;
}

export interface MonthlyOption {
  label: string;
  value: MonthlyPattern;
}

export interface MonthlyOptionsProps {
  /** The recurrence start date — used to derive available options. */
  startDate: Date;
  /** Currently selected pattern. */
  value: MonthlyPattern | undefined;
  /** Called when the user picks a different pattern. */
  onChange: (pattern: MonthlyPattern) => void;
  /** Extra className for the container. */
  className?: string;
  /** Render as a `<select>` instead of radio buttons. @default false */
  asSelect?: boolean;
}

function buildOptions(startDate: Date): MonthlyOption[] {
  const opts: MonthlyOption[] = [];

  const day = startDate.getUTCDate();
  const weekdayName = WEEKDAY_LONG[startDate.getUTCDay()] ?? '';
  const ordinal = ordinalWord(getOrdinalIndex(startDate));

  // "Monthly on day X" — not available for the 31st (ambiguous in short months)
  if (day !== 31) {
    opts.push({ label: `Monthly on day ${day}`, value: 'day' });
  }

  // "Monthly on the Nth Weekday"
  opts.push({ label: `Monthly on the ${ordinal} ${weekdayName}`, value: 'weekday' });

  // "Last day of the month" — only when startDate IS the last day
  const lastDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).getUTCDate();
  if (day === lastDay) {
    opts.push({ label: 'Last day of the month', value: 'lastDay' });
  }

  // "Last Weekday of the month" — always available as an option
  opts.push({ label: `Last ${weekdayName} of the month`, value: 'lastWeekday' });

  return opts;
}

/**
 * Renders the available monthly recurrence pattern options.
 */
export function MonthlyOptions({
  startDate,
  value,
  onChange,
  className,
  asSelect = false,
}: MonthlyOptionsProps) {
  const options = useMemo(() => buildOptions(startDate), [startDate]);
  const groupId = useId();

  if (asSelect) {
    return (
      <select
        className={`rbc-recurrence-monthly-select${className ? ` ${className}` : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as MonthlyPattern)}
        aria-label="Monthly recurrence pattern"
        data-testid="monthly-options-select"
      >
        <option value="" disabled>
          Select pattern
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Monthly recurrence pattern"
      className={`rbc-recurrence-monthly-options${className ? ` ${className}` : ''}`}
      data-testid="monthly-options"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`rbc-recurrence-monthly-option${value === opt.value ? ' rbc-recurrence-monthly-option--selected' : ''}`}
        >
          <input
            type="radio"
            name={`monthly-pattern-${groupId}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
