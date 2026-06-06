import type { Change, GraphState, Impact, Mismatch } from "./crossref-types.js";
import type { DocumentEnvelope } from "./document-types.js";

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
  "impact:result": (payload: Impact[]) => void;
  "mismatches:updated": (payload: Mismatch[]) => void;
}

export interface ClientToServerEvents {
  "edit:submit": (payload: Change) => void;
  "edit:apply-all": (payload: Change) => void;
  "edit:revert": (payload: Change) => void;
}
