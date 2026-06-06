import { Injectable } from "@nestjs/common";
import type { DocumentEnvelope, GraphState } from "@propagate/contracts";
import { buildGraph, checkConsistency } from "@propagate/crossref";

@Injectable()
export class GraphService {
  private documents: DocumentEnvelope[] = [];

  addDocument(doc: DocumentEnvelope): GraphState {
    this.documents.push(doc);
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
