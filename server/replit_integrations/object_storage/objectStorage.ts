import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { randomUUID } from 'crypto';

// R2 / S3-compatible config
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

const USE_R2 = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME &&
  R2_PUBLIC_URL
);

// Local filesystem fallback (dev)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

let s3: S3Client | null = null;
if (USE_R2) {
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  console.log('✅ R2 storage configured');
} else {
  console.log('📁 Using local filesystem storage (R2 not configured)');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  async getObjectEntityUploadURL(): Promise<string> {
    const uuid = randomUUID();
    const key = `uploads/${uuid}`;

    if (USE_R2 && s3) {
      const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key });
      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return presignedUrl;
    }

    return `/objects/${key}`;
  }

  normalizeObjectEntityPath(uploadURL: string): string {
    if (USE_R2 && uploadURL.startsWith('https://')) {
      // Extract the key from the presigned URL path (before query string)
      const url = new URL(uploadURL);
      // Path is /{bucket}/{key} or /{key} depending on endpoint style
      const parts = url.pathname.split('/').filter(Boolean);
      // Remove bucket name if present as first segment
      const key = parts[0] === R2_BUCKET_NAME ? parts.slice(1).join('/') : parts.join('/');
      return `/objects/${key}`;
    }
    return uploadURL;
  }

  getPublicObjectSearchPaths(): string[] {
    return ['/objects/'];
  }

  async getObjectEntityFile(objectPath: string): Promise<string> {
    const cleanPath = objectPath.replace(/^\/objects\//, '');

    if (USE_R2) {
      return `${R2_PUBLIC_URL}/${cleanPath}`;
    }

    const filePath = path.join(UPLOAD_DIR, cleanPath);
    if (!fs.existsSync(filePath)) throw new ObjectNotFoundError();
    return filePath;
  }

  async downloadObject(filePathOrUrl: string, res: Response): Promise<void> {
    if (USE_R2) {
      res.redirect(filePathOrUrl);
    } else {
      res.sendFile(filePathOrUrl);
    }
  }
}

export async function saveBufferToStorage(
  fileName: string,
  buffer: Buffer,
  contentType: string,
  _metadata?: Record<string, string>
): Promise<string> {
  console.log(`\n📤 [STORAGE] Iniciando saveBufferToStorage:`);
  console.log(`   - Arquivo: ${fileName}`);
  console.log(`   - Tamanho: ${buffer.length} bytes`);
  console.log(`   - Type: ${contentType}`);
  console.log(`   - USE_R2: ${USE_R2}`);
  console.log(`   - S3 inicializado: ${!!s3}`);

  if (USE_R2 && s3) {
    try {
      console.log(`🔗 [STORAGE] Conectando ao R2...`);
      console.log(`   - Bucket: ${R2_BUCKET_NAME}`);
      console.log(`   - Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);

      // DIAGNOSTIC: Log buffer info before sending to AWS
      console.log(`🔍 [STORAGE-DEBUG] Buffer type before PutObjectCommand: ${typeof buffer}`);
      console.log(`🔍 [STORAGE-DEBUG] Buffer.isBuffer: ${Buffer.isBuffer(buffer)}`);
      console.log(`🔍 [STORAGE-DEBUG] Buffer constructor: ${buffer?.constructor?.name}`);
      console.log(`🔍 [STORAGE-DEBUG] Buffer length: ${buffer.length}`);
      console.log(`🔍 [STORAGE-DEBUG] First 20 bytes (hex): ${buffer.slice(0, 20).toString('hex')}`);

      // Ensure buffer is a proper Buffer object (not stringified)
      const binaryBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as any);

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: fileName,
        Body: binaryBuffer,
        ContentType: contentType,
      });

      console.log(`📨 [STORAGE] Enviando comando PutObject...`);
      console.log(`🔍 [STORAGE-DEBUG] Comando Body type: ${typeof (command.input as any).Body}`);
      console.log(`🔍 [STORAGE-DEBUG] Comando Body isBuffer: ${Buffer.isBuffer((command.input as any).Body)}`);

      const result = await s3.send(command);
      console.log(`✅ [STORAGE] Sucesso no R2! Resultado:`, result.$metadata?.httpStatusCode);

      return `/objects/${fileName}`;
    } catch (error) {
      console.error(`❌ [STORAGE] ERRO NO R2:`, error);
      console.error(`   - Message: ${(error as any)?.message}`);
      console.error(`   - Code: ${(error as any)?.Code}`);
      console.error(`   - Name: ${(error as any)?.name}`);
      throw error;
    }
  }

  // Local fallback
  console.log(`💾 [STORAGE] Usando armazenamento local (fallback)...`);
  const dir = path.join(UPLOAD_DIR, path.dirname(fileName));
  ensureDir(dir);
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ [STORAGE] Arquivo salvo localmente: ${filePath}`);
  return `/objects/${fileName}`;
}

// Legacy compatibility shim
export const objectStorageClient = {
  bucket: (_bucketName: string) => ({
    file: (objectPath: string) => ({
      save: async (buffer: Buffer, options?: { contentType?: string; metadata?: any }) => {
        if (USE_R2 && s3) {
          await s3.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: objectPath,
            Body: buffer,
            ContentType: options?.contentType,
          }));
        } else {
          const dir = path.join(UPLOAD_DIR, path.dirname(objectPath));
          ensureDir(dir);
          fs.writeFileSync(path.join(UPLOAD_DIR, objectPath), buffer);
        }
      },
    }),
  }),
};

export { UPLOAD_DIR };
