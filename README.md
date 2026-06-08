# Propagate

Cross-document impact analysis for BIM. Upload architecture documents (IFC models, Excel schedules, PDF schedules), build a dependency graph across them, detect mismatches, and see real-time cascade when edits happen.

## The Problem

Architecture projects produce hundreds of interconnected documents: floor plans, door schedules, room finish schedules, sheet indices. A single change (renaming a room, moving a door) silently breaks references across dozens of sheets.

No tool solves this today. Cross-sheet coordination is a blind spot in the AEC industry.

## How It Works

1. **Ingest** real BIM documents (IFC, Excel, PDF). Users upload native files, Propagate converts them internally.
2. **Build a dependency graph** using exact matching (IDs, numbers) and fuzzy vector matching (LanceDB) to catch naming drift like "OPERATORY 1" vs "OP 1".
3. **Detect mismatches** that already exist across documents.
4. **Trace impact** when a field is edited. Change a room name on the floor plan and instantly see which schedule cells break.

The system never assumes which document is right. It shows divergence. The user decides what to fix.

## Project Structure

```
propagate/
├── packages/
│   ├── contracts/          Shared TypeScript types (documents, cross-refs, events)
│   └── crossref/           Pure TS cross-reference engine (runs client + server)
├── apps/
│   ├── engine/             NestJS backend (ingestion, graph, WebSocket gateway)
│   └── web/                Next.js frontend (floor plan SVG, schedule tables, editing)
└── samples/                Sample data (dental clinic)
```

## Stack

- **Engine:** NestJS, TypeScript
- **Web:** Next.js (App Router, React 19), Tailwind CSS, Zustand
- **Ingestion:** web-ifc (IFC), exceljs (Excel), pdf-parse (PDF)
- **Storage:** Firebase Storage (uploaded files), Redis (graph cache), LanceDB (vector search)
- **Real-time:** Socket.io (WebSockets)
- **Cross-ref engine:** Framework-free pure TypeScript, deterministic, no LLM dependency

## Getting Started

```bash
pnpm install
pnpm dev            # start engine (port 3001) + web (port 3000)
pnpm dev:engine     # engine only
pnpm dev:web        # web only
pnpm typecheck      # typecheck all packages
pnpm test           # run all tests
```

Copy `.env.example` to `.env` and fill in the values as needed.

## Sample Data

The `samples/` directory contains a dental clinic dataset used for development and testing:

| File                 | Format  | Contents                                              |
| -------------------- | ------- | ----------------------------------------------------- |
| `dental-clinic.ifc`  | IFC 2x3 | Floor plan with 17 rooms, 20 doors, 10 walls          |
| `room-schedule.xlsx` | Excel   | Room finish schedule (17 rows)                        |
| `door-schedule.xlsx` | Excel   | Door schedule (19 rows — D-108 intentionally missing) |
| `sheet-index.xlsx`   | Excel   | Sheet index (4 sheets)                                |
| `room-schedule.pdf`  | PDF     | PDF version of the room schedule                      |

Four mismatches are seeded across these files to demonstrate cross-document detection:

1. **Name drift:** Floor plan says "OPERATORY 1" (room 102), room schedule says "OP 1"
2. **Missing reference:** Door D-108 exists in the IFC model but is absent from the door schedule
3. **Property mismatch:** Floor plan has 180 SF for STERILIZATION (room 106), room schedule says 165 SF
4. **Rename drift:** Floor plan says "IMAGING" (room 107), sheet index A102 references "X-RAY"

### Regenerating sample files

The sample files are checked into the repo so tests work immediately after cloning. To regenerate them from scratch:

```bash
npx tsx samples/generate-ifc.ts          # generates dental-clinic.ifc
npx tsx samples/generate-schedules.ts    # generates *.xlsx files
npx tsx samples/generate-pdf.ts          # generates room-schedule.pdf
```

## Ingestion API

Upload a file to parse it into a typed `DocumentEnvelope`:

```bash
# IFC model → FloorPlan
curl -X POST http://localhost:3001/api/upload -F file=@samples/dental-clinic.ifc

# Excel schedule (type inferred from filename)
curl -X POST http://localhost:3001/api/upload -F file=@samples/room-schedule.xlsx

# Explicit schedule type
curl -X POST http://localhost:3001/api/upload?scheduleType=door -F file=@samples/door-schedule.xlsx

# PDF schedule
curl -X POST http://localhost:3001/api/upload -F file=@samples/room-schedule.pdf
```

Supported formats: `.ifc`, `.xlsx`, `.xls`, `.pdf`. The engine detects file type by extension and routes to the appropriate parser.

## Architecture Highlights

- The cross-reference engine (`packages/crossref`) is pure, testable, deterministic. It never calls an LLM.
- The engine runs client-side for instant cascade visualization (<1ms latency). The backend keeps Redis in sync via WebSocket.
- Two-layer matching: exact matching for IDs/numbers, fuzzy matching via LanceDB vectors for naming drift.
- Sample data uses a dental/medical clinic (17 rooms, 20 doors) with 4 seeded mismatches to demonstrate the system on first load.
