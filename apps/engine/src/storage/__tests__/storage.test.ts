import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "../storage.service.js";

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(() => ({})),
  cert: vi.fn((val: unknown) => val),
}));

const mockSave = vi.fn(() => Promise.resolve());
const mockMakePublic = vi.fn(() => Promise.resolve());
const mockPublicUrl = vi.fn(() => "https://storage.googleapis.com/bucket/uploads/doc-1/plan.ifc");
const mockFile = vi.fn(() => ({
  save: mockSave,
  makePublic: mockMakePublic,
  publicUrl: mockPublicUrl,
}));
const mockBucket = { file: mockFile };

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(() => ({ bucket: () => mockBucket })),
}));

describe("StorageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("when FIREBASE_STORAGE_BUCKET is not set", () => {
    it("reports unavailable", async () => {
      delete process.env.FIREBASE_STORAGE_BUCKET;
      const service = new StorageService();
      await service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
    });

    it("upload returns null", async () => {
      delete process.env.FIREBASE_STORAGE_BUCKET;
      const service = new StorageService();
      await service.onModuleInit();
      const result = await service.upload(Buffer.from("data"), "file.ifc", "doc-1");
      expect(result).toBeNull();
    });
  });

  describe("when Firebase is configured", () => {
    beforeEach(() => {
      vi.stubEnv("FIREBASE_STORAGE_BUCKET", "my-bucket.appspot.com");
    });

    it("reports available", async () => {
      const service = new StorageService();
      await service.onModuleInit();
      expect(service.isAvailable()).toBe(true);
    });

    it("uploads file and returns public URL", async () => {
      const service = new StorageService();
      await service.onModuleInit();
      const buffer = Buffer.from("ifc-content");
      const url = await service.upload(buffer, "plan.ifc", "doc-1");
      expect(url).toBe("https://storage.googleapis.com/bucket/uploads/doc-1/plan.ifc");
      expect(mockFile).toHaveBeenCalledWith("uploads/doc-1/plan.ifc");
      expect(mockSave).toHaveBeenCalledWith(buffer);
      expect(mockMakePublic).toHaveBeenCalled();
    });

    it("uses uploads/{docId}/{fileName} path convention", async () => {
      const service = new StorageService();
      await service.onModuleInit();
      await service.upload(Buffer.from("data"), "schedule.xlsx", "abc-123");
      expect(mockFile).toHaveBeenCalledWith("uploads/abc-123/schedule.xlsx");
    });

    it("returns null on upload failure", async () => {
      mockSave.mockRejectedValueOnce(new Error("network error"));
      const service = new StorageService();
      await service.onModuleInit();
      const result = await service.upload(Buffer.from("data"), "file.pdf", "doc-1");
      expect(result).toBeNull();
    });
  });
});
