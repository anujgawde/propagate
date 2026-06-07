import { Module } from "@nestjs/common";
import { GraphModule } from "../graph/graph.module.js";
import { AgentModule } from "../agent/agent.module.js";
import { PropagateGateway } from "./propagate.gateway.js";

@Module({
  imports: [GraphModule, AgentModule],
  providers: [PropagateGateway],
})
export class GatewayModule {}
