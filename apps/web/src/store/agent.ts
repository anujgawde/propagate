"use client";

import { create } from "zustand";
import type {
  FixSuggestion,
  MatchConfirmation,
} from "@propagate/contracts";

interface AgentStore {
  available: boolean | null;
  loading: boolean;
  suggestions: FixSuggestion[];
  confirmations: MatchConfirmation[];

  setAvailable: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setSuggestions: (items: FixSuggestion[]) => void;
  setConfirmations: (items: MatchConfirmation[]) => void;
  removeSuggestion: (mismatchId: string) => void;
  removeConfirmation: (crossRefId: string) => void;
  clear: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  available: null,
  loading: false,
  suggestions: [],
  confirmations: [],

  setAvailable: (available) => set({ available }),
  setLoading: (loading) => set({ loading }),
  setSuggestions: (suggestions) => set({ suggestions, loading: false }),
  setConfirmations: (confirmations) => set({ confirmations, loading: false }),
  removeSuggestion: (mismatchId) =>
    set((s) => ({ suggestions: s.suggestions.filter((x) => x.mismatchId !== mismatchId) })),
  removeConfirmation: (crossRefId) =>
    set((s) => ({ confirmations: s.confirmations.filter((x) => x.crossRefId !== crossRefId) })),
  clear: () => set({ suggestions: [], confirmations: [], loading: false }),
}));
