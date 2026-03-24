# API Reference

For the full interactive documentation, visit **[glue.berlin/rbc-recurrence/docs](https://glue.berlin/rbc-recurrence/docs)**.

---

## Core API (zero dependencies)

```ts
import { expand, validate, describe, toRRuleString, fromRRuleString } from 'rbc-recurrence';
```

### `expand(rule, options): ExpandedDate[]`

Expands a rule into occurrence dates within a date range.

```ts
const occurrences = expand(
  {
    startDate: new Date('2024-01-01'),
    interval: 2,
    period: 'week',
    end: { type: 'after', occurrences: 10 },
    weekly: { days: [1, 5] }, // Mon, Fri
  },
  {
    rangeStart: new Date('2024-03-01'),
    rangeEnd: new Date('2024-03-31'),
  }
);
// → [{ date: Date, occurrenceIndex: number }, ...]
```

### `validate(rule): ValidationResult`

```ts
const { valid, errors } = validate(rule);
```

### `describe(rule): string`

```ts
describe(rule); // → "Every 2 weeks on Mon, Fri, ending after 10 occurrences"
```

### `toRRuleString(rule): string` / `fromRRuleString(str): RecurrenceRule`

RFC 5545 interop — import/export to any calendar system.

```ts
const rrule = toRRuleString(rule);
// → "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;COUNT=10"

const parsed = fromRRuleString(rrule); // → RecurrenceRule
```

---

## Supported Rule Types

### Weekly

```ts
{
  period: 'week',
  interval: 1,          // every N weeks
  weekly: {
    days: [1, 3, 5],   // 0=Sun, 1=Mon, …, 6=Sat
  },
}
```

### Monthly

```ts
{
  period: 'month',
  interval: 1,
  monthly: {
    pattern: 'day'        // same day of month (e.g. 15th)
            | 'lastDay'   // last day of month
            | 'weekday'   // Nth weekday (e.g. 1st Monday — derived from startDate)
            | 'lastWeekday' // last occurrence of weekday (e.g. last Friday)
  },
}
```

### Daily / Yearly

```ts
{ period: 'day', interval: 3 }  // every 3 days

{
  period: 'year',
  yearly: { pattern: 'date' | 'weekday' },
}
```

### End Conditions

```ts
end: { type: 'never' }
end: { type: 'on', date: new Date('2025-12-31') }
end: { type: 'after', occurrences: 12 }
```

---

## RecurrenceEditor Component

Drop in the ready-made editor to let users build recurrence rules:

```tsx
import { RecurrenceEditor } from 'rbc-recurrence/react';
import type { RecurrenceRule } from 'rbc-recurrence';

function CreateEventForm() {
  const [rule, setRule] = useState<RecurrenceRule | null>(null);

  return (
    <>
      <RecurrenceEditor
        onValidChange={setRule}
        renderActions={({ isValid, description }) => (
          <div>
            {description && <p>{description}</p>}
            <button disabled={!isValid}>Save</button>
          </div>
        )}
      />
    </>
  );
}
```

Optional default styles:

```tsx
import 'rbc-recurrence/react/styles.css';
```

---

## React Hooks

### `useRecurringEvents(events, options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `oneTimeEvents` | `Event[]` | `[]` | Non-recurring events to merge in |
| `bufferDays` | `number` | `7` | Days of buffer around the visible range |
| `maxOccurrences` | `number` | `5000` | Safety cap per series |

Returns `{ events, onRangeChange }`.

### `useRecurrenceForm(options)`

| Option | Type | Description |
|---|---|---|
| `initialRule` | `Partial<RecurrenceRule>` | Pre-populate with existing rule |

Returns `{ rule, setField, isValid, validation, description, reset }`.

---

## Why not just use `rrule`?

`rrule` is a great RFC 5545 implementation, but it has a [well-known issue](https://github.com/jkbrzt/rrule/issues/344) where `luxon` is marked optional but required in ESM builds — causing bundle failures and adding ~70 KB. It also has no React Big Calendar integration or UI components.

`rbc-recurrence` covers the 95% of real-world use cases with a custom engine (~5 KB gzipped), while still offering `toRRuleString` / `fromRRuleString` for standards compliance when needed.

---

## Migrating from a manual rrule setup

```ts
// Before — custom expansion logic
const events = rrule.between(rangeStart, rangeEnd).map(...);

// After
import { expand } from 'rbc-recurrence';
const occurrences = expand(rule, { rangeStart, rangeEnd });
```
