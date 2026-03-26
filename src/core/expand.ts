/**
 * expand() — the main public API of the core engine.
 *
 * Given a RecurrenceRule and a date range, returns all occurrences that
 * fall within [rangeStart, rangeEnd] (both inclusive, day precision).
 *
 * This is a pure function with zero side-effects and zero dependencies.
 */

import type { RecurrenceRule, ExpandedDate, ExpandOptions } from './types.js';
import { expandDaily } from './rules/daily.js';
import { expandWeekly } from './rules/weekly.js';
import { expandMonthly } from './rules/monthly.js';
import { expandYearly } from './rules/yearly.js';

/**
 * Expand a recurrence rule into concrete occurrence dates within the given range.
 *
 * @param rule    - The recurrence definition.
 * @param options - The date range and optional safety limits.
 * @returns       - Sorted array of ExpandedDate objects within [rangeStart, rangeEnd].
 *
 * @example
 * ```ts
 * const rule: RecurrenceRule = {
 *   startDate: new Date('2024-01-01'),
 *   interval: 1,
 *   period: 'week',
 *   end: { type: 'never' },
 *   weekly: { days: [1, 3, 5] }, // Mon, Wed, Fri
 * };
 *
 * const occurrences = expand(rule, {
 *   rangeStart: new Date('2024-03-01'),
 *   rangeEnd:   new Date('2024-03-31'),
 * });
 * // → [{date: Mon Mar 4, occurrenceIndex: 22}, {date: Wed Mar 6, ...}, ...]
 * ```
 */
export function expand(rule: RecurrenceRule, options: ExpandOptions): ExpandedDate[] {
  // Normalise rule start to midnight local
  const normalisedRule: RecurrenceRule = {
    ...rule,
    startDate: new Date(Date.UTC(
      rule.startDate.getUTCFullYear(),
      rule.startDate.getUTCMonth(),
      rule.startDate.getUTCDate(),
    )),
  };

  // Merge rule-level excludeDates with options-level excludeDates
  const mergedOptions: ExpandOptions =
    rule.excludeDates && rule.excludeDates.length > 0
      ? {
          ...options,
          excludeDates: [...(rule.excludeDates), ...(options.excludeDates ?? [])],
        }
      : options;

  switch (rule.period) {
    case 'day':
      return expandDaily(normalisedRule, mergedOptions, 0);
    case 'week':
      return expandWeekly(normalisedRule, mergedOptions, 0);
    case 'month':
      return expandMonthly(normalisedRule, mergedOptions, 0);
    case 'year':
      return expandYearly(normalisedRule, mergedOptions, 0);
    default: {
      const _exhaustive: never = rule.period;
      throw new Error(`Unsupported period: ${String(_exhaustive)}`);
    }
  }
}
