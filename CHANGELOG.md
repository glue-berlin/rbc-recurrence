# Changelog

All notable changes to this project will be documented in this file.

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
