/**
 * Weekly recurrence expansion.
 *
 * Ported and generalised from:
 *   backend/resolvers/.../weeklyRepetition/genWeeklyRepetition.js
 *
 * Algorithm:
 *   1. Walk day-by-day from startDate toward rangeEnd (with fast-forward).
 *   2. For each day, compute weeksDiff(startDate, candidate) to determine
 *      whether this is a target week (weeksDiff % interval === 0).
 *   3. Within a target week, check whether the day-of-week is in weekly.days.
 *   4. Apply end conditions and exclusion set.
 */

import type { RecurrenceRule, ExpandedDate, ExpandOptions } from '../types.js';
import { addDays, weeksDiff, isAfterDay, isSameDay, toDateKey, startOfDay } from '../utils/date.js';

export function expandWeekly(
  rule: RecurrenceRule,
  options: ExpandOptions,
  occurrenceCountBefore: number,
): ExpandedDate[] {
  const { rangeStart, rangeEnd, maxOccurrences = 5000, excludeDates = [] } = options;
  const { startDate, interval, end, weekly } = rule;

  if (!weekly || weekly.days.length === 0) return [];

  const excludeSet = new Set(excludeDates.map(toDateKey));
  const results: ExpandedDate[] = [];

  let occurrenceIndex = 0;
  let cur = startOfDay(startDate);

  // Fast-forward: skip whole intervals to get close to rangeStart,
  // preserving the modulo invariant so interval logic stays correct.
  if (cur < rangeStart) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToRange = Math.max(
      0,
      Math.floor((rangeStart.getTime() - cur.getTime()) / msPerDay) - 7,
    );
    const safeSkipWeeks = Math.floor(daysToRange / (7 * interval)) * interval;
    if (safeSkipWeeks > 0) {
      cur = addDays(cur, safeSkipWeeks * 7);
      // Account for occurrences skipped by fast-forward.
      // First interval may be partial (only days >= startDate's weekday count).
      const intervalsSkipped = safeSkipWeeks / interval;
      const startDow = startDate.getUTCDay();
      const daysInFirstInterval = weekly.days.filter((d) => d >= startDow).length;
      occurrenceIndex =
        daysInFirstInterval + Math.max(0, intervalsSkipped - 1) * weekly.days.length;
    }
  }

  let safetyCounter = 0;

  while (!isAfterDay(cur, rangeEnd) && safetyCounter < maxOccurrences) {
    safetyCounter++;

    if (end.type === 'after' && occurrenceIndex >= end.occurrences) break;
    if (end.type === 'on' && isAfterDay(cur, end.date)) break;

    // Skip days before startDate
    if (isAfterDay(startDate, cur) && !isSameDay(startDate, cur)) {
      cur = addDays(cur, 1);
      continue;
    }

    const wDiff = weeksDiff(startDate, cur);
    const isTargetWeek = wDiff >= 0 && wDiff % interval === 0;

    if (isTargetWeek && weekly.days.includes(cur.getUTCDay())) {
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
    }

    cur = addDays(cur, 1);
  }

  return results;
}
