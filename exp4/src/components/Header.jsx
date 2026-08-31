import React from "react";

export function Header({ rangeLabel, onPrevWeek, onNextWeek, onToday, optimized, onToggleOptimized }) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
          Signal / Weekly schedule
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {rangeLabel}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-lg border border-panel-line">
          <button
            onClick={onPrevWeek}
            className="px-3 py-1.5 text-ink-dim transition-colors hover:bg-panel-raised hover:text-ink"
            aria-label="Previous week"
          >
            ‹
          </button>
          <button
            onClick={onToday}
            className="border-x border-panel-line px-3 py-1.5 font-mono text-[11px] text-ink-dim transition-colors hover:bg-panel-raised hover:text-ink"
          >
            today
          </button>
          <button
            onClick={onNextWeek}
            className="px-3 py-1.5 text-ink-dim transition-colors hover:bg-panel-raised hover:text-ink"
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        <button
          onClick={onToggleOptimized}
          role="switch"
          aria-checked={optimized}
          className={[
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors",
            optimized
              ? "border-signal/50 bg-signal/10 text-signal"
              : "border-flag/50 bg-flag/10 text-flag",
          ].join(" ")}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={[
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                optimized ? "bg-signal animate-ping" : "bg-flag animate-ping",
              ].join(" ")}
            />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${optimized ? "bg-signal" : "bg-flag"}`} />
          </span>
          {optimized ? "memo / useMemo / useCallback: ON" : "memo / useMemo / useCallback: OFF"}
        </button>
      </div>
    </header>
  );
}
