/**
 * Daily recurrence expansion. Every N days from startDate.
 */

import type { RecurrenceRule, ExpandedDate, ExpandOptions } from '../types.js';
import { addDays, isAfterDay, isSameDay, toDateKey, startOfDay } from '../utils/date.js';

export function expandDaily(
  rule: RecurrenceRule,
  options: ExpandOptions,
  occurrenceCountBefore: number,
): ExpandedDate[] {
  const { rangeStart, rangeEnd, maxOccurrences = 5000, excludeDates = [] } = options;
  const { startDate, interval, end } = rule;

  const excludeSet = new Set(excludeDates.map(toDateKey));
  const results: ExpandedDate[] = [];

  const msPerDay = 24 * 60 * 60 * 1000;
  let cur = startOfDay(startDate);

  // Fast-forward: skip to the first occurrence >= rangeStart
  if (cur < rangeStart) {
    const daysToRange = Math.floor((rangeStart.getTime() - cur.getTime()) / msPerDay);
    const stepsToSkip = Math.floor(daysToRange / interval);
    cur = addDays(cur, stepsToSkip * interval);
  }

  let occurrenceIndex = Math.floor(
    (cur.getTime() - startOfDay(startDate).getTime()) / (msPerDay * interval),
  );

  let safetyCounter = 0;

  while (!isAfterDay(cur, rangeEnd) && safetyCounter < maxOccurrences) {
    safetyCounter++;

    if (end.type === 'after' && occurrenceIndex >= end.occurrences) break;
    if (end.type === 'on' && isAfterDay(cur, end.date)) break;

    const inRange =
      (isSameDay(cur, rangeStart) || isAfterDay(cur, rangeStart)) &&
      (isSameDay(cur, rangeEnd) || !isAfterDay(cur, rangeEnd));

    if (inRange && !excludeSet.has(toDateKey(cur))) {
      results.push({
        date: new Date(cur),
        occurrenceIndex: occurrenceCountBefore + occurrenceIndex,
      });
    }

    occurrenceIndex++;
    cur = addDays(cur, interval);
  }

  return results;
}
