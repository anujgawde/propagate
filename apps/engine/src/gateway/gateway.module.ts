import { Module } from "@nestjs/common";
import { GraphModule } from "../graph/graph.module.js";
import { PropagateGateway } from "./propagate.gateway.js";

@Module({
  imports: [GraphModule],
  providers: [PropagateGateway],
})
export class GatewayModule {}
