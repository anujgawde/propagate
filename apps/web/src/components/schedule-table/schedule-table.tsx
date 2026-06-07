"use client";

import { useState, useCallback } from "react";
import type { Schedule, Mismatch, Change } from "@propagate/contracts";
import { useDocumentStore } from "@/store/documents";
import { socket } from "@/socket/client";

export function ScheduleTable() {
  const documents = useDocumentStore((s) => s.documents);
  const mismatches = useDocumentStore((s) => s.mismatches);
  const applyChange = useDocumentStore((s) => s.applyChange);

  const schedules = documents.filter((d) =>
    ["door-schedule", "room-schedule", "sheet-index"].includes(d.type),
  );

  const [activeIdx, setActiveIdx] = useState(0);

  if (schedules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-500">
        No schedule loaded
      </div>
    );
  }

  const active = schedules[Math.min(activeIdx, schedules.length - 1)];
  const schedule = active.document as Schedule;

  return (
    <div className="flex h-full flex-col">
      {schedules.length > 1 && (
        <div className="mb-3 flex gap-1 border-b border-zinc-800 pb-2">
          {schedules.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                i === Math.min(activeIdx, schedules.length - 1)
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
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
                  className="sticky top-0 border-b border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-800/50">
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

  const elementPath = `rows.${rowId}.${columnKey}`;
  const mismatch = mismatches.find(
    (m) =>
      (m.target.docId === docId && m.target.elementPath === elementPath) ||
      (m.source.docId === docId && m.source.elementPath === elementPath),
  );

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
  }, [draft, value, docId, elementPath, onCommit]);

  const bgClass = mismatch
    ? "bg-amber-900/30 border-l-2 border-l-amber-500"
    : "";

  if (editing) {
    return (
      <td className={`px-3 py-1.5 ${bgClass}`}>
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
          className="w-full rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
      </td>
    );
  }

  return (
    <td
      onDoubleClick={startEdit}
      className={`cursor-default px-3 py-1.5 text-zinc-300 ${bgClass}`}
      title={mismatch?.message}
    >
      {value ?? ""}
    </td>
  );
}
