"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Schedule, Mismatch, Change, PropagationTarget } from "@propagate/contracts";
import { useDocumentStore } from "@/store/documents";
import { socket } from "@/socket/client";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3001";

export function ScheduleTable() {
  const documents = useDocumentStore((s) => s.documents);
  const mismatches = useDocumentStore((s) => s.mismatches);
  const applyChange = useDocumentStore((s) => s.applyChange);
  const focusedMismatchId = useDocumentStore((s) => s.focusedMismatchId);

  const schedules = documents.filter((d) =>
    ["door-schedule", "room-schedule", "sheet-index"].includes(d.type),
  );

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!focusedMismatchId) return;
    const m = mismatches.find((mm) => mm.id === focusedMismatchId);
    if (!m) return;
    for (const ref of [m.target, m.source]) {
      const idx = schedules.findIndex((s) => s.id === ref.docId);
      if (idx !== -1) {
        setActiveIdx(idx);
        return;
      }
    }
  }, [focusedMismatchId, mismatches, schedules]);

  if (schedules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge text-ink-muted">
        No schedule loaded
      </div>
    );
  }

  const active = schedules[Math.min(activeIdx, schedules.length - 1)];
  const schedule = active.document as Schedule;

  return (
    <div className="flex h-full flex-col">
      {schedules.length > 1 && (
        <div className="mb-3 flex gap-1 border-b border-edge pb-2">
          {schedules.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                i === Math.min(activeIdx, schedules.length - 1)
                  ? "bg-surface-inset text-ink"
                  : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {s.type.replace("-", " ")}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {schedule.columns.map((col) => (
                <th
                  key={col.key}
                  className="sticky top-0 border-b border-edge bg-surface-alt px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-ink-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row) => (
              <tr key={row.id} className="border-b border-edge-subtle/50">
                {schedule.columns.map((col) => (
                  <EditableCell
                    key={col.key}
                    docId={active.id}
                    rowId={row.id}
                    columnKey={col.key}
                    value={row.values[col.key]}
                    mismatches={mismatches}
                    onCommit={applyChange}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableCell({
  docId,
  rowId,
  columnKey,
  value,
  mismatches,
  onCommit,
}: {
  docId: string;
  rowId: string;
  columnKey: string;
  value: string | number | undefined;
  mismatches: Mismatch[];
  onCommit: (change: Change) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const setPendingPropagation = useDocumentStore((s) => s.setPendingPropagation);
  const focusedMismatchId = useDocumentStore((s) => s.focusedMismatchId);

  const crossRefs = useDocumentStore((s) => s.crossRefs);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const elementPath = `rows.${rowId}.${columnKey}`;
  const mismatch = mismatches.find(
    (m) =>
      (m.target.docId === docId && m.target.elementPath === elementPath) ||
      (m.source.docId === docId && m.source.elementPath === elementPath),
  );
  const crossRef = mismatch ? crossRefs.find((c) => c.id === mismatch.crossRefId) : null;
  const isFuzzy = crossRef?.matchMethod === "fuzzy";
  const isFocused = !!(focusedMismatchId && mismatch?.id === focusedMismatchId);

  useEffect(() => {
    if (isFocused && cellRef.current) {
      cellRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFocused]);

  const startEdit = useCallback(() => {
    setDraft(String(value ?? ""));
    setEditing(true);
  }, [value]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const oldValue = value ?? "";
    const newValue =
      draft !== "" && !isNaN(Number(draft)) ? Number(draft) : draft;
    if (newValue === oldValue) return;

    const change: Change = {
      docId,
      elementPath,
      oldValue,
      newValue,
    };
    onCommit(change);
    socket.emit("edit:submit", change);

    fetch(`${ENGINE_URL}/api/propagate/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    })
      .then((r) => r.json())
      .then((targets: PropagationTarget[]) => {
        if (targets.length > 0) {
          setPendingPropagation(targets);
        }
      })
      .catch(() => {});
  }, [draft, value, docId, elementPath, onCommit, setPendingPropagation]);

  const bgClass = mismatch
    ? isFuzzy
      ? "bg-violet-900/20 border-l-2 border-l-violet-500"
      : "bg-amber-900/30 border-l-2 border-l-amber-500"
    : "";

  const focusClass = isFocused ? "ring-2 ring-amber-400" : "";

  if (editing) {
    return (
      <td ref={cellRef} className={`px-3 py-1.5 ${bgClass} ${focusClass}`}>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded border border-edge bg-surface-inset px-1.5 py-0.5 text-sm text-ink outline-none focus:border-blue-500"
        />
      </td>
    );
  }

  return (
    <td
      ref={cellRef}
      onDoubleClick={startEdit}
      className={`cursor-default px-3 py-1.5 text-ink-secondary ${bgClass} ${focusClass}`}
      title={mismatch ? `${mismatch.message}${isFuzzy ? ` (fuzzy match, ${Math.round((crossRef?.confidence ?? 0) * 100)}% confidence)` : ""}` : undefined}
    >
      {value ?? ""}
    </td>
  );
}
