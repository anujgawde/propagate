export interface Coordinate {
  x: number;
  y: number;
}

export interface BoundingBox {
  min: Coordinate;
  max: Coordinate;
}

export interface Room {
  id: string;
  name: string;
  number: string;
  area: number;
  bounds: BoundingBox;
  properties: Record<string, string | number>;
}

export interface Door {
  id: string;
  number: string;
  roomId: string;
  position: Coordinate;
  width: number;
  height: number;
  fireRating: string;
  hardware: string;
  properties: Record<string, string | number>;
}

export interface Wall {
  id: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  thickness: number;
  roomIds: string[];
}

export interface FloorPlan {
  id: string;
  name: string;
  sourceFile: string;
  rooms: Room[];
  doors: Door[];
  walls: Wall[];
}

export interface ScheduleColumn {
  key: string;
  label: string;
}

export interface ScheduleRow {
  id: string;
  values: Record<string, string | number>;
}

export interface Schedule {
  id: string;
  name: string;
  sourceFile: string;
  type: "door" | "room" | "sheet-index";
  columns: ScheduleColumn[];
  rows: ScheduleRow[];
}

export type Document = FloorPlan | Schedule;

export type DocumentType = "floor-plan" | "door-schedule" | "room-schedule" | "sheet-index";

export interface DocumentEnvelope {
  id: string;
  type: DocumentType;
  document: Document;
  uploadedAt: string;
  sourceUrl?: string;
}
