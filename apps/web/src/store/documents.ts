"use client";

import { create } from "zustand";
import type {
  DocumentEnvelope,
  CrossRef,
  Mismatch,
  Change,
  PropagationTarget,
  FloorPlan,
  Schedule,
} from "@propagate/contracts";
import { buildGraph, checkConsistency } from "@propagate/crossref";

interface DocumentStore {
  documents: DocumentEnvelope[];
  crossRefs: CrossRef[];
  mismatches: Mismatch[];
  selectedElementId: string | null;
  focusedMismatchId: string | null;
  uploading: boolean;
  pendingPropagation: PropagationTarget[] | null;

  addDocument: (doc: DocumentEnvelope) => void;
  setDocuments: (docs: DocumentEnvelope[]) => void;
  setGraphState: (crossRefs: CrossRef[], mismatches: Mismatch[]) => void;
  applyChange: (change: Change) => void;
  selectElement: (id: string | null) => void;
  focusMismatch: (id: string | null) => void;
  setUploading: (v: boolean) => void;
  setPendingPropagation: (targets: PropagationTarget[] | null) => void;
  clearAll: () => void;
}

function rebuildGraph(documents: DocumentEnvelope[]) {
  const crossRefs = buildGraph(documents);
  const mismatches = checkConsistency(crossRefs);
  return { crossRefs, mismatches };
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  crossRefs: [],
  mismatches: [],
  selectedElementId: null,
  focusedMismatchId: null,
  uploading: false,

  addDocument: (doc) => {
    const documents = [...get().documents, doc];
    const { crossRefs, mismatches } = rebuildGraph(documents);
    set({ documents, crossRefs, mismatches });
  },

  setDocuments: (documents) => {
    const { crossRefs, mismatches } = rebuildGraph(documents);
    set({ documents, crossRefs, mismatches });
  },

  setGraphState: (crossRefs, mismatches) => {
    set({ crossRefs, mismatches });
  },

  applyChange: (change) => {
    const documents = get().documents.map((d) => {
      if (d.id !== change.docId) return d;

      const parts = change.elementPath.split(".");
      const doc = structuredClone(d);

      if (parts[0] === "rooms") {
        const fp = doc.document as FloorPlan;
        const room = fp.rooms.find((r) => r.id === parts[1]);
        if (room) {
          (room as unknown as Record<string, unknown>)[parts[2]] =
            change.newValue;
        }
      } else if (parts[0] === "rows") {
        const schedule = doc.document as Schedule;
        const row = schedule.rows.find((r) => r.id === parts[1]);
        if (row) {
          row.values[parts[2]] = change.newValue;
        }
      }

      return doc;
    });

    const { crossRefs, mismatches } = rebuildGraph(documents);
    set({ documents, crossRefs, mismatches });
  },

  selectElement: (id) => set({ selectedElementId: id }),
  focusMismatch: (id) => set({ focusedMismatchId: id }),
  setUploading: (uploading) => set({ uploading }),
  pendingPropagation: null,
  setPendingPropagation: (targets) => set({ pendingPropagation: targets }),
  clearAll: () =>
    set({
      documents: [],
      crossRefs: [],
      mismatches: [],
      selectedElementId: null,
      focusedMismatchId: null,
      pendingPropagation: null,
    }),
}));
