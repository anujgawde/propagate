import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseIfc } from "../ifc-parser";

const SAMPLES_DIR = join(__dirname, "../../../../..", "samples");

describe("parseIfc", () => {
  it("parses 17 rooms from the dental clinic IFC", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    expect(floorPlan.rooms).toHaveLength(17);
  });

  it("parses 20 doors", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    expect(floorPlan.doors).toHaveLength(20);
  });

  it("parses 10 walls", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    expect(floorPlan.walls).toHaveLength(10);
  });

  it("extracts room names from LongName", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const reception = floorPlan.rooms.find((r) => r.number === "100");
    expect(reception).toBeDefined();
    expect(reception!.name).toBe("RECEPTION");
  });

  it("extracts room numbers from Name field", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const numbers = floorPlan.rooms.map((r) => r.number).sort();
    expect(numbers).toContain("100");
    expect(numbers).toContain("116");
  });

  it("extracts room areas from IfcElementQuantity", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const reception = floorPlan.rooms.find((r) => r.number === "100");
    expect(reception!.area).toBe(250);
  });

  it("contains OPERATORY 1 for room 102 (seeded mismatch source)", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const room102 = floorPlan.rooms.find((r) => r.number === "102");
    expect(room102).toBeDefined();
    expect(room102!.name).toBe("OPERATORY 1");
  });

  it("has area 180 for STERILIZATION room 106 (seeded mismatch source)", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const room106 = floorPlan.rooms.find((r) => r.number === "106");
    expect(room106).toBeDefined();
    expect(room106!.area).toBe(180);
  });

  it("has IMAGING for room 107 (seeded mismatch source)", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const room107 = floorPlan.rooms.find((r) => r.number === "107");
    expect(room107).toBeDefined();
    expect(room107!.name).toBe("IMAGING");
  });

  it("includes door D-108 (exists in IFC, missing from door schedule)", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const d108 = floorPlan.doors.find((d) => d.number === "D-108");
    expect(d108).toBeDefined();
  });

  it("extracts door properties (fire rating, hardware)", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const d101 = floorPlan.doors.find((d) => d.number === "D-101");
    expect(d101).toBeDefined();
    expect(d101!.fireRating).toBe("20 MIN");
    expect(d101!.hardware).toBe("HS-1");
  });

  it("extracts door room assignments", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "dental-clinic.ifc"));
    const floorPlan = await parseIfc(buffer);

    const d101 = floorPlan.doors.find((d) => d.number === "D-101");
    expect(d101!.roomId).toBe("100");
  });
});
