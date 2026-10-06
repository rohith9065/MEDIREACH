import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { ROLES } from "../../shared/constants/roles";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Passw0rd!";

interface SeedUser {
  name: string;
  email: string;
  phone: string;
  role: string;
  latitude?: number;
  longitude?: number;
}

// One account per role so RBAC is testable immediately, without needing the
// real hospital-invite / super-admin-approval flows that arrive in later phases.
const seedUsers: SeedUser[] = [
  {
    name: "Demo Patient",
    email: "patient@demo.medireach.dev",
    phone: "+919800000001",
    role: ROLES.PATIENT,
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    name: "Demo Hospital Admin",
    email: "hospitaladmin@demo.medireach.dev",
    phone: "+919800000002",
    role: ROLES.HOSPITAL_ADMIN,
  },
  {
    name: "Demo Doctor",
    email: "doctor@demo.medireach.dev",
    phone: "+919800000003",
    role: ROLES.DOCTOR,
  },
  {
    name: "Demo Ambulance Driver",
    email: "driver@demo.medireach.dev",
    phone: "+919800000004",
    role: ROLES.AMBULANCE_DRIVER,
  },
  {
    name: "Demo Super Admin",
    email: "superadmin@demo.medireach.dev",
    phone: "+919800000005",
    role: ROLES.SUPER_ADMIN,
  },
];

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    for (const u of seedUsers) {
      await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, role, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [u.name, u.email, u.phone, passwordHash, u.role, u.latitude ?? null, u.longitude ?? null],
      );
    }

    console.log(`\nSeeded ${seedUsers.length} demo users (shared password: "${DEMO_PASSWORD}"):`);
    seedUsers.forEach((u) => console.log(`  - [${u.role}] ${u.email}`));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
