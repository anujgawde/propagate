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
import { AgentService } from "../agent/agent.service.js";

@WebSocketGateway({ cors: true })
export class PropagateGateway {
  constructor(
    private readonly graphService: GraphService,
    private readonly agentService: AgentService,
  ) {}

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

  @SubscribeMessage("agent:request-suggestions")
  async handleRequestSuggestions(@ConnectedSocket() client: Socket) {
    const { mismatches } = this.graphService.getState();
    const documents = this.graphService.getDocuments();
    const result = await this.agentService.suggestFixes(mismatches, documents);
    if (!result) {
      client.emit("agent:status", { available: false });
      return;
    }
    client.emit("agent:suggestions", result);
  }

  @SubscribeMessage("agent:confirm-matches")
  async handleConfirmMatches(@ConnectedSocket() client: Socket) {
    const { crossRefs } = this.graphService.getState();
    const documents = this.graphService.getDocuments();
    const result = await this.agentService.confirmFuzzyMatches(crossRefs, documents);
    if (!result) {
      client.emit("agent:status", { available: false });
      return;
    }
    client.emit("agent:match-confirmations", result);
  }

  @SubscribeMessage("agent:accept-suggestion")
  handleAcceptSuggestion(
    @MessageBody() payload: { mismatchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { mismatches } = this.graphService.getState();
    const mismatch = mismatches.find((m) => m.id === payload.mismatchId);
    if (!mismatch) return;

    const change: Change = {
      docId: mismatch.target.docId,
      elementPath: mismatch.target.elementPath,
      oldValue: mismatch.target.value,
      newValue: mismatch.source.value,
    };
    this.graphService.applyChange(change);
    client.broadcast.emit("edit:broadcast", change);
  }
}
