import type {
  CrossRef,
  DocumentEnvelope,
  FloorPlan,
  Schedule,
} from "@propagate/contracts";

export function buildGraph(documents: DocumentEnvelope[]): CrossRef[] {
  const crossRefs: CrossRef[] = [];

  const floorPlans = documents.filter(
    (d) => d.type === "floor-plan",
  ) as (DocumentEnvelope & { document: FloorPlan })[];

  const schedules = documents.filter((d) =>
    ["door-schedule", "room-schedule", "sheet-index"].includes(d.type),
  ) as (DocumentEnvelope & { document: Schedule })[];

  for (const fp of floorPlans) {
    for (const schedule of schedules) {
      crossRefs.push(...matchFloorPlanToSchedule(fp, schedule));
    }
  }

  return crossRefs;
}

function matchFloorPlanToSchedule(
  fp: DocumentEnvelope & { document: FloorPlan },
  schedule: DocumentEnvelope & { document: Schedule },
): CrossRef[] {
  const refs: CrossRef[] = [];

  if (schedule.document.type === "room") {
    refs.push(...matchRooms(fp, schedule));
  }

  if (schedule.document.type === "door") {
    refs.push(...matchDoors(fp, schedule));
  }

  return refs;
}

function matchRooms(
  fp: DocumentEnvelope & { document: FloorPlan },
  schedule: DocumentEnvelope & { document: Schedule },
): CrossRef[] {
  const refs: CrossRef[] = [];
  const matchedRoomIds = new Set<string>();
  const matchedRowIds = new Set<string>();

  for (const room of fp.document.rooms) {
    for (const row of schedule.document.rows) {
      const scheduleNumber = String(row.values["number"] ?? "");
      if (room.number && scheduleNumber && room.number === scheduleNumber) {
        matchedRoomIds.add(room.id);
        matchedRowIds.add(row.id);

        refs.push({
          id: `${fp.id}:room:${room.id}:number→${schedule.id}:${row.id}`,
          type: "room-number",
          matchMethod: "exact",
          confidence: 1.0,
          source: {
            docId: fp.id,
            elementPath: `rooms.${room.id}.number`,
            value: room.number,
          },
          target: {
            docId: schedule.id,
            elementPath: `rows.${row.id}.number`,
            value: scheduleNumber,
          },
        });

        const scheduleName = String(row.values["name"] ?? "");
        if (room.name && scheduleName && room.name !== scheduleName) {
          const drift = detectNameDrift(room.name, scheduleName);
          refs.push({
            id: `${fp.id}:room:${room.id}:name→${schedule.id}:${row.id}`,
            type: "room-name",
            matchMethod: drift.isDrift ? "fuzzy" : "exact",
            confidence: drift.confidence,
            source: {
              docId: fp.id,
              elementPath: `rooms.${room.id}.name`,
              value: room.name,
            },
            target: {
              docId: schedule.id,
              elementPath: `rows.${row.id}.name`,
              value: scheduleName,
            },
          });
        }

        const scheduleArea = Number(row.values["area"]);
        if (room.area && scheduleArea && room.area !== scheduleArea) {
          refs.push({
            id: `${fp.id}:room:${room.id}:area→${schedule.id}:${row.id}`,
            type: "room-area",
            matchMethod: "exact",
            confidence: 1.0,
            source: {
              docId: fp.id,
              elementPath: `rooms.${room.id}.area`,
              value: room.area,
            },
            target: {
              docId: schedule.id,
              elementPath: `rows.${row.id}.area`,
              value: scheduleArea,
            },
          });
        }
      }
    }
  }

  for (const room of fp.document.rooms) {
    if (!room.number || matchedRoomIds.has(room.id)) continue;
    refs.push({
      id: `${fp.id}:room:${room.id}:missing→${schedule.id}`,
      type: "missing-in-schedule",
      matchMethod: "exact",
      confidence: 1.0,
      source: {
        docId: fp.id,
        elementPath: `rooms.${room.id}.number`,
        value: room.number,
      },
      target: {
        docId: schedule.id,
        elementPath: "",
        value: "",
      },
    });
  }

  for (const row of schedule.document.rows) {
    const scheduleNumber = String(row.values["number"] ?? "");
    if (!scheduleNumber || matchedRowIds.has(row.id)) continue;
    refs.push({
      id: `${schedule.id}:row:${row.id}:missing→${fp.id}`,
      type: "missing-in-floorplan",
      matchMethod: "exact",
      confidence: 1.0,
      source: {
        docId: schedule.id,
        elementPath: `rows.${row.id}.number`,
        value: scheduleNumber,
      },
      target: {
        docId: fp.id,
        elementPath: "",
        value: "",
      },
    });
  }

  return refs;
}

function matchDoors(
  fp: DocumentEnvelope & { document: FloorPlan },
  schedule: DocumentEnvelope & { document: Schedule },
): CrossRef[] {
  const refs: CrossRef[] = [];
  const matchedDoorIds = new Set<string>();
  const matchedRowIds = new Set<string>();

  for (const door of fp.document.doors) {
    for (const row of schedule.document.rows) {
      const scheduleNumber = String(row.values["number"] ?? "");
      if (door.number && scheduleNumber && door.number === scheduleNumber) {
        matchedDoorIds.add(door.id);
        matchedRowIds.add(row.id);

        refs.push({
          id: `${fp.id}:door:${door.id}:number→${schedule.id}:${row.id}`,
          type: "door-number",
          matchMethod: "exact",
          confidence: 1.0,
          source: {
            docId: fp.id,
            elementPath: `doors.${door.id}.number`,
            value: door.number,
          },
          target: {
            docId: schedule.id,
            elementPath: `rows.${row.id}.number`,
            value: scheduleNumber,
          },
        });
      }
    }
  }

  for (const door of fp.document.doors) {
    if (!door.number || matchedDoorIds.has(door.id)) continue;
    refs.push({
      id: `${fp.id}:door:${door.id}:missing→${schedule.id}`,
      type: "missing-in-schedule",
      matchMethod: "exact",
      confidence: 1.0,
      source: {
        docId: fp.id,
        elementPath: `doors.${door.id}.number`,
        value: door.number,
      },
      target: {
        docId: schedule.id,
        elementPath: "",
        value: "",
      },
    });
  }

  for (const row of schedule.document.rows) {
    const scheduleNumber = String(row.values["number"] ?? "");
    if (!scheduleNumber || matchedRowIds.has(row.id)) continue;
    refs.push({
      id: `${schedule.id}:row:${row.id}:missing→${fp.id}`,
      type: "missing-in-floorplan",
      matchMethod: "exact",
      confidence: 1.0,
      source: {
        docId: schedule.id,
        elementPath: `rows.${row.id}.number`,
        value: scheduleNumber,
      },
      target: {
        docId: fp.id,
        elementPath: "",
        value: "",
      },
    });
  }

  return refs;
}

function detectNameDrift(
  a: string,
  b: string,
): { isDrift: boolean; confidence: number } {
  const wordsA = a.toUpperCase().split(/\s+/);
  const wordsB = b.toUpperCase().split(/\s+/);
  const [shorter, longer] =
    wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];

  let prefixMatches = 0;
  for (const ws of shorter) {
    if (longer.some((wl) => wl.startsWith(ws) || ws.startsWith(wl))) {
      prefixMatches++;
    }
  }

  const ratio = prefixMatches / Math.max(shorter.length, longer.length);
  if (ratio >= 0.5) {
    return { isDrift: true, confidence: 0.5 + ratio * 0.3 };
  }
  return { isDrift: false, confidence: 1.0 };
}
