import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE TYPE ambulance_status AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFFLINE', 'MAINTENANCE');`);
  pgm.sql(`
    CREATE TYPE ambulance_request_status AS ENUM (
      'REQUESTED', 'ACCEPTED', 'GOING_TO_PATIENT', 'ARRIVED_AT_PATIENT',
      'GOING_TO_HOSPITAL', 'ARRIVED_AT_HOSPITAL', 'COMPLETED', 'CANCELLED'
    );
  `);

  pgm.sql(`
    CREATE TABLE ambulances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      driver_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      vehicle_number TEXT NOT NULL UNIQUE,
      status ambulance_status NOT NULL DEFAULT 'OFFLINE',
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      last_location_update TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  pgm.sql(`
    CREATE TRIGGER trg_ambulances_updated_at BEFORE UPDATE ON ambulances
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
  pgm.sql(`CREATE INDEX idx_ambulances_hospital ON ambulances(hospital_id);`);
  pgm.sql(`CREATE INDEX idx_ambulances_available ON ambulances(status) WHERE status = 'AVAILABLE';`);

  pgm.sql(`
    CREATE TABLE ambulance_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ambulance_id UUID REFERENCES ambulances(id) ON DELETE SET NULL,
      hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
      pickup_latitude DOUBLE PRECISION NOT NULL,
      pickup_longitude DOUBLE PRECISION NOT NULL,
      destination_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
      status ambulance_request_status NOT NULL DEFAULT 'REQUESTED',
      cancellation_reason TEXT,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      accepted_at TIMESTAMPTZ,
      arrived_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
  `);
  pgm.sql(`CREATE INDEX idx_ambulance_requests_patient ON ambulance_requests(patient_id);`);
  pgm.sql(`CREATE INDEX idx_ambulance_requests_ambulance ON ambulance_requests(ambulance_id);`);

  pgm.sql(`
    CREATE TABLE ambulance_request_declines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID NOT NULL REFERENCES ambulance_requests(id) ON DELETE CASCADE,
      ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
      declined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (request_id, ambulance_id)
    );
  `);

  pgm.sql(`
    CREATE TABLE ambulance_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  pgm.sql(`CREATE INDEX idx_ambulance_locations_ambulance ON ambulance_locations(ambulance_id, recorded_at DESC);`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS ambulance_locations;`);
  pgm.sql(`DROP TABLE IF EXISTS ambulance_request_declines;`);
  pgm.sql(`DROP TABLE IF EXISTS ambulance_requests;`);
  pgm.sql(`DROP TRIGGER IF EXISTS trg_ambulances_updated_at ON ambulances;`);
  pgm.sql(`DROP TABLE IF EXISTS ambulances;`);
  pgm.sql(`DROP TYPE IF EXISTS ambulance_request_status;`);
  pgm.sql(`DROP TYPE IF EXISTS ambulance_status;`);
}
