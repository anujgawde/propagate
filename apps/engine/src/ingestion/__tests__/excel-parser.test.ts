import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseExcel } from "../excel-parser.js";

const SAMPLES_DIR = join(__dirname, "../../../../..", "samples");

describe("parseExcel", () => {
  describe("room schedule", () => {
    it("parses all 17 rooms", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "room");

      expect(schedule.type).toBe("room");
      expect(schedule.rows).toHaveLength(17);
    });

    it("normalizes column headers to standard keys", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "room");

      const keys = schedule.columns.map((c) => c.key);
      expect(keys).toContain("number");
      expect(keys).toContain("name");
      expect(keys).toContain("area");
    });

    it("contains seeded mismatch: OP 1 for room 102", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "room");

      const room102 = schedule.rows.find((r) => r.values["number"] === "102");
      expect(room102).toBeDefined();
      expect(room102!.values["name"]).toBe("OP 1");
    });

    it("contains seeded mismatch: area 165 for room 106", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "room");

      const room106 = schedule.rows.find((r) => r.values["number"] === "106");
      expect(room106).toBeDefined();
      expect(room106!.values["area"]).toBe(165);
    });
  });

  describe("door schedule", () => {
    it("parses 19 doors (D-108 missing)", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "door-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "door");

      expect(schedule.type).toBe("door");
      expect(schedule.rows).toHaveLength(19);
    });

    it("does not contain D-108", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "door-schedule.xlsx"));
      const schedule = await parseExcel(buffer, "door");

      const d108 = schedule.rows.find((r) => r.values["number"] === "D-108");
      expect(d108).toBeUndefined();
    });
  });

  describe("sheet index", () => {
    it("parses 4 sheet entries", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "sheet-index.xlsx"));
      const schedule = await parseExcel(buffer, "sheet-index");

      expect(schedule.type).toBe("sheet-index");
      expect(schedule.rows).toHaveLength(4);
    });

    it("contains seeded mismatch: A102 references X-RAY", async () => {
      const buffer = readFileSync(join(SAMPLES_DIR, "sheet-index.xlsx"));
      const schedule = await parseExcel(buffer, "sheet-index");

      const a102 = schedule.rows.find(
        (r) => r.values["number"] === "A102",
      );
      expect(a102).toBeDefined();
      expect(String(a102!.values["elements"])).toContain("X-RAY");
    });
  });
});
