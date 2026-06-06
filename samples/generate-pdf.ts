import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RoomRow {
  number: string;
  name: string;
  floorFinish: string;
  wallFinish: string;
  ceilingType: string;
  area: number;
}

const rooms: RoomRow[] = [
  { number: "100", name: "RECEPTION", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 250 },
  { number: "101", name: "WAITING", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 320 },
  { number: "102", name: "OP 1", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 120 },
  { number: "103", name: "OPERATORY 2", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 120 },
  { number: "104", name: "OPERATORY 3", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 115 },
  { number: "105", name: "OPERATORY 4", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 115 },
  { number: "106", name: "STERILIZATION", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 165 },
  { number: "107", name: "IMAGING", floorFinish: "VINYL SHEET", wallFinish: "LEAD-LINED GWB", ceilingType: "GWB", area: 140 },
  { number: "108", name: "CONSULTATION", floorFinish: "CARPET TILE", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 160 },
  { number: "109", name: "LAB", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 200 },
  { number: "110", name: "BREAK ROOM", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 150 },
  { number: "111", name: "RESTROOM 1", floorFinish: "PORCELAIN TILE", wallFinish: "PORCELAIN TILE", ceilingType: "GWB", area: 60 },
  { number: "112", name: "RESTROOM 2", floorFinish: "PORCELAIN TILE", wallFinish: "PORCELAIN TILE", ceilingType: "GWB", area: 60 },
  { number: "113", name: "MECHANICAL", floorFinish: "SEALED CONCRETE", wallFinish: "PAINTED CMU", ceilingType: "EXPOSED", area: 100 },
  { number: "114", name: "STORAGE", floorFinish: "VINYL SHEET", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 80 },
  { number: "115", name: "CORRIDOR", floorFinish: "VINYL SHEET", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 400 },
  { number: "116", name: "BUSINESS OFFICE", floorFinish: "CARPET TILE", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 180 },
];

const headers = ["Room Number", "Room Name", "Floor Finish", "Wall Finish", "Ceiling Type", "Area (SF)"];
const colWidths = [70, 100, 85, 90, 75, 55];

function generate(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 40 });
    const outPath = join(__dirname, "room-schedule.pdf");
    const stream = createWriteStream(outPath);

    stream.on("finish", () => {
      console.log("Generated room-schedule.pdf");
      resolve();
    });
    stream.on("error", reject);

    doc.pipe(stream);

    doc.fontSize(14).font("Helvetica-Bold").text("ROOM FINISH SCHEDULE", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text("Dental Clinic — Sheet A602", { align: "center" });
    doc.moveDown(1);

    const startX = 40;
    let y = doc.y;
    const rowHeight = 20;

    // Header row
    doc.font("Helvetica-Bold").fontSize(8);
    const headerLine = headers.join(" | ");
    doc.text(headerLine, startX + 3, y + 5);
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
    y += rowHeight;

    // Data rows
    doc.font("Helvetica").fontSize(8);
    for (const room of rooms) {
      const values = [room.number, room.name, room.floorFinish, room.wallFinish, room.ceilingType, String(room.area)];
      const line = values.join(" | ");
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
      doc.text(line, startX + 3, y + 5);
      y += rowHeight;
    }

    doc.end();
  });
}

generate().catch(console.error);
