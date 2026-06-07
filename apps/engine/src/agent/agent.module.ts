import { Module } from "@nestjs/common";
import { OllamaClient } from "./ollama.client.js";
import { AgentService } from "./agent.service.js";

@Module({
  providers: [OllamaClient, AgentService],
  exports: [AgentService],
})
export class AgentModule {}
