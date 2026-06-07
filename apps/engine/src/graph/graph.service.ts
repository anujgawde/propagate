import { Injectable } from "@nestjs/common";
import type {
  DocumentEnvelope,
  GraphState,
  Change,
  PropagationTarget,
  FloorPlan,
  Schedule,
} from "@propagate/contracts";
import { buildGraph, checkConsistency, computePropagation } from "@propagate/crossref";

@Injectable()
export class GraphService {
  private documents: DocumentEnvelope[] = [];

  addDocument(doc: DocumentEnvelope): GraphState {
    this.documents.push(doc);
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
    const crossRefs = buildGraph(this.documents);
    const mismatches = checkConsistency(crossRefs);
    return { crossRefs, mismatches };
  }

  getState(): GraphState {
    return this.rebuild();
  }
}
