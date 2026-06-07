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
