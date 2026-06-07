import type { CrossRef, Mismatch, MismatchSeverity } from "@propagate/contracts";

export function checkConsistency(crossRefs: CrossRef[]): Mismatch[] {
  const mismatches: Mismatch[] = [];

  for (const ref of crossRefs) {
    if (ref.type === "missing-in-schedule" || ref.type === "missing-in-floorplan") {
      mismatches.push({
        id: `mismatch:${ref.id}`,
        crossRefId: ref.id,
        type: ref.type,
        severity: "error",
        source: ref.source,
        target: ref.target,
        message: buildMissingMessage(ref),
      });
    } else if (String(ref.source.value) !== String(ref.target.value)) {
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

function buildMissingMessage(ref: CrossRef): string {
  if (ref.type === "missing-in-schedule") {
    return `Element "${ref.source.value}" exists in floor plan but is missing from schedule (${ref.target.docId})`;
  }
  return `Element "${ref.source.value}" exists in schedule but is missing from floor plan (${ref.target.docId})`;
}
