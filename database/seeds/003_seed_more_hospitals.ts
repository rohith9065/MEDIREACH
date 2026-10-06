import { Pool } from "pg";

interface HospitalSeed {
  name: string;
  registrationNumber: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  emergencyStatus: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  beds: { bedType: string; totalBeds: number; occupiedBeds: number }[];
  facilities: { facilityName: string; status: string; quantity: number | null }[];
  doctor: { name: string; specialization: string; experienceYears: number; consultationFee: number };
}

// Scattered a few km around City Care Hospital (12.9716, 77.5946 — MG Road, Bengaluru) so the
// nearby-search + map screens have real variety to show: mixed emergency status, mixed bed
// availability, different distances.
const hospitals: HospitalSeed[] = [
  {
    name: "Sunrise General Hospital",
    registrationNumber: "MEDIREACH-DEMO-0002",
    phone: "+911234500001",
    emergencyPhone: "+911234500002",
    email: "contact@sunrise.demo.medireach.dev",
    address: "45 100 Feet Road, Indiranagar, Bengaluru, Karnataka",
    latitude: 12.9784,
    longitude: 77.6205,
    rating: 4.0,
    emergencyStatus: "LIMITED",
    beds: [
      { bedType: "ICU", totalBeds: 10, occupiedBeds: 9 },
      { bedType: "GENERAL", totalBeds: 60, occupiedBeds: 52 },
    ],
    facilities: [
      { facilityName: "PHARMACY", status: "AVAILABLE", quantity: null },
      { facilityName: "LABORATORY", status: "AVAILABLE", quantity: 1 },
    ],
    doctor: { name: "Dr. Priya Iyer", specialization: "Orthopedic Surgeon", experienceYears: 10, consultationFee: 600 },
  },
  {
    name: "Lakeview Multispecialty Hospital",
    registrationNumber: "MEDIREACH-DEMO-0003",
    phone: "+911234500003",
    emergencyPhone: "+911234500004",
    email: "contact@lakeview.demo.medireach.dev",
    address: "12 Hosur Road, Koramangala, Bengaluru, Karnataka",
    latitude: 12.9351,
    longitude: 77.6146,
    rating: 4.6,
    emergencyStatus: "AVAILABLE",
    beds: [
      { bedType: "ICU", totalBeds: 25, occupiedBeds: 12 },
      { bedType: "GENERAL", totalBeds: 120, occupiedBeds: 70 },
      { bedType: "EMERGENCY", totalBeds: 15, occupiedBeds: 5 },
    ],
    facilities: [
      { facilityName: "MRI", status: "AVAILABLE", quantity: 1 },
      { facilityName: "BLOOD_BANK", status: "AVAILABLE", quantity: null },
      { facilityName: "OPERATING_ROOM", status: "AVAILABLE", quantity: 3 },
    ],
    doctor: { name: "Dr. Vikram Shetty", specialization: "Neurologist", experienceYears: 18, consultationFee: 1000 },
  },
  {
    name: "Northside Community Hospital",
    registrationNumber: "MEDIREACH-DEMO-0004",
    phone: "+911234500005",
    emergencyPhone: "+911234500006",
    email: "contact@northside.demo.medireach.dev",
    address: "78 Sampige Road, Malleswaram, Bengaluru, Karnataka",
    latitude: 13.0067,
    longitude: 77.5691,
    rating: 3.7,
    emergencyStatus: "UNAVAILABLE",
    beds: [
      { bedType: "ICU", totalBeds: 8, occupiedBeds: 8 },
      { bedType: "GENERAL", totalBeds: 40, occupiedBeds: 38 },
    ],
    facilities: [{ facilityName: "PHARMACY", status: "LIMITED", quantity: null }],
    doctor: { name: "Dr. Anitha Reddy", specialization: "Pediatrician", experienceYears: 6, consultationFee: 400 },
  },
];

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    for (const h of hospitals) {
      const hospitalResult = await pool.query<{ id: string }>(
        `INSERT INTO hospitals (
           name, registration_number, phone, emergency_phone, email, address,
           latitude, longitude, rating, verified, status, emergency_status, emergency_status_updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'VERIFIED', $10, now())
         ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          h.name,
          h.registrationNumber,
          h.phone,
          h.emergencyPhone,
          h.email,
          h.address,
          h.latitude,
          h.longitude,
          h.rating,
          h.emergencyStatus,
        ],
      );
      const hospitalId = hospitalResult.rows[0].id;

      for (const bed of h.beds) {
        await pool.query(
          `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
          [hospitalId, bed.bedType, bed.totalBeds, bed.occupiedBeds],
        );
      }

      for (const facility of h.facilities) {
        await pool.query(
          `INSERT INTO facilities (hospital_id, facility_name, status, quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (hospital_id, facility_name) DO UPDATE SET status = EXCLUDED.status, quantity = EXCLUDED.quantity`,
          [hospitalId, facility.facilityName, facility.status, facility.quantity],
        );
      }

      const existingDoctor = await pool.query<{ id: string }>(
        `SELECT id FROM doctors WHERE hospital_id = $1 AND name = $2`,
        [hospitalId, h.doctor.name],
      );
      if (!existingDoctor.rows[0]) {
        await pool.query(
          `INSERT INTO doctors (hospital_id, name, specialization, experience_years, consultation_fee)
           VALUES ($1, $2, $3, $4, $5)`,
          [hospitalId, h.doctor.name, h.doctor.specialization, h.doctor.experienceYears, h.doctor.consultationFee],
        );
      }

      console.log(`Seeded "${h.name}" (${hospitalId})`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Additional hospital seeding failed:", err);
  process.exit(1);
});
