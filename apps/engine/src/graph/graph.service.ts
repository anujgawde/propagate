import { Injectable } from "@nestjs/common";
import type {
  CrossRef,
  DocumentEnvelope,
  GraphState,
  Change,
  PropagationTarget,
  FloorPlan,
  Schedule,
} from "@propagate/contracts";
import { buildGraph, checkConsistency, computePropagation } from "@propagate/crossref";
import { MatchingService } from "../matching/matching.service.js";

@Injectable()
export class GraphService {
  private documents: DocumentEnvelope[] = [];
  private fuzzyRefs: CrossRef[] = [];

  constructor(private readonly matching: MatchingService) {}

  async addDocument(doc: DocumentEnvelope): Promise<GraphState> {
    this.documents.push(doc);
    await this.refreshFuzzyRefs();
    return this.rebuild();
  }

  getDocuments(): DocumentEnvelope[] {
    return this.documents;
  }

  applyChange(change: Change): GraphState {
    const doc = this.documents.find((d) => d.id === change.docId);
    if (!doc) return this.rebuild();

    const parts = change.elementPath.split(".");
    if (parts[0] === "rooms") {
      const fp = doc.document as FloorPlan;
      const room = fp.rooms.find((r) => r.id === parts[1]);
      if (room) {
        (room as unknown as Record<string, unknown>)[parts[2]] =
          change.newValue;
      }
    } else if (parts[0] === "rows") {
      const schedule = doc.document as Schedule;
      const row = schedule.rows.find((r) => r.id === parts[1]);
      if (row) {
        row.values[parts[2]] = change.newValue;
      }
    }

    return this.rebuild();
  }

  previewPropagation(change: Change): PropagationTarget[] {
    const { crossRefs } = this.rebuild();
    return computePropagation(change, crossRefs);
  }

  applyPropagation(targets: PropagationTarget[]): GraphState {
    for (const target of targets) {
      this.applyChange({
        docId: target.docId,
        elementPath: target.elementPath,
        oldValue: target.currentValue,
        newValue: target.proposedValue,
      });
    }
    return this.rebuild();
  }

  rebuild(): GraphState {
    const exactRefs = buildGraph(this.documents);
    const crossRefs = [...exactRefs, ...this.fuzzyRefs];
    const mismatches = checkConsistency(crossRefs);
    return { crossRefs, mismatches };
  }

  getState(): GraphState {
    return this.rebuild();
  }

  private async refreshFuzzyRefs(): Promise<void> {
    await this.matching.indexElements(this.documents);
    const exactRefs = buildGraph(this.documents);
    this.fuzzyRefs = await this.matching.buildFuzzyRefs(
      this.documents,
      exactRefs,
    );
  }
}
