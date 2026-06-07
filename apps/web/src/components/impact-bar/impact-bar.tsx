"use client";

import { useState } from "react";
import { useDocumentStore } from "@/store/documents";

export function ImpactBar() {
  const mismatches = useDocumentStore((s) => s.mismatches);
  const documents = useDocumentStore((s) => s.documents);
  const [expanded, setExpanded] = useState(false);

  if (documents.length === 0) {
    return (
      <footer className="border-t border-zinc-800 px-6 py-3 text-sm text-zinc-500">
        Upload documents to begin analysis
      </footer>
    );
  }

  if (mismatches.length === 0) {
    return (
      <footer className="border-t border-zinc-800 px-6 py-3 text-sm text-emerald-500">
        No mismatches detected &mdash; {documents.length} document
        {documents.length !== 1 ? "s" : ""} loaded
      </footer>
    );
  }

  return (
    <footer className="border-t border-zinc-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-3 text-sm text-amber-400 hover:bg-zinc-900/50"
      >
        <span>
          {mismatches.length} mismatch{mismatches.length !== 1 ? "es" : ""}{" "}
          detected
        </span>
        <span className="text-zinc-600">{expanded ? "collapse" : "expand"}</span>
      </button>
      {expanded && (
        <div className="max-h-48 overflow-auto border-t border-zinc-800 px-6 py-2">
          {mismatches.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-3 py-1.5 text-xs"
            >
              <span
                className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                  m.severity === "error"
                    ? "bg-red-500"
                    : m.severity === "warning"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                }`}
              />
              <span className="text-zinc-400">{m.message}</span>
              <span className="ml-auto shrink-0 text-zinc-600">
                {m.type === "missing-in-schedule" || m.type === "missing-in-floorplan"
                  ? "missing"
                  : `${String(m.source.value)} ≠ ${String(m.target.value)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </footer>
  );
}
