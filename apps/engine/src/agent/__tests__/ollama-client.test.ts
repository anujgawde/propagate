import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OllamaClient, OllamaUnavailableError } from "../ollama.client.js";

describe("OllamaClient", () => {
  let client: OllamaClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new OllamaClient();
    client.clearCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("isAvailable", () => {
    it("returns true when Ollama responds 200", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
      expect(await client.isAvailable()).toBe(true);
    });

    it("returns false when Ollama responds non-200", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
      expect(await client.isAvailable()).toBe(false);
    });

    it("returns false when fetch throws", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      expect(await client.isAvailable()).toBe(false);
    });

    it("caches the result for subsequent calls", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch;

      await client.isAvailable();
      await client.isAvailable();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("re-fetches after cache is cleared", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch;

      await client.isAvailable();
      client.clearCache();
      await client.isAvailable();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("chat", () => {
    it("returns message content from Ollama response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { role: "assistant", content: "Hello from LLM" },
          }),
      });

      const result = await client.chat([
        { role: "user", content: "Hi" },
      ]);
      expect(result).toBe("Hello from LLM");
    });

    it("throws OllamaUnavailableError when fetch fails", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(
        client.chat([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow(OllamaUnavailableError);
    });

    it("throws OllamaUnavailableError on non-200 response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        client.chat([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow(OllamaUnavailableError);
    });

    it("returns empty string when response has no content", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await client.chat([
        { role: "user", content: "Hi" },
      ]);
      expect(result).toBe("");
    });

    it("sends correct request body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ message: { content: "ok" } }),
      });
      globalThis.fetch = mockFetch;

      await client.chat([
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello" },
      ]);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/chat");
      const body = JSON.parse(opts.body);
      expect(body.messages).toHaveLength(2);
      expect(body.stream).toBe(false);
      expect(body.model).toBe("llama3.1");
    });
  });

  describe("getModel", () => {
    it("returns the configured model name", () => {
      expect(client.getModel()).toBe("llama3.1");
    });
  });
});
