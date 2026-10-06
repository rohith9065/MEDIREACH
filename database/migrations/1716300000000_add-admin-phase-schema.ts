import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;`);

  pgm.sql(`
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);`);
  pgm.sql(`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS audit_logs;`);
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS is_active;`);
}
