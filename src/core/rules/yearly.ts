/**
 * Yearly recurrence expansion.
 *
 * Supports two patterns:
 *   - date    → same month + day every year (e.g. Dec 25)
 *   - weekday → Nth weekday of the same month (e.g. 3rd Thursday of November)
 */

import type { RecurrenceRule, ExpandedDate, ExpandOptions } from '../types.js';
import {
  daysInMonth,
  ordinalWeekdayInMonth,
  getOrdinalIndex,
  isAfterDay,
  isSameDay,
  toDateKey,
  startOfDay,
} from '../utils/date.js';

export function expandYearly(
  rule: RecurrenceRule,
  options: ExpandOptions,
  occurrenceCountBefore: number,
): ExpandedDate[] {
  const { rangeStart, rangeEnd, maxOccurrences = 5000, excludeDates = [] } = options;
  const { startDate, interval, end, yearly } = rule;

  if (!yearly) return [];

  const excludeSet = new Set(excludeDates.map(toDateKey));
  const results: ExpandedDate[] = [];

  const startYear = startDate.getUTCFullYear();
  const targetMonth = startDate.getUTCMonth();

  // Fast-forward to the first candidate year at or after rangeStart
  const yearsToRange = Math.max(0, rangeStart.getUTCFullYear() - startYear);
  const firstOffset = Math.floor(yearsToRange / interval) * interval;

  let occurrenceIndex = Math.floor(firstOffset / interval);
  let yearOffset = firstOffset;
  let safetyCounter = 0;

  while (safetyCounter < maxOccurrences) {
    safetyCounter++;

    const targetYear = startYear + yearOffset;

    let targetDate: Date | null = null;

    if (yearly.pattern === 'date') {
      const desiredDay = startDate.getUTCDate();
      const maxDay = daysInMonth(targetYear, targetMonth);
      targetDate = new Date(Date.UTC(targetYear, targetMonth, Math.min(desiredDay, maxDay)));
    } else if (yearly.pattern === 'weekday') {
      const weekday = startDate.getUTCDay();
      const ordinalIndex = getOrdinalIndex(startDate);
      targetDate = ordinalWeekdayInMonth(targetYear, targetMonth, weekday, ordinalIndex);
    }

    if (!targetDate) {
      yearOffset += interval;
      continue;
    }

    // normalise to UTC midnight
    targetDate = startOfDay(targetDate);

    if (end.type === 'after' && occurrenceIndex >= end.occurrences) break;
    if (end.type === 'on' && isAfterDay(targetDate, end.date)) break;
    if (isAfterDay(targetDate, rangeEnd)) break;

    const inRange =
      (isSameDay(targetDate, rangeStart) || isAfterDay(targetDate, rangeStart)) &&
      (isSameDay(targetDate, rangeEnd) || !isAfterDay(targetDate, rangeEnd));

    if (inRange && !excludeSet.has(toDateKey(targetDate))) {
      results.push({
        date: new Date(targetDate),
        occurrenceIndex: occurrenceCountBefore + occurrenceIndex,
      });
    }

    occurrenceIndex++;
    yearOffset += interval;
  }

  return results;
}
