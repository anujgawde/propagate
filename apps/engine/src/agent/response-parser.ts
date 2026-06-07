import type { Mismatch, FixSuggestion } from "@propagate/contracts";

interface RawFixSuggestion {
  mismatchId?: string;
  sourceOfTruth?: string;
  confidence?: number;
  reasoning?: string;
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

function isValidRaw(item: unknown): item is RawFixSuggestion {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.mismatchId === "string" &&
    (obj.sourceOfTruth === "source" || obj.sourceOfTruth === "target") &&
    typeof obj.confidence === "number" &&
    typeof obj.reasoning === "string"
  );
}

export function parseFixSuggestions(
  raw: string,
  mismatches: Mismatch[],
): FixSuggestion[] {
  const mismatchMap = new Map(mismatches.map((m) => [m.id, m]));

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const suggestions: FixSuggestion[] = [];

  for (const item of parsed) {
    if (!isValidRaw(item)) continue;

    const mismatch = mismatchMap.get(item.mismatchId!);
    if (!mismatch) continue;

    const isSourceCorrect = item.sourceOfTruth === "source";
    const correctSide = isSourceCorrect ? mismatch.source : mismatch.target;
    const wrongSide = isSourceCorrect ? mismatch.target : mismatch.source;

    suggestions.push({
      mismatchId: item.mismatchId!,
      confidence: Math.max(0, Math.min(1, item.confidence!)),
      reasoning: item.reasoning!,
      sourceOfTruth: item.sourceOfTruth as "source" | "target",
      proposedFix: {
        docId: wrongSide.docId,
        elementPath: wrongSide.elementPath,
        currentValue: wrongSide.value,
        proposedValue: correctSide.value,
      },
    });
  }

  return suggestions;
}
