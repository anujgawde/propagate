import ExcelJS from "exceljs";
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
  notes: string;
}

interface DoorRow {
  number: string;
  roomNumber: string;
  roomName: string;
  width: number;
  height: number;
  fireRating: string;
  hardwareSet: string;
  notes: string;
}

interface SheetRow {
  sheetNumber: string;
  sheetName: string;
  discipline: string;
  elements: string;
}

const rooms: RoomRow[] = [
  { number: "100", name: "RECEPTION", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 250, notes: "" },
  { number: "101", name: "WAITING", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 320, notes: "" },
  { number: "102", name: "OP 1", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 120, notes: "Seeded: IFC says OPERATORY 1" },
  { number: "103", name: "OPERATORY 2", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 120, notes: "" },
  { number: "104", name: "OPERATORY 3", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 115, notes: "" },
  { number: "105", name: "OPERATORY 4", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 115, notes: "" },
  { number: "106", name: "STERILIZATION", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 165, notes: "Seeded: IFC says 180 SF" },
  { number: "107", name: "IMAGING", floorFinish: "VINYL SHEET", wallFinish: "LEAD-LINED GWB", ceilingType: "GWB", area: 140, notes: "" },
  { number: "108", name: "CONSULTATION", floorFinish: "CARPET TILE", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 160, notes: "" },
  { number: "109", name: "LAB", floorFinish: "EPOXY", wallFinish: "FRP PANEL", ceilingType: "GWB", area: 200, notes: "" },
  { number: "110", name: "BREAK ROOM", floorFinish: "VINYL PLANK", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 150, notes: "" },
  { number: "111", name: "RESTROOM 1", floorFinish: "PORCELAIN TILE", wallFinish: "PORCELAIN TILE", ceilingType: "GWB", area: 60, notes: "" },
  { number: "112", name: "RESTROOM 2", floorFinish: "PORCELAIN TILE", wallFinish: "PORCELAIN TILE", ceilingType: "GWB", area: 60, notes: "" },
  { number: "113", name: "MECHANICAL", floorFinish: "SEALED CONCRETE", wallFinish: "PAINTED CMU", ceilingType: "EXPOSED", area: 100, notes: "" },
  { number: "114", name: "STORAGE", floorFinish: "VINYL SHEET", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 80, notes: "" },
  { number: "115", name: "CORRIDOR", floorFinish: "VINYL SHEET", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 400, notes: "" },
  { number: "116", name: "BUSINESS OFFICE", floorFinish: "CARPET TILE", wallFinish: "PAINTED GWB", ceilingType: "ACT 2x4", area: 180, notes: "" },
];

const doors: DoorRow[] = [
  { number: "D-101", roomNumber: "100", roomName: "RECEPTION", width: 36, height: 84, fireRating: "20 MIN", hardwareSet: "HS-1", notes: "" },
  { number: "D-102", roomNumber: "101", roomName: "WAITING", width: 36, height: 84, fireRating: "20 MIN", hardwareSet: "HS-1", notes: "" },
  { number: "D-103", roomNumber: "102", roomName: "OPERATORY 1", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-2", notes: "" },
  { number: "D-104", roomNumber: "103", roomName: "OPERATORY 2", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-2", notes: "" },
  { number: "D-105", roomNumber: "104", roomName: "OPERATORY 3", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-2", notes: "" },
  { number: "D-106", roomNumber: "105", roomName: "OPERATORY 4", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-2", notes: "" },
  { number: "D-107", roomNumber: "106", roomName: "STERILIZATION", width: 36, height: 84, fireRating: "20 MIN", hardwareSet: "HS-3", notes: "" },
  // D-108 intentionally skipped — seeded mismatch: exists in IFC but not here
  { number: "D-109", roomNumber: "108", roomName: "CONSULTATION", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-1", notes: "" },
  { number: "D-110", roomNumber: "109", roomName: "LAB", width: 36, height: 84, fireRating: "20 MIN", hardwareSet: "HS-3", notes: "" },
  { number: "D-111", roomNumber: "110", roomName: "BREAK ROOM", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-1", notes: "" },
  { number: "D-112", roomNumber: "111", roomName: "RESTROOM 1", width: 32, height: 84, fireRating: "NONE", hardwareSet: "HS-4", notes: "" },
  { number: "D-113", roomNumber: "112", roomName: "RESTROOM 2", width: 32, height: 84, fireRating: "NONE", hardwareSet: "HS-4", notes: "" },
  { number: "D-114", roomNumber: "113", roomName: "MECHANICAL", width: 36, height: 84, fireRating: "90 MIN", hardwareSet: "HS-5", notes: "" },
  { number: "D-115", roomNumber: "114", roomName: "STORAGE", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-1", notes: "" },
  { number: "D-116", roomNumber: "115", roomName: "CORRIDOR", width: 72, height: 84, fireRating: "20 MIN", hardwareSet: "HS-6", notes: "PAIR" },
  { number: "D-117", roomNumber: "115", roomName: "CORRIDOR", width: 36, height: 84, fireRating: "20 MIN", hardwareSet: "HS-1", notes: "" },
  { number: "D-118", roomNumber: "116", roomName: "BUSINESS OFFICE", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-1", notes: "" },
  { number: "D-119", roomNumber: "107", roomName: "IMAGING", width: 36, height: 84, fireRating: "NONE", hardwareSet: "HS-3", notes: "LEAD-LINED" },
  { number: "D-120", roomNumber: "100", roomName: "RECEPTION", width: 72, height: 84, fireRating: "NONE", hardwareSet: "HS-6", notes: "MAIN ENTRY, PAIR" },
];

const sheets: SheetRow[] = [
  { sheetNumber: "A101", sheetName: "FLOOR PLAN", discipline: "Architectural", elements: "All rooms, doors, walls" },
  { sheetNumber: "A102", sheetName: "ENLARGED PLAN - CLINICAL", discipline: "Architectural", elements: "X-RAY, OPERATORY 1-4, STERILIZATION" },
  { sheetNumber: "A601", sheetName: "DOOR SCHEDULE", discipline: "Architectural", elements: "All doors" },
  { sheetNumber: "A602", sheetName: "ROOM FINISH SCHEDULE", discipline: "Architectural", elements: "All rooms" },
];

function styleHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };
    cell.border = {
      bottom: { style: "thin" },
    };
  });
}

async function generateRoomSchedule() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Room Finish Schedule");

  ws.columns = [
    { header: "Room Number", key: "number", width: 14 },
    { header: "Room Name", key: "name", width: 22 },
    { header: "Floor Finish", key: "floorFinish", width: 18 },
    { header: "Wall Finish", key: "wallFinish", width: 18 },
    { header: "Ceiling Type", key: "ceilingType", width: 14 },
    { header: "Area (SF)", key: "area", width: 12 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  for (const room of rooms) {
    ws.addRow(room);
  }

  styleHeader(ws);
  await wb.xlsx.writeFile(join(__dirname, "room-schedule.xlsx"));
  console.log("Generated room-schedule.xlsx");
}

async function generateDoorSchedule() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Door Schedule");

  ws.columns = [
    { header: "Door Number", key: "number", width: 14 },
    { header: "Room Number", key: "roomNumber", width: 14 },
    { header: "Room Name", key: "roomName", width: 22 },
    { header: "Width", key: "width", width: 10 },
    { header: "Height", key: "height", width: 10 },
    { header: "Fire Rating", key: "fireRating", width: 14 },
    { header: "Hardware Set", key: "hardwareSet", width: 14 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  for (const door of doors) {
    ws.addRow(door);
  }

  styleHeader(ws);
  await wb.xlsx.writeFile(join(__dirname, "door-schedule.xlsx"));
  console.log("Generated door-schedule.xlsx (19 rows, D-108 missing)");
}

async function generateSheetIndex() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet Index");

  ws.columns = [
    { header: "Sheet Number", key: "sheetNumber", width: 14 },
    { header: "Sheet Name", key: "sheetName", width: 30 },
    { header: "Discipline", key: "discipline", width: 16 },
    { header: "Elements", key: "elements", width: 44 },
  ];

  for (const sheet of sheets) {
    ws.addRow(sheet);
  }

  styleHeader(ws);
  await wb.xlsx.writeFile(join(__dirname, "sheet-index.xlsx"));
  console.log("Generated sheet-index.xlsx (A102 references X-RAY = seeded mismatch)");
}

async function main() {
  await generateRoomSchedule();
  await generateDoorSchedule();
  await generateSheetIndex();
  console.log("\nAll sample schedules generated.");
}

main().catch(console.error);
