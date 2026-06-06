import { Module } from "@nestjs/common";
import { PropagateGateway } from "./propagate.gateway";

@Module({
  providers: [PropagateGateway],
})
export class GatewayModule {}
