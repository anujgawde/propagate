"use client";

import { useState } from "react";
import { useAgentStore } from "@/store/agent";
import { useDocumentStore } from "@/store/documents";
import { socket } from "@/socket/client";
import type { FixSuggestion, MatchConfirmation } from "@propagate/contracts";

function confidenceColor(c: number) {
  if (c >= 0.7) return "bg-emerald-500/20 text-emerald-400";
  if (c >= 0.4) return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

function SuggestionCard({ s, onAccept, onDismiss }: {
  s: FixSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${confidenceColor(s.confidence)}`}>
          {Math.round(s.confidence * 100)}%
        </span>
        <span className="text-xs text-zinc-400">{s.sourceOfTruth === "source" ? "Source" : "Target"} is correct</span>
      </div>
      <p className="mb-2 text-xs text-zinc-300">{s.reasoning}</p>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">
          {s.proposedFix.elementPath}
        </span>
        <span className="text-zinc-500">&ldquo;{String(s.proposedFix.currentValue)}&rdquo;</span>
        <span className="text-zinc-600">&rarr;</span>
        <span className="text-emerald-400">&ldquo;{String(s.proposedFix.proposedValue)}&rdquo;</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-500"
        >
          Accept
        </button>
        <button
          onClick={onDismiss}
          className="rounded-md px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ConfirmationCard({ c, onDismiss }: {
  c: MatchConfirmation;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${confidenceColor(c.confidence)}`}>
          {Math.round(c.confidence * 100)}%
        </span>
        <span className={`text-xs ${c.confirmed ? "text-emerald-400" : "text-red-400"}`}>
          {c.confirmed ? "Match confirmed" : "Not a match"}
        </span>
      </div>
      <p className="mb-2 text-xs text-zinc-300">{c.reasoning}</p>
      {c.suggestedCanonicalName && (
        <div className="mb-2 text-xs text-zinc-400">
          Canonical name: <span className="text-zinc-200">{c.suggestedCanonicalName}</span>
        </div>
      )}
      <button
        onClick={onDismiss}
        className="rounded-md px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
      >
        Dismiss
      </button>
    </div>
  );
}

export function AgentPanel() {
  const available = useAgentStore((s) => s.available);
  const loading = useAgentStore((s) => s.loading);
  const suggestions = useAgentStore((s) => s.suggestions);
  const confirmations = useAgentStore((s) => s.confirmations);
  const removeSuggestion = useAgentStore((s) => s.removeSuggestion);
  const removeConfirmation = useAgentStore((s) => s.removeConfirmation);
  const setLoading = useAgentStore((s) => s.setLoading);

  const documents = useDocumentStore((s) => s.documents);
  const mismatches = useDocumentStore((s) => s.mismatches);
  const crossRefs = useDocumentStore((s) => s.crossRefs);
  const applyChange = useDocumentStore((s) => s.applyChange);

  const [expanded, setExpanded] = useState(true);

  if (!available || documents.length === 0) return null;

  const hasFuzzy = crossRefs.some((cr) => cr.matchMethod === "fuzzy");
  const hasContent = suggestions.length > 0 || confirmations.length > 0;

  const handleRequestSuggestions = () => {
    setLoading(true);
    socket.emit("agent:request-suggestions");
  };

  const handleConfirmMatches = () => {
    setLoading(true);
    socket.emit("agent:confirm-matches");
  };

  const handleAccept = (s: FixSuggestion) => {
    socket.emit("agent:accept-suggestion", { mismatchId: s.mismatchId });
    applyChange({
      docId: s.proposedFix.docId,
      elementPath: s.proposedFix.elementPath,
      oldValue: s.proposedFix.currentValue,
      newValue: s.proposedFix.proposedValue,
    });
    removeSuggestion(s.mismatchId);
  };

  return (
    <div className="border-t border-zinc-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-2.5 text-sm text-violet-400 hover:bg-zinc-900/50"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
          Agent
          {hasContent && (
            <span className="text-xs text-zinc-500">
              {suggestions.length + confirmations.length} result{suggestions.length + confirmations.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="text-zinc-600">{expanded ? "collapse" : "expand"}</span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-6 py-3">
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleRequestSuggestions}
              disabled={loading || mismatches.length === 0}
              className="rounded-md border border-violet-700 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:border-violet-500 hover:text-violet-200 disabled:opacity-40"
            >
              {loading ? "Analyzing..." : "Analyze Mismatches"}
            </button>
            {hasFuzzy && (
              <button
                onClick={handleConfirmMatches}
                disabled={loading}
                className="rounded-md border border-violet-700 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:border-violet-500 hover:text-violet-200 disabled:opacity-40"
              >
                {loading ? "Confirming..." : "Confirm Fuzzy Matches"}
              </button>
            )}
          </div>

          {hasContent && (
            <div className="max-h-64 space-y-2 overflow-auto">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.mismatchId}
                  s={s}
                  onAccept={() => handleAccept(s)}
                  onDismiss={() => removeSuggestion(s.mismatchId)}
                />
              ))}
              {confirmations.map((c) => (
                <ConfirmationCard
                  key={c.crossRefId}
                  c={c}
                  onDismiss={() => removeConfirmation(c.crossRefId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
