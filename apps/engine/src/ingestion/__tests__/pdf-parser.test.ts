import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parsePdf } from "../pdf-parser";

const SAMPLES_DIR = join(__dirname, "../../../../..", "samples");

describe("parsePdf", () => {
  it("parses all 17 rooms from room-schedule.pdf", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.pdf"));
    const schedule = await parsePdf(buffer, "room");

    expect(schedule.type).toBe("room");
    expect(schedule.rows).toHaveLength(17);
  });

  it("normalizes column headers to standard keys", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.pdf"));
    const schedule = await parsePdf(buffer, "room");

    const keys = schedule.columns.map((c) => c.key);
    expect(keys).toContain("number");
    expect(keys).toContain("name");
    expect(keys).toContain("area");
  });

  it("contains seeded mismatch: OP 1 for room 102", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.pdf"));
    const schedule = await parsePdf(buffer, "room");

    const room102 = schedule.rows.find((r) => r.values["number"] === 102);
    expect(room102).toBeDefined();
    expect(room102!.values["name"]).toBe("OP 1");
  });

  it("contains seeded mismatch: area 165 for room 106", async () => {
    const buffer = readFileSync(join(SAMPLES_DIR, "room-schedule.pdf"));
    const schedule = await parsePdf(buffer, "room");

    const room106 = schedule.rows.find((r) => r.values["number"] === 106);
    expect(room106).toBeDefined();
    expect(room106!.values["area"]).toBe(165);
  });
});
