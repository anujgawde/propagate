import { describe, it, expect } from "vitest";
import type { Mismatch } from "@propagate/contracts";
import { parseFixSuggestions } from "../response-parser.js";

const MISMATCHES: Mismatch[] = [
  {
    id: "mismatch:xref-room-name-102",
    crossRefId: "xref-room-name-102",
    type: "room-name",
    severity: "warning",
    source: { docId: "fp-1", elementPath: "rooms.102.name", value: "OPERATORY 1" },
    target: { docId: "rs-1", elementPath: "rows.102.name", value: "OP 1" },
    message: 'room-name: "OPERATORY 1" (fp-1) ≠ "OP 1" (rs-1)',
  },
  {
    id: "mismatch:xref-room-area-106",
    crossRefId: "xref-room-area-106",
    type: "room-area",
    severity: "error",
    source: { docId: "fp-1", elementPath: "rooms.106.area", value: 180 },
    target: { docId: "rs-1", elementPath: "rows.106.area", value: 165 },
    message: 'room-area: "180" (fp-1) ≠ "165" (rs-1)',
  },
];

describe("parseFixSuggestions", () => {
  it("parses valid JSON response", () => {
    const raw = JSON.stringify([
      {
        mismatchId: "mismatch:xref-room-name-102",
        sourceOfTruth: "source",
        confidence: 0.9,
        reasoning: "Floor plan has the canonical room name",
      },
      {
        mismatchId: "mismatch:xref-room-area-106",
        sourceOfTruth: "source",
        confidence: 0.95,
        reasoning: "Floor plan area is measured from the model",
      },
    ]);

    const result = parseFixSuggestions(raw, MISMATCHES);

    expect(result).toHaveLength(2);
    expect(result[0].mismatchId).toBe("mismatch:xref-room-name-102");
    expect(result[0].sourceOfTruth).toBe("source");
    expect(result[0].proposedFix.docId).toBe("rs-1");
    expect(result[0].proposedFix.currentValue).toBe("OP 1");
    expect(result[0].proposedFix.proposedValue).toBe("OPERATORY 1");
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = '```json\n[{"mismatchId":"mismatch:xref-room-name-102","sourceOfTruth":"source","confidence":0.85,"reasoning":"Floor plan is canonical"}]\n```';

    const result = parseFixSuggestions(raw, MISMATCHES);

    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.85);
  });

  it("parses JSON wrapped in bare fences (no json tag)", () => {
    const raw = '```\n[{"mismatchId":"mismatch:xref-room-name-102","sourceOfTruth":"target","confidence":0.7,"reasoning":"Schedule is authoritative"}]\n```';

    const result = parseFixSuggestions(raw, MISMATCHES);

    expect(result).toHaveLength(1);
    expect(result[0].sourceOfTruth).toBe("target");
    expect(result[0].proposedFix.docId).toBe("fp-1");
    expect(result[0].proposedFix.proposedValue).toBe("OP 1");
  });

  it("returns empty array for completely unparseable response", () => {
    const result = parseFixSuggestions("I cannot help with that request.", MISMATCHES);
    expect(result).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    const result = parseFixSuggestions('{"error": "something"}', MISMATCHES);
    expect(result).toEqual([]);
  });

  it("filters out suggestions with non-existent mismatch IDs", () => {
    const raw = JSON.stringify([
      {
        mismatchId: "mismatch:does-not-exist",
        sourceOfTruth: "source",
        confidence: 0.9,
        reasoning: "Test",
      },
      {
        mismatchId: "mismatch:xref-room-area-106",
        sourceOfTruth: "source",
        confidence: 0.95,
        reasoning: "Floor plan area is measured",
      },
    ]);

    const result = parseFixSuggestions(raw, MISMATCHES);
    expect(result).toHaveLength(1);
    expect(result[0].mismatchId).toBe("mismatch:xref-room-area-106");
  });

  it("filters out items with missing required fields", () => {
    const raw = JSON.stringify([
      { mismatchId: "mismatch:xref-room-name-102" },
      { sourceOfTruth: "source", confidence: 0.5, reasoning: "test" },
      {
        mismatchId: "mismatch:xref-room-area-106",
        sourceOfTruth: "source",
        confidence: 0.95,
        reasoning: "Valid suggestion",
      },
    ]);

    const result = parseFixSuggestions(raw, MISMATCHES);
    expect(result).toHaveLength(1);
    expect(result[0].mismatchId).toBe("mismatch:xref-room-area-106");
  });

  it("clamps confidence to 0-1 range", () => {
    const raw = JSON.stringify([
      {
        mismatchId: "mismatch:xref-room-name-102",
        sourceOfTruth: "source",
        confidence: 1.5,
        reasoning: "Very confident",
      },
    ]);

    const result = parseFixSuggestions(raw, MISMATCHES);
    expect(result[0].confidence).toBe(1);
  });

  it("returns empty array for empty input", () => {
    const result = parseFixSuggestions("[]", MISMATCHES);
    expect(result).toEqual([]);
  });
});
