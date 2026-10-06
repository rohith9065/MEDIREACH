import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE TYPE appointment_status AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');`);
  pgm.sql(
    `CREATE TYPE queue_status AS ENUM ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED');`,
  );

  // One weekly window per day per doctor (no split shifts) — a deliberate Phase 6
  // simplification; a doctor needing a split day would need two rows today, unsupported.
  pgm.sql(`
    CREATE TABLE doctor_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (end_time > start_time),
      UNIQUE (doctor_id, day_of_week)
    );
  `);

  pgm.sql(`
    CREATE TABLE appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      status appointment_status NOT NULL DEFAULT 'BOOKED',
      token_number INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (doctor_id, appointment_date, appointment_time)
    );
  `);
  pgm.sql(`CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();`);
  pgm.sql(`CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);`);
  pgm.sql(`CREATE INDEX idx_appointments_patient ON appointments(patient_id);`);

  pgm.sql(`
    CREATE TABLE queue_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_number INT NOT NULL,
      status queue_status NOT NULL DEFAULT 'WAITING',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      called_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `);
  pgm.sql(`CREATE INDEX idx_queue_tokens_hospital_doctor ON queue_tokens(hospital_id, doctor_id, status);`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS queue_tokens;`);
  pgm.sql(`DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;`);
  pgm.sql(`DROP TABLE IF EXISTS appointments;`);
  pgm.sql(`DROP TABLE IF EXISTS doctor_schedules;`);
  pgm.sql(`DROP TYPE IF EXISTS queue_status;`);
  pgm.sql(`DROP TYPE IF EXISTS appointment_status;`);
}
