/**
 * Error Sanitization Utility
 * Prevents leaking sensitive information in error responses
 *
 * Never expose:
 * - Stack traces
 * - Database details
 * - File paths
 * - Internal function names
 * - User data/emails/IDs
 * - Configuration details
 */

interface SanitizedError {
  error: string;
  code?: string;
}

/**
 * Sanitize error messages for API responses
 * Maps internal errors to generic user-friendly messages
 */
export function sanitizeErrorForResponse(err: any, userMessage: string = "An error occurred"): SanitizedError {
  if (!err) {
    return { error: userMessage };
  }

  const message = String(err?.message || err).toLowerCase();

  // Map specific error patterns to safe messages
  if (message.includes("duplicate") || message.includes("unique constraint")) {
    return { error: "Este valor já existe no sistema", code: "DUPLICATE_ENTRY" };
  }

  if (message.includes("not found") || message.includes("no such table")) {
    return { error: "Recurso não encontrado", code: "NOT_FOUND" };
  }

  if (message.includes("auth") || message.includes("permission") || message.includes("forbidden")) {
    return { error: "Permissão negada", code: "FORBIDDEN" };
  }

  if (message.includes("timeout") || message.includes("deadlock")) {
    return { error: "Operação expirou. Tente novamente", code: "TIMEOUT" };
  }

  if (message.includes("database") || message.includes("sql") || message.includes("query")) {
    return { error: "Erro ao processar requisição", code: "DB_ERROR" };
  }

  if (message.includes("network") || message.includes("econnrefused") || message.includes("socket")) {
    return { error: "Serviço indisponível. Tente novamente mais tarde", code: "SERVICE_UNAVAILABLE" };
  }

  if (message.includes("json") || message.includes("parse")) {
    return { error: "Dados inválidos", code: "INVALID_DATA" };
  }

  if (message.includes("file") || message.includes("permission denied")) {
    return { error: "Erro ao processar arquivo", code: "FILE_ERROR" };
  }

  // Default: return generic message
  return { error: userMessage, code: "INTERNAL_ERROR" };
}

/**
 * Log error with sensitive details for debugging (internal use only)
 * This should go to internal logs, not sent to client
 */
export function logError(context: string, err: any, sanitized: SanitizedError): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack?.split("\n").slice(0, 3), // Only first 3 lines
    },
    sanitized,
  }));
}

/**
 * Sanitize user data from error messages
 * Remove email addresses, IDs, phone numbers, etc.
 */
export function removePII(text: string): string {
  if (!text) return text;

  // Remove email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");

  // Remove UUIDs
  text = text.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[ID]");

  // Remove numeric IDs (4+ digits)
  text = text.replace(/\b\d{4,}\b/g, "[ID]");

  // Remove phone numbers
  text = text.replace(/\b\d{10,}\b/g, "[PHONE]");

  // Remove IP addresses
  text = text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]");

  // Remove file paths
  text = text.replace(/[a-zA-Z]:\\[\w\\.:]+|\/[\w\/.]+/g, "[PATH]");

  return text;
}

/**
 * Check if error message is safe to return to client
 */
export function isSafeErrorMessage(message: string): boolean {
  const unsafePatterns = [
    /password/i,
    /secret/i,
    /api[_-]key/i,
    /token/i,
    /credential/i,
    /database/i,
    /sql/i,
    /query/i,
    /user_id/i,
    /email/i,
    /phone/i,
    /ssn/i,
    /credit[_-]card/i,
  ];

  return !unsafePatterns.some(pattern => pattern.test(message));
}
