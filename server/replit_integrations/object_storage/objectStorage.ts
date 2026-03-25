import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Garante que o diretório existe
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
    // Retorna path interno; o upload é feito via multipart no servidor
    const objectPath = `/objects/uploads/${randomUUID()}`;
    return objectPath;
  }

  normalizeObjectEntityPath(uploadURL: string): string {
    return uploadURL;
  }

  getPublicObjectSearchPaths(): string[] {
    return ['/objects/'];
  }

  async getObjectEntityFile(objectPath: string): Promise<string> {
    const cleanPath = objectPath.replace(/^\/objects\//, '');
    const filePath = path.join(UPLOAD_DIR, cleanPath);
    if (!fs.existsSync(filePath)) throw new ObjectNotFoundError();
    return filePath;
  }

  async downloadObject(filePath: string, res: Response): Promise<void> {
    res.sendFile(filePath);
  }
}

// Helper para salvar buffer em arquivo local (substitui GCS)
export async function saveBufferToStorage(
  buffer: Buffer,
  fileName: string,
  _contentType: string,
  _metadata?: Record<string, string>
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, path.dirname(fileName));
  ensureDir(dir);
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/objects/${fileName}`;
}

// Mantém compatibilidade com código legado que usava objectStorageClient
export const objectStorageClient = {
  bucket: (_bucketName: string) => ({
    file: (objectPath: string) => ({
      save: async (buffer: Buffer, options?: { contentType?: string; metadata?: any }) => {
        const dir = path.join(UPLOAD_DIR, path.dirname(objectPath));
        ensureDir(dir);
        const filePath = path.join(UPLOAD_DIR, objectPath);
        fs.writeFileSync(filePath, buffer);
      }
    })
  })
};

export { UPLOAD_DIR };
