/**
 * ActiveRules — a list of active recurrence rules with optional remove and select actions.
 *
 * Headless-first: no hardcoded styles, only CSS class names.
 * Can be used independently of RecurrenceEditor.
 *
 * @example
 * <ActiveRules
 *   items={[
 *     { id: '1', title: 'Daily Standup', rule: standupRule, color: '#6366f1' },
 *     { id: '2', title: 'Sprint Review', rule: reviewRule },
 *   ]}
 *   onRemove={(id) => removeRule(id)}
 *   onSelect={(id) => openEditor(id)}
 * />
 */

import { useMemo } from 'react';
import { describe, type DescribeOptions } from '../../core/describe.js';
import type { RecurrenceRule } from '../../core/types.js';

export interface ActiveRulesItem {
  /** Unique identifier for this rule. */
  id: string;
  /** Display title for the rule. */
  title: string;
  /** The recurrence rule to describe. */
  rule: RecurrenceRule;
  /** Optional accent color (rendered as a dot). */
  color?: string;
}

export interface ActiveRulesProps {
  /** The list of active recurrence rules to display. */
  items: ActiveRulesItem[];
  /** Called when the user clicks the remove button. If omitted, no remove button is shown. */
  onRemove?: (id: string) => void;
  /** Called when the user clicks an item (e.g. to edit it). */
  onSelect?: (id: string) => void;
  /** Extra className for the root container. */
  className?: string;
  /** Options passed to `describe()` for each rule. */
  describeOptions?: DescribeOptions;
}

/**
 * Renders a list of active recurrence rules with descriptions,
 * optional color dots, and remove buttons.
 */
export function ActiveRules({
  items,
  onRemove,
  onSelect,
  className,
  describeOptions,
}: ActiveRulesProps) {
  const descriptions = useMemo(
    () =>
      items.map((item) => {
        try {
          return describe(item.rule, describeOptions);
        } catch {
          return '';
        }
      }),
    [items, describeOptions],
  );

  return (
    <div
      className={`rbc-recurrence-active-rules${className ? ` ${className}` : ''}`}
      data-testid="active-rules"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`rbc-recurrence-active-rules-item${onSelect ? ' rbc-recurrence-active-rules-item--clickable' : ''}`}
          data-testid={`active-rules-item-${item.id}`}
          onClick={onSelect ? () => onSelect(item.id) : undefined}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={
            onSelect
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item.id);
                  }
                }
              : undefined
          }
        >
          {item.color && (
            <span
              className="rbc-recurrence-active-rules-dot"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
          )}
          <div className="rbc-recurrence-active-rules-info">
            <span className="rbc-recurrence-active-rules-title">{item.title}</span>
            {descriptions[index] && (
              <span className="rbc-recurrence-active-rules-desc">
                {descriptions[index]}
              </span>
            )}
          </div>
          {onRemove && (
            <button
              className="rbc-recurrence-active-rules-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              aria-label={`Remove ${item.title}`}
              data-testid={`active-rules-remove-${item.id}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
