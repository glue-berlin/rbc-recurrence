/**
 * YearlyOptions — a select/radio group for choosing the yearly recurrence pattern.
 *
 * @example
 * <YearlyOptions startDate={new Date('2024-11-28')} value="weekday" onChange={setPattern} />
 * // renders:
 * //  ○ On November 28
 * //  ○ On the fourth Thursday of November
 */

import { useId, useMemo } from 'react';
import type { YearlyPattern } from '../../core/types.js';
import { getOrdinalIndex } from '../../core/utils/date.js';

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinalWord(index: number): string {
  return ['first', 'second', 'third', 'fourth', 'fifth'][index] ?? `${index + 1}th`;
}

export interface YearlyOption {
  label: string;
  value: YearlyPattern;
}

export interface YearlyOptionsProps {
  /** The recurrence start date — used to derive available options. */
  startDate: Date;
  /** Currently selected pattern. */
  value: YearlyPattern | undefined;
  /** Called when the user picks a different pattern. */
  onChange: (pattern: YearlyPattern) => void;
  /** Extra className for the container. */
  className?: string;
  /** Render as a `<select>` instead of radio buttons. @default false */
  asSelect?: boolean;
}

function buildOptions(startDate: Date): YearlyOption[] {
  const monthName = MONTH_NAMES[startDate.getUTCMonth()] ?? '';
  const day = startDate.getUTCDate();
  const weekdayName = WEEKDAY_LONG[startDate.getUTCDay()] ?? '';
  const ordinal = ordinalWord(getOrdinalIndex(startDate));

  return [
    { label: `On ${monthName} ${day}`, value: 'date' },
    { label: `On the ${ordinal} ${weekdayName} of ${monthName}`, value: 'weekday' },
  ];
}

/**
 * Renders the available yearly recurrence pattern options.
 */
export function YearlyOptions({
  startDate,
  value,
  onChange,
  className,
  asSelect = false,
}: YearlyOptionsProps) {
  const options = useMemo(() => buildOptions(startDate), [startDate]);
  const groupId = useId();

  if (asSelect) {
    return (
      <select
        className={`rbc-recurrence-yearly-select${className ? ` ${className}` : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as YearlyPattern)}
        aria-label="Yearly recurrence pattern"
        data-testid="yearly-options-select"
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
      aria-label="Yearly recurrence pattern"
      className={`rbc-recurrence-yearly-options${className ? ` ${className}` : ''}`}
      data-testid="yearly-options"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`rbc-recurrence-yearly-option${value === opt.value ? ' rbc-recurrence-yearly-option--selected' : ''}`}
        >
          <input
            type="radio"
            name={`yearly-pattern-${groupId}`}
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
