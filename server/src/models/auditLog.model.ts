import { Pool, PoolClient } from "pg";
import { pool } from "../config/db";
import { AuditAction } from "../../../shared/types/admin";

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

// Always called from inside the same transaction as the change it's recording (see
// admin.service.ts) so the audit trail can never drift from what actually happened.
export async function insertAuditLog(
  entry: {
    actorUserId: string | null;
    action: AuditAction;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.actorUserId, entry.action, entry.targetType, entry.targetId ?? null, entry.metadata ?? null],
  );
}

export async function listAuditLogs(limit: number, offset: number): Promise<AuditLogRow[]> {
  const result = await pool.query<AuditLogRow>(
    `SELECT a.*, u.name AS actor_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}
