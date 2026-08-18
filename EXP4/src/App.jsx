import React, { useCallback, useMemo, useState } from "react";
import { Header } from "./components/Header.jsx";
import { CalendarGrid } from "./components/CalendarGrid.jsx";
import { RenderTrackerPanel } from "./components/RenderTrackerPanel.jsx";
import { TaskModal } from "./components/TaskModal.jsx";
import { initialEvents, DAY_NAMES } from "./data/initialEvents.js";
import { generateTaskId } from "./utils/id.js";

function findDayOf(eventsByDay, id) {
  for (let d = 0; d < eventsByDay.length; d++) {
    if (eventsByDay[d].some((e) => e.id === id)) return d;
  }
  return -1;
}

function groupByDay(events) {
  const grouped = Array.from({ length: 7 }, () => []);
  events.forEach((e) => grouped[e.day].push(e));
  return grouped;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fetchEventsFromApi() {
  // Mirrors the PDF's MSW example (`GET /api/events`). In dev this just
  // resolves against local seed data; tests intercept this exact call with
  // Mock Service Worker instead of hitting a real network.
  return fetch("/api/events")
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad response"))))
    .catch(() => initialEvents);
}

export default function App() {
  const [eventsByDay, setEventsByDay] = useState(() => groupByDay(initialEvents));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [optimized, setOptimized] = useState(true);
  const [source, setSource] = useState("seed");
  // null | { mode: "create", day } | { mode: "edit", event }
  const [modalState, setModalState] = useState(null);

  const todayIndex = useMemo(() => {
    const diffDays = Math.round((startOfWeek(new Date()) - weekStart) / 86400000);
    return diffDays === 0 ? (new Date().getDay() + 6) % 7 : -1;
  }, [weekStart]);

  const weekDates = useMemo(() => {
    return DAY_NAMES.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });
  }, [weekStart]);

  const rangeLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`;
  }, [weekStart]);

  // Which event is currently being dragged is tracked in a plain ref, not
  // state. It's only ever read inside handleDrop (on the actual drop), so
  // there is no reason to have picking up / releasing a card trigger a
  // React re-render at all — the visual "lifted" opacity is handled by
  // EventCard writing directly to the DOM node it owns (see EventCard.jsx).
  // This is what keeps a drag pickup from re-rendering all 7 day columns:
  // only handleDrop below ever calls setEventsByDay, and only for the two
  // affected days.
  const draggingIdRef = React.useRef(null);

  // --- Drag and drop ------------------------------------------------------
  // Stable across renders (useCallback, empty deps + functional setState) so
  // that in "optimized" mode unaffected DayColumn/EventCard instances see the
  // exact same function reference and React.memo can bail out.
  const handleDragStartEvent = useCallback((e, event) => {
    draggingIdRef.current = event.id;
    e.dataTransfer.setData("text/plain", event.id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEndEvent = useCallback(() => {
    draggingIdRef.current = null;
  }, []);

  const handleDrop = useCallback((targetDay) => {
    setEventsByDay((prev) => {
      let fromDay = -1;
      let moved = null;
      for (let d = 0; d < 7; d++) {
        const found = prev[d].find((e) => e.id === draggingIdRef.current);
        if (found) {
          fromDay = d;
          moved = found;
          break;
        }
      }
      if (!moved || fromDay === targetDay) return prev;

      // Only the two affected day arrays get new references — every other
      // day keeps the exact array it had last render. That reference
      // stability is what lets a memoized DayColumn skip re-rendering for
      // the five days nothing happened in.
      const next = prev.slice();
      next[fromDay] = prev[fromDay].filter((e) => e.id !== moved.id);
      next[targetDay] = [...prev[targetDay], { ...moved, day: targetDay }];
      return next;
    });
  }, []);

  const handleImportFromApi = useCallback(async () => {
    setSource("loading");
    const events = await fetchEventsFromApi();
    setEventsByDay(groupByDay(events));
    setSource("api");
  }, []);

  // --- Task CRUD -----------------------------------------------------------
  // openCreateModal / openEditModal / closeModal are stable (empty deps),
  // same as the drag handlers above, so passing them down doesn't break
  // React.memo on DayColumn for days the modal has nothing to do with.
  const openCreateModal = useCallback((day) => {
    setModalState({ mode: "create", day });
  }, []);

  const openEditModal = useCallback((event) => {
    setModalState({ mode: "edit", event });
  }, []);

  const closeModal = useCallback(() => setModalState(null), []);

  const handleSaveTask = useCallback(
    (formData) => {
      setEventsByDay((prev) => {
        const next = prev.slice();

        if (modalState?.mode === "edit") {
          const id = modalState.event.id;
          const fromDay = findDayOf(prev, id);
          if (fromDay === -1) return prev;

          const updated = { ...modalState.event, ...formData, id };

          if (fromDay === formData.day) {
            // Same day: only that one array gets a new reference.
            next[fromDay] = prev[fromDay].map((e) => (e.id === id ? updated : e));
          } else {
            // Day changed via the edit form — same two-array-update shape
            // as a drag-and-drop move, for the same reference-stability
            // reason (see handleDrop above).
            next[fromDay] = prev[fromDay].filter((e) => e.id !== id);
            next[formData.day] = [...prev[formData.day], updated];
          }
        } else {
          const newEvent = { id: generateTaskId(), ...formData };
          next[formData.day] = [...prev[formData.day], newEvent];
        }

        return next;
      });
      setModalState(null);
    },
    [modalState]
  );

  const handleDeleteTask = useCallback(() => {
    if (modalState?.mode !== "edit") return;
    const id = modalState.event.id;

    setEventsByDay((prev) => {
      const fromDay = findDayOf(prev, id);
      if (fromDay === -1) return prev;
      const next = prev.slice();
      next[fromDay] = prev[fromDay].filter((e) => e.id !== id);
      return next;
    });
    setModalState(null);
  }, [modalState]);

  const totalEvents = useMemo(
    () => eventsByDay.reduce((sum, day) => sum + day.length, 0),
    [eventsByDay]
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Header
          rangeLabel={rangeLabel}
          onPrevWeek={() => setWeekStart((d) => new Date(d.getTime() - 7 * 86400000))}
          onNextWeek={() => setWeekStart((d) => new Date(d.getTime() + 7 * 86400000))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
          optimized={optimized}
          onToggleOptimized={() => setOptimized((o) => !o)}
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-panel-line bg-panel-raised/40 px-3.5 py-2 font-mono text-[11px] text-ink-dim">
          <span>
            {totalEvents} events scheduled · source: {source}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateModal(todayIndex >= 0 ? todayIndex : 0)}
              className="rounded border border-signal/40 bg-signal/10 px-2 py-1 text-signal transition-colors hover:bg-signal/20"
            >
              + new task
            </button>
            <button
              onClick={handleImportFromApi}
              className="rounded border border-panel-line px-2 py-1 text-ink-dim transition-colors hover:border-signal hover:text-signal"
            >
              refetch via /api/events (MSW-mocked in tests)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_300px]">
          <CalendarGrid
            weekDates={weekDates}
            eventsByDay={eventsByDay}
            onDrop={handleDrop}
            onDragStartEvent={handleDragStartEvent}
            onDragEndEvent={handleDragEndEvent}
            onAddTask={openCreateModal}
            onEditTask={openEditModal}
            optimized={optimized}
            todayIndex={todayIndex}
          />
          <RenderTrackerPanel optimized={optimized} />
        </div>
      </div>

      {modalState && (
        <TaskModal
          mode={modalState.mode}
          initial={modalState.mode === "edit" ? modalState.event : { day: modalState.day }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
