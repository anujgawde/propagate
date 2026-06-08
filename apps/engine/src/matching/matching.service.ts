import { Injectable } from "@nestjs/common";
import type {
  CrossRef,
  DocumentEnvelope,
  FloorPlan,
  Schedule,
} from "@propagate/contracts";
import { LanceService } from "./lance.service.js";

interface NamedElement {
  docId: string;
  elementPath: string;
  text: string;
}

@Injectable()
export class MatchingService {
  constructor(private readonly lance: LanceService) {}

  isAvailable(): boolean {
    return this.lance.isAvailable();
  }

  async indexElements(documents: DocumentEnvelope[]): Promise<void> {
    await this.lance.indexElements(documents);
  }

  async buildFuzzyRefs(
    documents: DocumentEnvelope[],
    exactRefs: CrossRef[],
  ): Promise<CrossRef[]> {
    if (!this.lance.isAvailable()) return [];

    const elements = this.collectNamedElements(documents);
    const coveredPairs = this.buildCoveredSet(exactRefs);
    const seen = new Set<string>();
    const fuzzyRefs: CrossRef[] = [];

    for (const el of elements) {
      const matches = await this.lance.findSimilar(el.text, el.docId, 0.4);

      for (const match of matches) {
        const pairKey = [el.docId, el.elementPath, match.docId, match.elementPath]
          .sort()
          .join("|");
        if (seen.has(pairKey)) continue;
        if (coveredPairs.has(this.coveredKey(el.docId, el.elementPath, match.docId, match.elementPath))) continue;
        seen.add(pairKey);

        const refType = this.inferRefType(el.elementPath, match.elementPath);

        fuzzyRefs.push({
          id: `fuzzy:${el.docId}:${el.elementPath}→${match.docId}:${match.elementPath}`,
          type: refType,
          matchMethod: "fuzzy",
          confidence: match.confidence,
          source: {
            docId: el.docId,
            elementPath: el.elementPath,
            value: el.text,
          },
          target: {
            docId: match.docId,
            elementPath: match.elementPath,
            value: match.text,
          },
        });
      }
    }

    return fuzzyRefs;
  }

  private collectNamedElements(documents: DocumentEnvelope[]): NamedElement[] {
    const elements: NamedElement[] = [];

    for (const doc of documents) {
      if (doc.type === "floor-plan") {
        const fp = doc.document as FloorPlan;
        for (const room of fp.rooms) {
          if (room.name) {
            elements.push({
              docId: doc.id,
              elementPath: `rooms.${room.id}.name`,
              text: room.name,
            });
          }
        }
      } else {
        const schedule = doc.document as Schedule;
        for (const row of schedule.rows) {
          const name = row.values["name"];
          if (name) {
            elements.push({
              docId: doc.id,
              elementPath: `rows.${row.id}.name`,
              text: String(name),
            });
          }
        }
      }
    }

    return elements;
  }

  private buildCoveredSet(exactRefs: CrossRef[]): Set<string> {
    const set = new Set<string>();
    for (const ref of exactRefs) {
      set.add(
        this.coveredKey(
          ref.source.docId,
          ref.source.elementPath,
          ref.target.docId,
          ref.target.elementPath,
        ),
      );
    }
    return set;
  }

  private coveredKey(
    docId1: string,
    path1: string,
    docId2: string,
    path2: string,
  ): string {
    return [docId1, path1, docId2, path2].sort().join("|");
  }

  private inferRefType(
    sourcePath: string,
    targetPath: string,
  ): CrossRef["type"] {
    if (sourcePath.includes("rooms") || targetPath.includes("rooms")) {
      if (sourcePath.includes(".name") || targetPath.includes(".name")) {
        return "room-name";
      }
      return "room-number";
    }
    if (sourcePath.includes("doors")) return "door-number";
    return "room-name";
  }
}
