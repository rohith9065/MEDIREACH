import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE TYPE hospital_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');`);
  pgm.sql(`CREATE TYPE emergency_status AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');`);
  pgm.sql(`CREATE TYPE bed_type AS ENUM ('ICU', 'GENERAL', 'EMERGENCY', 'PEDIATRIC', 'MATERNITY', 'ISOLATION');`);
  pgm.sql(`CREATE TYPE facility_status AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');`);
  pgm.sql(`CREATE TYPE department_status AS ENUM ('ACTIVE', 'INACTIVE');`);
  pgm.sql(`CREATE TYPE doctor_status AS ENUM ('AVAILABLE', 'UNAVAILABLE');`);

  pgm.sql(`
    CREATE TABLE hospitals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      registration_number VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      phone VARCHAR(20),
      emergency_phone VARCHAR(20),
      email VARCHAR(255),
      address TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      rating NUMERIC(2, 1),
      verified BOOLEAN NOT NULL DEFAULT false,
      status hospital_status NOT NULL DEFAULT 'PENDING',
      emergency_status emergency_status NOT NULL DEFAULT 'UNAVAILABLE',
      emergency_status_updated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  pgm.sql(`CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION set_updated_at();`);

  // One hospital admin manages exactly one hospital in Phase 2 (UNIQUE user_id).
  // The underlying many-to-many shape from the full spec (a user could staff several
  // hospitals) can be relaxed later by dropping this constraint without a table rewrite.
  pgm.sql(`
    CREATE TABLE hospital_staff (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'HOSPITAL_ADMIN',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      status department_status NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (hospital_id, name)
    );
  `);
  pgm.sql(`CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();`);

  pgm.sql(`
    CREATE TABLE doctors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(150) NOT NULL,
      specialization VARCHAR(150),
      experience_years INT,
      consultation_fee NUMERIC(10, 2),
      status doctor_status NOT NULL DEFAULT 'AVAILABLE',
      profile_image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  pgm.sql(`CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION set_updated_at();`);
  pgm.sql(`CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);`);

  pgm.sql(`
    CREATE TABLE beds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      bed_type bed_type NOT NULL,
      total_beds INT NOT NULL DEFAULT 0 CHECK (total_beds >= 0),
      occupied_beds INT NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
      available_beds INT GENERATED ALWAYS AS (total_beds - occupied_beds) STORED,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by UUID REFERENCES users(id),
      CHECK (occupied_beds <= total_beds),
      UNIQUE (hospital_id, bed_type)
    );
  `);

  pgm.sql(`
    CREATE TABLE facilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      facility_name VARCHAR(100) NOT NULL,
      status facility_status NOT NULL DEFAULT 'UNAVAILABLE',
      quantity INT,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by UUID REFERENCES users(id),
      UNIQUE (hospital_id, facility_name)
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS facilities;`);
  pgm.sql(`DROP TABLE IF EXISTS beds;`);
  pgm.sql(`DROP TRIGGER IF EXISTS trg_doctors_updated_at ON doctors;`);
  pgm.sql(`DROP TABLE IF EXISTS doctors;`);
  pgm.sql(`DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;`);
  pgm.sql(`DROP TABLE IF EXISTS departments;`);
  pgm.sql(`DROP TABLE IF EXISTS hospital_staff;`);
  pgm.sql(`DROP TRIGGER IF EXISTS trg_hospitals_updated_at ON hospitals;`);
  pgm.sql(`DROP TABLE IF EXISTS hospitals;`);
  pgm.sql(`DROP TYPE IF EXISTS doctor_status;`);
  pgm.sql(`DROP TYPE IF EXISTS department_status;`);
  pgm.sql(`DROP TYPE IF EXISTS facility_status;`);
  pgm.sql(`DROP TYPE IF EXISTS bed_type;`);
  pgm.sql(`DROP TYPE IF EXISTS emergency_status;`);
  pgm.sql(`DROP TYPE IF EXISTS hospital_status;`);
}
