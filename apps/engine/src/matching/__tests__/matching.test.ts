import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchingService } from "../matching.service.js";
import { LanceService } from "../lance.service.js";
import type { CrossRef, DocumentEnvelope } from "@propagate/contracts";

function makeLanceService(available: boolean, results: Record<string, unknown[]> = {}) {
  return {
    isAvailable: () => available,
    indexElements: vi.fn(),
    findSimilar: vi.fn((text: string) => Promise.resolve(results[text] ?? [])),
  } as unknown as LanceService;
}

const bounds = { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } };

const fpDoc: DocumentEnvelope = {
  id: "fp-1",
  type: "floor-plan",
  document: {
    id: "fp-1",
    name: "Floor Plan",
    sourceFile: "plan.ifc",
    rooms: [
      { id: "r1", name: "OPERATORY 1", number: "102", bounds, area: 100, properties: {} },
      { id: "r2", name: "STERILIZATION", number: "106", bounds, area: 180, properties: {} },
    ],
    doors: [],
    walls: [],
  },
  uploadedAt: new Date().toISOString(),
};

const schedDoc: DocumentEnvelope = {
  id: "sched-1",
  type: "room-schedule",
  document: {
    id: "sched-1",
    name: "Room Schedule",
    sourceFile: "schedule.xlsx",
    type: "room" as const,
    columns: [
      { key: "number", label: "Number" },
      { key: "name", label: "Name" },
      { key: "area", label: "Area" },
    ],
    rows: [
      { id: "row1", values: { number: "102", name: "OP 1", area: 100 } },
      { id: "row2", values: { number: "106", name: "STERIL RM", area: 165 } },
    ],
  },
  uploadedAt: new Date().toISOString(),
};

describe("MatchingService", () => {
  let service: MatchingService;

  describe("when LanceDB is unavailable", () => {
    beforeEach(() => {
      service = new MatchingService(makeLanceService(false));
    });

    it("returns empty array for fuzzy refs", async () => {
      const result = await service.buildFuzzyRefs([fpDoc, schedDoc], []);
      expect(result).toEqual([]);
    });

    it("reports unavailable", () => {
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe("when LanceDB is available", () => {
    it("produces fuzzy cross-refs for similar names", async () => {
      const lance = makeLanceService(true, {
        "OPERATORY 1": [
          { id: "sched-1:rows.row1.name", docId: "sched-1", elementPath: "rows.row1.name", text: "OP 1", confidence: 0.65 },
        ],
        "STERILIZATION": [
          { id: "sched-1:rows.row2.name", docId: "sched-1", elementPath: "rows.row2.name", text: "STERIL RM", confidence: 0.72 },
        ],
        "OP 1": [
          { id: "fp-1:rooms.r1.name", docId: "fp-1", elementPath: "rooms.r1.name", text: "OPERATORY 1", confidence: 0.65 },
        ],
        "STERIL RM": [
          { id: "fp-1:rooms.r2.name", docId: "fp-1", elementPath: "rooms.r2.name", text: "STERILIZATION", confidence: 0.72 },
        ],
      });
      service = new MatchingService(lance);

      const refs = await service.buildFuzzyRefs([fpDoc, schedDoc], []);
      expect(refs.length).toBe(2);
      expect(refs.every((r) => r.matchMethod === "fuzzy")).toBe(true);
      expect(refs.every((r) => r.confidence > 0 && r.confidence < 1)).toBe(true);
    });

    it("skips pairs already covered by exact matching", async () => {
      const exactRef: CrossRef = {
        id: "exact-1",
        type: "room-name",
        matchMethod: "exact",
        confidence: 1.0,
        source: { docId: "fp-1", elementPath: "rooms.r1.name", value: "OPERATORY 1" },
        target: { docId: "sched-1", elementPath: "rows.row1.name", value: "OP 1" },
      };
      const lance = makeLanceService(true, {
        "OPERATORY 1": [
          { id: "sched-1:rows.row1.name", docId: "sched-1", elementPath: "rows.row1.name", text: "OP 1", confidence: 0.65 },
        ],
      });
      service = new MatchingService(lance);

      const refs = await service.buildFuzzyRefs([fpDoc, schedDoc], [exactRef]);
      const matching = refs.filter(
        (r) =>
          (r.source.elementPath === "rooms.r1.name" && r.target.elementPath === "rows.row1.name") ||
          (r.source.elementPath === "rows.row1.name" && r.target.elementPath === "rooms.r1.name"),
      );
      expect(matching.length).toBe(0);
    });

    it("deduplicates bidirectional matches", async () => {
      const lance = makeLanceService(true, {
        "OPERATORY 1": [
          { id: "sched-1:rows.row1.name", docId: "sched-1", elementPath: "rows.row1.name", text: "OP 1", confidence: 0.65 },
        ],
        "OP 1": [
          { id: "fp-1:rooms.r1.name", docId: "fp-1", elementPath: "rooms.r1.name", text: "OPERATORY 1", confidence: 0.65 },
        ],
      });
      service = new MatchingService(lance);

      const refs = await service.buildFuzzyRefs([fpDoc, schedDoc], []);
      const op1Refs = refs.filter(
        (r) =>
          (r.source.value === "OPERATORY 1" && r.target.value === "OP 1") ||
          (r.source.value === "OP 1" && r.target.value === "OPERATORY 1"),
      );
      expect(op1Refs.length).toBe(1);
    });

    it("filters out matches where both texts have different numbers", async () => {
      const lance = makeLanceService(true, {
        "OPERATORY 1": [
          { id: "fp-1:rooms.r2.name", docId: "fp-1", elementPath: "rooms.r2.name", text: "OPERATORY 2", confidence: 0.82 },
        ],
      });
      service = new MatchingService(lance);

      const refs = await service.buildFuzzyRefs([fpDoc, schedDoc], []);
      expect(refs.length).toBe(0);
    });

    it("assigns correct cross-ref type for room names", async () => {
      const lance = makeLanceService(true, {
        "OPERATORY 1": [
          { id: "sched-1:rows.row1.name", docId: "sched-1", elementPath: "rows.row1.name", text: "OP 1", confidence: 0.65 },
        ],
      });
      service = new MatchingService(lance);

      const refs = await service.buildFuzzyRefs([fpDoc, schedDoc], []);
      expect(refs[0]?.type).toBe("room-name");
    });
  });
});
