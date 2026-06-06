import * as WebIFC from "web-ifc";
import type {
  FloorPlan,
  Room,
  Door,
  Wall,
  BoundingBox,
  Coordinate,
} from "@propagate/contracts";

export async function parseIfc(buffer: Buffer): Promise<FloorPlan> {
  const api = new WebIFC.IfcAPI();
  await api.Init();

  const data = new Uint8Array(buffer);
  const modelId = api.OpenModel(data);

  const rooms = extractRooms(api, modelId);
  const doors = extractDoors(api, modelId);
  const walls = extractWalls(api, modelId);

  api.CloseModel(modelId);

  return {
    id: "",
    name: "",
    sourceFile: "",
    rooms,
    doors,
    walls,
  };
}

function extractRooms(api: WebIFC.IfcAPI, modelId: number): Room[] {
  const rooms: Room[] = [];
  const spaceIds = api.GetLineIDsWithType(modelId, WebIFC.IFCSPACE);

  for (let i = 0; i < spaceIds.size(); i++) {
    const expressId = spaceIds.get(i);
    const space = api.GetLine(modelId, expressId);

    const name = resolveRoomName(space);
    const number = resolveRoomNumber(space, api, modelId, expressId);
    const area = resolveArea(api, modelId, expressId);
    const bounds = resolveBounds(space, api, modelId);

    rooms.push({
      id: `space-${expressId}`,
      name,
      number,
      area,
      bounds,
      properties: extractAllProperties(api, modelId, expressId),
    });
  }

  return rooms;
}

function resolveRoomName(space: any): string {
  if (space.LongName?.value) return String(space.LongName.value);
  if (space.Name?.value) {
    const name = String(space.Name.value);
    if (!/^\d+$/.test(name)) return name;
  }
  return "";
}

function resolveRoomNumber(
  space: any,
  api: WebIFC.IfcAPI,
  modelId: number,
  expressId: number,
): string {
  // Check Name field first (often the room number)
  if (space.Name?.value) {
    const name = String(space.Name.value);
    if (/^\d+$/.test(name)) return name;
  }

  // Check property sets for Reference or room number
  const props = extractAllProperties(api, modelId, expressId);
  if (props["Reference"]) return String(props["Reference"]);

  // Fall back to Description
  if (space.Description?.value) return String(space.Description.value);

  return "";
}

function resolveArea(
  api: WebIFC.IfcAPI,
  modelId: number,
  expressId: number,
): number {
  // Check IfcElementQuantity for NetFloorArea or GrossFloorArea
  const relIds = api.GetLineIDsWithType(modelId, WebIFC.IFCRELDEFINESBYPROPERTIES);
  for (let i = 0; i < relIds.size(); i++) {
    const rel = api.GetLine(modelId, relIds.get(i));
    const relatedObjects = rel.RelatedObjects;
    if (!relatedObjects) continue;

    const related = Array.isArray(relatedObjects)
      ? relatedObjects
      : [relatedObjects];
    const matchesElement = related.some(
      (obj: any) => obj?.value === expressId,
    );
    if (!matchesElement) continue;

    const defId = rel.RelatingPropertyDefinition?.value;
    if (!defId) continue;

    const def = api.GetLine(modelId, defId);
    if (def.constructor?.name === "IfcElementQuantity" || def.Quantities) {
      const quantities = def.Quantities;
      if (!quantities) continue;

      for (const q of quantities) {
        const qty = api.GetLine(modelId, q.value);
        const qName = qty.Name?.value;
        if (
          qName === "NetFloorArea" ||
          qName === "GrossFloorArea" ||
          qName === "Area"
        ) {
          return Number(qty.AreaValue?.value ?? qty.NominalValue?.value ?? 0);
        }
      }
    }
  }

  // Fallback: check property sets for area
  const props = extractAllProperties(api, modelId, expressId);
  if (props["Area"]) return Number(props["Area"]);
  if (props["NetFloorArea"]) return Number(props["NetFloorArea"]);

  return 0;
}

function resolveBounds(
  space: any,
  _api: WebIFC.IfcAPI,
  _modelId: number,
): BoundingBox {
  const placement = space.ObjectPlacement;
  let x = 0;
  let y = 0;

  if (placement) {
    try {
      const relPlacement = placement.RelativePlacement;
      if (relPlacement?.Location?.Coordinates) {
        const coords = relPlacement.Location.Coordinates;
        x = Number(coords[0]?.value ?? 0);
        y = Number(coords[1]?.value ?? 0);
      }
    } catch {
      // Placement hierarchy too deep to resolve inline
    }
  }

  const defaultSize = 10;
  return {
    min: { x, y },
    max: { x: x + defaultSize, y: y + defaultSize },
  };
}

function extractDoors(api: WebIFC.IfcAPI, modelId: number): Door[] {
  const doors: Door[] = [];
  const doorIds = api.GetLineIDsWithType(modelId, WebIFC.IFCDOOR);

  for (let i = 0; i < doorIds.size(); i++) {
    const expressId = doorIds.get(i);
    const door = api.GetLine(modelId, expressId);

    const number = door.Tag?.value ?? door.Name?.value ?? `door-${expressId}`;
    const width = Number(door.OverallWidth?.value ?? 0);
    const height = Number(door.OverallHeight?.value ?? 0);
    const position = resolveDoorPosition(door);
    const props = extractAllProperties(api, modelId, expressId);

    doors.push({
      id: `door-${expressId}`,
      number: String(number),
      roomId: String(props["RoomNumber"] ?? ""),
      position,
      width,
      height,
      fireRating: String(props["FireRating"] ?? ""),
      hardware: String(props["HardwareSet"] ?? ""),
      properties: props,
    });
  }

  return doors;
}

function resolveDoorPosition(door: any): Coordinate {
  try {
    const placement = door.ObjectPlacement;
    if (placement?.RelativePlacement?.Location?.Coordinates) {
      const coords = placement.RelativePlacement.Location.Coordinates;
      return {
        x: Number(coords[0]?.value ?? 0),
        y: Number(coords[1]?.value ?? 0),
      };
    }
  } catch {
    // Fall through
  }
  return { x: 0, y: 0 };
}

function extractWalls(api: WebIFC.IfcAPI, modelId: number): Wall[] {
  const walls: Wall[] = [];

  let wallLineIds = api.GetLineIDsWithType(modelId, WebIFC.IFCWALLSTANDARDCASE);
  if (wallLineIds.size() === 0) {
    wallLineIds = api.GetLineIDsWithType(modelId, WebIFC.IFCWALL);
  }

  for (let i = 0; i < wallLineIds.size(); i++) {
    const expressId = wallLineIds.get(i);
    const wall = api.GetLine(modelId, expressId);

    const position = resolveWallPosition(wall);
    const props = extractAllProperties(api, modelId, expressId);
    const thickness = Number(props["Width"] ?? 0.2);

    walls.push({
      id: `wall-${expressId}`,
      startPoint: position.start,
      endPoint: position.end,
      thickness,
      roomIds: [],
    });
  }

  return walls;
}

function resolveWallPosition(wall: any): {
  start: Coordinate;
  end: Coordinate;
} {
  let ox = 0;
  let oy = 0;
  try {
    const placement = wall.ObjectPlacement;
    if (placement?.RelativePlacement?.Location?.Coordinates) {
      const coords = placement.RelativePlacement.Location.Coordinates;
      ox = Number(coords[0]?.value ?? 0);
      oy = Number(coords[1]?.value ?? 0);
    }
  } catch {
    // Fall through
  }

  return {
    start: { x: ox, y: oy },
    end: { x: ox, y: oy },
  };
}

function extractAllProperties(
  api: WebIFC.IfcAPI,
  modelId: number,
  expressId: number,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  const relIds = api.GetLineIDsWithType(
    modelId,
    WebIFC.IFCRELDEFINESBYPROPERTIES,
  );

  for (let i = 0; i < relIds.size(); i++) {
    const rel = api.GetLine(modelId, relIds.get(i));
    const relatedObjects = rel.RelatedObjects;
    if (!relatedObjects) continue;

    const related = Array.isArray(relatedObjects)
      ? relatedObjects
      : [relatedObjects];
    const matchesElement = related.some(
      (obj: any) => obj?.value === expressId,
    );
    if (!matchesElement) continue;

    const defId = rel.RelatingPropertyDefinition?.value;
    if (!defId) continue;

    const def = api.GetLine(modelId, defId);

    // IfcPropertySet
    if (def.HasProperties) {
      for (const propRef of def.HasProperties) {
        try {
          const prop = api.GetLine(modelId, propRef.value);
          const name = prop.Name?.value;
          const val = prop.NominalValue?.value;
          if (name && val !== undefined && val !== null) {
            result[String(name)] = typeof val === "number" ? val : String(val);
          }
        } catch {
          // Skip unresolvable properties
        }
      }
    }

    // IfcElementQuantity
    if (def.Quantities) {
      for (const qRef of def.Quantities) {
        try {
          const qty = api.GetLine(modelId, qRef.value);
          const name = qty.Name?.value;
          const val =
            qty.AreaValue?.value ??
            qty.LengthValue?.value ??
            qty.VolumeValue?.value ??
            qty.NominalValue?.value;
          if (name && val !== undefined) {
            result[String(name)] = typeof val === "number" ? val : String(val);
          }
        } catch {
          // Skip
        }
      }
    }
  }

  return result;
}
