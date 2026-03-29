/**
 * Logging Sanitization
 * Ensures logs never contain Personally Identifiable Information (PII)
 */

type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Patterns to remove from log output
 */
const PII_PATTERNS = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },

  // UUIDs/User IDs
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: "[UUID]" },

  // Numeric IDs (4+ digits)
  { pattern: /user[_-]?id["\']?\s*[:=]\s*["\']?(\d+)["\']?/gi, replacement: 'user_id="[ID]"' },
  { pattern: /user[_-]?id["\']?\s*[:=]\s*["\']?([0-9a-f-]+)["\']?/gi, replacement: 'user_id="[ID]"' },

  // Phone numbers
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: "[PHONE]" },

  // IP addresses
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: "[IP]" },

  // Session IDs and tokens (commonly long hex strings)
  { pattern: /session[_-]?id["\']?\s*[:=]\s*["\']?([0-9a-f]{20,})["\']?/gi, replacement: 'session_id="[TOKEN]"' },
  { pattern: /token["\']?\s*[:=]\s*["\']?([0-9a-zA-Z._-]{20,})["\']?/gi, replacement: 'token="[TOKEN]"' },

  // API Keys and secrets
  { pattern: /api[_-]?key["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_.-]{16,})["\']?/gi, replacement: 'api_key="[SECRET]"' },
  { pattern: /secret["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_.-]{16,})["\']?/gi, replacement: 'secret="[SECRET]"' },
  { pattern: /password["\']?\s*[:=]\s*["\']?([^"\']+)["\']?/gi, replacement: 'password="[REDACTED]"' },
];

/**
 * Sanitize log message by removing PII
 */
export function sanitizeLogMessage(message: any): string {
  if (!message) return "";

  let text = typeof message === "string" ? message : JSON.stringify(message);

  // Apply all PII removal patterns
  for (const { pattern, replacement } of PII_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

/**
 * Sanitize an object by removing PII from all string values
 */
export function sanitizeLogObject(obj: any): any {
  if (!obj) return obj;

  if (typeof obj === "string") {
    return sanitizeLogMessage(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeLogObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys entirely
      if (["password", "token", "secret", "apiKey", "creditCard"].some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeLogMessage(value);
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeLogObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Safe logging function that sanitizes before logging
 */
export const secureLog = {
  info: (message: string, data?: any) => {
    const sanitized = data ? sanitizeLogObject(data) : undefined;
    console.log(`[INFO] ${sanitizeLogMessage(message)}`, sanitized || "");
  },

  warn: (message: string, data?: any) => {
    const sanitized = data ? sanitizeLogObject(data) : undefined;
    console.warn(`[WARN] ${sanitizeLogMessage(message)}`, sanitized || "");
  },

  error: (message: string, data?: any) => {
    const sanitized = data ? sanitizeLogObject(data) : undefined;
    console.error(`[ERROR] ${sanitizeLogMessage(message)}`, sanitized || "");
  },

  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
      const sanitized = data ? sanitizeLogObject(data) : undefined;
      console.debug(`[DEBUG] ${sanitizeLogMessage(message)}`, sanitized || "");
    }
  },
};
