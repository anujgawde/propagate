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
└── fixtures/               Sample data (dental clinic)
```

## Stack

- **Engine:** NestJS, TypeScript
- **Web:** Next.js (App Router, React 19), Tailwind CSS, Zustand
- **Ingestion:** web-ifc (IFC), exceljs (Excel), pdfreader (PDF)
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

## Architecture Highlights

- The cross-reference engine (`packages/crossref`) is pure, testable, deterministic. It never calls an LLM.
- The engine runs client-side for instant cascade visualization (<1ms latency). The backend keeps Redis in sync via WebSocket.
- Two-layer matching: exact matching for IDs/numbers, fuzzy matching via LanceDB vectors for naming drift.
- Sample data uses a dental/medical clinic (~18 rooms, ~20 doors) with 4 seeded mismatches to demonstrate the system on first load.

## Current Status

Monorepo scaffold is in place with shared types, the cross-reference engine (exact matching), NestJS backend modules, and the Next.js frontend shell. Ingestion parsers, sample data, and the full UI are next.
