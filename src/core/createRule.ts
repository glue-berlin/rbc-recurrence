/**
 * createRule() — a convenience builder for creating RecurrenceRule objects.
 *
 * Provides sugar for the end condition:
 * - `Date`      → { type: 'on', date }
 * - `number`    → { type: 'after', occurrences }
 * - `undefined` → { type: 'never' }
 *
 * Validates the result and throws on invalid input.
 *
 * @example
 * ```ts
 * createRule({
 *   start: new Date('2024-06-01'),
 *   end: new Date('2024-12-31'),
 *   period: 'week',
 *   weekly: { days: [1, 3, 5] },
 * })
 * ```
 */

import type {
  RecurrenceRule,
  Period,
  RecurrenceEnd,
  WeeklyConfig,
  MonthlyConfig,
  YearlyConfig,
} from './types.js';
import { validate } from './validate.js';

export interface CreateRuleOptions {
  /** The first occurrence / anchor date. */
  start: Date;
  /**
   * When the recurrence ends.
   * - `Date`      → ends on that date (inclusive)
   * - `number`    → ends after N occurrences
   * - `undefined` → never ends
   */
  end?: Date | number;
  /** Repeat every N periods. @default 1 */
  interval?: number;
  /** The recurrence frequency. */
  period: Period;
  /** Required when period is 'week'. */
  weekly?: WeeklyConfig;
  /** Required when period is 'month'. */
  monthly?: MonthlyConfig;
  /** Required when period is 'year'. */
  yearly?: YearlyConfig;
  /** Dates to exclude from expansion. */
  excludeDates?: Date[];
}

function resolveEnd(end: CreateRuleOptions['end']): RecurrenceEnd {
  if (end === undefined || end === null) return { type: 'never' };
  if (end instanceof Date) return { type: 'on', date: end };
  if (typeof end === 'number') return { type: 'after', occurrences: end };
  return { type: 'never' };
}

/**
 * Creates a validated RecurrenceRule from a simplified options object.
 *
 * @throws {Error} if the resulting rule is invalid.
 */
export function createRule(options: CreateRuleOptions): RecurrenceRule {
  const rule: RecurrenceRule = {
    startDate: options.start,
    interval: options.interval ?? 1,
    period: options.period,
    end: resolveEnd(options.end),
  };

  if (options.weekly) rule.weekly = options.weekly;
  if (options.monthly) rule.monthly = options.monthly;
  if (options.yearly) rule.yearly = options.yearly;
  if (options.excludeDates && options.excludeDates.length > 0) {
    rule.excludeDates = options.excludeDates;
  }

  const result = validate(rule);
  if (!result.valid) {
    throw new Error(`Invalid recurrence rule: ${result.errors.join('; ')}`);
  }

  return rule;
}
