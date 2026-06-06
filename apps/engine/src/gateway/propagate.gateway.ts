import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import type { Change } from "@propagate/contracts";

@WebSocketGateway({ cors: true })
export class PropagateGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("edit:submit")
  handleEdit(@MessageBody() change: Change) {
    this.server.emit("edit:broadcast", change);
  }
}
