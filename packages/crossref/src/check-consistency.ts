import type { CrossRef, Mismatch, MismatchSeverity } from "@propagate/contracts";

export function checkConsistency(crossRefs: CrossRef[]): Mismatch[] {
  const mismatches: Mismatch[] = [];

  for (const ref of crossRefs) {
    if (String(ref.source.value) !== String(ref.target.value)) {
      mismatches.push({
        id: `mismatch:${ref.id}`,
        crossRefId: ref.id,
        type: ref.type,
        severity: getSeverity(ref),
        source: ref.source,
        target: ref.target,
        message: buildMessage(ref),
      });
    }
  }

  return mismatches;
}

function getSeverity(ref: CrossRef): MismatchSeverity {
  if (ref.matchMethod === "fuzzy" && ref.confidence >= 0.8) return "warning";
  if (ref.matchMethod === "fuzzy") return "info";
  return "error";
}

function buildMessage(ref: CrossRef): string {
  return `${ref.type}: "${ref.source.value}" (${ref.source.docId}) ≠ "${ref.target.value}" (${ref.target.docId})`;
}
