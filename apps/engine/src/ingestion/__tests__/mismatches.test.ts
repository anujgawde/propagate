import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type { DocumentEnvelope, FloorPlan, Schedule } from "@propagate/contracts";
import { buildGraph, checkConsistency } from "@propagate/crossref";
import { parseIfc } from "../ifc-parser";
import { parseExcel } from "../excel-parser";

const SAMPLES_DIR = join(__dirname, "../../../../..", "samples");

describe("seeded mismatches end-to-end", () => {
  let floorPlanEnvelope: DocumentEnvelope;
  let roomScheduleEnvelope: DocumentEnvelope;
  let doorScheduleEnvelope: DocumentEnvelope;

  it("loads all sample documents", async () => {
    const ifcBuffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(ifcBuffer);
    floorPlan.id = "fp-1";
    floorPlan.sourceFile = "dental-clinic.ifc";

    floorPlanEnvelope = {
      id: "fp-1",
      type: "floor-plan",
      document: floorPlan,
      uploadedAt: new Date().toISOString(),
    };

    const roomBuffer = readFileSync(join(SAMPLES_DIR, "room-schedule.xlsx"));
    const roomSchedule = await parseExcel(roomBuffer, "room");
    roomSchedule.id = "rs-1";
    roomSchedule.sourceFile = "room-schedule.xlsx";

    roomScheduleEnvelope = {
      id: "rs-1",
      type: "room-schedule",
      document: roomSchedule,
      uploadedAt: new Date().toISOString(),
    };

    const doorBuffer = readFileSync(join(SAMPLES_DIR, "door-schedule.xlsx"));
    const doorSchedule = await parseExcel(doorBuffer, "door");
    doorSchedule.id = "ds-1";
    doorSchedule.sourceFile = "door-schedule.xlsx";

    doorScheduleEnvelope = {
      id: "ds-1",
      type: "door-schedule",
      document: doorSchedule,
      uploadedAt: new Date().toISOString(),
    };

    expect((floorPlanEnvelope.document as FloorPlan).rooms.length).toBe(17);
    expect((roomScheduleEnvelope.document as Schedule).rows.length).toBe(17);
    expect((doorScheduleEnvelope.document as Schedule).rows.length).toBe(19);
  });

  it("builds cross-references between documents", () => {
    const crossRefs = buildGraph([
      floorPlanEnvelope,
      roomScheduleEnvelope,
      doorScheduleEnvelope,
    ]);

    expect(crossRefs.length).toBeGreaterThan(0);

    const roomNumberRefs = crossRefs.filter((r) => r.type === "room-number");
    expect(roomNumberRefs.length).toBeGreaterThanOrEqual(15);

    const doorNumberRefs = crossRefs.filter((r) => r.type === "door-number");
    expect(doorNumberRefs.length).toBeGreaterThanOrEqual(19);
  });

  it("detects mismatch #1: OPERATORY 1 vs OP 1", () => {
    const crossRefs = buildGraph([floorPlanEnvelope, roomScheduleEnvelope]);
    const mismatches = checkConsistency(crossRefs);

    const nameMismatch = mismatches.find(
      (m) =>
        m.type === "room-name" &&
        (String(m.source.value).includes("OPERATORY 1") ||
          String(m.target.value).includes("OP 1")),
    );
    expect(nameMismatch).toBeDefined();
  });

  it("detects mismatch #3: area 180 vs 165 for STERILIZATION", () => {
    const crossRefs = buildGraph([floorPlanEnvelope, roomScheduleEnvelope]);
    const mismatches = checkConsistency(crossRefs);

    const areaMismatch = mismatches.find(
      (m) =>
        m.type === "room-area" &&
        ((m.source.value === 180 && m.target.value === 165) ||
          (m.source.value === 165 && m.target.value === 180)),
    );
    expect(areaMismatch).toBeDefined();
  });
});
