export interface FixSuggestion {
  mismatchId: string;
  confidence: number;
  reasoning: string;
  sourceOfTruth: "source" | "target";
  proposedFix: {
    docId: string;
    elementPath: string;
    currentValue: string | number;
    proposedValue: string | number;
  };
}

export interface AgentSuggestionsPayload {
  suggestions: FixSuggestion[];
  modelUsed: string;
  generatedAt: string;
}

export interface MatchConfirmation {
  crossRefId: string;
  confirmed: boolean;
  confidence: number;
  reasoning: string;
  suggestedCanonicalName?: string;
}

export interface AgentMatchConfirmPayload {
  confirmations: MatchConfirmation[];
  modelUsed: string;
  generatedAt: string;
}
