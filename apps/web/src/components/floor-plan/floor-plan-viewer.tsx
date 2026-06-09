"use client";

import { useMemo, useState, useCallback } from "react";
import type { FloorPlan, Room, Door, Wall, Mismatch, CrossRef, Change, PropagationTarget } from "@propagate/contracts";
import { useDocumentStore } from "@/store/documents";
import { socket } from "@/socket/client";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3001";

type MatchType = "exact" | "fuzzy" | null;

function roomTint(room: Room): string {
  const name = room.name.toUpperCase();
  if (/OPERATORY|STERILIZATION|LAB|IMAGING/.test(name)) return "#f0fdf4";
  if (/RESTROOM/.test(name)) return "#eff6ff";
  if (/MECHANICAL|STORAGE/.test(name)) return "#fefce8";
  if (/CORRIDOR/.test(name)) return "#f5f5f4";
  return "#ffffff";
}

export function FloorPlanViewer() {
  const documents = useDocumentStore((s) => s.documents);
  const mismatches = useDocumentStore((s) => s.mismatches);
  const crossRefs = useDocumentStore((s) => s.crossRefs);
  const selectedElementId = useDocumentStore((s) => s.selectedElementId);
  const selectElement = useDocumentStore((s) => s.selectElement);
  const focusedMismatchId = useDocumentStore((s) => s.focusedMismatchId);

  const fpDoc = documents.find((d) => d.type === "floor-plan");

  if (!fpDoc) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge text-ink-muted">
        No floor plan loaded
      </div>
    );
  }

  const floorPlan = fpDoc.document as FloorPlan;

  return (
    <div className="flex h-full flex-col">
      <FloorPlanSVG
        docId={fpDoc.id}
        floorPlan={floorPlan}
        mismatches={mismatches}
        crossRefs={crossRefs}
        selectedElementId={selectedElementId}
        focusedMismatchId={focusedMismatchId}
        onSelectElement={selectElement}
      />
      {selectedElementId && (
        <RoomEditPanel
          docId={fpDoc.id}
          floorPlan={floorPlan}
          roomId={selectedElementId}
        />
      )}
    </div>
  );
}

function RoomEditPanel({
  docId,
  floorPlan,
  roomId,
}: {
  docId: string;
  floorPlan: FloorPlan;
  roomId: string;
}) {
  const room = floorPlan.rooms.find((r) => r.id === roomId);
  const applyChange = useDocumentStore((s) => s.applyChange);
  const setPendingPropagation = useDocumentStore((s) => s.setPendingPropagation);
  const [editField, setEditField] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = useCallback((field: string, value: string | number) => {
    setEditField(field);
    setDraft(String(value ?? ""));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editField || !room) return;
    const raw = (room as unknown as Record<string, unknown>)[editField];
    const oldValue: string | number = typeof raw === "number" ? raw : String(raw ?? "");
    const newValue = draft !== "" && !isNaN(Number(draft)) ? Number(draft) : draft;
    if (String(newValue) === String(oldValue)) {
      setEditField(null);
      return;
    }

    const change: Change = {
      docId,
      elementPath: `rooms.${room.id}.${editField}`,
      oldValue,
      newValue,
    };
    applyChange(change);
    socket.emit("edit:submit", change);
    setEditField(null);

    fetch(`${ENGINE_URL}/api/propagate/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    })
      .then((r) => r.json())
      .then((targets: PropagationTarget[]) => {
        if (targets.length > 0) setPendingPropagation(targets);
      })
      .catch(() => {});
  }, [editField, draft, room, docId, applyChange, setPendingPropagation]);

  if (!room) return null;

  const fields = [
    { key: "number", label: "Number", value: room.number },
    { key: "name", label: "Name", value: room.name },
    { key: "area", label: "Area (SF)", value: room.area },
  ];

  return (
    <div className="mt-2 rounded-lg border border-edge bg-surface-alt p-3">
      <div className="mb-2 text-xs font-medium text-ink-muted uppercase tracking-wider">
        Edit Room {room.number}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {fields.map((f) => (
          <div key={f.key}>
            <div className="mb-1 text-[10px] text-ink-faint">{f.label}</div>
            {editField === f.key ? (
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditField(null);
                }}
                className="w-full rounded border border-edge bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-blue-500"
              />
            ) : (
              <button
                onClick={() => startEdit(f.key, f.value ?? "")}
                className="w-full rounded bg-surface px-2 py-1 text-left text-xs text-ink-secondary hover:bg-surface-inset"
              >
                {f.value || "—"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FloorPlanSVG({
  docId,
  floorPlan,
  mismatches,
  crossRefs,
  selectedElementId,
  focusedMismatchId,
  onSelectElement,
}: {
  docId: string;
  floorPlan: FloorPlan;
  mismatches: Mismatch[];
  crossRefs: CrossRef[];
  selectedElementId: string | null;
  focusedMismatchId: string | null;
  onSelectElement: (id: string | null) => void;
}) {
  const { viewBox, bounds } = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const room of floorPlan.rooms) {
      minX = Math.min(minX, room.bounds.min.x);
      minY = Math.min(minY, room.bounds.min.y);
      maxX = Math.max(maxX, room.bounds.max.x);
      maxY = Math.max(maxY, room.bounds.max.y);
    }

    for (const wall of floorPlan.walls) {
      minX = Math.min(minX, wall.startPoint.x, wall.endPoint.x);
      minY = Math.min(minY, wall.startPoint.y, wall.endPoint.y);
      maxX = Math.max(maxX, wall.startPoint.x, wall.endPoint.x);
      maxY = Math.max(maxY, wall.startPoint.y, wall.endPoint.y);
    }

    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 100;
      maxY = 100;
    }

    const pad = 3;
    return {
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
      bounds: { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 },
    };
  }, [floorPlan]);

  const mismatchRoomMap = useMemo(() => {
    const map = new Map<string, "exact" | "fuzzy">();
    for (const m of mismatches) {
      const cr = crossRefs.find((c) => c.id === m.crossRefId);
      const method = cr?.matchMethod === "fuzzy" ? "fuzzy" : "exact";
      for (const ref of [m.source, m.target]) {
        if (ref.docId === docId) {
          const parts = ref.elementPath.split(".");
          if (parts[0] === "rooms") {
            const existing = map.get(parts[1]);
            if (!existing || (existing === "exact" && method === "fuzzy")) {
              map.set(parts[1], method);
            }
          }
        }
      }
    }
    return map;
  }, [mismatches, crossRefs, docId]);

  const focusedRoomId = useMemo(() => {
    if (!focusedMismatchId) return null;
    const m = mismatches.find((mm) => mm.id === focusedMismatchId);
    if (!m) return null;
    for (const ref of [m.source, m.target]) {
      if (ref.docId === docId && ref.elementPath.startsWith("rooms.")) {
        return ref.elementPath.split(".")[1];
      }
    }
    return null;
  }, [focusedMismatchId, mismatches, docId]);

  return (
    <div className="flex-1">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Floor Plan
        </span>
        <span className="text-xs text-ink-faint">
          {floorPlan.rooms.length} rooms &middot; {floorPlan.doors.length} doors
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-edge bg-surface-alt/50" style={{ height: "calc(100% - 2rem)" }}>
        <svg
          viewBox={viewBox}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#3f3f46" strokeWidth="0.03" />
            </pattern>
          </defs>
          <rect
            x={bounds.minX}
            y={bounds.minY}
            width={bounds.w}
            height={bounds.h}
            fill="url(#grid)"
          />
          {floorPlan.walls.map((wall) => (
            <WallLine key={wall.id} wall={wall} />
          ))}
          {floorPlan.rooms.map((room) => (
            <RoomRect
              key={room.id}
              room={room}
              matchType={mismatchRoomMap.get(room.id) ?? null}
              isSelected={selectedElementId === room.id}
              isFocused={focusedRoomId === room.id}
              onClick={() =>
                onSelectElement(
                  selectedElementId === room.id ? null : room.id,
                )
              }
            />
          ))}
          {floorPlan.doors.map((door) => (
            <DoorMarker key={door.id} door={door} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function RoomRect({
  room,
  matchType,
  isSelected,
  isFocused,
  onClick,
}: {
  room: Room;
  matchType: MatchType;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
}) {
  const x = room.bounds.min.x;
  const y = room.bounds.min.y;
  const w = room.bounds.max.x - room.bounds.min.x;
  const h = room.bounds.max.y - room.bounds.min.y;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const isFuzzy = matchType === "fuzzy";
  const isExact = matchType === "exact";

  let fill = roomTint(room);
  let stroke = isSelected ? "#3b82f6" : "#27272a";
  let strokeWidth = isSelected ? 0.35 : 0.2;
  let strokeDash: string | undefined;
  let circleStroke = "#a1a1aa";
  let numberColor = "#18181b";
  let nameColor = "#52525b";

  if (isExact) {
    fill = "#fef2f2";
    stroke = "#ef4444";
    strokeWidth = 0.35;
    strokeDash = "1,0.5";
    circleStroke = "#fca5a5";
    numberColor = "#dc2626";
    nameColor = "#ef4444";
  } else if (isFuzzy) {
    fill = "#faf5ff";
    stroke = "#8b5cf6";
    strokeWidth = 0.35;
    strokeDash = "0.8,0.4";
    circleStroke = "#c4b5fd";
    numberColor = "#7c3aed";
    nameColor = "#8b5cf6";
  }

  const fontSize = Math.min(w, h) * 0.13;

  return (
    <g onClick={onClick} className="cursor-pointer">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
      />
      <circle
        cx={cx}
        cy={cy - fontSize * 0.8}
        r={fontSize * 0.75}
        fill="none"
        stroke={circleStroke}
        strokeWidth={0.06}
      />
      <text
        x={cx}
        y={cy - fontSize * 0.8}
        textAnchor="middle"
        dominantBaseline="central"
        fill={numberColor}
        fontSize={fontSize}
        fontWeight="bold"
      >
        {room.number}
      </text>
      <text
        x={cx}
        y={cy + fontSize * 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill={nameColor}
        fontSize={fontSize * 0.55}
      >
        {truncate(room.name, 14)}
      </text>
      {room.area != null && (
        <text
          x={cx}
          y={cy + fontSize * 1.5}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#a1a1aa"
          fontSize={fontSize * 0.45}
        >
          {room.area} SF
        </text>
      )}
      {isFocused && (
        <rect
          x={x - 0.3}
          y={y - 0.3}
          width={w + 0.6}
          height={h + 0.6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={0.5}
          rx={0.3}
        />
      )}
    </g>
  );
}

function DoorMarker({ door }: { door: Door }) {
  if (door.position.x === 0 && door.position.y === 0) return null;

  const px = door.position.x;
  const py = door.position.y;
  const leafLen = door.width * 0.3 || 0.8;

  return (
    <g>
      <line
        x1={px - leafLen / 2}
        y1={py}
        x2={px + leafLen / 2}
        y2={py}
        stroke="#3b82f6"
        strokeWidth={0.15}
        strokeLinecap="square"
      />
      <path
        d={`M ${px + leafLen / 2} ${py} A ${leafLen} ${leafLen} 0 0 1 ${px + leafLen / 2} ${py - leafLen}`}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={0.06}
        strokeDasharray="0.3,0.2"
      />
    </g>
  );
}

function WallLine({ wall }: { wall: Wall }) {
  if (
    wall.startPoint.x === wall.endPoint.x &&
    wall.startPoint.y === wall.endPoint.y
  )
    return null;

  return (
    <line
      x1={wall.startPoint.x}
      y1={wall.startPoint.y}
      x2={wall.endPoint.x}
      y2={wall.endPoint.y}
      stroke="#18181b"
      strokeWidth={Math.max(wall.thickness * 0.8, 0.3)}
      strokeLinecap="square"
    />
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
