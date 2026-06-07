"use client";

import { useMemo } from "react";
import type { FloorPlan, Room, Door, Wall, Mismatch } from "@propagate/contracts";
import { useDocumentStore } from "@/store/documents";

const ROOM_FILLS = [
  "#1e3a5f",
  "#1e4d3d",
  "#3d2e5c",
  "#4a3728",
  "#1e3a5f",
  "#2d4a3a",
];

export function FloorPlanViewer() {
  const documents = useDocumentStore((s) => s.documents);
  const mismatches = useDocumentStore((s) => s.mismatches);
  const selectedElementId = useDocumentStore((s) => s.selectedElementId);
  const selectElement = useDocumentStore((s) => s.selectElement);

  const fpDoc = documents.find((d) => d.type === "floor-plan");

  if (!fpDoc) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-500">
        No floor plan loaded
      </div>
    );
  }

  const floorPlan = fpDoc.document as FloorPlan;

  return (
    <FloorPlanSVG
      docId={fpDoc.id}
      floorPlan={floorPlan}
      mismatches={mismatches}
      selectedElementId={selectedElementId}
      onSelectElement={selectElement}
    />
  );
}

function FloorPlanSVG({
  docId,
  floorPlan,
  mismatches,
  selectedElementId,
  onSelectElement,
}: {
  docId: string;
  floorPlan: FloorPlan;
  mismatches: Mismatch[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
}) {
  const viewBox = useMemo(() => {
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
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [floorPlan]);

  const mismatchRoomIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of mismatches) {
      if (m.source.docId === docId) {
        const parts = m.source.elementPath.split(".");
        if (parts[0] === "rooms") ids.add(parts[1]);
      }
      if (m.target.docId === docId) {
        const parts = m.target.elementPath.split(".");
        if (parts[0] === "rooms") ids.add(parts[1]);
      }
    }
    return ids;
  }, [mismatches, docId]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Floor Plan
        </span>
        <span className="text-xs text-zinc-600">
          {floorPlan.rooms.length} rooms &middot; {floorPlan.doors.length} doors
        </span>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <svg
          viewBox={viewBox}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {floorPlan.walls.map((wall) => (
            <WallLine key={wall.id} wall={wall} />
          ))}
          {floorPlan.rooms.map((room, i) => (
            <RoomRect
              key={room.id}
              room={room}
              colorIndex={i}
              hasMismatch={mismatchRoomIds.has(room.id)}
              isSelected={selectedElementId === room.id}
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
  colorIndex,
  hasMismatch,
  isSelected,
  onClick,
}: {
  room: Room;
  colorIndex: number;
  hasMismatch: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const x = room.bounds.min.x;
  const y = room.bounds.min.y;
  const w = room.bounds.max.x - room.bounds.min.x;
  const h = room.bounds.max.y - room.bounds.min.y;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const fill = hasMismatch
    ? "#7c2d12"
    : ROOM_FILLS[colorIndex % ROOM_FILLS.length];
  const stroke = hasMismatch ? "#f97316" : isSelected ? "#60a5fa" : "#3f3f46";
  const strokeWidth = hasMismatch || isSelected ? 0.4 : 0.15;

  const fontSize = Math.min(w, h) * 0.15;

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
        rx={0.3}
        opacity={0.85}
      />
      <text
        x={cx}
        y={cy - fontSize * 0.4}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hasMismatch ? "#fb923c" : "#a1a1aa"}
        fontSize={fontSize}
        fontWeight="bold"
      >
        {room.number}
      </text>
      <text
        x={cx}
        y={cy + fontSize * 0.8}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hasMismatch ? "#fdba74" : "#71717a"}
        fontSize={fontSize * 0.7}
      >
        {truncate(room.name, 14)}
      </text>
    </g>
  );
}

function DoorMarker({ door }: { door: Door }) {
  if (door.position.x === 0 && door.position.y === 0) return null;

  return (
    <rect
      x={door.position.x - 0.4}
      y={door.position.y - 0.15}
      width={0.8}
      height={0.3}
      fill="#3b82f6"
      rx={0.05}
      opacity={0.7}
    />
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
      stroke="#52525b"
      strokeWidth={wall.thickness || 0.2}
      strokeLinecap="round"
    />
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
