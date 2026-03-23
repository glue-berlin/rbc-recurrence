/**
 * fromRRuleString() — parses an iCalendar RRULE string into a RecurrenceRule.
 *
 * Supports the subset of RFC 5545 that maps to rbc-recurrence's feature set:
 *   FREQ, INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, UNTIL, COUNT
 *
 * Unknown or unsupported parameters are silently ignored.
 */

import type { RecurrenceRule, MonthlyPattern, WeeklyConfig, MonthlyConfig, YearlyConfig } from '../core/types.js';

const BYDAY_TO_INDEX: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

function parseICalDate(str: string): Date {
  // Handles YYYYMMDD and YYYYMMDDTHHmmssZ
  const clean = str.replace(/[TZ]/g, '').replace(/[^0-9]/g, '');
  const year = parseInt(clean.slice(0, 4), 10);
  const month = parseInt(clean.slice(4, 6), 10) - 1;
  const day = parseInt(clean.slice(6, 8), 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Parses an RRULE string (optionally preceded by a DTSTART line) into a RecurrenceRule.
 *
 * @throws {Error} if FREQ is missing or unrecognised.
 *
 * @example
 * fromRRuleString('DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE')
 */
export function fromRRuleString(input: string): RecurrenceRule {
  const lines = input.trim().split(/\r?\n/);

  const now = new Date();
  let startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let rruleLine = '';

  for (const line of lines) {
    if (line.startsWith('DTSTART:')) {
      startDate = parseICalDate(line.slice(8));
    } else if (line.startsWith('RRULE:')) {
      rruleLine = line.slice(6);
    } else if (!line.includes(':')) {
      // Plain RRULE without prefix
      rruleLine = line;
    }
  }

  if (!rruleLine) throw new Error('No RRULE found in input.');

  const params: Record<string, string> = {};
  for (const part of rruleLine.split(';')) {
    const [key, value] = part.split('=');
    if (key && value !== undefined) params[key] = value;
  }

  // FREQ → period
  const freqMap: Record<string, RecurrenceRule['period']> = {
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
    YEARLY: 'year',
  };
  const freq = params['FREQ'];
  const period = freq ? freqMap[freq] : undefined;
  if (!period) throw new Error(`Unsupported or missing FREQ: ${freq ?? 'undefined'}`);

  // INTERVAL
  const interval = params['INTERVAL'] ? parseInt(params['INTERVAL'], 10) : 1;

  // End condition
  let end: RecurrenceRule['end'] = { type: 'never' };
  if (params['UNTIL']) {
    end = { type: 'on', date: parseICalDate(params['UNTIL']) };
  } else if (params['COUNT']) {
    end = { type: 'after', occurrences: parseInt(params['COUNT'], 10) };
  }

  // Period-specific
  let weekly: WeeklyConfig | undefined;
  let monthly: MonthlyConfig | undefined;
  let yearly: YearlyConfig | undefined;

  if (period === 'week') {
    const byday = params['BYDAY'];
    const days = byday
      ? byday.split(',').map((d) => BYDAY_TO_INDEX[d] ?? -1).filter((d) => d >= 0)
      : [startDate.getUTCDay()];
    weekly = { days };
  }

  if (period === 'month') {
    const byMonthDay = params['BYMONTHDAY'];
    const byday = params['BYDAY'];

    if (byMonthDay === '-1') {
      monthly = { pattern: 'lastDay' };
    } else if (byMonthDay) {
      monthly = { pattern: 'day' };
    } else if (byday) {
      const match = /^(-?\d+)([A-Z]{2})$/.exec(byday);
      if (match) {
        const ordinal = parseInt(match[1]!, 10);
        const pattern: MonthlyPattern = ordinal === -1 ? 'lastWeekday' : 'weekday';
        monthly = { pattern };
      } else {
        throw new Error(`Malformed monthly BYDAY value: ${byday}`);
      }
    } else {
      monthly = { pattern: 'day' };
    }
  }

  if (period === 'year') {
    const byday = params['BYDAY'];
    yearly = { pattern: byday ? 'weekday' : 'date' };
  }

  const rule: RecurrenceRule = { startDate, interval, period, end };
  if (weekly) rule.weekly = weekly;
  if (monthly) rule.monthly = monthly;
  if (yearly) rule.yearly = yearly;

  return rule;
}
