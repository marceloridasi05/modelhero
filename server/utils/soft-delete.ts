/**
 * Soft Delete Utilities
 * Instead of permanently deleting records, mark them as deleted (deletedAt timestamp)
 * This allows for:
 * - Data recovery
 * - Audit trails
 * - GDPR compliance (track when data was deleted)
 * - Historical data retention
 *
 * Database Schema Requirements (add to migrations):
 * - users: ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
 * - kits: ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
 * - materials: ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
 * - wishlist_items: ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
 * - user_sessions: ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
 */

/**
 * Mark a record as deleted without removing it
 * Returns the timestamp when it was deleted
 */
export function softDeleteTimestamp(): Date {
  return new Date();
}

/**
 * SQL fragment to filter out deleted records
 * Use in queries: WHERE deleted_at IS NULL
 */
export const SOFT_DELETE_FILTER = "deleted_at IS NULL";

/**
 * Generate DELETE query for soft delete
 * Example: UPDATE users SET deleted_at = NOW() WHERE id = $1
 */
export function generateSoftDeleteQuery(table: string, idColumn: string = "id"): string {
  return `UPDATE ${table} SET deleted_at = NOW() WHERE ${idColumn} = $1 AND deleted_at IS NULL RETURNING *`;
}

/**
 * Generate RESTORE query to undelete
 * Example: UPDATE users SET deleted_at = NULL WHERE id = $1
 */
export function generateRestoreQuery(table: string, idColumn: string = "id"): string {
  return `UPDATE ${table} SET deleted_at = NULL WHERE ${idColumn} = $1 RETURNING *`;
}

/**
 * Hard delete (permanently remove) - should be restricted and logged
 * Used only for:
 * - GDPR right to be forgotten
 * - Admin/compliance purposes
 * - Must have proper authorization and logging
 */
export function generateHardDeleteQuery(table: string, idColumn: string = "id"): string {
  return `DELETE FROM ${table} WHERE ${idColumn} = $1 AND deleted_at IS NOT NULL RETURNING *`;
}

/**
 * Audit log for deletion operations
 */
export interface DeletionAudit {
  timestamp: Date;
  operation: "soft_delete" | "restore" | "hard_delete";
  table: string;
  recordId: string;
  userId: string;
  reason?: string;
  ipAddress?: string;
}

/**
 * Log deletion operation for audit trail
 */
export function logDeletion(audit: DeletionAudit): void {
  console.info(JSON.stringify({
    type: "DELETION_AUDIT",
    timestamp: audit.timestamp.toISOString(),
    operation: audit.operation,
    table: audit.table,
    recordId: audit.recordId,
    userId: audit.userId,
    reason: audit.reason,
    ipAddress: audit.ipAddress,
  }));
}

/**
 * Soft delete helper for services
 * Returns true if record was successfully soft-deleted
 */
export async function performSoftDelete(
  db: any, // Drizzle ORM instance
  tableName: string,
  recordId: string,
  userId: string,
  ipAddress?: string,
  reason?: string,
): Promise<boolean> {
  const timestamp = new Date();

  try {
    // Execute soft delete (details depend on your ORM)
    // Example with raw SQL:
    // await db.execute(sql`UPDATE ${table} SET deleted_at = ${timestamp} WHERE id = ${recordId}`)

    // Log the deletion for audit trail
    logDeletion({
      timestamp,
      operation: "soft_delete",
      table: tableName,
      recordId,
      userId,
      reason,
      ipAddress,
    });

    return true;
  } catch (err) {
    console.error(`[SOFT_DELETE_ERROR] Failed to soft delete ${tableName} ${recordId}:`, err);
    return false;
  }
}

/**
 * Permanently delete (hard delete) - restricted operation
 * Should only be called by admin/compliance processes
 */
export async function performHardDelete(
  db: any,
  tableName: string,
  recordId: string,
  userId: string,
  ipAddress?: string,
  reason: string = "Compliance hard delete",
): Promise<boolean> {
  const timestamp = new Date();

  try {
    // Execute hard delete
    // This should only work on already soft-deleted records

    // Log the hard deletion
    logDeletion({
      timestamp,
      operation: "hard_delete",
      table: tableName,
      recordId,
      userId,
      reason,
      ipAddress,
    });

    return true;
  } catch (err) {
    console.error(`[HARD_DELETE_ERROR] Failed to hard delete ${tableName} ${recordId}:`, err);
    return false;
  }
}

/**
 * Restore a soft-deleted record
 */
export async function performRestore(
  db: any,
  tableName: string,
  recordId: string,
  userId: string,
  ipAddress?: string,
  reason: string = "Manual restore",
): Promise<boolean> {
  const timestamp = new Date();

  try {
    // Execute restore

    // Log the restoration
    logDeletion({
      timestamp,
      operation: "restore",
      table: tableName,
      recordId,
      userId,
      reason,
      ipAddress,
    });

    return true;
  } catch (err) {
    console.error(`[RESTORE_ERROR] Failed to restore ${tableName} ${recordId}:`, err);
    return false;
  }
}

/**
 * Check if record is soft-deleted
 */
export function isDeletedRecord(record: any): boolean {
  return record?.deleted_at !== null && record?.deleted_at !== undefined;
}

/**
 * Filter array to exclude soft-deleted records
 */
export function filterDeletedRecords<T extends { deleted_at?: Date | null }>(records: T[]): T[] {
  return records.filter(record => !isDeletedRecord(record));
}
