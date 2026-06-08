import { Injectable, Logger } from "@nestjs/common";
import { toTrigramVector, EMBEDDING_DIM } from "./embedding.js";
import type { DocumentEnvelope, FloorPlan, Schedule } from "@propagate/contracts";

export interface IndexedElement {
  id: string;
  docId: string;
  elementPath: string;
  text: string;
  vector: Float32Array;
}

export interface SimilarMatch {
  id: string;
  docId: string;
  elementPath: string;
  text: string;
  confidence: number;
}

const TABLE_NAME = "elements";

@Injectable()
export class LanceService {
  private readonly logger = new Logger(LanceService.name);
  private db: unknown = null;
  private table: unknown = null;
  private available = false;

  async onModuleInit() {
    const dbPath = process.env.LANCEDB_PATH || "./data/lancedb";
    try {
      const lancedb = await import("@lancedb/lancedb");
      this.db = await lancedb.connect(dbPath);
      this.available = true;
      this.logger.log(`LanceDB connected at ${dbPath}`);
    } catch {
      this.logger.warn("LanceDB unavailable — fuzzy matching disabled");
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async indexElements(documents: DocumentEnvelope[]): Promise<void> {
    if (!this.available || !this.db) return;

    const elements = this.extractElements(documents);
    if (elements.length === 0) return;

    const rows = elements.map((el) => ({
      id: el.id,
      docId: el.docId,
      elementPath: el.elementPath,
      text: el.text,
      vector: Array.from(el.vector),
    }));

    try {
      const db = this.db as { dropTable: (name: string) => Promise<void>; createTable: (name: string, data: unknown[]) => Promise<unknown> };
      try {
        await db.dropTable(TABLE_NAME);
      } catch {
        // table doesn't exist yet
      }
      this.table = await db.createTable(TABLE_NAME, rows);
    } catch (err) {
      this.logger.error("Failed to index elements in LanceDB", err);
    }
  }

  async findSimilar(
    text: string,
    excludeDocId: string,
    threshold = 0.6,
    limit = 10,
  ): Promise<SimilarMatch[]> {
    if (!this.available || !this.table) return [];

    const queryVector = Array.from(toTrigramVector(text));

    try {
      const tbl = this.table as {
        search: (vector: number[]) => {
          distanceType: (type: string) => {
            limit: (n: number) => {
              toArray: () => Promise<Array<Record<string, unknown>>>;
            };
          };
        };
      };

      const results = await tbl
        .search(queryVector)
        .distanceType("cosine")
        .limit(limit)
        .toArray();

      return results
        .filter((row) => row["docId"] !== excludeDocId)
        .map((row) => ({
          id: row["id"] as string,
          docId: row["docId"] as string,
          elementPath: row["elementPath"] as string,
          text: row["text"] as string,
          confidence: 1 - (row["_distance"] as number),
        }))
        .filter((m) => m.confidence >= threshold);
    } catch (err) {
      this.logger.error("LanceDB search failed", err);
      return [];
    }
  }

  private extractElements(documents: DocumentEnvelope[]): IndexedElement[] {
    const elements: IndexedElement[] = [];

    for (const doc of documents) {
      if (doc.type === "floor-plan") {
        const fp = doc.document as FloorPlan;
        for (const room of fp.rooms) {
          if (room.name) {
            elements.push({
              id: `${doc.id}:rooms.${room.id}.name`,
              docId: doc.id,
              elementPath: `rooms.${room.id}.name`,
              text: room.name,
              vector: toTrigramVector(room.name),
            });
          }
        }
        for (const door of fp.doors) {
          if (door.number) {
            elements.push({
              id: `${doc.id}:doors.${door.id}.number`,
              docId: doc.id,
              elementPath: `doors.${door.id}.number`,
              text: door.number,
              vector: toTrigramVector(door.number),
            });
          }
        }
      } else {
        const schedule = doc.document as Schedule;
        for (const row of schedule.rows) {
          const name = row.values["name"];
          if (name) {
            elements.push({
              id: `${doc.id}:rows.${row.id}.name`,
              docId: doc.id,
              elementPath: `rows.${row.id}.name`,
              text: String(name),
              vector: toTrigramVector(String(name)),
            });
          }
        }
      }
    }

    return elements;
  }
}
