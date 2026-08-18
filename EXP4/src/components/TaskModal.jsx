import React, { useEffect, useRef, useState } from "react";
import { DAY_NAMES } from "../data/initialEvents.js";

const TAGS = ["work", "study", "fitness"];

function emptyForm(day) {
  return { title: "", time: "09:00", tag: "work", day };
}

export function TaskModal({ mode, initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() =>
    mode === "edit" && initial
      ? { title: initial.title, time: initial.time, tag: initial.tag, day: initial.day }
      : emptyForm(initial?.day ?? 0)
  );
  const [error, setError] = useState("");
  const titleRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Give the task a title.");
      titleRef.current?.focus();
      return;
    }
    if (!form.time) {
      setError("Pick a time.");
      return;
    }
    onSave({ title, time: form.time, tag: form.tag, day: Number(form.day) });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        data-testid="task-modal"
        className="w-full max-w-sm rounded-xl border border-panel-line bg-panel-raised p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="task-modal-title" className="text-sm font-semibold text-ink">
            {mode === "edit" ? "Edit task" : "New task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-1.5 py-0.5 text-ink-faint transition-colors hover:bg-panel hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="task-title" className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-dim">
              Title
            </label>
            <input
              id="task-title"
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Design review"
              className="w-full rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="task-time" className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-dim">
                Time
              </label>
              <input
                id="task-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
              />
            </div>
            <div>
              <label htmlFor="task-tag" className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-dim">
                Tag
              </label>
              <select
                id="task-tag"
                value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                className="w-full rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
              >
                {TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-day" className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-dim">
              Day
            </label>
            <select
              id="task-day"
              value={form.day}
              onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
              className="w-full rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="font-mono text-[11px] text-alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-alert/40 bg-alert/10 px-3 py-1.5 font-mono text-[11px] text-alert transition-colors hover:bg-alert/20"
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-panel-line px-3 py-1.5 font-mono text-[11px] text-ink-dim transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-signal/50 bg-signal/10 px-3 py-1.5 font-mono text-[11px] text-signal transition-colors hover:bg-signal/20"
              >
                {mode === "edit" ? "Save changes" : "Add task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
