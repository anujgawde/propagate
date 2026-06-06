import ExcelJS from "exceljs";
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

export async function parseExcel(
  buffer: Buffer,
  scheduleType: "door" | "room" | "sheet-index",
): Promise<Schedule> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Workbook contains no worksheets");
  }

  const headerRow = worksheet.getRow(1);
  const columns: ScheduleColumn[] = [];
  const columnIndices: Map<number, string> = new Map();

  headerRow.eachCell((cell, colNumber) => {
    const label = String(cell.value ?? "").trim();
    if (!label) return;
    const key = normalizeColumnKey(label, scheduleType);
    columns.push({ key, label });
    columnIndices.set(colNumber, key);
  });

  const rows: ScheduleRow[] = [];
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const values: Record<string, string | number> = {};
    let hasValues = false;

    columnIndices.forEach((key, colNumber) => {
      const cell = row.getCell(colNumber);
      const raw = cell.value;
      if (raw === null || raw === undefined) return;
      hasValues = true;
      values[key] = typeof raw === "number" ? raw : String(raw);
    });

    if (!hasValues) continue;

    rows.push({
      id: `row-${rowNum - 1}`,
      values,
    });
  }

  return {
    id: "",
    name: worksheet.name,
    sourceFile: "",
    type: scheduleType,
    columns,
    rows,
  };
}
