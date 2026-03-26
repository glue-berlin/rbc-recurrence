/**
 * nextOccurrence() — returns the next occurrence of a recurrence rule after a given date.
 *
 * Uses a progressive widening strategy:
 * 1. Try a 90-day window (covers daily/weekly)
 * 2. Try a 400-day window (covers monthly)
 * 3. Try a 4-year window (covers yearly + leap years)
 * 4. Return null if no occurrence found (series has ended)
 *
 * Hard cap: never scans more than 10 years ahead.
 *
 * @example
 * ```ts
 * const next = nextOccurrence(rule);            // next after now
 * const next = nextOccurrence(rule, someDate);  // next after someDate
 * ```
 */

import type { RecurrenceRule } from './types.js';
import { expand } from './expand.js';
import { addDays } from './utils/date.js';

const WINDOWS = [90, 400, 365 * 4];
const MAX_HORIZON_DAYS = 365 * 10;

/**
 * Returns the next occurrence date after `after` (defaults to now).
 * Returns `null` if the series has ended or no occurrence exists within 10 years.
 */
export function nextOccurrence(rule: RecurrenceRule, after?: Date): Date | null {
  const now = after ?? new Date();
  const rangeStart = addDays(now, 1); // strictly after

  for (const windowDays of WINDOWS) {
    if (windowDays > MAX_HORIZON_DAYS) break;

    const rangeEnd = addDays(rangeStart, windowDays);
    const results = expand(rule, { rangeStart, rangeEnd });

    if (results.length > 0) {
      return results[0]!.date;
    }

    // If the rule has a finite end and we've passed it, stop early
    if (rule.end.type === 'on' && rangeEnd > rule.end.date) {
      return null;
    }
  }

  // Final attempt with full horizon
  const rangeEnd = addDays(rangeStart, MAX_HORIZON_DAYS);
  const results = expand(rule, { rangeStart, rangeEnd });
  return results.length > 0 ? results[0]!.date : null;
}
