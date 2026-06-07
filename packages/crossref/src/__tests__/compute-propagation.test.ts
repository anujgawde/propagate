import { describe, it, expect } from "vitest";
import { computePropagation } from "../compute-propagation.js";
import type { Change, CrossRef } from "@propagate/contracts";

const crossRefs: CrossRef[] = [
  {
    id: "fp1:room:r102:name→sched1:row102",
    type: "room-name",
    matchMethod: "exact",
    confidence: 1.0,
    source: {
      docId: "fp1",
      elementPath: "rooms.r102.name",
      value: "OPERATORY 1",
    },
    target: {
      docId: "sched1",
      elementPath: "rows.row102.name",
      value: "OP 1",
    },
  },
  {
    id: "fp1:room:r102:name→pdf1:row102",
    type: "room-name",
    matchMethod: "exact",
    confidence: 1.0,
    source: {
      docId: "fp1",
      elementPath: "rooms.r102.name",
      value: "OPERATORY 1",
    },
    target: {
      docId: "pdf1",
      elementPath: "rows.row102.name",
      value: "OP 1",
    },
  },
  {
    id: "fp1:room:r102:number→sched1:row102",
    type: "room-number",
    matchMethod: "exact",
    confidence: 1.0,
    source: {
      docId: "fp1",
      elementPath: "rooms.r102.number",
      value: "102",
    },
    target: {
      docId: "sched1",
      elementPath: "rows.row102.number",
      value: "102",
    },
  },
  {
    id: "fp1:room:r106:missing→sched1",
    type: "missing-in-schedule",
    matchMethod: "exact",
    confidence: 1.0,
    source: {
      docId: "fp1",
      elementPath: "rooms.r106.number",
      value: "106",
    },
    target: {
      docId: "sched1",
      elementPath: "",
      value: "",
    },
  },
];

describe("computePropagation", () => {
  it("returns targets in other docs that differ from the new value", () => {
    const change: Change = {
      docId: "sched1",
      elementPath: "rows.row102.name",
      oldValue: "OP 1",
      newValue: "OPERATORY 1",
    };

    const targets = computePropagation(change, crossRefs);

    // The schedule target now matches the floor plan source, so the floor plan
    // does NOT need updating. But the PDF still has "OP 1".
    // However, the cross-ref links fp1→sched1, not sched1→pdf1.
    // The change is on the TARGET side of the fp1→sched1 ref.
    // So the source (fp1) is checked: "OPERATORY 1" === "OPERATORY 1" → no propagation needed.
    expect(targets).toHaveLength(0);
  });

  it("proposes changes when editing the source side", () => {
    const change: Change = {
      docId: "fp1",
      elementPath: "rooms.r102.name",
      oldValue: "OPERATORY 1",
      newValue: "OP ROOM 1",
    };

    const targets = computePropagation(change, crossRefs);

    // Both sched1 and pdf1 have "OP 1" which differs from "OP ROOM 1"
    expect(targets).toHaveLength(2);
    expect(targets[0].docId).toBe("sched1");
    expect(targets[0].proposedValue).toBe("OP ROOM 1");
    expect(targets[0].currentValue).toBe("OP 1");
    expect(targets[1].docId).toBe("pdf1");
    expect(targets[1].proposedValue).toBe("OP ROOM 1");
  });

  it("skips targets that already match the new value", () => {
    const change: Change = {
      docId: "fp1",
      elementPath: "rooms.r102.name",
      oldValue: "OPERATORY 1",
      newValue: "OP 1",
    };

    const targets = computePropagation(change, crossRefs);

    // Both sched1 and pdf1 already have "OP 1" — nothing to propagate
    expect(targets).toHaveLength(0);
  });

  it("skips missing-in-schedule and missing-in-floorplan refs", () => {
    const change: Change = {
      docId: "fp1",
      elementPath: "rooms.r106.number",
      oldValue: "106",
      newValue: "106A",
    };

    const targets = computePropagation(change, crossRefs);

    // The only cross-ref for r106 is a missing-in-schedule type — should be skipped
    expect(targets).toHaveLength(0);
  });

  it("returns empty array when no cross-refs match the change", () => {
    const change: Change = {
      docId: "unknown-doc",
      elementPath: "rows.x.name",
      oldValue: "foo",
      newValue: "bar",
    };

    const targets = computePropagation(change, crossRefs);
    expect(targets).toHaveLength(0);
  });
});
