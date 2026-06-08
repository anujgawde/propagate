import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
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
import { RedisService } from "../redis/redis.service.js";

const DOCUMENTS_KEY = "propagate:documents";

@Injectable()
export class GraphService implements OnModuleInit {
  private readonly logger = new Logger(GraphService.name);
  private documents: DocumentEnvelope[] = [];
  private fuzzyRefs: CrossRef[] = [];

  constructor(
    private readonly matching: MatchingService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    const cached = await this.redis.get<DocumentEnvelope[]>(DOCUMENTS_KEY);
    if (cached && cached.length > 0) {
      this.documents = cached;
      this.logger.log(`Hydrated ${cached.length} document(s) from Redis`);
      await this.refreshFuzzyRefs();
    }
  }

  async addDocument(doc: DocumentEnvelope): Promise<GraphState> {
    this.documents.push(doc);
    await this.redis.set(DOCUMENTS_KEY, this.documents);
    await this.refreshFuzzyRefs();
    return this.rebuild();
  }

  getDocuments(): DocumentEnvelope[] {
    return this.documents;
  }

  async applyChange(change: Change): Promise<GraphState> {
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

    await this.redis.set(DOCUMENTS_KEY, this.documents);
    return this.rebuild();
  }

  previewPropagation(change: Change): PropagationTarget[] {
    const { crossRefs } = this.rebuild();
    return computePropagation(change, crossRefs);
  }

  async applyPropagation(targets: PropagationTarget[]): Promise<GraphState> {
    for (const target of targets) {
      await this.applyChange({
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
