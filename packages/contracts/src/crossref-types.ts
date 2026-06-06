export type CrossRefType =
  | "room-name"
  | "room-number"
  | "room-area"
  | "door-number"
  | "door-room"
  | "door-property"
  | "element-sheet";

export type MatchMethod = "exact" | "fuzzy";

export interface ElementRef {
  docId: string;
  elementPath: string;
  value: string | number;
}

export interface CrossRef {
  id: string;
  type: CrossRefType;
  matchMethod: MatchMethod;
  confidence: number;
  source: ElementRef;
  target: ElementRef;
}

export type MismatchSeverity = "error" | "warning" | "info";

export interface Mismatch {
  id: string;
  crossRefId: string;
  type: CrossRefType;
  severity: MismatchSeverity;
  source: ElementRef;
  target: ElementRef;
  message: string;
}

export interface Change {
  docId: string;
  elementPath: string;
  oldValue: string | number;
  newValue: string | number;
}

export interface Impact {
  crossRefId: string;
  affectedDoc: string;
  affectedElement: string;
  currentValue: string | number;
  expectedValue: string | number;
}

export interface GraphState {
  crossRefs: CrossRef[];
  mismatches: Mismatch[];
}
