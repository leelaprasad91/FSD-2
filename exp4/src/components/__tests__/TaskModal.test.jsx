import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskModal } from "../TaskModal.jsx";

test("create mode: rejects an empty title instead of calling onSave", async () => {
  const user = userEvent.setup();
  const onSave = jest.fn();
  render(<TaskModal mode="create" initial={{ day: 0 }} onSave={onSave} onDelete={() => {}} onClose={() => {}} />);

  await user.click(screen.getByRole("button", { name: /add task/i }));

  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent(/title/i);
});

test("create mode: submits a fully filled-out form", async () => {
  const user = userEvent.setup();
  const onSave = jest.fn();
  render(<TaskModal mode="create" initial={{ day: 1 }} onSave={onSave} onDelete={() => {}} onClose={() => {}} />);

  await user.type(screen.getByLabelText(/title/i), "Deep work block");
  await user.clear(screen.getByLabelText(/time/i));
  await user.type(screen.getByLabelText(/time/i), "14:30");
  await user.selectOptions(screen.getByLabelText(/tag/i), "study");
  await user.selectOptions(screen.getByLabelText(/day/i), "3");
  await user.click(screen.getByRole("button", { name: /add task/i }));

  expect(onSave).toHaveBeenCalledWith({
    title: "Deep work block",
    time: "14:30",
    tag: "study",
    day: 3,
  });
});

test("edit mode: pre-fills the form from the existing task and can save changes", async () => {
  const user = userEvent.setup();
  const onSave = jest.fn();
  const existing = { id: "evt-9", title: "Code review", time: "12:00", tag: "work", day: 3 };
  render(<TaskModal mode="edit" initial={existing} onSave={onSave} onDelete={() => {}} onClose={() => {}} />);

  expect(screen.getByLabelText(/title/i)).toHaveValue("Code review");
  expect(screen.getByLabelText(/time/i)).toHaveValue("12:00");

  await user.clear(screen.getByLabelText(/title/i));
  await user.type(screen.getByLabelText(/title/i), "Code review — final pass");
  await user.click(screen.getByRole("button", { name: /save changes/i }));

  expect(onSave).toHaveBeenCalledWith({
    title: "Code review — final pass",
    time: "12:00",
    tag: "work",
    day: 3,
  });
});

test("edit mode: delete button calls onDelete, not onSave", async () => {
  const user = userEvent.setup();
  const onDelete = jest.fn();
  const existing = { id: "evt-9", title: "Code review", time: "12:00", tag: "work", day: 3 };
  render(<TaskModal mode="edit" initial={existing} onSave={() => {}} onDelete={onDelete} onClose={() => {}} />);

  await user.click(screen.getByRole("button", { name: /delete/i }));
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test("clicking the backdrop or Cancel closes the modal without saving", async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();
  const onSave = jest.fn();
  render(<TaskModal mode="create" initial={{ day: 0 }} onSave={onSave} onDelete={() => {}} onClose={onClose} />);

  await user.click(screen.getByRole("button", { name: /cancel/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});

test("Escape key closes the modal", () => {
  const onClose = jest.fn();
  render(<TaskModal mode="create" initial={{ day: 0 }} onSave={() => {}} onDelete={() => {}} onClose={onClose} />);

  screen.getByTestId("task-modal").ownerDocument.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});
