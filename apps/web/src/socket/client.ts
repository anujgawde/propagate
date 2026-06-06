import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@propagate/contracts";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3001";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  ENGINE_URL,
  { autoConnect: false },
);
