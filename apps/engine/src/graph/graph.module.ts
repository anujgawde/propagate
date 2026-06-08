import { Module } from "@nestjs/common";
import { MatchingModule } from "../matching/matching.module.js";
import { GraphService } from "./graph.service.js";

@Module({
  imports: [MatchingModule],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
