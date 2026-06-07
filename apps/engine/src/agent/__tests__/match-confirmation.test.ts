import { describe, it, expect } from "vitest";
import type { CrossRef } from "@propagate/contracts";
import { parseMatchConfirmations } from "../response-parser.js";

const CROSS_REFS: CrossRef[] = [
  {
    id: "xref-room-name-102",
    type: "room-name",
    matchMethod: "fuzzy",
    confidence: 0.75,
    source: { docId: "fp-1", elementPath: "rooms.102.name", value: "OPERATORY 1" },
    target: { docId: "rs-1", elementPath: "rows.102.name", value: "OP 1" },
  },
  {
    id: "xref-room-name-201",
    type: "room-name",
    matchMethod: "fuzzy",
    confidence: 0.6,
    source: { docId: "fp-1", elementPath: "rooms.201.name", value: "MECHANICAL" },
    target: { docId: "rs-1", elementPath: "rows.201.name", value: "MECH" },
  },
];

describe("parseMatchConfirmations", () => {
  it("parses valid JSON response", () => {
    const raw = JSON.stringify([
      {
        crossRefId: "xref-room-name-102",
        confirmed: true,
        confidence: 0.95,
        reasoning: "OP 1 is a standard abbreviation of OPERATORY 1",
        suggestedCanonicalName: "OPERATORY 1",
      },
      {
        crossRefId: "xref-room-name-201",
        confirmed: true,
        confidence: 0.9,
        reasoning: "MECH is a standard abbreviation of MECHANICAL",
        suggestedCanonicalName: "MECHANICAL",
      },
    ]);

    const result = parseMatchConfirmations(raw, CROSS_REFS);

    expect(result).toHaveLength(2);
    expect(result[0].crossRefId).toBe("xref-room-name-102");
    expect(result[0].confirmed).toBe(true);
    expect(result[0].confidence).toBe(0.95);
    expect(result[0].suggestedCanonicalName).toBe("OPERATORY 1");
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = '```json\n[{"crossRefId":"xref-room-name-102","confirmed":true,"confidence":0.85,"reasoning":"Abbreviation match","suggestedCanonicalName":"OPERATORY 1"}]\n```';

    const result = parseMatchConfirmations(raw, CROSS_REFS);

    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.85);
  });

  it("parses JSON wrapped in bare fences", () => {
    const raw = '```\n[{"crossRefId":"xref-room-name-201","confirmed":false,"confidence":0.3,"reasoning":"Not a match","suggestedCanonicalName":null}]\n```';

    const result = parseMatchConfirmations(raw, CROSS_REFS);

    expect(result).toHaveLength(1);
    expect(result[0].confirmed).toBe(false);
    expect(result[0].suggestedCanonicalName).toBeUndefined();
  });

  it("returns empty array for unparseable response", () => {
    const result = parseMatchConfirmations("I cannot analyze these matches.", CROSS_REFS);
    expect(result).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    const result = parseMatchConfirmations('{"error": "something"}', CROSS_REFS);
    expect(result).toEqual([]);
  });

  it("filters out confirmations with non-existent cross-ref IDs", () => {
    const raw = JSON.stringify([
      {
        crossRefId: "xref-does-not-exist",
        confirmed: true,
        confidence: 0.9,
        reasoning: "Test",
        suggestedCanonicalName: null,
      },
      {
        crossRefId: "xref-room-name-102",
        confirmed: true,
        confidence: 0.95,
        reasoning: "Valid confirmation",
        suggestedCanonicalName: "OPERATORY 1",
      },
    ]);

    const result = parseMatchConfirmations(raw, CROSS_REFS);
    expect(result).toHaveLength(1);
    expect(result[0].crossRefId).toBe("xref-room-name-102");
  });

  it("filters out items with missing required fields", () => {
    const raw = JSON.stringify([
      { crossRefId: "xref-room-name-102" },
      { confirmed: true, confidence: 0.5, reasoning: "test" },
      {
        crossRefId: "xref-room-name-201",
        confirmed: true,
        confidence: 0.9,
        reasoning: "Valid",
        suggestedCanonicalName: "MECHANICAL",
      },
    ]);

    const result = parseMatchConfirmations(raw, CROSS_REFS);
    expect(result).toHaveLength(1);
    expect(result[0].crossRefId).toBe("xref-room-name-201");
  });

  it("clamps confidence to 0-1 range", () => {
    const raw = JSON.stringify([
      {
        crossRefId: "xref-room-name-102",
        confirmed: true,
        confidence: 1.8,
        reasoning: "Very confident",
        suggestedCanonicalName: "OPERATORY 1",
      },
    ]);

    const result = parseMatchConfirmations(raw, CROSS_REFS);
    expect(result[0].confidence).toBe(1);
  });

  it("handles negative confidence by clamping to 0", () => {
    const raw = JSON.stringify([
      {
        crossRefId: "xref-room-name-102",
        confirmed: false,
        confidence: -0.5,
        reasoning: "Not sure",
        suggestedCanonicalName: null,
      },
    ]);

    const result = parseMatchConfirmations(raw, CROSS_REFS);
    expect(result[0].confidence).toBe(0);
  });

  it("returns empty array for empty JSON array", () => {
    const result = parseMatchConfirmations("[]", CROSS_REFS);
    expect(result).toEqual([]);
  });
});
