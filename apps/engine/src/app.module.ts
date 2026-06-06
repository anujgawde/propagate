import { Module } from "@nestjs/common";
import { IngestionModule } from "./ingestion/ingestion.module";
import { GraphModule } from "./graph/graph.module";
import { GatewayModule } from "./gateway/gateway.module";
import { ApiController } from "./api.controller";

@Module({
  imports: [IngestionModule, GraphModule, GatewayModule],
  controllers: [ApiController],
})
export class AppModule {}
