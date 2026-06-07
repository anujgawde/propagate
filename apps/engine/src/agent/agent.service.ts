import { Injectable } from "@nestjs/common";
import { OllamaClient } from "./ollama.client.js";

@Injectable()
export class AgentService {
  constructor(private readonly ollama: OllamaClient) {}

  async checkHealth(): Promise<{ available: boolean; model: string }> {
    const available = await this.ollama.isAvailable();
    return { available, model: this.ollama.getModel() };
  }
}
