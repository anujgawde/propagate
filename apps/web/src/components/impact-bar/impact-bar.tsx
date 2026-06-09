"use client";

import { useMemo } from "react";
import { useDocumentStore } from "@/store/documents";
import type { Mismatch } from "@propagate/contracts";

function humanizeType(type: string): string {
  return type.replace(/-/g, " ");
}

export function ImpactBar() {
  const mismatches = useDocumentStore((s) => s.mismatches);
  const crossRefs = useDocumentStore((s) => s.crossRefs);
  const documents = useDocumentStore((s) => s.documents);
  const focusedMismatchId = useDocumentStore((s) => s.focusedMismatchId);
  const focusMismatch = useDocumentStore((s) => s.focusMismatch);

  const docNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of documents) {
      const name = humanizeType(d.type);
      map.set(d.id, name.charAt(0).toUpperCase() + name.slice(1));
    }
    return map;
  }, [documents]);

  const fuzzyCount = useMemo(() => {
    return mismatches.filter((m) => {
      const cr = crossRefs.find((c) => c.id === m.crossRefId);
      return cr?.matchMethod === "fuzzy";
    }).length;
  }, [mismatches, crossRefs]);

  function resolveMessage(m: Mismatch): string {
    let msg = m.message;
    const sourceName = docNameMap.get(m.source.docId);
    const targetName = docNameMap.get(m.target.docId);
    if (sourceName) msg = msg.replaceAll(m.source.docId, sourceName);
    if (targetName) msg = msg.replaceAll(m.target.docId, targetName);
    return msg;
  }

  function isFuzzy(m: Mismatch): { fuzzy: boolean; confidence: number } {
    const cr = crossRefs.find((c) => c.id === m.crossRefId);
    if (cr?.matchMethod === "fuzzy") return { fuzzy: true, confidence: cr.confidence };
    return { fuzzy: false, confidence: 1 };
  }

  if (documents.length === 0) {
    return (
      <div className="px-6 py-3 text-sm text-ink-muted">
        Upload documents to begin analysis
      </div>
    );
  }

  if (mismatches.length === 0) {
    return (
      <div className="px-6 py-3 text-sm text-emerald-600 dark:text-emerald-500">
        No mismatches detected &mdash; {documents.length} document
        {documents.length !== 1 ? "s" : ""} loaded
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-2 text-sm text-amber-600 dark:text-amber-400">
        <span>
          {mismatches.length} mismatch{mismatches.length !== 1 ? "es" : ""}{" "}
          detected
          {fuzzyCount > 0 && (
            <span className="ml-2 text-violet-600 dark:text-violet-400">
              ({fuzzyCount} fuzzy)
            </span>
          )}
        </span>
      </div>
      <div className="overflow-auto px-6 pb-2">
        {mismatches.map((m) => {
          const { fuzzy, confidence } = isFuzzy(m);
          return (
            <div
              key={m.id}
              onClick={() => focusMismatch(focusedMismatchId === m.id ? null : m.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-xs hover:bg-surface-hover ${focusedMismatchId === m.id ? "bg-surface-inset ring-1 ring-edge" : ""}`}
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
              <span className="text-ink-secondary">{resolveMessage(m)}</span>
              {fuzzy && (
                <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                  fuzzy {Math.round(confidence * 100)}%
                </span>
              )}
              <span className="ml-auto shrink-0 text-ink-faint">
                {m.type === "missing-in-schedule" || m.type === "missing-in-floorplan"
                  ? "missing"
                  : `${String(m.source.value)} ≠ ${String(m.target.value)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
