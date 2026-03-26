// ─── Recurrence Rule ─────────────────────────────────────────────────────────

/** Supported recurrence frequencies. */
export type Period = 'day' | 'week' | 'month' | 'year';

/**
 * Monthly recurrence patterns.
 * - `day`         → same calendar day (e.g. every 15th)
 * - `lastDay`     → last day of the month
 * - `weekday`     → Nth weekday of the month (e.g. 1st Monday)
 * - `lastWeekday` → last occurrence of a weekday (e.g. last Friday)
 */
export type MonthlyPattern = 'day' | 'lastDay' | 'weekday' | 'lastWeekday';

/**
 * Yearly recurrence patterns.
 * - `date`    → same month + day every year (e.g. Dec 25)
 * - `weekday` → Nth weekday of the same month (e.g. 3rd Thursday of November)
 */
export type YearlyPattern = 'date' | 'weekday';

/** When/how the recurrence series ends. */
export type RecurrenceEnd =
  | { type: 'never' }
  | { type: 'on'; date: Date }
  | { type: 'after'; occurrences: number };

/** Weekly-specific configuration. */
export interface WeeklyConfig {
  /** Days of the week to recur on. 0 = Sunday … 6 = Saturday. */
  days: number[];
}

/** Monthly-specific configuration. */
export interface MonthlyConfig {
  pattern: MonthlyPattern;
}

/** Yearly-specific configuration. */
export interface YearlyConfig {
  pattern: YearlyPattern;
}

/**
 * A complete, self-contained recurrence rule.
 * The `startDate` anchors all interval calculations.
 */
export interface RecurrenceRule {
  /** The first occurrence date. Used as the anchor for all calculations. */
  startDate: Date;
  /** Repeat every N periods (e.g. interval=2, period='week' → every 2 weeks). */
  interval: number;
  period: Period;
  end: RecurrenceEnd;
  weekly?: WeeklyConfig;
  monthly?: MonthlyConfig;
  yearly?: YearlyConfig;
  /**
   * Dates to exclude from expansion (e.g. deleted single occurrences).
   * Persisted through RRULE round-trip as EXDATE lines.
   */
  excludeDates?: Date[];
}

// ─── Expansion ───────────────────────────────────────────────────────────────

/** A single expanded occurrence produced by `expand()`. */
export interface ExpandedDate {
  /** The occurrence date (time set to midnight UTC). */
  date: Date;
  /** 0-based index within the full series (not limited to the query range). */
  occurrenceIndex: number;
}

/** Options controlling how `expand()` generates occurrences. */
export interface ExpandOptions {
  /** Start of the date range to expand into (inclusive). */
  rangeStart: Date;
  /** End of the date range to expand into (inclusive). */
  rangeEnd: Date;
  /**
   * Hard cap on total occurrences considered (safety valve).
   * @default 5000
   */
  maxOccurrences?: number;
  /**
   * Dates to exclude from expansion (e.g. deleted single occurrences).
   * Comparison is done at day precision.
   */
  excludeDates?: Date[];
}

// ─── React Big Calendar Integration ──────────────────────────────────────────

/** A recurring event definition, decoupled from any single occurrence. */
export interface RecurringEvent<TData = Record<string, unknown>> {
  /** Stable, unique identifier for this recurring series. */
  id: string;
  /** The recurrence rule driving this event. */
  rule: RecurrenceRule;
  /**
   * Arbitrary data you want carried on each expanded occurrence
   * (title, color, resource IDs, etc.).
   */
  eventData: TData;
  /** Duration of each occurrence in minutes. */
  durationMinutes: number;
  /**
   * Optional time-of-day window. "HH:mm" in 24-hour format.
   * When provided, expanded RBC events will have proper start/end times.
   */
  schedule?: {
    startTime: string;
    endTime: string;
  };
  /**
   * Dates to exclude from this event's expansion.
   * Takes precedence over rule.excludeDates.
   */
  excludeDates?: Date[];
}

/**
 * The shape of an event object consumed by React Big Calendar.
 * Merges your `TData` payload with the required `start`/`end` fields.
 */
export type RBCEvent<TData = Record<string, unknown>> = TData & {
  start: Date;
  end: Date;
  /**
   * Stable occurrence ID: `${recurringEvent.id}::${date.toISOString()}`.
   * Allows distinguishing individual occurrences within a series.
   */
  _occurrenceId: string;
  /** The parent series ID. */
  _seriesId: string;
  /** The 0-based occurrence index within the full series. */
  _occurrenceIndex: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
