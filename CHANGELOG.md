# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] — 2026-03-26

### Added
- `createRule()` — ergonomic builder for creating recurrence rules with smart end-condition sugar (`Date` → until, `number` → count, omit → never)
- `nextOccurrence()` — find the next occurrence after any date with progressive widening strategy (90d → 400d → 4y, 10-year cap)
- `excludeDates` on `RecurrenceRule` and `RecurringEvent` — EXDATE support for deleting single occurrences from a series
- EXDATE round-trip in `toRRuleString()` / `fromRRuleString()` — excluded dates are now serialized and parsed per RFC 5545
- `<YearlyOptions />` — yearly pattern selector component ("On November 28" vs "On the fourth Thursday of November")
- `<ActiveRules />` — standalone component for displaying a list of active recurrence rules with remove and select actions, usable independently of `RecurrenceEditor`
- `describe(rule, { includeStart: true })` — optionally include start date in descriptions
- Auto-initialization of period config in `useRecurrenceForm` when switching periods (week → month no longer crashes)
- `RecurrenceEditor` section visibility props: `showWeekdayPicker`, `showMonthlyOptions`, `showYearlyOptions`, `showSchedule`, `showDescription` — all default to `true`, allowing consumers to hide sections and render standalone components elsewhere

### Fixed
- `validate()` now rejects rules where `end.date` is before or equal to `startDate`
- `fromRRuleString()` now correctly parses `DTSTART` with parameters (`DTSTART;TZID=...`, `DTSTART;VALUE=DATE:...`) instead of silently falling back to today
- `useRecurringEvents` now passes `excludeDates` from events and rules to the expansion engine
- `expand()` merges rule-level and options-level `excludeDates` automatically

### Changed
- "Start date" label in `RecurrenceEditor` renamed to "Starts on"
- Updated npm keywords for better discoverability

### Stats
- 229 tests (up from 171)
- Core bundle: 3.7 KB gzipped
- React bundle: 6 KB gzipped

## [0.1.0] — 2026-03-23

### Added
- `expand()` — pure function expanding a RecurrenceRule into occurrence dates
- `validate()` — validates RecurrenceRule with structured error messages
- `describe()` — human-readable rule descriptions
- `toRRuleString()` / `fromRRuleString()` — RFC 5545 RRULE interop
- `useRecurringEvents` — React hook integrating with React Big Calendar's `onRangeChange`
- `useRecurrenceForm` — headless form state hook for building recurrence rules
- `<RecurrenceEditor />` — compound editor component
- `<WeekdayPicker />` — S M T W T F S toggle buttons
- `<MonthlyOptions />` — monthly pattern selector
- Daily, weekly, monthly, yearly recurrence periods
- Monthly patterns: `day`, `lastDay`, `weekday`, `lastWeekday`
- End conditions: `never`, `on` (date), `after` (N occurrences)
- Optional default styles (`rbc-recurrence/react/styles.css`)
- ESM + CJS dual output, TypeScript definitions
- Zero runtime dependencies
