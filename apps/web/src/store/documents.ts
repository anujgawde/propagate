import { create } from "zustand";
import type { DocumentEnvelope, GraphState, Mismatch } from "@propagate/contracts";

interface DocumentStore {
  documents: DocumentEnvelope[];
  graph: GraphState | null;
  mismatches: Mismatch[];
  selectedElementId: string | null;

  addDocument: (doc: DocumentEnvelope) => void;
  setGraph: (graph: GraphState) => void;
  setMismatches: (mismatches: Mismatch[]) => void;
  selectElement: (id: string | null) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  graph: null,
  mismatches: [],
  selectedElementId: null,

  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),
  setGraph: (graph) => set({ graph }),
  setMismatches: (mismatches) => set({ mismatches }),
  selectElement: (id) => set({ selectedElementId: id }),
}));
