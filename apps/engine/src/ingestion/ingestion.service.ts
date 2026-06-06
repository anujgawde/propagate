import { Injectable } from "@nestjs/common";
import type { DocumentEnvelope } from "@propagate/contracts";

@Injectable()
export class IngestionService {
  async ingest(_fileBuffer: Buffer, _fileName: string): Promise<DocumentEnvelope> {
    throw new Error("Not implemented");
  }
}
