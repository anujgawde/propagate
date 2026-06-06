import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let nextId = 1;
function id(): number {
  return nextId++;
}

const lines: string[] = [];
function emit(entityId: number, line: string) {
  lines.push(`#${entityId}=${line};`);
}

interface RoomDef {
  number: string;
  name: string;
  area: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DoorDef {
  number: string;
  roomNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fireRating: string;
  hardware: string;
}

interface WallDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  roomNumbers: string[];
}

const rooms: RoomDef[] = [
  { number: "100", name: "RECEPTION", area: 250, x: 0, y: 0, w: 25, h: 10 },
  { number: "101", name: "WAITING", area: 320, x: 25, y: 0, w: 32, h: 10 },
  { number: "102", name: "OPERATORY 1", area: 120, x: 0, y: 10, w: 12, h: 10 },
  { number: "103", name: "OPERATORY 2", area: 120, x: 12, y: 10, w: 12, h: 10 },
  { number: "104", name: "OPERATORY 3", area: 115, x: 24, y: 10, w: 11.5, h: 10 },
  { number: "105", name: "OPERATORY 4", area: 115, x: 35.5, y: 10, w: 11.5, h: 10 },
  { number: "106", name: "STERILIZATION", area: 180, x: 47, y: 10, w: 18, h: 10 },
  { number: "107", name: "IMAGING", area: 140, x: 0, y: 20, w: 14, h: 10 },
  { number: "108", name: "CONSULTATION", area: 160, x: 14, y: 20, w: 16, h: 10 },
  { number: "109", name: "LAB", area: 200, x: 30, y: 20, w: 20, h: 10 },
  { number: "110", name: "BREAK ROOM", area: 150, x: 50, y: 20, w: 15, h: 10 },
  { number: "111", name: "RESTROOM 1", area: 60, x: 0, y: 30, w: 6, h: 10 },
  { number: "112", name: "RESTROOM 2", area: 60, x: 6, y: 30, w: 6, h: 10 },
  { number: "113", name: "MECHANICAL", area: 100, x: 12, y: 30, w: 10, h: 10 },
  { number: "114", name: "STORAGE", area: 80, x: 22, y: 30, w: 8, h: 10 },
  { number: "115", name: "CORRIDOR", area: 400, x: 30, y: 30, w: 40, h: 10 },
  { number: "116", name: "BUSINESS OFFICE", area: 180, x: 57, y: 0, w: 18, h: 10 },
];

const doorDefs: DoorDef[] = [
  { number: "D-101", roomNumber: "100", x: 12.5, y: 0, width: 3, height: 7, fireRating: "20 MIN", hardware: "HS-1" },
  { number: "D-102", roomNumber: "101", x: 37, y: 0, width: 3, height: 7, fireRating: "20 MIN", hardware: "HS-1" },
  { number: "D-103", roomNumber: "102", x: 6, y: 10, width: 3, height: 7, fireRating: "NONE", hardware: "HS-2" },
  { number: "D-104", roomNumber: "103", x: 18, y: 10, width: 3, height: 7, fireRating: "NONE", hardware: "HS-2" },
  { number: "D-105", roomNumber: "104", x: 29.75, y: 10, width: 3, height: 7, fireRating: "NONE", hardware: "HS-2" },
  { number: "D-106", roomNumber: "105", x: 41.25, y: 10, width: 3, height: 7, fireRating: "NONE", hardware: "HS-2" },
  { number: "D-107", roomNumber: "106", x: 56, y: 10, width: 3, height: 7, fireRating: "20 MIN", hardware: "HS-3" },
  { number: "D-108", roomNumber: "107", x: 7, y: 20, width: 3, height: 7, fireRating: "NONE", hardware: "HS-3" },
  { number: "D-109", roomNumber: "108", x: 22, y: 20, width: 3, height: 7, fireRating: "NONE", hardware: "HS-1" },
  { number: "D-110", roomNumber: "109", x: 40, y: 20, width: 3, height: 7, fireRating: "20 MIN", hardware: "HS-3" },
  { number: "D-111", roomNumber: "110", x: 57.5, y: 20, width: 3, height: 7, fireRating: "NONE", hardware: "HS-1" },
  { number: "D-112", roomNumber: "111", x: 3, y: 30, width: 2.67, height: 7, fireRating: "NONE", hardware: "HS-4" },
  { number: "D-113", roomNumber: "112", x: 9, y: 30, width: 2.67, height: 7, fireRating: "NONE", hardware: "HS-4" },
  { number: "D-114", roomNumber: "113", x: 17, y: 30, width: 3, height: 7, fireRating: "90 MIN", hardware: "HS-5" },
  { number: "D-115", roomNumber: "114", x: 26, y: 30, width: 3, height: 7, fireRating: "NONE", hardware: "HS-1" },
  { number: "D-116", roomNumber: "115", x: 50, y: 30, width: 6, height: 7, fireRating: "20 MIN", hardware: "HS-6" },
  { number: "D-117", roomNumber: "115", x: 60, y: 30, width: 3, height: 7, fireRating: "20 MIN", hardware: "HS-1" },
  { number: "D-118", roomNumber: "116", x: 66, y: 0, width: 3, height: 7, fireRating: "NONE", hardware: "HS-1" },
  { number: "D-119", roomNumber: "107", x: 7, y: 25, width: 3, height: 7, fireRating: "NONE", hardware: "HS-3" },
  { number: "D-120", roomNumber: "100", x: 0, y: 5, width: 6, height: 7, fireRating: "NONE", hardware: "HS-6" },
];

const wallDefs: WallDef[] = [
  { x1: 0, y1: 0, x2: 75, y2: 0, thickness: 0.5, roomNumbers: ["100", "101", "116"] },
  { x1: 0, y1: 10, x2: 65, y2: 10, thickness: 0.5, roomNumbers: ["100", "101", "102", "103", "104", "105", "106"] },
  { x1: 0, y1: 20, x2: 65, y2: 20, thickness: 0.5, roomNumbers: ["102", "103", "104", "105", "106", "107", "108", "109", "110"] },
  { x1: 0, y1: 30, x2: 70, y2: 30, thickness: 0.5, roomNumbers: ["107", "108", "109", "110", "111", "112", "113", "114", "115"] },
  { x1: 0, y1: 40, x2: 70, y2: 40, thickness: 0.5, roomNumbers: ["111", "112", "113", "114", "115"] },
  { x1: 0, y1: 0, x2: 0, y2: 40, thickness: 0.5, roomNumbers: ["100", "102", "107", "111"] },
  { x1: 75, y1: 0, x2: 75, y2: 10, thickness: 0.5, roomNumbers: ["116"] },
  { x1: 25, y1: 0, x2: 25, y2: 10, thickness: 0.5, roomNumbers: ["100", "101"] },
  { x1: 12, y1: 10, x2: 12, y2: 20, thickness: 0.5, roomNumbers: ["102", "103"] },
  { x1: 24, y1: 10, x2: 24, y2: 20, thickness: 0.5, roomNumbers: ["103", "104"] },
];

function ifcStr(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function guid(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  let result = "";
  for (let i = 0; i < 22; i++) {
    result += chars[Math.floor(Math.random() * 64)];
  }
  return result;
}

function generate() {
  // Core geometry references
  const originPt = id();
  emit(originPt, `IFCCARTESIANPOINT((0.,0.,0.))`);

  const dirZ = id();
  emit(dirZ, `IFCDIRECTION((0.,0.,1.))`);

  const dirX = id();
  emit(dirX, `IFCDIRECTION((1.,0.,0.))`);

  const worldPlacement = id();
  emit(worldPlacement, `IFCAXIS2PLACEMENT3D(#${originPt},#${dirZ},#${dirX})`);

  const worldContext = id();
  emit(worldContext, `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.0E-5,#${worldPlacement},$)`);

  const dimExponents = id();
  emit(dimExponents, `IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0)`);

  const siUnit1 = id();
  emit(siUnit1, `IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);

  const siUnit2 = id();
  emit(siUnit2, `IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);

  const siUnit3 = id();
  emit(siUnit3, `IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`);

  const units = id();
  emit(units, `IFCUNITASSIGNMENT((#${siUnit1},#${siUnit2},#${siUnit3}))`);

  // Owner history
  const person = id();
  emit(person, `IFCPERSON($,${ifcStr("Propagate")},${ifcStr("Generator")},$,$,$,$,$)`);

  const org = id();
  emit(org, `IFCORGANIZATION($,${ifcStr("Propagate")},$,$,$)`);

  const personOrg = id();
  emit(personOrg, `IFCPERSONANDORGANIZATION(#${person},#${org},$)`);

  const app = id();
  emit(app, `IFCAPPLICATION(#${org},${ifcStr("1.0")},${ifcStr("Propagate Generator")},${ifcStr("PropGen")})`);

  const ownerHistory = id();
  emit(ownerHistory, `IFCOWNERHISTORY(#${personOrg},#${app},$,.NOCHANGE.,$,$,$,1700000000)`);

  // Spatial hierarchy: Project > Site > Building > Storey
  const project = id();
  emit(project, `IFCPROJECT(${ifcStr(guid())},#${ownerHistory},${ifcStr("Dental Clinic")},$,$,$,$,(#${worldContext}),#${units})`);

  const sitePlacement = id();
  emit(sitePlacement, `IFCLOCALPLACEMENT($,#${worldPlacement})`);

  const site = id();
  emit(site, `IFCSITE(${ifcStr(guid())},#${ownerHistory},${ifcStr("Default Site")},$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)`);

  const buildingPlacement = id();
  emit(buildingPlacement, `IFCLOCALPLACEMENT(#${sitePlacement},#${worldPlacement})`);

  const building = id();
  emit(building, `IFCBUILDING(${ifcStr(guid())},#${ownerHistory},${ifcStr("Dental Clinic Building")},$,$,#${buildingPlacement},$,$,.ELEMENT.,$,$,$)`);

  const storeyPlacement = id();
  emit(storeyPlacement, `IFCLOCALPLACEMENT(#${buildingPlacement},#${worldPlacement})`);

  const storey = id();
  emit(storey, `IFCBUILDINGSTOREY(${ifcStr(guid())},#${ownerHistory},${ifcStr("Level 1")},$,$,#${storeyPlacement},$,$,.ELEMENT.,0.)`);

  // Aggregation: project>site>building>storey
  const relAgg1 = id();
  emit(relAgg1, `IFCRELAGGREGATES(${ifcStr(guid())},#${ownerHistory},$,$,#${project},(#${site}))`);

  const relAgg2 = id();
  emit(relAgg2, `IFCRELAGGREGATES(${ifcStr(guid())},#${ownerHistory},$,$,#${site},(#${building}))`);

  const relAgg3 = id();
  emit(relAgg3, `IFCRELAGGREGATES(${ifcStr(guid())},#${ownerHistory},$,$,#${building},(#${storey}))`);

  const spaceIds: number[] = [];
  const doorIds: number[] = [];
  const wallIds: number[] = [];

  // Rooms (IfcSpace)
  for (const room of rooms) {
    const pt = id();
    emit(pt, `IFCCARTESIANPOINT((${room.x}.,${room.y}.,0.))`);

    const placement = id();
    emit(placement, `IFCAXIS2PLACEMENT3D(#${pt},#${dirZ},#${dirX})`);

    const localPlacement = id();
    emit(localPlacement, `IFCLOCALPLACEMENT(#${storeyPlacement},#${placement})`);

    // Bounding box representation
    const ptMin = id();
    emit(ptMin, `IFCCARTESIANPOINT((0.,0.,0.))`);
    const ptMax = id();
    emit(ptMax, `IFCCARTESIANPOINT((${room.w},${room.h},3.))`);

    const bbox = id();
    emit(bbox, `IFCBOUNDINGBOX(#${ptMin},${room.w},${room.h},3.)`);

    const shapeRep = id();
    emit(shapeRep, `IFCSHAPEREPRESENTATION(#${worldContext},${ifcStr("Box")},${ifcStr("BoundingBox")},(#${bbox}))`);

    const prodShape = id();
    emit(prodShape, `IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const space = id();
    emit(space, `IFCSPACE(${ifcStr(guid())},#${ownerHistory},${ifcStr(room.number)},${ifcStr("Room " + room.number)},$,#${localPlacement},#${prodShape},${ifcStr(room.name)},.ELEMENT.,.INTERNAL.)`);

    spaceIds.push(space);

    // Property set with room number
    const propNumber = id();
    emit(propNumber, `IFCPROPERTYSINGLEVALUE(${ifcStr("Reference")},$,IFCIDENTIFIER(${ifcStr(room.number)}),$)`);

    const propName = id();
    emit(propName, `IFCPROPERTYSINGLEVALUE(${ifcStr("Name")},$,IFCLABEL(${ifcStr(room.name)}),$)`);

    const pset = id();
    emit(pset, `IFCPROPERTYSET(${ifcStr(guid())},#${ownerHistory},${ifcStr("Identity Data")},$,(#${propNumber},#${propName}))`);

    const relPset = id();
    emit(relPset, `IFCRELDEFINESBYPROPERTIES(${ifcStr(guid())},#${ownerHistory},$,$,(#${space}),#${pset})`);

    // Element quantity with area
    const qArea = id();
    emit(qArea, `IFCQUANTITYAREA(${ifcStr("NetFloorArea")},$,$,${room.area},$)`);

    const eqty = id();
    emit(eqty, `IFCELEMENTQUANTITY(${ifcStr(guid())},#${ownerHistory},${ifcStr("BaseQuantities")},$,$,(#${qArea}))`);

    const relQty = id();
    emit(relQty, `IFCRELDEFINESBYPROPERTIES(${ifcStr(guid())},#${ownerHistory},$,$,(#${space}),#${eqty})`);
  }

  // Doors (IfcDoor)
  for (const door of doorDefs) {
    const pt = id();
    emit(pt, `IFCCARTESIANPOINT((${door.x},${door.y},0.))`);

    const placement = id();
    emit(placement, `IFCAXIS2PLACEMENT3D(#${pt},#${dirZ},#${dirX})`);

    const localPlacement = id();
    emit(localPlacement, `IFCLOCALPLACEMENT(#${storeyPlacement},#${placement})`);

    const ptBbox = id();
    emit(ptBbox, `IFCCARTESIANPOINT((0.,0.,0.))`);

    const bbox = id();
    emit(bbox, `IFCBOUNDINGBOX(#${ptBbox},${door.width},0.2,${door.height})`);

    const shapeRep = id();
    emit(shapeRep, `IFCSHAPEREPRESENTATION(#${worldContext},${ifcStr("Box")},${ifcStr("BoundingBox")},(#${bbox}))`);

    const prodShape = id();
    emit(prodShape, `IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const doorEntity = id();
    emit(doorEntity, `IFCDOOR(${ifcStr(guid())},#${ownerHistory},${ifcStr(door.number)},$,$,#${localPlacement},#${prodShape},${ifcStr(door.number)},${door.height},${door.width})`);

    doorIds.push(doorEntity);

    // Property set for door
    const propFire = id();
    emit(propFire, `IFCPROPERTYSINGLEVALUE(${ifcStr("FireRating")},$,IFCLABEL(${ifcStr(door.fireRating)}),$)`);

    const propHw = id();
    emit(propHw, `IFCPROPERTYSINGLEVALUE(${ifcStr("HardwareSet")},$,IFCLABEL(${ifcStr(door.hardware)}),$)`);

    const propRoom = id();
    emit(propRoom, `IFCPROPERTYSINGLEVALUE(${ifcStr("RoomNumber")},$,IFCLABEL(${ifcStr(door.roomNumber)}),$)`);

    const pset = id();
    emit(pset, `IFCPROPERTYSET(${ifcStr(guid())},#${ownerHistory},${ifcStr("Pset_DoorCommon")},$,(#${propFire},#${propHw},#${propRoom}))`);

    const relPset = id();
    emit(relPset, `IFCRELDEFINESBYPROPERTIES(${ifcStr(guid())},#${ownerHistory},$,$,(#${doorEntity}),#${pset})`);
  }

  // Walls (IfcWallStandardCase)
  for (const wall of wallDefs) {
    const pt = id();
    emit(pt, `IFCCARTESIANPOINT((${wall.x1},${wall.y1},0.))`);

    const placement = id();
    emit(placement, `IFCAXIS2PLACEMENT3D(#${pt},#${dirZ},#${dirX})`);

    const localPlacement = id();
    emit(localPlacement, `IFCLOCALPLACEMENT(#${storeyPlacement},#${placement})`);

    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    const pt1 = id();
    emit(pt1, `IFCCARTESIANPOINT((0.,0.))`);
    const pt2 = id();
    emit(pt2, `IFCCARTESIANPOINT((${length},0.))`);

    const polyline = id();
    emit(polyline, `IFCPOLYLINE((#${pt1},#${pt2}))`);

    const shapeRep = id();
    emit(shapeRep, `IFCSHAPEREPRESENTATION(#${worldContext},${ifcStr("Axis")},${ifcStr("Curve2D")},(#${polyline}))`);

    const prodShape = id();
    emit(prodShape, `IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const wallEntity = id();
    emit(wallEntity, `IFCWALLSTANDARDCASE(${ifcStr(guid())},#${ownerHistory},$,$,$,#${localPlacement},#${prodShape},$)`);

    wallIds.push(wallEntity);

    // Material layer with thickness
    const propThickness = id();
    emit(propThickness, `IFCPROPERTYSINGLEVALUE(${ifcStr("Width")},$,IFCLENGTHMEASURE(${wall.thickness}),$)`);

    const pset = id();
    emit(pset, `IFCPROPERTYSET(${ifcStr(guid())},#${ownerHistory},${ifcStr("Pset_WallCommon")},$,(#${propThickness}))`);

    const relPset = id();
    emit(relPset, `IFCRELDEFINESBYPROPERTIES(${ifcStr(guid())},#${ownerHistory},$,$,(#${wallEntity}),#${pset})`);
  }

  // Containment: all elements in the storey
  const allElements = [...spaceIds, ...doorIds, ...wallIds];
  const containedRefs = allElements.map((eid) => `#${eid}`).join(",");
  const relContained = id();
  emit(relContained, `IFCRELCONTAINEDINSPATIALSTRUCTURE(${ifcStr(guid())},#${ownerHistory},$,$,(${containedRefs}),#${storey})`);

  // Write the file
  const timestamp = "2024-01-01T00:00:00";
  const header = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('dental-clinic.ifc','${timestamp}',('Propagate Generator'),('Propagate'),'','Propagate Generator','');
FILE_SCHEMA(('IFC2X3'));
END-HEADER;
DATA;`;

  const footer = `END-SECTION;
END-ISO-10303-21;`;

  const content = [header, ...lines, footer].join("\n");
  const outPath = join(__dirname, "dental-clinic.ifc");
  writeFileSync(outPath, content);
  console.log(`Generated dental-clinic.ifc (${rooms.length} rooms, ${doorDefs.length} doors, ${wallDefs.length} walls)`);
  console.log(`Total IFC entities: ${nextId - 1}`);
}

generate();
