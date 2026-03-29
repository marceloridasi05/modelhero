import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { kits, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * AUTHORIZATION MIDDLEWARE
 * Previne IDOR, escalação de privilégio e acesso não autorizado
 */

/**
 * Valida se usuário está autenticado
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as any;

  if (!user || !user.id) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
    });
  }

  // Opcional: Validar se usuário ainda existe e não foi deletado
  try {
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord.length) {
      req.logOut(() => {});
      return res.status(401).json({
        error: "User not found",
        code: "USER_DELETED",
      });
    }

    // Validar se conta está ativa (se houver campo active)
    if ((userRecord[0] as any).deletedAt) {
      req.logOut(() => {});
      return res.status(401).json({
        error: "Account deleted",
        code: "ACCOUNT_DELETED",
      });
    }

    next();
  } catch (err) {
    console.error("[AUTH_ERROR]", err);
    return res.status(500).json({
      error: "Authentication check failed",
      code: "AUTH_CHECK_FAILED",
    });
  }
}

/**
 * Valida se usuário é admin
 * Deve ser usado APÓS requireAuth
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as any;

  if (!user || user.isAdmin !== true) {
    console.warn(
      `[SECURITY_ALERT] Unauthorized admin access attempt by user: ${user?.id || "unknown"} | Path: ${req.path}`
    );

    // Log auditoria
    try {
      console.info({
        type: "SECURITY_INCIDENT",
        incident: "UNAUTHORIZED_ADMIN_ACCESS",
        userId: user?.id || "unknown",
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to log security incident", e);
    }

    return res.status(403).json({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  }

  next();
}

/**
 * Valida se usuário é proprietário do kit
 * Deve ser usado APÓS requireAuth
 * Previne IDOR (Insecure Direct Object Reference)
 */
export async function requireKitOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as any)?.id;
  const kitId = req.params.id;

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
    });
  }

  if (!kitId) {
    return res.status(400).json({
      error: "Kit ID is required",
      code: "INVALID_REQUEST",
    });
  }

  try {
    // Validar que kit pertence ao usuário autenticado
    const kit = await db
      .select()
      .from(kits)
      .where(and(eq(kits.id, kitId), eq(kits.userId, userId)))
      .limit(1);

    if (!kit.length) {
      // NÃO revelar se kit não existe vs. não pertence ao usuário
      console.warn(
        `[IDOR_ATTEMPT] User ${userId} tried to access kit ${kitId} they don't own`
      );

      return res.status(404).json({
        error: "Kit not found",
        code: "NOT_FOUND",
      });
    }

    // Anexar kit validado ao request para evitar query duplicada
    (req as any).kit = kit[0];
    next();
  } catch (err) {
    console.error("[KIT_OWNERSHIP_CHECK_ERROR]", err);
    return res.status(500).json({
      error: "Authorization check failed",
      code: "AUTH_CHECK_FAILED",
    });
  }
}

/**
 * Log de auditoria para ações sensíveis
 */
export function auditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) {
  console.info({
    type: "AUDIT",
    timestamp: new Date().toISOString(),
    userId,
    action,
    resourceType,
    resourceId,
    details: details ? JSON.stringify(details) : undefined,
  });
}

/**
 * Middleware para anexar auditLog ao request
 */
export function auditLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  (req as any).auditLog = auditLog;
  next();
}
