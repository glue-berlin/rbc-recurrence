/**
 * RecurrenceEditor — a complete, compound recurrence rule editor.
 *
 * Headless-first: no hardcoded styles. Wraps useRecurrenceForm + WeekdayPicker
 * + MonthlyOptions into a single ready-to-use component.
 *
 * @example
 * <RecurrenceEditor
 *   initialRule={existingRule}
 *   onChange={(rule) => console.log(rule)}
 *   onValidChange={(rule) => saveToServer(rule)}
 * />
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useRecurrenceForm } from '../hooks/useRecurrenceForm.js';
import { WeekdayPicker } from './WeekdayPicker.js';
import { MonthlyOptions } from './MonthlyOptions.js';
import { YearlyOptions } from './YearlyOptions.js';
import type { RecurrenceRule, MonthlyPattern, YearlyPattern } from '../../core/types.js';

/** Time-of-day schedule for each occurrence. "HH:mm" in 24-hour format. */
export interface Schedule {
  startTime: string;
  endTime: string;
}

export interface RecurrenceEditorProps {
  /** Pre-populate with an existing rule. */
  initialRule?: Partial<RecurrenceRule>;
  /** Pre-populate the time-of-day schedule. */
  initialSchedule?: Schedule;
  /**
   * Called on every change, even when the rule is incomplete/invalid.
   * Use `onValidChange` if you only want valid rules.
   */
  onChange?: (rule: Partial<RecurrenceRule>, isValid: boolean, schedule?: Schedule) => void;
  /** Called only when the rule passes validation. */
  onValidChange?: (rule: RecurrenceRule, schedule?: Schedule) => void;
  /** Extra className for the root container. */
  className?: string;
  /** Render a custom submit/save button at the bottom. */
  renderActions?: (props: {
    isValid: boolean;
    description: string;
    rule: Partial<RecurrenceRule>;
    schedule: Schedule | undefined;
  }) => React.ReactNode;
  /** Show the weekday picker when period is 'week'. @default true */
  showWeekdayPicker?: boolean;
  /** Show the monthly pattern selector when period is 'month'. @default true */
  showMonthlyOptions?: boolean;
  /** Show the yearly pattern selector when period is 'year'. @default true */
  showYearlyOptions?: boolean;
  /** Show the start/end time inputs. @default true */
  showSchedule?: boolean;
  /** Show the human-readable description. @default true */
  showDescription?: boolean;
}

const PERIOD_LABELS: Record<RecurrenceRule['period'], string> = {
  day: 'Day(s)',
  week: 'Week(s)',
  month: 'Month(s)',
  year: 'Year(s)',
};

const END_LABELS: Record<string, string> = {
  never: 'Never',
  on: 'On date',
  after: 'After N occurrences',
};

/**
 * A full recurrence rule editor with period selector, interval input,
 * weekday picker, monthly pattern selector, and end condition controls.
 */
export function RecurrenceEditor({
  initialRule,
  initialSchedule,
  onChange,
  onValidChange,
  className,
  renderActions,
  showWeekdayPicker = true,
  showMonthlyOptions = true,
  showYearlyOptions = true,
  showSchedule = true,
  showDescription = true,
}: RecurrenceEditorProps) {
  const formOptions = useMemo(
    () => (initialRule ? { initialRule } : {}),
    [initialRule],
  );
  const { rule, setField, isValid, validation, description } = useRecurrenceForm(formOptions);

  const [schedule, setSchedule] = useState<Schedule | undefined>(initialSchedule);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;

  useEffect(() => {
    onChangeRef.current?.(rule, isValid, schedule);
    if (isValid) onValidChangeRef.current?.(rule as RecurrenceRule, schedule);
  }, [rule, isValid, schedule]);

  const startDate = rule.startDate ?? new Date();

  return (
    <div
      className={`rbc-recurrence-editor${className ? ` ${className}` : ''}`}
      data-testid="recurrence-editor"
    >
      {/* Start date */}
      <div className="rbc-recurrence-field">
        <label className="rbc-recurrence-label">Starts on</label>
        <input
          type="date"
          className="rbc-recurrence-input"
          value={startDate.toISOString().slice(0, 10)}
          onChange={(e) => {
            const d = new Date(e.target.value + 'T00:00:00Z');
            if (!isNaN(d.getTime())) setField('startDate', d);
          }}
          data-testid="start-date-input"
        />
      </div>

      {/* Schedule: start time / end time */}
      {showSchedule && (
        <div className="rbc-recurrence-field rbc-recurrence-field--inline">
          <label className="rbc-recurrence-label">From</label>
          <input
            type="time"
            className="rbc-recurrence-input"
            value={schedule?.startTime ?? ''}
            onChange={(e) => {
              const startTime = e.target.value;
              setSchedule((prev) => ({
                startTime,
                endTime: prev?.endTime ?? '',
              }));
            }}
            data-testid="start-time-input"
          />
          <label className="rbc-recurrence-label">To</label>
          <input
            type="time"
            className="rbc-recurrence-input"
            value={schedule?.endTime ?? ''}
            onChange={(e) => {
              const endTime = e.target.value;
              setSchedule((prev) => ({
                startTime: prev?.startTime ?? '',
                endTime,
              }));
            }}
            data-testid="end-time-input"
          />
        </div>
      )}

      {/* Repeat every */}
      <div className="rbc-recurrence-field rbc-recurrence-field--inline">
        <label className="rbc-recurrence-label">Repeat every</label>
        <input
          type="number"
          min={1}
          className="rbc-recurrence-input rbc-recurrence-input--number"
          value={rule.interval ?? 1}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1) setField('interval', v);
          }}
          data-testid="interval-input"
        />
        <select
          className="rbc-recurrence-select"
          value={rule.period}
          onChange={(e) => setField('period', e.target.value as RecurrenceRule['period'])}
          data-testid="period-select"
        >
          {(Object.entries(PERIOD_LABELS) as [RecurrenceRule['period'], string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Weekly days */}
      {showWeekdayPicker && rule.period === 'week' && (
        <div className="rbc-recurrence-field">
          <label className="rbc-recurrence-label">On days</label>
          <WeekdayPicker
            value={rule.weekly?.days ?? []}
            onChange={(days) => setField('weekly', { days })}
          />
        </div>
      )}

      {/* Monthly pattern */}
      {showMonthlyOptions && rule.period === 'month' && (
        <div className="rbc-recurrence-field">
          <label className="rbc-recurrence-label">Pattern</label>
          <MonthlyOptions
            startDate={startDate}
            value={rule.monthly?.pattern}
            onChange={(pattern: MonthlyPattern) => setField('monthly', { pattern })}
            asSelect
          />
        </div>
      )}

      {/* Yearly pattern */}
      {showYearlyOptions && rule.period === 'year' && (
        <div className="rbc-recurrence-field">
          <label className="rbc-recurrence-label">Pattern</label>
          <YearlyOptions
            startDate={startDate}
            value={rule.yearly?.pattern}
            onChange={(pattern: YearlyPattern) => setField('yearly', { pattern })}
            asSelect
          />
        </div>
      )}

      {/* End condition */}
      <div className="rbc-recurrence-field">
        <label className="rbc-recurrence-label">Ends</label>
        <select
          className="rbc-recurrence-select"
          value={rule.end?.type ?? 'never'}
          onChange={(e) => {
            const t = e.target.value as RecurrenceRule['end']['type'];
            if (t === 'never') setField('end', { type: 'never' });
            else if (t === 'on') {
              const now = new Date();
              setField('end', { type: 'on', date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) });
            }
            else if (t === 'after') setField('end', { type: 'after', occurrences: 10 });
          }}
          data-testid="end-type-select"
        >
          {Object.entries(END_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* End date */}
      {rule.end?.type === 'on' && (
        <div className="rbc-recurrence-field">
          <label className="rbc-recurrence-label">End on</label>
          <input
            type="date"
            className="rbc-recurrence-input"
            value={(rule.end.date ?? new Date()).toISOString().slice(0, 10)}
            onChange={(e) => {
              const d = new Date(e.target.value + 'T00:00:00Z');
              if (!isNaN(d.getTime())) setField('end', { type: 'on', date: d });
            }}
            data-testid="end-on-input"
          />
        </div>
      )}

      {/* After N occurrences */}
      {rule.end?.type === 'after' && (
        <div className="rbc-recurrence-field rbc-recurrence-field--inline">
          <label className="rbc-recurrence-label">After</label>
          <input
            type="number"
            min={1}
            className="rbc-recurrence-input rbc-recurrence-input--number"
            value={rule.end.occurrences ?? 10}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 1) setField('end', { type: 'after', occurrences: v });
            }}
            data-testid="end-after-input"
          />
          <span className="rbc-recurrence-label">occurrences</span>
        </div>
      )}

      {/* Validation errors */}
      {!isValid && validation.errors.length > 0 && (
        <ul className="rbc-recurrence-errors" data-testid="validation-errors">
          {validation.errors.map((e, i) => (
            <li key={i} className="rbc-recurrence-error">
              {e}
            </li>
          ))}
        </ul>
      )}

      {/* Human-readable description */}
      {showDescription && isValid && description && (
        <p className="rbc-recurrence-description" data-testid="description">
          {description}
        </p>
      )}

      {/* Custom actions slot */}
      {renderActions?.({ isValid, description, rule, schedule })}
    </div>
  );
}
