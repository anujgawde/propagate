import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis | null = null;
  private available = false;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) return;
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      await this.client.connect();
      this.available = true;
      this.logger.log("Redis connected");
    } catch {
      this.logger.warn("Redis unavailable — running in-memory only");
      this.client = null;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.error(`Redis GET failed for key "${key}"`, err);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.available || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value));
    } catch (err) {
      this.logger.error(`Redis SET failed for key "${key}"`, err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.available || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis DEL failed for key "${key}"`, err);
    }
  }
}
