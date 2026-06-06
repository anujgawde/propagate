import { Injectable } from "@nestjs/common";
import type { DocumentEnvelope, DocumentType } from "@propagate/contracts";
import { randomUUID } from "crypto";
import { parseIfc } from "./ifc-parser";
import { parseExcel } from "./excel-parser";
import { parsePdf } from "./pdf-parser";

@Injectable()
export class IngestionService {
  async ingest(
    fileBuffer: Buffer,
    fileName: string,
    scheduleType?: "door" | "room" | "sheet-index",
  ): Promise<DocumentEnvelope> {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const docId = randomUUID();

    switch (ext) {
      case "ifc": {
        const floorPlan = await parseIfc(fileBuffer);
        floorPlan.id = docId;
        floorPlan.name = fileName;
        floorPlan.sourceFile = fileName;
        return {
          id: docId,
          type: "floor-plan",
          document: floorPlan,
          uploadedAt: new Date().toISOString(),
        };
      }

      case "xlsx":
      case "xls": {
        const type = scheduleType ?? inferScheduleType(fileName);
        const schedule = await parseExcel(fileBuffer, type);
        schedule.id = docId;
        schedule.name = fileName;
        schedule.sourceFile = fileName;
        return {
          id: docId,
          type: toDocumentType(type),
          document: schedule,
          uploadedAt: new Date().toISOString(),
        };
      }

      case "pdf": {
        const type = scheduleType ?? inferScheduleType(fileName);
        const schedule = await parsePdf(fileBuffer, type);
        schedule.id = docId;
        schedule.name = fileName;
        schedule.sourceFile = fileName;
        return {
          id: docId,
          type: toDocumentType(type),
          document: schedule,
          uploadedAt: new Date().toISOString(),
        };
      }

      default:
        throw new Error(`Unsupported file format: .${ext}`);
    }
  }
}

function inferScheduleType(
  fileName: string,
): "door" | "room" | "sheet-index" {
  const lower = fileName.toLowerCase();
  if (lower.includes("door")) return "door";
  if (lower.includes("sheet-index") || lower.includes("sheet_index"))
    return "sheet-index";
  return "room";
}

function toDocumentType(
  scheduleType: "door" | "room" | "sheet-index",
): DocumentType {
  switch (scheduleType) {
    case "door":
      return "door-schedule";
    case "room":
      return "room-schedule";
    case "sheet-index":
      return "sheet-index";
  }
}
