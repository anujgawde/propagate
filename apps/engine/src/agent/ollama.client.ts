import { Injectable } from "@nestjs/common";

export class OllamaUnavailableError extends Error {
  constructor(message = "Ollama is not reachable") {
    super(message);
    this.name = "OllamaUnavailableError";
  }
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private cachedAvailable: boolean | null = null;
  private cacheExpiry = 0;
  private static readonly CACHE_TTL_MS = 30_000;
  private static readonly REQUEST_TIMEOUT_MS = 30_000;
  private static readonly HEALTH_TIMEOUT_MS = 2_000;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
    this.model = process.env.OLLAMA_MODEL ?? "llama3.1";
  }

  getModel(): string {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    if (this.cachedAvailable !== null && Date.now() < this.cacheExpiry) {
      return this.cachedAvailable;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(OllamaClient.HEALTH_TIMEOUT_MS),
      });
      this.cachedAvailable = res.ok;
    } catch {
      this.cachedAvailable = false;
    }

    this.cacheExpiry = Date.now() + OllamaClient.CACHE_TTL_MS;
    return this.cachedAvailable;
  }

  async chat(messages: OllamaChatMessage[]): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, messages, stream: false }),
        signal: AbortSignal.timeout(OllamaClient.REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new OllamaUnavailableError();
    }

    if (!res.ok) {
      throw new OllamaUnavailableError(`Ollama responded with ${res.status}`);
    }

    const body = (await res.json()) as { message?: { content?: string } };
    return body.message?.content ?? "";
  }

  clearCache(): void {
    this.cachedAvailable = null;
    this.cacheExpiry = 0;
  }
}
