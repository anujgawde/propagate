import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IngestionService } from "./ingestion/ingestion.service.js";
import { GraphService } from "./graph/graph.service.js";

@Controller("api")
export class ApiController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly graphService: GraphService,
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

    const graph = this.graphService.addDocument(envelope);

    return { envelope, graph };
  }
}
