import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { initializeApp, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

interface BucketLike {
  file(path: string): {
    save(data: Buffer): Promise<void>;
    makePublic(): Promise<unknown>;
    publicUrl(): string;
  };
}

@Injectable()
export class StorageService implements OnModuleInit {
  private bucket: BucketLike | null = null;
  private available = false;
  private readonly logger = new Logger(StorageService.name);

  async onModuleInit() {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) return;
    try {
      let app: App;
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        app = initializeApp({
          credential: cert(JSON.parse(serviceAccount)),
          storageBucket: bucketName,
        });
      } else {
        app = initializeApp({ storageBucket: bucketName });
      }
      this.bucket = getStorage(app).bucket();
      this.available = true;
      this.logger.log("Firebase Storage connected");
    } catch {
      this.logger.warn("Firebase Storage unavailable — file persistence disabled");
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async upload(
    buffer: Buffer,
    fileName: string,
    docId: string,
  ): Promise<string | null> {
    if (!this.available || !this.bucket) return null;
    const path = `uploads/${docId}/${fileName}`;
    try {
      const file = this.bucket.file(path);
      await file.save(buffer);
      await file.makePublic();
      return file.publicUrl();
    } catch (err) {
      this.logger.error(`Failed to upload ${path}`, err);
      return null;
    }
  }
}
