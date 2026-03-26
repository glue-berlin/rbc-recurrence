/**
 * rbc-recurrence/react — React Big Calendar adapter entry point.
 *
 * Requires peer dependencies: react >=17, react-big-calendar >=1.
 *
 * @example
 * import { useRecurringEvents, useRecurrenceForm, RecurrenceEditor, WeekdayPicker } from 'rbc-recurrence/react';
 */

// Hooks
export { useRecurringEvents } from './react/hooks/useRecurringEvents.js';
export { useRecurrenceForm } from './react/hooks/useRecurrenceForm.js';

// Components
export { WeekdayPicker } from './react/components/WeekdayPicker.js';
export { MonthlyOptions } from './react/components/MonthlyOptions.js';
export { YearlyOptions } from './react/components/YearlyOptions.js';
export { RecurrenceEditor } from './react/components/RecurrenceEditor.js';
export { ActiveRules } from './react/components/ActiveRules.js';

// Types
export type {
  UseRecurringEventsOptions,
  UseRecurringEventsResult,
  RBCRange,
} from './react/hooks/useRecurringEvents.js';

export type {
  UseRecurrenceFormOptions,
  UseRecurrenceFormResult,
  RecurrenceFormState,
} from './react/hooks/useRecurrenceForm.js';

export type { WeekdayPickerProps } from './react/components/WeekdayPicker.js';
export type { MonthlyOptionsProps, MonthlyOption } from './react/components/MonthlyOptions.js';
export type { RecurrenceEditorProps, Schedule } from './react/components/RecurrenceEditor.js';
export type { YearlyOptionsProps, YearlyOption } from './react/components/YearlyOptions.js';
export type { ActiveRulesProps, ActiveRulesItem } from './react/components/ActiveRules.js';

// Re-export core types for convenience
export type {
  RecurrenceRule,
  RecurringEvent,
  RBCEvent,
  Period,
  MonthlyPattern,
  YearlyPattern,
  RecurrenceEnd,
} from './core/types.js';

export type { DescribeOptions } from './core/describe.js';
