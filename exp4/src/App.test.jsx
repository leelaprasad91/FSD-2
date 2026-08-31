import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { getCountsSnapshot, reset } from "./store/renderTelemetry.js";

beforeEach(() => reset());

test("renders the weekly calendar with seed events", () => {
  render(<App />);
  expect(screen.getByText("Design review")).toBeInTheDocument();
  expect(screen.getByText(/events scheduled/)).toBeInTheDocument();
});

test("refetching from /api/events (MSW-mocked) reloads the schedule", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByText(/refetch via \/api\/events/));

  expect(await screen.findByText(/source: api/)).toBeInTheDocument();
  expect(screen.getByText("Design review")).toBeInTheDocument();
});

test("toggling optimized mode updates the telemetry panel label", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText(/memo \/ useMemo \/ useCallback: ON/)).toBeInTheDocument();
  await user.click(screen.getByText(/memo \/ useMemo \/ useCallback: ON/));
  expect(screen.getByText(/memo \/ useMemo \/ useCallback: OFF/)).toBeInTheDocument();
});

// Regression test for a real bug: an earlier version of the render-flash
// hook called setState inside an unconditional useEffect to restart a CSS
// animation, which re-triggered the same effect on every commit — an
// infinite render loop that looked like the app was "auto re-rendering all
// the time" with no user interaction. The fix moved the flash entirely
// onto the DOM (see useRenderFlash.js), so mounting should log exactly one
// render per component and then go quiet.
test("idle app does not keep re-rendering itself after mount", async () => {
  render(<App />);

  const designReviewEntry = await screen.findByTitle(/Design review/);
  const beforeCount = designReviewEntry.title.match(/rendered (\d+)x/)[1];

  // Give any runaway effect loop a real chance to fire.
  await new Promise((resolve) => setTimeout(resolve, 300));

  const afterCount = designReviewEntry.title.match(/rendered (\d+)x/)[1];
  expect(afterCount).toBe(beforeCount);

  const dayZeroCount = getCountsSnapshot().get("day-0")?.count ?? 0;
  expect(dayZeroCount).toBe(1);
});

// This is the exact scenario the render telemetry panel exists to show:
// dragging one event from Monday to Wednesday should re-render precisely
// those two DayColumn instances — not all seven, and not repeatedly.
test("moving an event from Monday to Wednesday re-renders only those two day columns", async () => {
  render(<App />);

  const card = await screen.findByTestId("event-evt-1"); // "Design review", seeded on Monday
  const mondayColumn = screen.getByTestId("day-column-0");
  const wednesdayColumn = screen.getByTestId("day-column-2");

  expect(within(mondayColumn).getByText("Design review")).toBeInTheDocument();

  // Seed data: Monday (day 0) has 3 tasks, Wednesday (day 2) has 3 tasks.
  const dayTaskCount = (testId) =>
    Number(screen.getByTestId(testId).textContent.match(/^(\d+)/)[1]);

  expect(dayTaskCount("day-task-count-0")).toBe(3);
  expect(dayTaskCount("day-task-count-2")).toBe(3);

  const dataTransfer = { setData: jest.fn(), getData: jest.fn(() => "evt-1"), effectAllowed: "" };
  fireEvent.dragStart(card, { dataTransfer });
  fireEvent.dragOver(wednesdayColumn, { dataTransfer });
  fireEvent.drop(wednesdayColumn, { dataTransfer });
  fireEvent.dragEnd(card, { dataTransfer });

  expect(within(mondayColumn).queryByText("Design review")).not.toBeInTheDocument();
  expect(within(wednesdayColumn).getByText("Design review")).toBeInTheDocument();

  // The actual task count must track real data: down on the day something
  // was dragged OUT of, up on the day it was dropped INTO.
  expect(dayTaskCount("day-task-count-0")).toBe(2);
  expect(dayTaskCount("day-task-count-2")).toBe(4);

  const counts = getCountsSnapshot();
  expect(counts.get("day-0")?.count).toBe(2); // mount + the move
  expect(counts.get("day-2")?.count).toBe(2); // mount + the move
  [1, 3, 4, 5, 6].forEach((untouchedDay) => {
    expect(counts.get(`day-${untouchedDay}`)?.count).toBe(1); // mount only
    // Task count on untouched days is unaffected either.
  });
});

// --- Create ------------------------------------------------------------
test("creating a task via a day's + add task button adds it to that day", async () => {
  const user = userEvent.setup();
  render(<App />);

  const tuesdayColumn = screen.getByTestId("day-column-1");
  expect(within(tuesdayColumn).queryByText("Portfolio review")).not.toBeInTheDocument();

  await user.click(screen.getByTestId("add-task-1"));

  const modal = await screen.findByTestId("task-modal");
  await user.type(within(modal).getByLabelText(/title/i), "Portfolio review");
  await user.clear(within(modal).getByLabelText(/time/i));
  await user.type(within(modal).getByLabelText(/time/i), "13:00");
  await user.click(within(modal).getByRole("button", { name: /add task/i }));

  expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
  expect(within(tuesdayColumn).getByText("Portfolio review")).toBeInTheDocument();

  const dayTaskCount = (testId) =>
    Number(screen.getByTestId(testId).textContent.match(/^(\d+)/)[1]);
  expect(dayTaskCount("day-task-count-1")).toBe(3); // seed had 2 events on Tuesday
});

// --- Edit ----------------------------------------------------------------
test("clicking a task opens the edit form, and saving updates it in place", async () => {
  const user = userEvent.setup();
  render(<App />);

  const card = screen.getByTestId("event-evt-9"); // "Code review", Thursday
  await user.click(card);

  const modal = await screen.findByTestId("task-modal");
  expect(within(modal).getByLabelText(/title/i)).toHaveValue("Code review");

  await user.clear(within(modal).getByLabelText(/title/i));
  await user.type(within(modal).getByLabelText(/title/i), "Code review — v2");
  await user.click(within(modal).getByRole("button", { name: /save changes/i }));

  expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
  expect(screen.queryByText("Code review")).not.toBeInTheDocument();
  expect(screen.getByText("Code review — v2")).toBeInTheDocument();
});

test("editing a task's day moves it, updating both day's task counts", async () => {
  const user = userEvent.setup();
  render(<App />);

  const dayTaskCount = (testId) =>
    Number(screen.getByTestId(testId).textContent.match(/^(\d+)/)[1]);
  expect(dayTaskCount("day-task-count-3")).toBe(1); // Thursday: "Code review"
  expect(dayTaskCount("day-task-count-5")).toBe(1); // Saturday: "Contest — LeetCode"

  await user.click(screen.getByTestId("event-evt-9"));
  const modal = await screen.findByTestId("task-modal");
  await user.selectOptions(within(modal).getByLabelText(/day/i), "5");
  await user.click(within(modal).getByRole("button", { name: /save changes/i }));

  expect(dayTaskCount("day-task-count-3")).toBe(0);
  expect(dayTaskCount("day-task-count-5")).toBe(2);
  expect(within(screen.getByTestId("day-column-5")).getByText("Code review")).toBeInTheDocument();
});

// --- Delete ----------------------------------------------------------------
test("deleting a task from the edit form removes it from the calendar", async () => {
  const user = userEvent.setup();
  render(<App />);

  const dayTaskCount = (testId) =>
    Number(screen.getByTestId(testId).textContent.match(/^(\d+)/)[1]);
  expect(dayTaskCount("day-task-count-3")).toBe(1);

  await user.click(screen.getByTestId("event-evt-9"));
  const modal = await screen.findByTestId("task-modal");
  await user.click(within(modal).getByRole("button", { name: /delete/i }));

  expect(screen.queryByTestId("task-modal")).not.toBeInTheDocument();
  expect(screen.queryByTestId("event-evt-9")).not.toBeInTheDocument();
  expect(dayTaskCount("day-task-count-3")).toBe(0);
});
