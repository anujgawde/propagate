import { Module } from "@nestjs/common";
import { LanceService } from "./lance.service.js";
import { MatchingService } from "./matching.service.js";

@Module({
  providers: [LanceService, MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
