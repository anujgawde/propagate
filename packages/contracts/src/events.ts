import type { Change, GraphState, Impact, Mismatch, PropagationTarget } from "./crossref-types.js";
import type { DocumentEnvelope } from "./document-types.js";
import type { AgentSuggestionsPayload, AgentMatchConfirmPayload } from "./agent-types.js";

export interface IngestionProgress {
  fileId: string;
  fileName: string;
  status: "parsing" | "indexing" | "done" | "error";
  progress: number;
  message: string;
}

export interface ServerToClientEvents {
  "ingestion:progress": (payload: IngestionProgress) => void;
  "graph:updated": (payload: GraphState) => void;
  "document:updated": (payload: DocumentEnvelope) => void;
  "edit:broadcast": (payload: Change) => void;
  "propagate:broadcast": (payload: Change[]) => void;
  "impact:result": (payload: Impact[]) => void;
  "mismatches:updated": (payload: Mismatch[]) => void;
  "agent:status": (payload: { available: boolean }) => void;
  "agent:suggestions": (payload: AgentSuggestionsPayload) => void;
  "agent:match-confirmations": (payload: AgentMatchConfirmPayload) => void;
}

export interface ClientToServerEvents {
  "edit:submit": (payload: Change) => void;
  "edit:apply-all": (payload: Change) => void;
  "edit:revert": (payload: Change) => void;
  "propagate:submit": (payload: PropagationTarget[]) => void;
  "agent:request-suggestions": () => void;
  "agent:accept-suggestion": (payload: { mismatchId: string }) => void;
  "agent:confirm-matches": () => void;
}
