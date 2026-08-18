# Signal — Interactive Calendar & Render Telemetry

A 7-day drag-and-drop calendar built for Experiment 4 (*Interactive Calendar
Optimization & Testing*), with a live "render telemetry" panel that shows
exactly which components re-render — and which of those renders were
unnecessary — as you drag events between days.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # production build
npm test            # Jest + React Testing Library
npm run coverage    # Jest with a coverage report
```

## What to try

1. Click **`+ new task`** in the toolbar, or **`+ add task`** at the bottom of
   any day column, to create a task. Title and time are required; day and
   tag default sensibly and can be changed.
2. Click any task card to edit it — change its title, time, tag, or even
   move it to a different day from the dropdown (this updates task counts
   on both days, same as a drag).
3. Click **Delete** inside the edit form to remove a task.
4. Drag any event card to a different day.
5. Look at the two badges in each day's header:
   - **`N tasks`** (teal) — the real, current number of events on that day.
     Drag one out and it goes down; drop one in and it goes up.
   - **`Nx rendered`** (grey) — a separate render-count *diagnostic*, for the
     telemetry demo. It only ever goes up, on purpose — it counts how many
     times React has rendered that component since mount, it is **not** a
     task count. Hover it for a tooltip explaining this.
3. Watch the **Render telemetry** panel on the right — it logs every
   component render live, and tags each one `mount`, `data changed`, or
   `unrelated re-render` (amber).
4. Click the **`memo / useMemo / useCallback`** toggle in the header to flip
   between the optimized and unoptimized component tree, then drag an event
   again. In the unoptimized mode you'll see every day column (and every
   card in it) log an "unrelated re-render" on each drag — in the optimized
   mode only the two affected columns re-render.
5. Hover an event card to see its own render count (`×N`) in the corner.

## How each part of the PDF is covered

| PDF section | Where it lives |
|---|---|
| 7-day interactive calendar, event-driven UI | `src/components/CalendarGrid.jsx`, `DayColumn.jsx` |
| Drag-and-drop (drag source / drop target / state update on drop) | `EventCard.jsx` (`draggable`, `onDragStart`), `DayColumn.jsx` (`onDragOver`/`onDrop`), `App.jsx` (`handleDrop`) |
| `React.memo` — component-level optimization | `EventCard` and `DayColumn` are both exported memoized *and* unmemoized, switched live via the header toggle |
| `useMemo` — expensive computation optimization | `filteredEvents`-equivalent sort in `DayColumn.jsx`; derived totals/week labels in `App.jsx` |
| `useCallback` — referential stability | `handleDragStartEvent`, `handleDragEndEvent`, `handleDrop` in `App.jsx` |
| Stable keys vs. array-index keys | Every list is keyed by `event.id` / day index, never array position (see comment in `initialEvents.js`) |
| Component re-render analysis / "why did this render" | `src/store/renderTelemetry.js` + `src/hooks/useRenderFlash.js` + `RenderTrackerPanel.jsx` — a hand-built analogue of React DevTools' Profiler "why did this render" view, live in the UI instead of a separate devtool |
| React DevTools profiling | Works as normal on top of this app — Profiler tab will corroborate what the in-app telemetry panel shows |
| Testing with React Testing Library, "test behavior not implementation" | `src/components/__tests__/EventCard.test.jsx`, `CalendarGrid.test.jsx`, `TaskModal.test.jsx`, `src/App.test.jsx` |
| Create / edit / delete a task | `src/components/TaskModal.jsx` (form), wired through `App.jsx` (`openCreateModal`, `openEditModal`, `handleSaveTask`, `handleDeleteTask`) — click a card to edit, "+ add task" per day or "+ new task" in the toolbar to create |
| API mocking with Mock Service Worker | `src/mocks/handlers.js`, `src/mocks/server.js`, wired up in `src/setupTests.js`; exercised by the "refetch via `/api/events`" button and its test |
| Jest coverage | `npm run coverage` (thresholds/collection config in `jest.config.cjs`) |

## Notable implementation details

- **Task count vs. render count are two different badges, on purpose.**
  Each day's `N tasks` badge is just `sorted.length` read straight from
  props every render — it's always correct and moves both directions. The
  `Nx rendered` badge next to it is a diagnostic counter for the telemetry
  demo (how many times this component instance has re-rendered) and is
  expected to only increase; it was previously the *only* badge, labeled
  just `rN`, which read like a task count and only going up looked like a
  bug. They're now visually and textually distinct, each with its own
  tooltip.
- **Per-day state, not one flat array.** Events are stored as
  `eventsByDay: Event[][]` (one array per day) rather than a single flat
  list. Moving an event only replaces the *two* affected day arrays —
  every other day keeps the exact same array reference across the update.
  That's what makes `React.memo` on `DayColumn` actually skip re-rendering
  the five untouched columns; with a flat array + `.filter()`, every column
  would get a new array reference (and re-render) on every drag, even in
  "optimized" mode.
- **The telemetry store is a plain module-level pub/sub, not React
  context.** If it were context, every tracked component would need to
  *read* it too — which would itself force re-renders and contaminate the
  measurement. Components only ever write to it (`logRender`); only
  `RenderTrackerPanel` subscribes, via `useSyncExternalStore`.
- **Nothing about dragging touches React state.** Picking a card up,
  hovering a column, and releasing are all handled by writing directly to
  the DOM (`element.style.opacity`, `element.classList`) through refs —
  not `useState`. Only the actual drop, which calls `setEventsByDay`, goes
  through React. That's the whole reason the render count for a
  Monday→Wednesday move is exactly 2 (one for each affected `DayColumn`)
  instead of 7+.
- **`useRenderFlash` never calls `setState`.** An earlier version drove its
  flash animation with a state variable updated inside an unconditional
  `useEffect` — which re-triggered the same effect on every commit and
  produced a genuine infinite render loop (this is what showed up as "it's
  automatically re-rendering all the time"). The fix restarts the CSS
  animation by mutating the DOM node directly via a ref, so logging a
  render can never cause one. See the comment at the top of
  `src/hooks/useRenderFlash.js` and the regression tests in `App.test.jsx`.
- **`React.StrictMode` is intentionally not used.** It double-invokes
  render (and mount effects) in dev to catch impure components, which
  would double every number in the telemetry panel and make correct code
  look broken — the opposite of what a render-counting demo needs.
- **`jest-fixed-jsdom`** is used instead of plain `jest-environment-jsdom`
  because MSW needs native `fetch`/`Request`/`Response` globals that
  stock jsdom doesn't provide.

## Project structure

```
src/
  App.jsx                     root state, drag handlers, task CRUD, week math
  components/
    Header.jsx                 week nav + optimized/unoptimized toggle
    CalendarGrid.jsx            7-day layout
    DayColumn.jsx                 drop target for one day, "+ add task"
    EventCard.jsx                  draggable + clickable-to-edit task
    TaskModal.jsx                create/edit form with delete
    RenderTrackerPanel.jsx     live telemetry feed
    __tests__/                 RTL tests
  data/initialEvents.js        seed data
  hooks/useRenderFlash.js      per-component render instrumentation
  store/renderTelemetry.js     pub/sub store behind the telemetry panel
  utils/id.js                  id generator for new tasks
  mocks/{handlers,server}.js   MSW
  setupTests.js                 jest-dom + MSW lifecycle
```
