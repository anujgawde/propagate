import { Module } from "@nestjs/common";
import { MatchingModule } from "../matching/matching.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { GraphService } from "./graph.service.js";

@Module({
  imports: [MatchingModule, RedisModule],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
