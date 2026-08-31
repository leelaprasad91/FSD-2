import React, { memo } from "react";
import { TAG_COLORS } from "../data/initialEvents.js";
import { useRenderFlash } from "../hooks/useRenderFlash.js";

function EventCardBase({ event, onDragStart, onDragEnd, onEdit = () => {} }) {
  const watchKey = `${event.id}|${event.title}|${event.time}|${event.tag}`;
  const { cause, renderCount, nodeRef } = useRenderFlash(
    `event-${event.id}`,
    "EventCard",
    watchKey
  );

  const colors = TAG_COLORS[event.tag] ?? TAG_COLORS.work;

  // Drag-lift opacity is applied directly to this node in the drag
  // handlers below, not via React state — picking a card up or letting it
  // go doesn't change any event's data, so it shouldn't cause a React
  // re-render at all, on this card or any other.
  const handleDragStart = (e) => {
    e.currentTarget.style.opacity = "0.4";
    onDragStart(e, event);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    onDragEnd(e);
  };

  return (
    <div
      ref={nodeRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(event);
        }
      }}
      data-testid={`event-${event.id}`}
      data-render-cause={cause}
      title={`${event.title} · rendered ${renderCount}x · click to edit`}
      className={[
        "group relative mb-2 cursor-pointer select-none rounded-lg border px-3 py-2 text-left",
        "active:cursor-grabbing transition-[opacity,background-color,border-color]",
        colors.bg,
        colors.border,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
        <span className="font-mono text-[11px] text-ink-dim">{event.time}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-ink">{event.title}</p>

      <span
        className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-panel/80 px-1 font-mono text-[9px] text-ink-faint opacity-0 group-hover:opacity-100"
        aria-hidden="true"
      >
        ×{renderCount}
      </span>
    </div>
  );
}

export const EventCard = memo(EventCardBase);
export const EventCardUnoptimized = EventCardBase;
