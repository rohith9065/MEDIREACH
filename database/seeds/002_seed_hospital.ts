import { Pool } from "pg";

interface DoctorSeed {
  name: string;
  departmentName: string;
  userEmail?: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
}

const departments = [
  { name: "Cardiology", description: "Heart and cardiovascular care" },
  { name: "General Medicine", description: "General physician consultations" },
  { name: "Radiology", description: "Imaging and diagnostics" },
];

const doctors: DoctorSeed[] = [
  {
    name: "Dr. Arun Kumar",
    departmentName: "Cardiology",
    userEmail: "doctor@demo.medireach.dev",
    specialization: "Cardiologist",
    experienceYears: 12,
    consultationFee: 800,
  },
  {
    name: "Dr. Meera Nair",
    departmentName: "General Medicine",
    specialization: "General Physician",
    experienceYears: 8,
    consultationFee: 500,
  },
  {
    name: "Dr. Sanjay Rao",
    departmentName: "Radiology",
    specialization: "Radiologist",
    experienceYears: 15,
    consultationFee: 700,
  },
];

const beds = [
  { bedType: "ICU", totalBeds: 20, occupiedBeds: 17 },
  { bedType: "GENERAL", totalBeds: 100, occupiedBeds: 79 },
  { bedType: "EMERGENCY", totalBeds: 10, occupiedBeds: 6 },
];

const facilities = [
  { facilityName: "MRI", status: "AVAILABLE", quantity: 2 },
  { facilityName: "CT_SCAN", status: "AVAILABLE", quantity: 1 },
  { facilityName: "BLOOD_BANK", status: "AVAILABLE", quantity: null },
  { facilityName: "PHARMACY", status: "AVAILABLE", quantity: null },
];

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hospitalResult = await pool.query<{ id: string }>(
      `INSERT INTO hospitals (
         name, registration_number, description, phone, emergency_phone, email, address,
         latitude, longitude, rating, verified, status, emergency_status, emergency_status_updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'VERIFIED', 'AVAILABLE', now())
       ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        "City Care Hospital",
        "MEDIREACH-DEMO-0001",
        "A full-service demo hospital used to exercise the MediReach hospital portal.",
        "+911234567890",
        "+911234567891",
        "contact@citycare.demo.medireach.dev",
        "12 MG Road, Bengaluru, Karnataka",
        12.9716,
        77.5946,
        4.3,
      ],
    );
    const hospitalId = hospitalResult.rows[0].id;

    const adminResult = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
      "hospitaladmin@demo.medireach.dev",
    ]);
    if (adminResult.rows[0]) {
      await pool.query(
        `INSERT INTO hospital_staff (hospital_id, user_id, role)
         VALUES ($1, $2, 'HOSPITAL_ADMIN')
         ON CONFLICT (user_id) DO NOTHING`,
        [hospitalId, adminResult.rows[0].id],
      );
    }

    const departmentIds = new Map<string, string>();
    for (const dept of departments) {
      const res = await pool.query<{ id: string }>(
        `INSERT INTO departments (hospital_id, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (hospital_id, name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [hospitalId, dept.name, dept.description],
      );
      departmentIds.set(dept.name, res.rows[0].id);
    }

    for (const doc of doctors) {
      let userId: string | null = null;
      if (doc.userEmail) {
        const res = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [doc.userEmail]);
        userId = res.rows[0]?.id ?? null;
      }

      const existing = await pool.query<{ id: string }>(
        `SELECT id FROM doctors WHERE hospital_id = $1 AND name = $2`,
        [hospitalId, doc.name],
      );

      if (!existing.rows[0]) {
        await pool.query(
          `INSERT INTO doctors (hospital_id, department_id, user_id, name, specialization, experience_years, consultation_fee)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            hospitalId,
            departmentIds.get(doc.departmentName) ?? null,
            userId,
            doc.name,
            doc.specialization,
            doc.experienceYears,
            doc.consultationFee,
          ],
        );
      }
    }

    for (const bed of beds) {
      await pool.query(
        `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
        [hospitalId, bed.bedType, bed.totalBeds, bed.occupiedBeds],
      );
    }

    for (const facility of facilities) {
      await pool.query(
        `INSERT INTO facilities (hospital_id, facility_name, status, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (hospital_id, facility_name) DO UPDATE SET status = EXCLUDED.status, quantity = EXCLUDED.quantity`,
        [hospitalId, facility.facilityName, facility.status, facility.quantity],
      );
    }

    console.log(`\nSeeded hospital "City Care Hospital" (${hospitalId}):`);
    console.log(`  - ${departments.length} departments, ${doctors.length} doctors`);
    console.log(`  - ${beds.length} bed types, ${facilities.length} facilities`);
    console.log(`  - linked to hospitaladmin@demo.medireach.dev`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Hospital seeding failed:", err);
  process.exit(1);
});
