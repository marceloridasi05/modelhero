import type { Express, RequestHandler, Request } from "express";
import rateLimit from "express-rate-limit";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { generateSafeFilename, validateFileSize, logUploadValidationFailure } from "../../utils/upload-validator";

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
