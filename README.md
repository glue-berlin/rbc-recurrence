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
- **Ultra-Lightweight** — Core engine under 5 KB gzipped with zero external dependencies
- **RFC 5545 Compliant** — Supports RRULE format for seamless integration with Google Calendar, Outlook, and iCal
- **React Hooks API** — `useRecurringEvents` and `useRecurrenceForm` hooks for effortless integration
- **Smart Expansion** — Only expands visible occurrences, no pre-generating thousands of events
- **Comprehensive Patterns** — Daily, weekly, monthly, and yearly frequencies with flexible end conditions
- **Pre-built Components** — `RecurrenceEditor`, `WeekdayPicker`, and `MonthlyOptions`, ready to drop in

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

---

## Documentation

For the full API reference — core functions, React hooks, components, and types — visit the **[Documentation](https://glue.berlin/rbc-recurrence/docs)**.

For usage examples, rule patterns, and migration guides, see the [examples](./examples/) folder.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All PRs welcome!

---

## License

[MIT](./LICENSE)
