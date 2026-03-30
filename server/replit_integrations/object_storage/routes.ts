import type { Express, RequestHandler, Request } from "express";
import rateLimit from "express-rate-limit";
import { ObjectStorageService, ObjectNotFoundError, saveBufferToStorage } from "./objectStorage";
import { generateSafeFilename, validateFileSize, logUploadValidationFailure } from "../../utils/upload-validator";
import { randomUUID } from "crypto";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These routes require authentication for uploads.
 *
 * @param app Express application
 * @param requireAuth Authentication middleware to protect upload routes
 */
export function registerObjectStorageRoutes(app: Express, requireAuth?: RequestHandler): void {
  const objectStorageService = new ObjectStorageService();

  // P2-5: Rate limiter for upload requests (50 uploads per hour per user)
  const uploadRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: "Limite de requisições de upload atingido. Tente novamente em 1 hora.",
    standardHeaders: true,
    legacyHeaders: false,
    store: new (require("express-rate-limit").MemoryStore)(),
    keyGenerator: (req: Request) => {
      const userId = (req as any).session?.userId || (req as any).user?.id || req.ip || "unknown";
      return `upload:${userId}`;
    },
  });

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "/objects/uploads/uuid",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   * This endpoint requires authentication.
   */
  const middlewares = requireAuth ? [requireAuth, uploadRequestLimiter] : [uploadRequestLimiter];

  app.post("/api/uploads/request-url", ...middlewares, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      const userId = (req as any).session?.userId || "unknown";

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      // Validate file size (15MB max for images - increased for high-quality photos)
      const MAX_SIZE = 15 * 1024 * 1024; // 15MB
      const sizeValidation = validateFileSize(size || 0, MAX_SIZE);
      if (!sizeValidation.valid) {
        logUploadValidationFailure(userId, name, sizeValidation.error || "Unknown error", size);
        return res.status(400).json({
          error: sizeValidation.error || "Arquivo inválido",
        });
      }

      // Validate content type is reasonable (basic check)
      const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
      if (contentType && !allowedContentTypes.includes(contentType)) {
        logUploadValidationFailure(userId, name, `Unsupported content type: ${contentType}`, size);
        return res.status(400).json({
          error: "Tipo de arquivo não suportado",
        });
      }

      // Sanitize filename
      const safeName = generateSafeFilename(name);

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the upload URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the sanitized metadata for client convenience
        metadata: { name: safeName, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Test endpoint - simple JSON response
   */
  app.post("/api/uploads/test", (req, res) => {
    console.log("🧪 [TEST] POST /api/uploads/test called");
    res.json({ test: "ok", received: req.body ? Object.keys(req.body) : "no body" });
  });

  /**
   * Upload file via JSON with base64 (avoids multipart/CORS issues).
   *
   * POST /api/uploads/upload
   * JSON body: { file: "base64 string", name: "filename.jpg", type: "image/jpeg" }
   *
   * Response: { url, id, name }
   */
  app.post("/api/uploads/upload", async (req, res) => {
    console.log(`\n${'='.repeat(60)}\n🔵 [UPLOAD] POST /api/uploads/upload - INÍCIO\n${'='.repeat(60)}`);

    try {
      const { file, name, type: mimeType } = req.body;
      console.log(`📥 [UPLOAD] Body recebido. File size (base64): ${file ? file.length : 0}, Name: ${name}, Type: ${mimeType}`);

      if (!file || !name) {
        console.warn("⚠️ [UPLOAD] Arquivo ou nome não fornecido");
        return res.status(400).json({ error: "Missing file or name" });
      }

      // Decode base64 to buffer
      let buffer: Buffer;
      try {
        console.log(`🔄 [UPLOAD] Decodificando base64... Tamanho: ${file.length}`);
        buffer = Buffer.from(file, 'base64');
        console.log(`📦 [UPLOAD] ✅ Buffer criado com sucesso: ${buffer.length} bytes`);
      } catch (decodeError) {
        console.error("❌ [UPLOAD] Erro ao decodificar base64:", decodeError);
        return res.status(400).json({ error: "Invalid base64 data" });
      }

      const size = buffer.length;
      const userId = (req as any).session?.userId || "unknown";
      console.log(`👤 [UPLOAD] UserID: ${userId}`);

      // Validate file size (15MB max)
      const MAX_SIZE = 15 * 1024 * 1024;
      console.log(`📏 [UPLOAD] Validando tamanho... ${size}bytes vs limite ${MAX_SIZE}`);
      const sizeValidation = validateFileSize(size, MAX_SIZE);
      if (!sizeValidation.valid) {
        console.warn("⚠️ [UPLOAD] Validação de tamanho falhou:", sizeValidation.error);
        return res.status(400).json({ error: sizeValidation.error || "File too large" });
      }
      console.log(`✅ [UPLOAD] Tamanho validado`);

      // Validate content type
      const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
      const contentType = mimeType || "image/jpeg";
      console.log(`📋 [UPLOAD] Validando tipo... ${contentType}`);
      if (!allowedContentTypes.includes(contentType)) {
        console.warn("⚠️ [UPLOAD] Tipo de arquivo não permitido:", contentType);
        return res.status(400).json({ error: "Unsupported file type" });
      }
      console.log(`✅ [UPLOAD] Tipo validado`);

      // Generate safe filename with UUID
      const fileId = randomUUID();
      const ext = name.split(".").pop() || "bin";
      const safeName = `${fileId}.${ext}`;
      const objectPath = `uploads/${safeName}`;
      console.log(`📝 [UPLOAD] Filename gerado: ${objectPath}`);

      console.log(`🚀 [UPLOAD] Iniciando saveBufferToStorage...`);

      // Upload to R2 (or local storage)
      const result = await saveBufferToStorage(objectPath, buffer, contentType);
      console.log(`✅ [UPLOAD] ✅ ✅ Arquivo salvo com SUCESSO: ${result}`);

      // Return success response with object path
      const url = `/objects/${objectPath}`;
      const response = {
        id: fileId,
        name: name,
        url: url,
        type: "image",
        thumbnail: url,
      };

      console.log(`📤 [UPLOAD] Retornando resposta:`, JSON.stringify(response).substring(0, 100));
      res.json(response);
      console.log(`\n✅ [UPLOAD] SUCESSO TOTAL!\n${'='.repeat(60)}\n`);

    } catch (error) {
      console.error(`\n❌ [UPLOAD] ❌ ❌ ERRO CRÍTICO:\n`);
      console.error("Tipo de erro:", typeof error);
      console.error("Erro:", error);
      console.error("Stack:", (error as any)?.stack);
      console.error("Message:", (error as any)?.message);
      console.error(`${'='.repeat(60)}\n`);

      res.status(500).json({
        error: "Failed to upload file",
        message: (error as any)?.message || String(error),
        type: typeof error,
      });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from local storage.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
