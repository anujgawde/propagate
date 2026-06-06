import type { Change, CrossRef, Impact } from "@propagate/contracts";

export function traceImpact(crossRefs: CrossRef[], change: Change): Impact[] {
  const impacts: Impact[] = [];

  for (const ref of crossRefs) {
    if (
      ref.source.docId === change.docId &&
      ref.source.elementPath === change.elementPath
    ) {
      impacts.push({
        crossRefId: ref.id,
        affectedDoc: ref.target.docId,
        affectedElement: ref.target.elementPath,
        currentValue: ref.target.value,
        expectedValue: change.newValue,
      });
    }

    if (
      ref.target.docId === change.docId &&
      ref.target.elementPath === change.elementPath
    ) {
      impacts.push({
        crossRefId: ref.id,
        affectedDoc: ref.source.docId,
        affectedElement: ref.source.elementPath,
        currentValue: ref.source.value,
        expectedValue: change.newValue,
      });
    }
  }

  return impacts;
}
