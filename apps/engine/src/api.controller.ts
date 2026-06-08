import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Change, PropagationTarget } from "@propagate/contracts";
import { IngestionService } from "./ingestion/ingestion.service.js";
import { GraphService } from "./graph/graph.service.js";
import { AgentService } from "./agent/agent.service.js";

@Controller("api")
export class ApiController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly graphService: GraphService,
    private readonly agentService: AgentService,
  ) {}

  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Get("documents")
  getDocuments() {
    return this.graphService.getDocuments();
  }

  @Get("graph")
  getGraph() {
    return this.graphService.getState();
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query("scheduleType") scheduleType?: "door" | "room" | "sheet-index",
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const envelope = await this.ingestionService.ingest(
      file.buffer,
      file.originalname,
      scheduleType,
    );

    const graph = await this.graphService.addDocument(envelope);

    return { envelope, graph };
  }

  @Get("agent/health")
  agentHealth() {
    return this.agentService.checkHealth();
  }

  @Post("agent/suggest")
  async agentSuggest() {
    const { mismatches } = this.graphService.getState();
    const documents = this.graphService.getDocuments();
    const result = await this.agentService.suggestFixes(mismatches, documents);
    if (!result) return { available: false };
    return result;
  }

  @Post("agent/confirm-matches")
  async agentConfirmMatches() {
    const { crossRefs } = this.graphService.getState();
    const documents = this.graphService.getDocuments();
    const result = await this.agentService.confirmFuzzyMatches(crossRefs, documents);
    if (!result) return { available: false };
    return result;
  }

  @Post("propagate/preview")
  previewPropagation(@Body() change: Change) {
    return this.graphService.previewPropagation(change);
  }

  @Post("propagate/apply")
  applyPropagation(@Body() body: { targets: PropagationTarget[] }) {
    return this.graphService.applyPropagation(body.targets);
  }
}
