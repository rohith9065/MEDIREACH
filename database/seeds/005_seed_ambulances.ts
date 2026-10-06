import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Passw0rd!";
const HOSPITAL_REGISTRATION_NUMBER = "MEDIREACH-DEMO-0001";

// The existing driver@demo.medireach.dev seed user (001_seed_users.ts) is AMBULANCE_DRIVER
// role but has no ambulance yet. Link it, plus one new second driver at a farther distance so
// the decline-then-retry-next-nearest flow is exercisable without using the hospital-web
// "add ambulance" form first.
const SECOND_DRIVER_EMAIL = "driver2@demo.medireach.dev";

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hospitalRes = await pool.query<{ id: string }>(`SELECT id FROM hospitals WHERE registration_number = $1`, [
      HOSPITAL_REGISTRATION_NUMBER,
    ]);
    const hospitalId = hospitalRes.rows[0]?.id;
    if (!hospitalId) {
      console.log("City Care Hospital not seeded yet — skipping ambulance seed.");
      return;
    }

    const firstDriverRes = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
      "driver@demo.medireach.dev",
    ]);
    const firstDriverId = firstDriverRes.rows[0]?.id;
    if (firstDriverId) {
      await pool.query(
        `INSERT INTO ambulances (hospital_id, driver_id, vehicle_number, status, latitude, longitude, last_location_update)
         VALUES ($1, $2, $3, 'AVAILABLE', $4, $5, now())
         ON CONFLICT (driver_id) DO UPDATE SET status = 'AVAILABLE', latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
        [hospitalId, firstDriverId, "KA-01-AB-1001", 12.9716, 77.5946],
      );
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const secondDriverRes = await pool.query<{ id: string }>(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'AMBULANCE_DRIVER')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ["Demo Ambulance Driver 2", SECOND_DRIVER_EMAIL, "+919800000006", passwordHash],
    );
    const secondDriverId = secondDriverRes.rows[0].id;
    await pool.query(
      `INSERT INTO ambulances (hospital_id, driver_id, vehicle_number, status, latitude, longitude, last_location_update)
       VALUES ($1, $2, $3, 'AVAILABLE', $4, $5, now())
       ON CONFLICT (driver_id) DO UPDATE SET status = 'AVAILABLE', latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
      [hospitalId, secondDriverId, "KA-01-AB-1002", 13.02, 77.65],
    );

    console.log(`\nSeeded 2 ambulances at City Care Hospital (${hospitalId}):`);
    console.log(`  - KA-01-AB-1001, driver@demo.medireach.dev, near City Care`);
    console.log(`  - KA-01-AB-1002, ${SECOND_DRIVER_EMAIL} (password: "${DEMO_PASSWORD}"), ~9km away`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Ambulance seeding failed:", err);
  process.exit(1);
});
