import { PDFParse } from "pdf-parse";
import type { Schedule, ScheduleColumn, ScheduleRow } from "@propagate/contracts";

const BASE_KEY_MAP: Record<string, string> = {
  "room name": "name",
  "sheet name": "name",
  "room": "name",
  "area": "area",
  "area (sf)": "area",
  "area (sq ft)": "area",
};

const KEY_MAP_BY_TYPE: Record<string, Record<string, string>> = {
  door: {
    "door number": "number",
    "door no": "number",
    "door #": "number",
    "room number": "room-number",
    "room no": "room-number",
    "room #": "room-number",
  },
  room: {
    "room number": "number",
    "room no": "number",
    "room #": "number",
  },
  "sheet-index": {
    "sheet number": "number",
    "sheet no": "number",
    "sheet #": "number",
  },
};

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-");
}

function normalizeColumnKey(
  header: string,
  scheduleType: string,
): string {
  const lower = header.toLowerCase().trim();
  const typeMap = KEY_MAP_BY_TYPE[scheduleType] ?? {};
  return typeMap[lower] ?? BASE_KEY_MAP[lower] ?? slugify(header);
}

export async function parsePdf(
  buffer: Buffer,
  scheduleType: "door" | "room" | "sheet-index",
): Promise<Schedule> {
  const data = new Uint8Array(buffer);
  // pdf-parse v2 types mark load/getText as private, but they're part of the public API
  const parser: any = new PDFParse(data);
  await parser.load();

  const result = await parser.getText();
  const text = result.pages
    .map((p: { text: string }) => p.text)
    .join("\n");
  parser.destroy();

  const allLines = text
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  const headerIdx = findHeaderLine(allLines);
  if (headerIdx < 0) {
    throw new Error("Could not find a header row in the PDF");
  }

  const headerParts = allLines[headerIdx].split("|").map((s: string) => s.trim());
  const columns: ScheduleColumn[] = headerParts
    .filter((h: string) => h.length > 0)
    .map((h: string) => ({
      key: normalizeColumnKey(h, scheduleType),
      label: h,
    }));

  const rows: ScheduleRow[] = [];
  let rowIdx = 0;

  for (let i = headerIdx + 1; i < allLines.length; i++) {
    const line = allLines[i];
    if (!line.includes("|")) continue;

    const parts = line.split("|").map((s: string) => s.trim());
    if (parts.length < columns.length) continue;

    const values: Record<string, string | number> = {};
    let hasValues = false;

    for (let c = 0; c < columns.length; c++) {
      const raw = parts[c];
      if (!raw) continue;
      hasValues = true;
      const num = Number(raw);
      values[columns[c].key] = !isNaN(num) && raw.length > 0 ? num : raw;
    }

    if (!hasValues) continue;

    rowIdx++;
    rows.push({ id: `row-${rowIdx}`, values });
  }

  return {
    id: "",
    name: "",
    sourceFile: "",
    type: scheduleType,
    columns,
    rows,
  };
}

function findHeaderLine(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes("|") && /number|name|sheet/i.test(lines[i])) {
      return i;
    }
  }
  return -1;
}
