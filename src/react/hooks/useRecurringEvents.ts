/**
 * useRecurringEvents — the primary React Big Calendar integration hook.
 *
 * Accepts an array of RecurringEvent definitions and re-expands them
 * whenever the visible calendar range changes via RBC's onRangeChange callback.
 *
 * Usage:
 * ```tsx
 * const { events, onRangeChange } = useRecurringEvents(myRecurringEvents, {
 *   oneTimeEvents: myStaticEvents,
 * });
 *
 * <Calendar events={events} onRangeChange={onRangeChange} />
 * ```
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { expand } from '../../core/expand.js';
import { setTimeOfDay, addDays } from '../../core/utils/date.js';
import type { RecurringEvent, RBCEvent, ExpandOptions } from '../../core/types.js';

export type RBCRange = Date[] | { start: Date; end: Date };

export interface UseRecurringEventsOptions<TData> {
  /**
   * Non-recurring events to mix into the output unchanged.
   * They must already have `start` and `end` fields.
   */
  oneTimeEvents?: (TData & { start: Date; end: Date })[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  /**
   * Buffer in days added to each side of the visible range before expanding.
   * Prevents flicker when the user navigates by a few days.
   * @default 7
   */
  bufferDays?: number;
  /**
   * Maximum occurrences per series per expansion call.
   * @default 5000
   */
  maxOccurrences?: number;
}

export interface UseRecurringEventsResult<TData> {
  /** Fully expanded + merged events ready to pass to `<Calendar events={...} />`. */
  events: Array<RBCEvent<TData> | (TData & { start: Date; end: Date })>;
  /**
   * Pass this directly to `<Calendar onRangeChange={onRangeChange} />`.
   * Re-expands recurring events whenever the user navigates.
   */
  onRangeChange: (range: RBCRange) => void;
}

function normaliseRange(range: RBCRange): { start: Date; end: Date } {
  if (Array.isArray(range)) {
    const sorted = [...range].sort((a, b) => a.getTime() - b.getTime());
    return { start: sorted[0]!, end: sorted[sorted.length - 1]! };
  }
  return { start: range.start, end: range.end };
}

export function useRecurringEvents<TData = Record<string, unknown>>(
  recurringEvents: RecurringEvent<TData>[],
  options: UseRecurringEventsOptions<TData> = {},
): UseRecurringEventsResult<TData> {
  const { oneTimeEvents = [], bufferDays = 7, maxOccurrences = 5000 } = options;

  // Default range: current month
  const today = new Date();
  const defaultRange = {
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
  };

  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>(defaultRange);

  const onRangeChange = useCallback((range: RBCRange) => {
    setVisibleRange(normaliseRange(range));
  }, []);

  // Keep a stable ref to recurring events to avoid unnecessary re-expansions
  const recurringEventsRef = useRef(recurringEvents);
  recurringEventsRef.current = recurringEvents;

  const expandedEvents = useMemo(() => {
    const rangeStart = addDays(visibleRange.start, -bufferDays);
    const rangeEnd = addDays(visibleRange.end, bufferDays);

    const expandOptions: ExpandOptions = { rangeStart, rangeEnd, maxOccurrences };

    const results: RBCEvent<TData>[] = [];

    for (const recurringEvent of recurringEventsRef.current) {
      const occurrences = expand(recurringEvent.rule, expandOptions);

      for (const occurrence of occurrences) {
        let start: Date;
        let end: Date;

        if (recurringEvent.schedule) {
          start = setTimeOfDay(occurrence.date, recurringEvent.schedule.startTime);
          end = setTimeOfDay(occurrence.date, recurringEvent.schedule.endTime);
        } else {
          start = new Date(occurrence.date);
          end = addDays(occurrence.date, Math.ceil(recurringEvent.durationMinutes / (60 * 24)));
          if (recurringEvent.durationMinutes < 1440) {
            // sub-day event: set end by adding minutes
            end = new Date(start.getTime() + recurringEvent.durationMinutes * 60 * 1000);
          }
        }

        results.push({
          ...recurringEvent.eventData,
          start,
          end,
          _occurrenceId: `${recurringEvent.id}::${occurrence.date.toISOString()}`,
          _seriesId: recurringEvent.id,
          _occurrenceIndex: occurrence.occurrenceIndex,
        });
      }
    }

    return results;
  }, [visibleRange, bufferDays, maxOccurrences]);

  const events = useMemo(
    () => [...expandedEvents, ...oneTimeEvents],
    [expandedEvents, oneTimeEvents],
  );

  return { events, onRangeChange };
}
