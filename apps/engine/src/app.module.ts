import { Module } from "@nestjs/common";
import { IngestionModule } from "./ingestion/ingestion.module.js";
import { GraphModule } from "./graph/graph.module.js";
import { GatewayModule } from "./gateway/gateway.module.js";
import { ApiController } from "./api.controller.js";

@Module({
  imports: [IngestionModule, GraphModule, GatewayModule],
  controllers: [ApiController],
})
export class AppModule {}
