import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  useRecurringEvents,
  RecurrenceEditor,
  type RecurrenceRule,
  type RecurringEvent,
  describe,
  toRRuleString,
} from 'rbc-recurrence/react';

const localizer = momentLocalizer(moment);

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

interface Series {
  id: string;
  title: string;
  color: string;
  rule: RecurrenceRule;
}

// ── Default demo series ────────────────────────────────────────────────────────
const today = new Date();
const startOfWeek = new Date(Date.UTC(
  today.getFullYear(), today.getMonth(), today.getDate() - today.getDay(),
));

const DEFAULT_SERIES: Series[] = [
  {
    id: 'standup',
    title: 'Daily Standup',
    color: '#6366f1',
    rule: {
      startDate: startOfWeek,
      interval: 1,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [1, 2, 3, 4, 5] }, // Mon–Fri
    },
  },
  {
    id: 'review',
    title: 'Sprint Review',
    color: '#10b981',
    rule: {
      startDate: startOfWeek,
      interval: 2,
      period: 'week',
      end: { type: 'never' },
      weekly: { days: [5] }, // Every 2nd Friday
    },
  },
  {
    id: 'allhands',
    title: 'All-Hands',
    color: '#f59e0b',
    rule: {
      startDate: startOfWeek,
      interval: 1,
      period: 'month',
      end: { type: 'never' },
      monthly: { pattern: 'weekday' }, // 1st Monday of month
    },
  },
];

export default function App() {
  const [series, setSeries] = useState<Series[]>(DEFAULT_SERIES);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<RecurrenceRule> | null>(null);
  const [editingTitle, setEditingTitle] = useState('New Event');
  const [editingColor, setEditingColor] = useState(COLORS[0]!);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [rruleStr, setRruleStr] = useState('');

  // Convert series → RecurringEvent[]
  const recurringEvents: RecurringEvent<{ title: string; style: React.CSSProperties }>[] =
    series.map((s) => ({
      id: s.id,
      rule: s.rule,
      durationMinutes: 60,
      eventData: {
        title: s.title,
        style: { backgroundColor: s.color, borderRadius: '4px', color: '#fff', border: 'none' },
      },
    }));

  const { events, onRangeChange } = useRecurringEvents(recurringEvents);

  const openAdd = () => {
    setEditingId(null);
    setEditingTitle('New Event');
    setEditingColor(COLORS[Math.floor(Math.random() * COLORS.length)]!);
    setEditingRule(null);
    setIsValid(false);
    setRruleStr('');
    setShowModal(true);
  };

  const openEdit = (s: Series) => {
    setEditingId(s.id);
    setEditingTitle(s.title);
    setEditingColor(s.color);
    setEditingRule(s.rule);
    setIsValid(true);
    setRruleStr(toRRuleString(s.rule));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!isValid || !editingRule) return;
    const rule = editingRule as RecurrenceRule;
    if (editingId) {
      setSeries((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, title: editingTitle, color: editingColor, rule } : s,
        ),
      );
    } else {
      setSeries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), title: editingTitle, color: editingColor, rule },
      ]);
    }
    setShowModal(false);
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1>rbc-recurrence</h1>
        <a href="https://github.com/glue-berlin/rbc-recurrence" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <a href="https://www.npmjs.com/package/rbc-recurrence" target="_blank" rel="noreferrer">
          npm ↗
        </a>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Recurring Series</h2>
        <div className="series-list">
          {series.map((s) => (
            <div
              key={s.id}
              className="series-item"
              onClick={() => openEdit(s)}
            >
              <div className="series-dot" style={{ background: s.color }} />
              <div className="series-info">
                <div className="series-title">{s.title}</div>
                <div className="series-desc">{describe(s.rule)}</div>
              </div>
              <button
                className="series-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setSeries((prev) => prev.filter((x) => x.id !== s.id));
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="add-btn" onClick={openAdd}>+ Add Recurring Event</button>
      </div>

      {/* Calendar */}
      <div className="calendar-area">
        <Calendar
          localizer={localizer}
          events={events as Parameters<typeof Calendar>[0]['events']}
          defaultView="month"
          views={['month', 'week', 'day']}
          style={{ flex: 1 }}
          onRangeChange={onRangeChange}
          eventPropGetter={(event) => ({
            style: (event as { style?: React.CSSProperties }).style ?? {},
          })}
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Series' : 'New Recurring Event'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <input
              className="title-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="Event title"
            />

            <div className="color-row">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch${editingColor === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setEditingColor(c)}
                />
              ))}
            </div>

            <RecurrenceEditor
              initialRule={editingRule ?? undefined}
              onValidChange={(rule) => {
                setIsValid(true);
                setEditingRule(rule);
                setRruleStr(toRRuleString(rule));
              }}
              onChange={(rule, valid) => {
                setIsValid(valid);
                setEditingRule(rule);
              }}
            />

            {rruleStr && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>RRULE (RFC 5545)</div>
                <div className="rrule-box">{rruleStr}</div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={!isValid} onClick={handleSave}>
                {editingId ? 'Save Changes' : 'Add Series'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
