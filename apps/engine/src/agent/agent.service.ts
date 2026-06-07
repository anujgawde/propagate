import { Injectable } from "@nestjs/common";
import type {
  Mismatch,
  CrossRef,
  DocumentEnvelope,
  FixSuggestion,
  AgentSuggestionsPayload,
  MatchConfirmation,
  AgentMatchConfirmPayload,
} from "@propagate/contracts";
import { OllamaClient, OllamaUnavailableError } from "./ollama.client.js";
import { buildFixSuggestionPrompt, buildMatchConfirmationPrompt } from "./prompt-builder.js";
import { parseFixSuggestions, parseMatchConfirmations } from "./response-parser.js";

@Injectable()
export class AgentService {
  constructor(private readonly ollama: OllamaClient) {}

  async checkHealth(): Promise<{ available: boolean; model: string }> {
    const available = await this.ollama.isAvailable();
    return { available, model: this.ollama.getModel() };
  }

  async suggestFixes(
    mismatches: Mismatch[],
    documents: DocumentEnvelope[],
  ): Promise<AgentSuggestionsPayload | null> {
    if (mismatches.length === 0) {
      return { suggestions: [], modelUsed: this.ollama.getModel(), generatedAt: new Date().toISOString() };
    }

    if (!(await this.ollama.isAvailable())) return null;

    let suggestions: FixSuggestion[];
    try {
      const messages = buildFixSuggestionPrompt(mismatches, documents);
      const raw = await this.ollama.chat(messages);
      suggestions = parseFixSuggestions(raw, mismatches);
    } catch (e) {
      if (e instanceof OllamaUnavailableError) return null;
      throw e;
    }

    return {
      suggestions,
      modelUsed: this.ollama.getModel(),
      generatedAt: new Date().toISOString(),
    };
  }

  async confirmFuzzyMatches(
    crossRefs: CrossRef[],
    documents: DocumentEnvelope[],
  ): Promise<AgentMatchConfirmPayload | null> {
    const fuzzy = crossRefs.filter((cr) => cr.matchMethod === "fuzzy");
    if (fuzzy.length === 0) {
      return { confirmations: [], modelUsed: this.ollama.getModel(), generatedAt: new Date().toISOString() };
    }

    if (!(await this.ollama.isAvailable())) return null;

    let confirmations: MatchConfirmation[];
    try {
      const messages = buildMatchConfirmationPrompt(fuzzy, documents);
      const raw = await this.ollama.chat(messages);
      confirmations = parseMatchConfirmations(raw, fuzzy);
    } catch (e) {
      if (e instanceof OllamaUnavailableError) return null;
      throw e;
    }

    return {
      confirmations,
      modelUsed: this.ollama.getModel(),
      generatedAt: new Date().toISOString(),
    };
  }
}
