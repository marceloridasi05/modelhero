import { fileTypeFromBuffer } from "file-type";

/**
 * Upload validation utilities
 * Prevents:
 * - Malicious file type uploads (checked by magic bytes, not extension)
 * - Oversized files
 * - Unsafe filenames
 */

// Allowed MIME types for different upload contexts
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
export const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB - increased for high-quality photos
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
}

/**
 * Validate file type by checking magic bytes (file signature)
 * More secure than relying on MIME type header alone
 */
export async function validateFileType(
  buffer: Buffer,
  allowedTypes: string[],
): Promise<ValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        valid: false,
        error: "Tipo de arquivo não detectado ou inválido",
      };
    }

    if (!allowedTypes.includes(fileType.mime)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Aceitos: ${allowedTypes.join(", ")}`,
      };
    }

    return {
      valid: true,
      mimeType: fileType.mime,
    };
  } catch (error) {
    console.error("[UPLOAD_VALIDATION] Error validating file type:", error);
    return {
      valid: false,
      error: "Erro ao validar tipo de arquivo",
    };
  }
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): ValidationResult {
  if (size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxMB}MB`,
    };
  }

  if (size === 0) {
    return {
      valid: false,
      error: "Arquivo vazio",
    };
  }

  return { valid: true };
}

/**
 * Generate safe filename
 * Prevents directory traversal and other filename-based attacks
 */
export function generateSafeFilename(originalFilename: string): string {
  // Remove path traversal attempts
  const basename = originalFilename.split(/[\\/]/).pop() || "file";

  // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
  const safe = basename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe chars with underscore
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
    .substring(0, 255); // Limit length

  // Add timestamp to avoid collisions
  const timestamp = Date.now();
  const lastDotIndex = safe.lastIndexOf(".");
  const [name, ext] =
    lastDotIndex > 0 ? [safe.substring(0, lastDotIndex), safe.substring(lastDotIndex + 1)] : [safe, ""];

  return `${name}_${timestamp}${ext ? "." + ext : ""}`;
}

/**
 * Validate image file (JPEG, PNG, WebP, GIF)
 */
export async function validateImageFile(
  buffer: Buffer,
  size: number,
): Promise<ValidationResult> {
  // Check size first (faster)
  const sizeValidation = validateFileSize(size, MAX_IMAGE_SIZE);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Check file type by magic bytes
  return validateFileType(buffer, ALLOWED_IMAGE_TYPES);
}

/**
 * Validate document file (PDF)
 */
export async function validateDocumentFile(
  buffer: Buffer,
  size: number,
): Promise<ValidationResult> {
  // Check size first (faster)
  const sizeValidation = validateFileSize(size, MAX_DOCUMENT_SIZE);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Check file type by magic bytes
  return validateFileType(buffer, ALLOWED_DOCUMENT_TYPES);
}

/**
 * Log upload validation failure
 */
export function logUploadValidationFailure(
  userId: string,
  filename: string,
  error: string,
  fileSize?: number,
): void {
  console.warn("[UPLOAD_SECURITY]", {
    timestamp: new Date().toISOString(),
    userId,
    filename,
    error,
    fileSize,
  });
}
