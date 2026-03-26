# rbc-recurrence

**The missing recurrence plugin for [React Big Calendar](https://github.com/jquense/react-big-calendar).**

[![npm version](https://img.shields.io/npm/v/rbc-recurrence.svg)](https://www.npmjs.com/package/rbc-recurrence)
[![npm downloads](https://img.shields.io/npm/dw/rbc-recurrence.svg)](https://www.npmjs.com/package/rbc-recurrence)
[![bundle size](https://img.shields.io/bundlephobia/minzip/rbc-recurrence)](https://bundlephobia.com/package/rbc-recurrence)
[![license](https://img.shields.io/npm/l/rbc-recurrence.svg)](./LICENSE)
[![CI](https://github.com/glue-berlin/rbc-recurrence/actions/workflows/ci.yml/badge.svg)](https://github.com/glue-berlin/rbc-recurrence/actions)

React Big Calendar has **750K+ weekly downloads** but no built-in recurring event support — the maintainer [intentionally delegated this](https://github.com/jquense/react-big-calendar/issues/51) to application code. `rbc-recurrence` fills that gap with a lightweight, zero-dependency engine and a ready-to-use React adapter.

> **[Live Demo →](https://glue.berlin/rbc-recurrence)** · **[Full Documentation →](https://glue.berlin/rbc-recurrence/docs)**

---

## Features

- **Open Source** — MIT licensed, free to use, modify, and distribute in any project
- **Ultra-Lightweight** — Core engine under 4 KB gzipped with zero external dependencies
- **RFC 5545 Compliant** — Full RRULE + EXDATE support for seamless integration with Google Calendar, Outlook, and iCal
- **React Hooks API** — `useRecurringEvents` and `useRecurrenceForm` hooks for effortless integration
- **Smart Expansion** — Only expands visible occurrences, no pre-generating thousands of events
- **Comprehensive Patterns** — Daily, weekly, monthly, and yearly frequencies with flexible end conditions
- **Pre-built Components** — `RecurrenceEditor`, `ActiveRules`, `WeekdayPicker`, `MonthlyOptions`, and `YearlyOptions`, ready to drop in
- **Composable Editor** — Toggle `RecurrenceEditor` sections on/off and render standalone components wherever you need them
- **Rule Builder** — `createRule()` for ergonomic rule creation with smart defaults
- **Exclude Dates** — EXDATE support for deleting single occurrences from a series

---

## Why rbc-recurrence?

If you're using React Big Calendar and need recurring events, you have two options: wire up a generic RRULE library yourself, or use `rbc-recurrence` — purpose-built for the job.

### How to add recurring events to React Big Calendar

Without `rbc-recurrence`, you need to:
1. Pick an RRULE library (like `rrule`)
2. Manually expand occurrences for the visible range
3. Convert them to RBC's `{ start, end }` event format
4. Re-expand on every range change (month/week/day navigation)
5. Build your own recurrence editor UI from scratch

With `rbc-recurrence`, it's one hook:

```tsx
const { events, onRangeChange } = useRecurringEvents(recurringEvents);

<Calendar events={events} onRangeChange={onRangeChange} />
```

### rbc-recurrence vs rrule

| | rbc-recurrence | rrule |
|---|---|---|
| Bundle size | 3.7 KB | 43 KB |
| Dependencies | Zero | luxon (optional) |
| RBC hooks | `useRecurringEvents`, `useRecurrenceForm` | — |
| UI components | `RecurrenceEditor`, `ActiveRules`, + 3 more | — |
| Range expansion | Automatic (visible dates only) | Manual |
| RRULE + EXDATE | Yes | Yes |
| Timezone / BYSETPOS | Planned | Yes |

**Use `rbc-recurrence` when:** you're building with React Big Calendar and want a drop-in solution with UI components.

**Use `rrule` when:** you need full RFC 5545 compliance (BYSETPOS, WKST, sub-day recurrence) or timezone-aware expansion, and you're willing to build the RBC integration yourself.

---

## Getting Started

### Installation

```bash
npm install rbc-recurrence react-big-calendar dayjs
```

> **Why dayjs?** React Big Calendar requires a date localizer — it doesn't support native `Date` on its own. `rbc-recurrence` itself uses only native JavaScript. We recommend [dayjs](https://day.js.org/) (2 KB, zero deps) as the lightest option. You may also use `luxon` or `date-fns`.

### Quick Start

```tsx
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import { useRecurringEvents } from 'rbc-recurrence/react';
import type { RecurringEvent } from 'rbc-recurrence';

const localizer = dayjsLocalizer(dayjs);

const recurringEvents: RecurringEvent[] = [
  {
    id: 'standup',
    rule: {
      startDate: new Date('2024-01-01'),
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1, 2, 3, 4, 5] }, // Mon–Fri
    },
    durationMinutes: 30,
    eventData: { title: 'Daily Standup' },
  },
];

function MyCalendar() {
  const { events, onRangeChange } = useRecurringEvents(recurringEvents);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      onRangeChange={onRangeChange}
    />
  );
}
```

That's it. The hook expands occurrences only for the visible range — no pre-generating thousands of events.

### Creating Rules with `createRule()`

```ts
import { createRule } from 'rbc-recurrence';

// Every weekday, ending Dec 31
const rule = createRule({
  start: new Date('2024-06-01'),
  end: new Date('2024-12-31'),
  period: 'week',
  weekly: { days: [1, 2, 3, 4, 5] },
});

// Every 2 months, 10 occurrences
const rule2 = createRule({
  start: new Date('2024-01-15'),
  end: 10,
  period: 'month',
  monthly: { pattern: 'day' },
});

// Yearly on Dec 25, forever
const rule3 = createRule({
  start: new Date('2024-12-25'),
  period: 'year',
  yearly: { pattern: 'date' },
});
```

### RRULE Import/Export (RFC 5545)

```ts
import { toRRuleString, fromRRuleString } from 'rbc-recurrence';

// Export to iCal / Google Calendar format
const rrule = toRRuleString(rule);
// → "DTSTART:20240601T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20241231T000000Z"

// Import from external calendar systems
const imported = fromRRuleString(rrule);
```

EXDATE (excluded dates) are fully supported in both directions:

```ts
const rule = createRule({
  start: new Date('2024-01-01'),
  period: 'day',
  excludeDates: [new Date('2024-01-05')], // skip Jan 5
});

const rrule = toRRuleString(rule);
// includes: EXDATE:20240105T000000Z
```

### Finding the Next Occurrence

```ts
import { nextOccurrence } from 'rbc-recurrence';

const next = nextOccurrence(rule);              // next after now
const next2 = nextOccurrence(rule, someDate);   // next after a specific date
// Returns null if the series has ended
```

### Human-Readable Descriptions

```ts
import { describe } from 'rbc-recurrence';

describe(rule);
// → "Every week on Mon, Tue, Wed, Thu, Fri"

describe(rule, { includeStart: true });
// → "Every week on Mon, Tue, Wed, Thu, Fri, starting June 1, 2024, until December 31, 2024"
```

### Displaying Active Rules

```tsx
import { ActiveRules } from 'rbc-recurrence/react';

<ActiveRules
  items={[
    { id: '1', title: 'Daily Standup', rule: standupRule, color: '#6366f1' },
    { id: '2', title: 'Sprint Review', rule: reviewRule },
  ]}
  onRemove={(id) => removeRule(id)}
  onSelect={(id) => openEditor(id)}
  describeOptions={{ includeStart: true }}
/>
```

`ActiveRules` is independent of `RecurrenceEditor` — use it in sidebars, dashboards, or wherever you list rules.

### Composable Editor

`RecurrenceEditor` renders all sections by default. Toggle them off to render standalone components elsewhere:

```tsx
// Hide the weekday picker and schedule — render your own
<RecurrenceEditor
  showWeekdayPicker={false}
  showSchedule={false}
  showDescription={false}
  onChange={handleChange}
/>

// Render the weekday picker wherever you want
<WeekdayPicker value={days} onChange={setDays} />
```

Available toggles: `showWeekdayPicker`, `showMonthlyOptions`, `showYearlyOptions`, `showSchedule`, `showDescription` — all default to `true`.

---

## Documentation

For the full API reference — core functions, React hooks, components, and types — visit the **[Documentation](https://glue.berlin/rbc-recurrence/docs)**.

For usage examples, rule patterns, and migration guides, see the [examples](./examples/) folder.

---

## FAQ

### How do I add recurring events to React Big Calendar?

Install `rbc-recurrence`, define your recurring events with a `RecurrenceRule`, and pass them to the `useRecurringEvents` hook. The hook returns expanded events ready for RBC's `<Calendar>` component. See [Quick Start](#quick-start) above.

### Can I use this without React?

Yes. The core engine (`rbc-recurrence`) has zero dependencies and works in any JavaScript environment. Only the `/react` entry point requires React and react-big-calendar as peer dependencies.

```ts
import { expand, createRule, describe, toRRuleString } from 'rbc-recurrence';
```

### How does this compare to the rrule library?

See the [comparison table](#rbc-recurrence-vs-rrule) above. In short: `rbc-recurrence` is purpose-built for React Big Calendar with hooks, UI components, and 10x smaller bundle. `rrule` offers broader RFC 5545 coverage but no RBC integration.

### Does it support Google Calendar / Outlook / iCal?

Yes. `toRRuleString()` and `fromRRuleString()` produce and parse standard RFC 5545 RRULE+EXDATE strings, which are the format used by Google Calendar, Outlook, Apple Calendar, and all iCalendar-compatible systems.

### How do I delete a single occurrence from a recurring series?

Add the date to the `excludeDates` array on the rule or the recurring event:

```ts
rule.excludeDates = [new Date('2024-03-15')]; // skip March 15
```

Excluded dates are preserved through RRULE round-trips as EXDATE lines.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All PRs welcome!

---

## License

[MIT](./LICENSE)
