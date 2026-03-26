/**
 * describe() — produces a human-readable string describing a RecurrenceRule.
 *
 * Examples:
 *   "Every day"
 *   "Every 2 weeks on Mon, Wed, Fri"
 *   "Every month on the 1st Monday"
 *   "Every month on the last day"
 *   "Every year on March 15"
 *   "Every 3 months on the last Friday, ending after 10 occurrences"
 */

import type { RecurrenceRule } from './types.js';
import { getOrdinalIndex } from './utils/date.js';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinalStr(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const val = n % 100;
  return n + (suffix[(val - 20) % 10] ?? suffix[val] ?? suffix[0] ?? 'th');
}

function ordinalWord(index: number): string {
  return ['first', 'second', 'third', 'fourth', 'fifth'][index] ?? ordinalStr(index + 1);
}

function describeEnd(rule: RecurrenceRule): string {
  if (rule.end.type === 'never') return '';
  if (rule.end.type === 'after')
    return `, ending after ${rule.end.occurrences} occurrence${rule.end.occurrences === 1 ? '' : 's'}`;
  if (rule.end.type === 'on') {
    const d = rule.end.date;
    return `, until ${MONTH_NAMES[d.getUTCMonth()] ?? ''} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }
  return '';
}

export interface DescribeOptions {
  /** Include the start date in the description. @default false */
  includeStart?: boolean;
}

/**
 * Returns a human-readable description of the recurrence rule.
 *
 * @example
 * describe({ period: 'week', interval: 2, weekly: { days: [1,3,5] }, ... })
 * // → "Every 2 weeks on Mon, Wed, Fri"
 *
 * describe(rule, { includeStart: true })
 * // → "Every 2 weeks on Mon, Wed, Fri, starting June 1, 2024"
 */
export function describe(rule: RecurrenceRule, options?: DescribeOptions): string {
  const { period, interval, startDate } = rule;
  const every = interval === 1 ? 'Every' : `Every ${interval}`;
  const end = describeEnd(rule);

  let base: string;

  switch (period) {
    case 'day': {
      const unit = interval === 1 ? 'day' : 'days';
      base = `${every} ${unit}`;
      break;
    }

    case 'week': {
      const unit = interval === 1 ? 'week' : 'weeks';
      if (!rule.weekly || rule.weekly.days.length === 0) {
        base = `${every} ${unit}`;
      } else {
        const dayLabels = rule.weekly.days
          .slice()
          .sort((a, b) => a - b)
          .map((d) => WEEKDAY_SHORT[d] ?? '')
          .join(', ');
        base = `${every} ${unit} on ${dayLabels}`;
      }
      break;
    }

    case 'month': {
      const unit = interval === 1 ? 'month' : 'months';
      if (!rule.monthly) {
        base = `${every} ${unit}`;
      } else {
        switch (rule.monthly.pattern) {
          case 'day': {
            const day = startDate.getUTCDate();
            base = `${every} ${unit} on the ${ordinalStr(day)}`;
            break;
          }
          case 'lastDay':
            base = `${every} ${unit} on the last day`;
            break;
          case 'weekday': {
            const weekdayName = WEEKDAY_LONG[startDate.getUTCDay()] ?? '';
            const ordinal = ordinalWord(getOrdinalIndex(startDate));
            base = `${every} ${unit} on the ${ordinal} ${weekdayName}`;
            break;
          }
          case 'lastWeekday': {
            const weekdayName = WEEKDAY_LONG[startDate.getUTCDay()] ?? '';
            base = `${every} ${unit} on the last ${weekdayName}`;
            break;
          }
          default:
            base = `${every} ${unit}`;
        }
      }
      break;
    }

    case 'year': {
      const unit = interval === 1 ? 'year' : 'years';
      if (!rule.yearly) {
        base = `${every} ${unit}`;
      } else {
        const monthName = MONTH_NAMES[startDate.getUTCMonth()] ?? '';
        switch (rule.yearly.pattern) {
          case 'date':
            base = `${every} ${unit} on ${monthName} ${ordinalStr(startDate.getUTCDate())}`;
            break;
          case 'weekday': {
            const weekdayName = WEEKDAY_LONG[startDate.getUTCDay()] ?? '';
            const ordinal = ordinalWord(getOrdinalIndex(startDate));
            base = `${every} ${unit} on the ${ordinal} ${weekdayName} of ${monthName}`;
            break;
          }
          default:
            base = `${every} ${unit}`;
        }
      }
      break;
    }

    default:
      base = `Every ${interval} ${period as string}(s)`;
  }

  let result = base;

  if (options?.includeStart) {
    const m = MONTH_NAMES[startDate.getUTCMonth()] ?? '';
    result += `, starting ${m} ${startDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;
  }

  result += end;

  return result;
}
