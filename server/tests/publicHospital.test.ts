import request from "supertest";
import { createApp } from "../src/app";
import { pool } from "../src/config/db";

const app = createApp();

const REG_A = "MEDIREACH-TEST-JEST-NEARBY-A";
const REG_B = "MEDIREACH-TEST-JEST-NEARBY-B";
const REG_UNVERIFIED = "MEDIREACH-TEST-JEST-UNVERIFIED";
const REG_SCORE_CLOSE_BAD = "MEDIREACH-TEST-JEST-SCORE-CLOSE-BAD";
const REG_SCORE_FAR_GOOD = "MEDIREACH-TEST-JEST-SCORE-FAR-GOOD";
const REG_SCORE_SPEC_YES = "MEDIREACH-TEST-JEST-SCORE-SPEC-YES";
const REG_SCORE_SPEC_NO = "MEDIREACH-TEST-JEST-SCORE-SPEC-NO";
const REG_EMG_UNAVAILABLE = "MEDIREACH-TEST-JEST-EMG-UNAVAILABLE";
const REG_EMG_CLOSE_LIMITED = "MEDIREACH-TEST-JEST-EMG-CLOSE-LIMITED";
const REG_EMG_FAR_AVAILABLE = "MEDIREACH-TEST-JEST-EMG-FAR-AVAILABLE";
const REG_EMG_NEAR_AVAILABLE = "MEDIREACH-TEST-JEST-EMG-NEAR-AVAILABLE";

const QUERY_LAT = 12.0;
const QUERY_LNG = 77.0;

let hospitalAId: string;
let unverifiedHospitalId: string;

const ALL_SCORE_REGS = [REG_SCORE_CLOSE_BAD, REG_SCORE_FAR_GOOD, REG_SCORE_SPEC_YES, REG_SCORE_SPEC_NO];
const ALL_EMG_REGS = [REG_EMG_UNAVAILABLE, REG_EMG_CLOSE_LIMITED, REG_EMG_FAR_AVAILABLE, REG_EMG_NEAR_AVAILABLE];

beforeAll(async () => {
  const a = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Nearby Hospital A", REG_A, QUERY_LAT, QUERY_LNG],
  );
  hospitalAId = a.rows[0].id;
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 4)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [hospitalAId],
  );

  await pool.query(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
    ["Jest Nearby Hospital B", REG_B, QUERY_LAT + 0.05, QUERY_LNG],
  );

  const unverified = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, false, 'PENDING')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Unverified Hospital", REG_UNVERIFIED, QUERY_LAT, QUERY_LNG],
  );
  unverifiedHospitalId = unverified.rows[0].id;

  // Very close but fully unavailable — should rank BELOW a farther, fully-available hospital.
  const closeBad = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'UNAVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Score Close Bad", REG_SCORE_CLOSE_BAD, QUERY_LAT, QUERY_LNG],
  );
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 10)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [closeBad.rows[0].id],
  );

  const farGood = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'AVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Score Far Good", REG_SCORE_FAR_GOOD, QUERY_LAT + 0.03, QUERY_LNG],
  );
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 1)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [farGood.rows[0].id],
  );

  // Same location/emergency/beds, only difference is an available Cardiologist on one of them.
  const specYes = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'AVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Score Specialist Yes", REG_SCORE_SPEC_YES, QUERY_LAT + 0.01, QUERY_LNG + 0.01],
  );
  await pool.query(
    `INSERT INTO doctors (hospital_id, name, specialization, status)
     VALUES ($1, 'Dr. Jest Cardio', 'Cardiologist', 'AVAILABLE')`,
    [specYes.rows[0].id],
  );

  await pool.query(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'AVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
    ["Jest Score Specialist No", REG_SCORE_SPEC_NO, QUERY_LAT + 0.01, QUERY_LNG + 0.01],
  );

  // Phase 7 fixtures — emergencyMode ranking/exclusion.
  await pool.query(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'UNAVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
    ["Jest Emergency Unavailable", REG_EMG_UNAVAILABLE, QUERY_LAT, QUERY_LNG],
  );

  // Close but only LIMITED, with poor bed availability.
  const emgCloseLimited = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'LIMITED')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Emergency Close Limited", REG_EMG_CLOSE_LIMITED, QUERY_LAT, QUERY_LNG],
  );
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 10)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [emgCloseLimited.rows[0].id],
  );

  // Farther, fully AVAILABLE, good beds — should still beat the close-but-LIMITED one above.
  const emgFarAvailable = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'AVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Emergency Far Available", REG_EMG_FAR_AVAILABLE, QUERY_LAT + 0.03, QUERY_LNG],
  );
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 1)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [emgFarAvailable.rows[0].id],
  );

  // Same status + same bed ratio as the one above, but much closer — isolates the distance
  // sub-score as the tiebreaker.
  const emgNearAvailable = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status, emergency_status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED', 'AVAILABLE')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Emergency Near Available", REG_EMG_NEAR_AVAILABLE, QUERY_LAT, QUERY_LNG],
  );
  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 1)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [emgNearAvailable.rows[0].id],
  );
});

afterAll(async () => {
  await pool.query(`DELETE FROM hospitals WHERE registration_number = ANY($1)`, [
    [REG_A, REG_B, REG_UNVERIFIED, ...ALL_SCORE_REGS, ...ALL_EMG_REGS],
  ]);
  await pool.end();
});

describe("GET /api/hospitals/nearby", () => {
  it("orders results by distance ascending", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10 });

    expect(res.status).toBe(200);
    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    const indexA = names.indexOf("Jest Nearby Hospital A");
    const indexB = names.indexOf("Jest Nearby Hospital B");
    expect(indexA).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeGreaterThan(indexA);

    const hospitalA = res.body.hospitals[indexA];
    expect(hospitalA.distanceKm).toBeCloseTo(0, 1);
    expect(hospitalA.beds.find((b: { bedType: string }) => b.bedType === "ICU").available).toBe(6);
  });

  it("excludes hospitals outside the requested radius", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 2 });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toContain("Jest Nearby Hospital A");
    expect(names).not.toContain("Jest Nearby Hospital B");
  });

  it("never returns an unverified hospital, regardless of radius", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 100 });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).not.toContain("Jest Unverified Hospital");
  });

  it("rejects an out-of-range latitude", async () => {
    const res = await request(app).get("/api/hospitals/nearby").query({ lat: 999, lng: QUERY_LNG });
    expect(res.status).toBe(400);
  });

  it("filters by the free-text q param", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, q: "Nearby Hospital B" });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toEqual(["Jest Nearby Hospital B"]);
  });
});

describe("GET /api/hospitals/nearby — smart recommendation score", () => {
  it("includes a matchScore in [0, 100] and non-empty matchReasons", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10 });

    const hospitalA = res.body.hospitals.find((h: { name: string }) => h.name === "Jest Nearby Hospital A");
    expect(hospitalA.matchScore).toBeGreaterThanOrEqual(0);
    expect(hospitalA.matchScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(hospitalA.matchReasons)).toBe(true);
    expect(hospitalA.matchReasons.length).toBeGreaterThan(0);
  });

  it("ranks a farther fully-available hospital above a closer fully-unavailable one", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10 });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    const indexFarGood = names.indexOf("Jest Score Far Good");
    const indexCloseBad = names.indexOf("Jest Score Close Bad");

    expect(indexFarGood).toBeGreaterThanOrEqual(0);
    expect(indexCloseBad).toBeGreaterThanOrEqual(0);
    expect(indexFarGood).toBeLessThan(indexCloseBad);

    const farGood = res.body.hospitals[indexFarGood];
    const closeBad = res.body.hospitals[indexCloseBad];
    expect(farGood.distanceKm).toBeGreaterThan(closeBad.distanceKm);
    expect(farGood.matchScore).toBeGreaterThan(closeBad.matchScore);
  });

  it("raises the score when a requested specialization is available", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, specialization: "Cardiologist" });

    const withSpecialist = res.body.hospitals.find((h: { name: string }) => h.name === "Jest Score Specialist Yes");
    const withoutSpecialist = res.body.hospitals.find((h: { name: string }) => h.name === "Jest Score Specialist No");

    expect(withSpecialist.matchScore).toBeGreaterThan(withoutSpecialist.matchScore);
    expect(withSpecialist.matchReasons).toContain("Cardiologist available");
  });
});

describe("GET /api/hospitals/nearby — emergencyMode", () => {
  it("excludes UNAVAILABLE hospitals when emergencyMode=true", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, emergencyMode: "true" });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).not.toContain("Jest Emergency Unavailable");
  });

  it("does not exclude UNAVAILABLE hospitals when emergencyMode is omitted", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10 });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toContain("Jest Emergency Unavailable");
  });

  it("does not exclude UNAVAILABLE hospitals when emergencyMode=false explicitly", async () => {
    // Guards against a z.coerce.boolean() footgun: Boolean("false") === true.
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, emergencyMode: "false" });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toContain("Jest Emergency Unavailable");
  });

  it("ranks a farther fully-AVAILABLE hospital above a closer LIMITED one", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, emergencyMode: "true" });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    const indexFar = names.indexOf("Jest Emergency Far Available");
    const indexClose = names.indexOf("Jest Emergency Close Limited");

    expect(indexFar).toBeGreaterThanOrEqual(0);
    expect(indexClose).toBeGreaterThanOrEqual(0);
    expect(indexFar).toBeLessThan(indexClose);
  });

  it("uses distance to break ties when status and bed availability are equal", async () => {
    const res = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 10, emergencyMode: "true" });

    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    const indexNear = names.indexOf("Jest Emergency Near Available");
    const indexFar = names.indexOf("Jest Emergency Far Available");

    expect(indexNear).toBeGreaterThanOrEqual(0);
    expect(indexFar).toBeGreaterThanOrEqual(0);
    expect(indexNear).toBeLessThan(indexFar);
  });
});

describe("GET /api/hospitals/:id", () => {
  it("returns a verified hospital's public detail", async () => {
    const res = await request(app).get(`/api/hospitals/${hospitalAId}`);
    expect(res.status).toBe(200);
    expect(res.body.hospital.name).toBe("Jest Nearby Hospital A");
    expect(res.body.hospital.beds.length).toBeGreaterThan(0);
  });

  it("404s for an unverified hospital", async () => {
    const res = await request(app).get(`/api/hospitals/${unverifiedHospitalId}`);
    expect(res.status).toBe(404);
  });

  it("404s for a nonexistent id", async () => {
    const res = await request(app).get(`/api/hospitals/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
  });
});
