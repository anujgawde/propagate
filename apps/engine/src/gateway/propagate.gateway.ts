import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { Change, PropagationTarget } from "@propagate/contracts";
import { GraphService } from "../graph/graph.service.js";

@WebSocketGateway({ cors: true })
export class PropagateGateway {
  constructor(private readonly graphService: GraphService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("edit:submit")
  handleEdit(
    @MessageBody() change: Change,
    @ConnectedSocket() client: Socket,
  ) {
    this.graphService.applyChange(change);
    client.broadcast.emit("edit:broadcast", change);
  }

  @SubscribeMessage("propagate:submit")
  handlePropagate(
    @MessageBody() targets: PropagationTarget[],
    @ConnectedSocket() client: Socket,
  ) {
    this.graphService.applyPropagation(targets);
    const changes: Change[] = targets.map((t) => ({
      docId: t.docId,
      elementPath: t.elementPath,
      oldValue: t.currentValue,
      newValue: t.proposedValue,
    }));
    client.broadcast.emit("propagate:broadcast", changes);
  }
}
