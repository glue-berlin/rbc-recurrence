/**
 * useRecurrenceForm — manages state for building a RecurrenceRule from user input.
 *
 * Generalised from Glue's use-repetitionForm.js — no Redux, no app-specific fields.
 *
 * Usage:
 * ```tsx
 * const { rule, setField, isValid, errors, description } = useRecurrenceForm();
 *
 * // Render your own form UI and call setField to update individual fields.
 * setField('period', 'week');
 * setField('weekly', { days: [1, 3, 5] });
 * ```
 */

import { useReducer, useMemo, useCallback } from 'react';
import { validate } from '../../core/validate.js';
import { describe } from '../../core/describe.js';
import type { RecurrenceRule, ValidationResult } from '../../core/types.js';

// ─── State ───────────────────────────────────────────────────────────────────

export type RecurrenceFormField = keyof RecurrenceRule;

export type RecurrenceFormState = Partial<RecurrenceRule> & {
  startDate: Date;
  interval: number;
  period: RecurrenceRule['period'];
  end: RecurrenceRule['end'];
};

type Action =
  | { type: 'SET_FIELD'; field: RecurrenceFormField; value: unknown }
  | { type: 'RESET'; state: RecurrenceFormState };

function reducer(state: RecurrenceFormState, action: Action): RecurrenceFormState {
  switch (action.type) {
    case 'SET_FIELD': {
      const next = { ...state, [action.field]: action.value };
      // Auto-initialize period-specific config when period changes
      if (action.field === 'period') {
        const period = action.value as RecurrenceRule['period'];
        if (period === 'week' && !next.weekly) {
          next.weekly = { days: [state.startDate.getUTCDay()] };
        }
        if (period === 'month' && !next.monthly) {
          next.monthly = { pattern: 'day' };
        }
        if (period === 'year' && !next.yearly) {
          next.yearly = { pattern: 'date' };
        }
      }
      return next;
    }
    case 'RESET':
      return action.state;
    default:
      return state;
  }
}

// ─── Defaults ────────────────────────────────────────────────────────────────

function defaultState(initial?: Partial<RecurrenceRule>): RecurrenceFormState {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  return {
    startDate: today,
    interval: 1,
    period: 'week',
    end: { type: 'never' },
    weekly: { days: [today.getUTCDay()] },
    ...initial,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseRecurrenceFormOptions {
  /** Pre-populate the form with an existing rule (e.g. when editing). */
  initialRule?: Partial<RecurrenceRule> | undefined;
}

export interface UseRecurrenceFormResult {
  /** Current (possibly incomplete) rule built from the form state. */
  rule: RecurrenceFormState;
  /** Update any single field of the rule. */
  setField: <K extends RecurrenceFormField>(field: K, value: RecurrenceRule[K]) => void;
  /** Returns true if the current rule is valid. Also exposed as `validation`. */
  isValid: boolean;
  /** Full validation result with error messages. */
  validation: ValidationResult;
  /** Human-readable description of the current rule (empty string if invalid). */
  description: string;
  /** Reset the form to its initial state (or to a new rule). */
  reset: (newInitial?: Partial<RecurrenceRule>) => void;
}

export function useRecurrenceForm(
  options: UseRecurrenceFormOptions = {},
): UseRecurrenceFormResult {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    defaultState(options.initialRule),
  );

  const setField = useCallback(
    <K extends RecurrenceFormField>(field: K, value: RecurrenceRule[K]) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [],
  );

  const reset = useCallback((newInitial?: Partial<RecurrenceRule>) => {
    dispatch({ type: 'RESET', state: defaultState(newInitial) });
  }, []);

  const validation = useMemo((): ValidationResult => {
    // Cast — state may be partial; validate will surface any missing fields.
    return validate(state as RecurrenceRule);
  }, [state]);

  const description = useMemo(() => {
    if (!validation.valid) return '';
    try {
      return describe(state as RecurrenceRule);
    } catch {
      return '';
    }
  }, [validation, state]);

  return {
    rule: state,
    setField,
    isValid: validation.valid,
    validation,
    description,
    reset,
  };
}
