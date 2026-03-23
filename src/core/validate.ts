/**
 * validate() — validates a RecurrenceRule and returns structured errors.
 */

import type { RecurrenceRule, ValidationResult } from './types.js';

export function validate(rule: RecurrenceRule): ValidationResult {
  const errors: string[] = [];

  if (!(rule.startDate instanceof Date) || isNaN(rule.startDate.getTime())) {
    errors.push('startDate must be a valid Date.');
  }

  if (!Number.isInteger(rule.interval) || rule.interval < 1) {
    errors.push('interval must be a positive integer.');
  }

  if (!['day', 'week', 'month', 'year'].includes(rule.period)) {
    errors.push(`period must be one of: day, week, month, year.`);
  }

  // End condition
  if (!rule.end || !['never', 'on', 'after'].includes(rule.end.type)) {
    errors.push(`end.type must be one of: never, on, after.`);
  } else {
    if (rule.end.type === 'on') {
      if (!(rule.end.date instanceof Date) || isNaN(rule.end.date.getTime())) {
        errors.push('end.date must be a valid Date when end.type is "on".');
      }
    }
    if (rule.end.type === 'after') {
      if (!Number.isInteger(rule.end.occurrences) || rule.end.occurrences < 1) {
        errors.push('end.occurrences must be a positive integer when end.type is "after".');
      }
    }
  }

  // Period-specific
  if (rule.period === 'week') {
    if (!rule.weekly || !Array.isArray(rule.weekly.days) || rule.weekly.days.length === 0) {
      errors.push('weekly.days must be a non-empty array when period is "week".');
    } else {
      const invalid = rule.weekly.days.filter((d) => !Number.isInteger(d) || d < 0 || d > 6);
      if (invalid.length > 0) {
        errors.push('weekly.days must contain integers between 0 (Sun) and 6 (Sat).');
      }
    }
  }

  if (rule.period === 'month') {
    if (!rule.monthly) {
      errors.push('monthly config is required when period is "month".');
    } else if (!['day', 'lastDay', 'weekday', 'lastWeekday'].includes(rule.monthly.pattern)) {
      errors.push(
        'monthly.pattern must be one of: day, lastDay, weekday, lastWeekday.',
      );
    }
  }

  if (rule.period === 'year') {
    if (!rule.yearly) {
      errors.push('yearly config is required when period is "year".');
    } else if (!['date', 'weekday'].includes(rule.yearly.pattern)) {
      errors.push('yearly.pattern must be one of: date, weekday.');
    }
  }

  return { valid: errors.length === 0, errors };
}
