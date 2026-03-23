/**
 * toRRuleString() — converts a RecurrenceRule to an iCalendar RRULE string.
 *
 * Output format follows RFC 5545, e.g.:
 *   DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;UNTIL=20241231T000000Z
 *
 * This makes rbc-recurrence interoperable with iCal, Google Calendar,
 * Outlook, and any system that speaks RFC 5545.
 */

import type { RecurrenceRule } from '../core/types.js';

const BYDAY_MAP: Record<number, string> = {
  0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA',
};

function padTo2(n: number): string {
  return String(n).padStart(2, '0');
}

function toICalDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}` +
    `${padTo2(d.getUTCMonth() + 1)}` +
    `${padTo2(d.getUTCDate())}` +
    `T000000Z`
  );
}

/**
 * Converts a RecurrenceRule to an RRULE string (RFC 5545).
 *
 * @example
 * toRRuleString(rule)
 * // → "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
 */
export function toRRuleString(rule: RecurrenceRule): string {
  const parts: string[] = [];

  // FREQ
  const freqMap: Record<string, string> = {
    day: 'DAILY',
    week: 'WEEKLY',
    month: 'MONTHLY',
    year: 'YEARLY',
  };
  parts.push(`FREQ=${freqMap[rule.period] ?? 'DAILY'}`);

  // INTERVAL (omit if 1 — RFC default)
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);

  // Period-specific
  if (rule.period === 'week' && rule.weekly && rule.weekly.days.length > 0) {
    const byday = rule.weekly.days.map((d) => BYDAY_MAP[d] ?? '').join(',');
    parts.push(`BYDAY=${byday}`);
  }

  if (rule.period === 'month' && rule.monthly) {
    switch (rule.monthly.pattern) {
      case 'day':
        parts.push(`BYMONTHDAY=${rule.startDate.getUTCDate()}`);
        break;
      case 'lastDay':
        parts.push('BYMONTHDAY=-1');
        break;
      case 'weekday': {
        const ordinal = Math.floor((rule.startDate.getUTCDate() - 1) / 7) + 1;
        const day = BYDAY_MAP[rule.startDate.getUTCDay()] ?? 'MO';
        parts.push(`BYDAY=${ordinal}${day}`);
        break;
      }
      case 'lastWeekday': {
        const day = BYDAY_MAP[rule.startDate.getUTCDay()] ?? 'MO';
        parts.push(`BYDAY=-1${day}`);
        break;
      }
    }
  }

  if (rule.period === 'year' && rule.yearly) {
    parts.push(`BYMONTH=${rule.startDate.getUTCMonth() + 1}`);
    if (rule.yearly.pattern === 'weekday') {
      const ordinal = Math.floor((rule.startDate.getUTCDate() - 1) / 7) + 1;
      const day = BYDAY_MAP[rule.startDate.getUTCDay()] ?? 'MO';
      parts.push(`BYDAY=${ordinal}${day}`);
    } else {
      parts.push(`BYMONTHDAY=${rule.startDate.getUTCDate()}`);
    }
  }

  // End condition
  if (rule.end.type === 'on') {
    parts.push(`UNTIL=${toICalDate(rule.end.date)}`);
  } else if (rule.end.type === 'after') {
    parts.push(`COUNT=${rule.end.occurrences}`);
  }

  const dtstart = `DTSTART:${toICalDate(rule.startDate)}`;
  return `${dtstart}\nRRULE:${parts.join(';')}`;
}
