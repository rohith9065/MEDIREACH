import { Pool } from "pg";

// Real hospital names (Tamil Nadu district hospital list per TN Govt Order No.166,
// 23-Jun-2026 "Thaimaaman Thanga Mothiram Thittam" hub list; Kerala district
// hospitals/general hospitals are well-known public facilities; Bangalore entries are
// well-known government hospitals). Coordinates are APPROXIMATE district/town centers,
// not geocoded hospital addresses — good enough for map/distance demo purposes only.
// Bed counts, emergency status, and facilities below are SYNTHETIC placeholder data,
// same as the rest of the seed set — see root README's data-freshness disclaimer.
interface RealHospitalSeed {
  name: string;
  state: "TN" | "KL" | "KA";
  district: string;
  latitude: number;
  longitude: number;
}

const hospitals: RealHospitalSeed[] = [
  // Tamil Nadu — one government hospital per district
  { name: "Government Medical College Hospital, Ariyalur", state: "TN", district: "Ariyalur", latitude: 11.1401, longitude: 79.0782 },
  { name: "Government Medical College Hospital, Chengalpattu", state: "TN", district: "Chengalpattu", latitude: 12.6923, longitude: 79.9764 },
  { name: "Government Kilpauk Medical College Hospital, Chennai", state: "TN", district: "Chennai", latitude: 13.0827, longitude: 80.2432 },
  { name: "Coimbatore Medical College Hospital", state: "TN", district: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { name: "Government Medical College Hospital, Cuddalore", state: "TN", district: "Cuddalore", latitude: 11.7480, longitude: 79.7714 },
  { name: "Government Medical College Hospital, Dharmapuri", state: "TN", district: "Dharmapuri", latitude: 12.1211, longitude: 78.1582 },
  { name: "Government Medical College Hospital, Dindigul", state: "TN", district: "Dindigul", latitude: 10.3624, longitude: 77.9695 },
  { name: "Government Medical College Hospital, Perundurai (Erode)", state: "TN", district: "Erode", latitude: 11.2842, longitude: 77.5850 },
  { name: "Government Medical College Hospital, Kallakurichi", state: "TN", district: "Kallakurichi", latitude: 11.7401, longitude: 78.9597 },
  { name: "Government District Headquarters Hospital, Kancheepuram", state: "TN", district: "Kancheepuram", latitude: 12.8342, longitude: 79.7036 },
  { name: "Government Medical College Hospital, Asaripallam (Kanyakumari)", state: "TN", district: "Kanyakumari", latitude: 8.1778, longitude: 77.4325 },
  { name: "Government Medical College Hospital, Karur", state: "TN", district: "Karur", latitude: 10.9601, longitude: 78.0766 },
  { name: "Government Medical College Hospital, Krishnagiri", state: "TN", district: "Krishnagiri", latitude: 12.5186, longitude: 78.2137 },
  { name: "Government Rajaji Hospital, Madurai", state: "TN", district: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { name: "Government District Headquarters Hospital, Mayiladuthurai", state: "TN", district: "Mayiladuthurai", latitude: 11.1085, longitude: 79.6535 },
  { name: "Government Medical College Hospital, Nagapattinam", state: "TN", district: "Nagapattinam", latitude: 10.7672, longitude: 79.8449 },
  { name: "Government Medical College Hospital, Namakkal", state: "TN", district: "Namakkal", latitude: 11.2189, longitude: 78.1677 },
  { name: "Government District Headquarters Hospital, Perambalur", state: "TN", district: "Perambalur", latitude: 11.2342, longitude: 78.8807 },
  { name: "Government Medical College Hospital, Pudukkottai", state: "TN", district: "Pudukkottai", latitude: 10.3813, longitude: 78.8213 },
  { name: "Government Medical College Hospital, Ramanathapuram", state: "TN", district: "Ramanathapuram", latitude: 9.3639, longitude: 78.8395 },
  { name: "Government Mohan Kumaramangalam Medical College Hospital, Salem", state: "TN", district: "Salem", latitude: 11.6643, longitude: 78.1460 },
  { name: "Government Medical College Hospital, Sivagangai", state: "TN", district: "Sivagangai", latitude: 9.8433, longitude: 78.4809 },
  { name: "Government District Headquarters Hospital, Tenkasi", state: "TN", district: "Tenkasi", latitude: 8.9606, longitude: 77.3152 },
  { name: "Thanjavur Medical College Hospital", state: "TN", district: "Thanjavur", latitude: 10.7870, longitude: 79.1378 },
  { name: "Government Medical College Hospital, Theni", state: "TN", district: "Theni", latitude: 10.0104, longitude: 77.4768 },
  { name: "Government District Headquarters Hospital, Tirupathur", state: "TN", district: "Tirupathur", latitude: 12.4950, longitude: 78.5678 },
  { name: "Government Medical College Hospital, Thoothukudi", state: "TN", district: "Thoothukudi", latitude: 8.7642, longitude: 78.1348 },
  { name: "Mahatma Gandhi Memorial Government Hospital, Tiruchirappalli", state: "TN", district: "Tiruchirappalli", latitude: 10.7905, longitude: 78.7047 },
  { name: "Tirunelveli Medical College Hospital", state: "TN", district: "Tirunelveli", latitude: 8.7139, longitude: 77.7567 },
  { name: "Government Medical College Hospital, Tiruppur", state: "TN", district: "Tiruppur", latitude: 11.1085, longitude: 77.3411 },
  { name: "Government Medical College Hospital, Tiruvallur", state: "TN", district: "Thiruvallur", latitude: 13.1231, longitude: 79.9120 },
  { name: "Government Thiruvannamalai Medical College Hospital", state: "TN", district: "Thiruvannamalai", latitude: 12.2253, longitude: 79.0747 },
  { name: "Government Medical College Hospital, Tiruvarur", state: "TN", district: "Tiruvarur", latitude: 10.7661, longitude: 79.6345 },
  { name: "Government Vellore Medical College Hospital", state: "TN", district: "Vellore", latitude: 12.9165, longitude: 79.1325 },
  { name: "Government Villupuram Medical College Hospital", state: "TN", district: "Villupuram", latitude: 11.9401, longitude: 79.4861 },
  { name: "Government Medical College Hospital, Virudhunagar", state: "TN", district: "Virudhunagar", latitude: 9.5851, longitude: 77.9578 },

  // Kerala — one district/general hospital per district
  { name: "General Hospital, Thiruvananthapuram", state: "KL", district: "Thiruvananthapuram", latitude: 8.5241, longitude: 76.9366 },
  { name: "District Hospital, Kollam", state: "KL", district: "Kollam", latitude: 8.8932, longitude: 76.6141 },
  { name: "District Hospital, Kozhencherry (Pathanamthitta)", state: "KL", district: "Pathanamthitta", latitude: 9.2648, longitude: 76.7870 },
  { name: "General Hospital, Alappuzha", state: "KL", district: "Alappuzha", latitude: 9.4981, longitude: 76.3388 },
  { name: "District Hospital, Kottayam", state: "KL", district: "Kottayam", latitude: 9.5916, longitude: 76.5222 },
  { name: "District Hospital, Painavu (Idukki)", state: "KL", district: "Idukki", latitude: 9.8524, longitude: 76.9766 },
  { name: "General Hospital, Ernakulam", state: "KL", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999 },
  { name: "District Hospital, Thrissur", state: "KL", district: "Thrissur", latitude: 10.5276, longitude: 76.2144 },
  { name: "District Hospital, Palakkad", state: "KL", district: "Palakkad", latitude: 10.7867, longitude: 76.6548 },
  { name: "District Hospital, Tirur (Malappuram)", state: "KL", district: "Malappuram", latitude: 10.9139, longitude: 75.9210 },
  { name: "Government Beach Hospital, Kozhikode", state: "KL", district: "Kozhikode", latitude: 11.2588, longitude: 75.7804 },
  { name: "District Hospital, Kalpetta (Wayanad)", state: "KL", district: "Wayanad", latitude: 11.6085, longitude: 76.0836 },
  { name: "Pariyaram Medical College Hospital (Kannur)", state: "KL", district: "Kannur", latitude: 11.8745, longitude: 75.3704 },
  { name: "District Hospital, Kasaragod", state: "KL", district: "Kasaragod", latitude: 12.4996, longitude: 74.9869 },

  // Bangalore, Karnataka — major government hospitals
  { name: "Victoria Hospital, Bangalore", state: "KA", district: "Bengaluru Urban", latitude: 12.9634, longitude: 77.5730 },
  { name: "Bowring and Lady Curzon Hospital, Bangalore", state: "KA", district: "Bengaluru Urban", latitude: 12.9819, longitude: 77.6046 },
  { name: "Vani Vilas Hospital, Bangalore", state: "KA", district: "Bengaluru Urban", latitude: 12.9647, longitude: 77.5754 },
];

const EMERGENCY_CYCLE = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "LIMITED", "UNAVAILABLE"] as const;

function slug(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    for (let i = 0; i < hospitals.length; i++) {
      const h = hospitals[i];
      const registrationNumber = `MEDIREACH-${h.state}-${slug(h.district)}-${i}`;
      const emergencyStatus = EMERGENCY_CYCLE[i % EMERGENCY_CYCLE.length];

      const result = await pool.query<{ id: string }>(
        `INSERT INTO hospitals (
           name, registration_number, address, latitude, longitude, rating,
           verified, status, emergency_status, emergency_status_updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, true, 'VERIFIED', $7, now())
         ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          h.name,
          registrationNumber,
          `${h.district} district, ${h.state === "TN" ? "Tamil Nadu" : h.state === "KL" ? "Kerala" : "Karnataka"}`,
          h.latitude,
          h.longitude,
          3.5 + ((i * 7) % 15) / 10,
          emergencyStatus,
        ],
      );
      const hospitalId = result.rows[0].id;

      const icuTotal = 10 + (i % 6) * 5;
      const icuOccupied = Math.round(icuTotal * (0.4 + ((i * 13) % 50) / 100));
      const generalTotal = 60 + (i % 8) * 15;
      const generalOccupied = Math.round(generalTotal * (0.5 + ((i * 11) % 40) / 100));

      await pool.query(
        `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
         VALUES ($1, 'ICU', $2, $3), ($1, 'GENERAL', $4, $5)
         ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
        [hospitalId, icuTotal, icuOccupied, generalTotal, generalOccupied],
      );

      await pool.query(
        `INSERT INTO facilities (hospital_id, facility_name, status, quantity)
         VALUES ($1, 'PHARMACY', 'AVAILABLE', NULL)
         ON CONFLICT (hospital_id, facility_name) DO NOTHING`,
        [hospitalId],
      );
    }

    console.log(`Seeded ${hospitals.length} real-named district hospitals (TN: 36, KL: 14, KA: 3).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Real hospital seeding failed:", err);
  process.exit(1);
});
