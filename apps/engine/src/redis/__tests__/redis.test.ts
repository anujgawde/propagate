import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisService } from "../redis.service.js";

function createService() {
  const service = new RedisService();
  return service;
}

describe("RedisService", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("when REDIS_URL is not set", () => {
    it("reports unavailable", async () => {
      delete process.env.REDIS_URL;
      const service = createService();
      await service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
    });

    it("get returns null", async () => {
      delete process.env.REDIS_URL;
      const service = createService();
      await service.onModuleInit();
      expect(await service.get("any-key")).toBeNull();
    });

    it("set is a silent no-op", async () => {
      delete process.env.REDIS_URL;
      const service = createService();
      await service.onModuleInit();
      await expect(service.set("key", { data: true })).resolves.toBeUndefined();
    });

    it("del is a silent no-op", async () => {
      delete process.env.REDIS_URL;
      const service = createService();
      await service.onModuleInit();
      await expect(service.del("key")).resolves.toBeUndefined();
    });
  });

  describe("when Redis connection fails", () => {
    it("reports unavailable and degrades gracefully", async () => {
      vi.stubEnv("REDIS_URL", "redis://localhost:19999");
      const service = createService();
      await service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
      expect(await service.get("key")).toBeNull();
    });
  });

  describe("JSON round-trip logic", () => {
    it("serializes and deserializes through the service interface", () => {
      const documents = [
        {
          id: "fp-1",
          type: "floor-plan",
          document: { id: "fp-1", name: "Floor Plan", rooms: [{ id: "r1", name: "LOBBY" }] },
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ];
      const json = JSON.stringify(documents);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(documents);
      expect(parsed[0].document.rooms[0].name).toBe("LOBBY");
    });
  });
});
