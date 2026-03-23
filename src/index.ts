/**
 * rbc-recurrence — core entry point (zero dependencies).
 *
 * Import from here for the pure recurrence engine without any React.
 *
 * @example
 * import { expand, validate, describe, toRRuleString, fromRRuleString } from 'rbc-recurrence';
 */

// Core engine
export { expand } from './core/expand.js';
export { validate } from './core/validate.js';
export { describe } from './core/describe.js';

// RRULE interop
export { toRRuleString } from './rrule/toRRule.js';
export { fromRRuleString } from './rrule/fromRRule.js';

// Types (re-exported for convenience)
export type {
  Period,
  MonthlyPattern,
  YearlyPattern,
  RecurrenceEnd,
  WeeklyConfig,
  MonthlyConfig,
  YearlyConfig,
  RecurrenceRule,
  ExpandedDate,
  ExpandOptions,
  RecurringEvent,
  RBCEvent,
  ValidationResult,
} from './core/types.js';
