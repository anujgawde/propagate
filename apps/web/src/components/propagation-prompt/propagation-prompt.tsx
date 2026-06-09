"use client";

import { useDocumentStore } from "@/store/documents";
import { socket } from "@/socket/client";

export function PropagationPrompt() {
  const pendingPropagation = useDocumentStore((s) => s.pendingPropagation);
  const setPendingPropagation = useDocumentStore((s) => s.setPendingPropagation);
  const applyChange = useDocumentStore((s) => s.applyChange);
  const documents = useDocumentStore((s) => s.documents);

  if (!pendingPropagation || pendingPropagation.length === 0) return null;

  const docName = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return docId;
    return doc.type.replace("-", " ");
  };

  const handleApply = () => {
    socket.emit("propagate:submit", pendingPropagation);

    for (const target of pendingPropagation) {
      applyChange({
        docId: target.docId,
        elementPath: target.elementPath,
        oldValue: target.currentValue,
        newValue: target.proposedValue,
      });
    }

    setPendingPropagation(null);
  };

  const handleDismiss = () => {
    setPendingPropagation(null);
  };

  return (
    <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-edge bg-surface-alt p-4 shadow-xl">
      <div className="mb-3 text-sm font-medium text-ink">
        Propagate to {pendingPropagation.length} other location
        {pendingPropagation.length !== 1 ? "s" : ""}?
      </div>
      <div className="mb-3 max-h-32 space-y-1.5 overflow-auto">
        {pendingPropagation.map((target) => (
          <div
            key={target.crossRefId}
            className="flex items-center gap-2 text-xs"
          >
            <span className="rounded bg-surface-inset px-1.5 py-0.5 text-ink-secondary">
              {docName(target.docId)}
            </span>
            <span className="text-ink-muted">
              &ldquo;{String(target.currentValue)}&rdquo;
            </span>
            <span className="text-ink-faint">&rarr;</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              &ldquo;{String(target.proposedValue)}&rdquo;
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Propagate
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md px-3 py-1.5 text-xs text-ink-secondary hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
