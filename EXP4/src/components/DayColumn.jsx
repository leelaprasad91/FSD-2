import React, { memo, useMemo } from "react";
import { EventCard, EventCardUnoptimized } from "./EventCard.jsx";
import { useRenderFlash } from "../hooks/useRenderFlash.js";

const OVER_CLASSES = ["border-signal", "bg-signal/5"];
const IDLE_CLASSES = ["border-panel-line"];

function DayColumnBase({
  day,
  dayName,
  dateLabel,
  isToday,
  events,
  onDrop,
  onDragStartEvent,
  onDragEndEvent,
  onAddTask = () => {},
  onEditTask = () => {},
  optimized,
}) {
  // Same pattern as the PDF's `filteredEvents` useMemo example: recompute
  // only when this day's own event list or its sort key actually changes.
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.time.localeCompare(b.time)),
    [events]
  );

  // watchKey fingerprints only what THIS column actually renders. If the
  // column re-renders while this is unchanged, it was an unrelated re-render.
  const watchKey = sorted.map((e) => e.id).join(",");
  const { cause, renderCount, nodeRef } = useRenderFlash(`day-${day}`, "DayColumn", watchKey);

  const Card = optimized ? EventCard : EventCardUnoptimized;

  // Drag-over highlight is applied directly to this node's classList, not
  // via React state. Hovering a column while dragging doesn't change any
  // event's data, so — like the opacity lift in EventCard — it shouldn't
  // cause a React re-render at all, here or anywhere else.
  const setOver = (isOver) => {
    const el = nodeRef.current;
    if (!el) return;
    el.classList.remove(...(isOver ? IDLE_CLASSES : OVER_CLASSES));
    el.classList.add(...(isOver ? OVER_CLASSES : IDLE_CLASSES));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setOver(true);
  };

  const handleDragLeave = () => setOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setOver(false);
    onDrop(day);
  };

  return (
    <div
      ref={nodeRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`day-column-${day}`}
      data-render-cause={cause}
      className="flex min-h-[420px] flex-col rounded-xl border border-panel-line bg-panel-raised/60 p-2.5 transition-colors"
    >
      <div className="mb-2 flex items-center justify-between px-0.5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">{dayName}</p>
          <p className={`text-sm font-semibold ${isToday ? "text-signal" : "text-ink"}`}>
            {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Actual task count for this day. This is the number that should
              go up on the day you drop into and down on the day you drag
              out of — it's just `sorted.length`, read straight from props
              on every render, so it's always in sync with the real data. */}
          <span
            className="rounded bg-signal/10 px-1.5 py-0.5 font-mono text-[10px] text-signal"
            title="tasks currently on this day"
            data-testid={`day-task-count-${day}`}
          >
            {sorted.length} task{sorted.length === 1 ? "" : "s"}
          </span>
          {/* Separate render diagnostic — NOT a task count. This counts how
              many times React has re-rendered this column's component
              instance since it mounted, for the telemetry demo. It's
              expected to only ever go up (renders accumulate); it says
              nothing about how many tasks are on this day right now. */}
          <span
            className="rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
            title="diagnostic only — how many times THIS COLUMN has re-rendered, not a task count. Renders accumulate and never go down; the task count badge next to it is the one that reflects your actual data."
            data-testid={`day-render-count-${day}`}
          >
            {renderCount}x rendered
          </span>
        </div>
      </div>

      <div className="flex-1">
        {sorted.length === 0 && (
          <p className="mt-6 text-center font-mono text-[11px] text-ink-faint">— empty —</p>
        )}
        {sorted.map((event) => (
          <Card
            key={event.id}
            event={event}
            onDragStart={onDragStartEvent}
            onDragEnd={onDragEndEvent}
            onEdit={onEditTask}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddTask(day)}
        data-testid={`add-task-${day}`}
        className="mt-2 rounded-lg border border-dashed border-panel-line py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-signal hover:text-signal"
      >
        + add task
      </button>
    </div>
  );
}

export const DayColumn = memo(DayColumnBase);
export const DayColumnUnoptimized = DayColumnBase;
