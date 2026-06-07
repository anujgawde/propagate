import type { Change, CrossRef, PropagationTarget } from "@propagate/contracts";

export function computePropagation(
  change: Change,
  crossRefs: CrossRef[],
): PropagationTarget[] {
  const targets: PropagationTarget[] = [];

  for (const ref of crossRefs) {
    if (ref.type === "missing-in-schedule" || ref.type === "missing-in-floorplan") {
      continue;
    }

    if (
      ref.source.docId === change.docId &&
      ref.source.elementPath === change.elementPath
    ) {
      if (String(ref.target.value) !== String(change.newValue)) {
        targets.push({
          crossRefId: ref.id,
          docId: ref.target.docId,
          elementPath: ref.target.elementPath,
          currentValue: ref.target.value,
          proposedValue: change.newValue,
        });
      }
    }

    if (
      ref.target.docId === change.docId &&
      ref.target.elementPath === change.elementPath
    ) {
      if (String(ref.source.value) !== String(change.newValue)) {
        targets.push({
          crossRefId: ref.id,
          docId: ref.source.docId,
          elementPath: ref.source.elementPath,
          currentValue: ref.source.value,
          proposedValue: change.newValue,
        });
      }
    }
  }

  return targets;
}
