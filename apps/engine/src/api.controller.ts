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
import { IngestionService } from "./ingestion/ingestion.service";

@Controller("api")
export class ApiController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get("health")
  health() {
    return { status: "ok" };
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

    return envelope;
  }
}
