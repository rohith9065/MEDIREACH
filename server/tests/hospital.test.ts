import request from "supertest";
import { createApp } from "../src/app";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import { ROLES } from "../../shared/constants/roles";

const app = createApp();

const ADMIN_EMAIL = "jest.hospitaladmin@medireach.test";
const ORPHAN_ADMIN_EMAIL = "jest.orphan-admin@medireach.test";
const PASSWORD = "Passw0rd!";
const REGISTRATION_NUMBER = "MEDIREACH-TEST-JEST-0001";

let adminToken: string;
let orphanAdminToken: string;
let hospitalId: string;

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.token;
}

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD);

  const hospitalRes = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, verified, status)
     VALUES ($1, $2, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Jest Test Hospital", REGISTRATION_NUMBER],
  );
  hospitalId = hospitalRes.rows[0].id;

  const adminRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Hospital Admin", ADMIN_EMAIL, passwordHash, ROLES.HOSPITAL_ADMIN],
  );
  await pool.query(
    `INSERT INTO hospital_staff (hospital_id, user_id, role)
     VALUES ($1, $2, 'HOSPITAL_ADMIN')
     ON CONFLICT (user_id) DO UPDATE SET hospital_id = EXCLUDED.hospital_id`,
    [hospitalId, adminRes.rows[0].id],
  );

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ["Jest Orphan Admin", ORPHAN_ADMIN_EMAIL, passwordHash, ROLES.HOSPITAL_ADMIN],
  );

  adminToken = await loginAs(ADMIN_EMAIL);
  orphanAdminToken = await loginAs(ORPHAN_ADMIN_EMAIL);
});

afterAll(async () => {
  // Hospitals first: beds/facilities carry updated_by -> users with no cascade, so a
  // hospital's child rows (which reference the admin as updated_by) must go before the user.
  await pool.query(`DELETE FROM hospitals WHERE registration_number = $1`, [REGISTRATION_NUMBER]);
  await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [[ADMIN_EMAIL, ORPHAN_ADMIN_EMAIL]]);
  await pool.end();
});

describe("Hospital context", () => {
  it("rejects a HOSPITAL_ADMIN with no linked hospital", async () => {
    const res = await request(app).get("/api/hospital/me").set("Authorization", `Bearer ${orphanAdminToken}`);
    expect(res.status).toBe(403);
  });

  it("rejects a PATIENT entirely", async () => {
    const patientRes = await request(app).post("/api/auth/register").send({
      name: "Jest Hospital Patient",
      email: "jest.hospital-patient@medireach.test",
      password: PASSWORD,
    });
    const res = await request(app)
      .get("/api/hospital/me")
      .set("Authorization", `Bearer ${patientRes.body.token}`);
    expect(res.status).toBe(403);
    await pool.query(`DELETE FROM users WHERE email = $1`, ["jest.hospital-patient@medireach.test"]);
  });

  it("returns the admin's own hospital", async () => {
    const res = await request(app).get("/api/hospital/me").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.hospital.id).toBe(hospitalId);
  });
});

describe("Beds", () => {
  it("upserts a bed count and computes availableBeds", async () => {
    const res = await request(app)
      .put("/api/hospital/beds/ICU")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ totalBeds: 20, occupiedBeds: 15 });

    expect(res.status).toBe(200);
    expect(res.body.bed.availableBeds).toBe(5);
  });

  it("rejects occupiedBeds greater than totalBeds", async () => {
    const res = await request(app)
      .put("/api/hospital/beds/ICU")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ totalBeds: 10, occupiedBeds: 99 });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid bed type in the URL", async () => {
    const res = await request(app)
      .put("/api/hospital/beds/NOT_A_TYPE")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ totalBeds: 10, occupiedBeds: 1 });

    expect(res.status).toBe(400);
  });
});

describe("Doctors", () => {
  it("creates and lists a doctor", async () => {
    const createRes = await request(app)
      .post("/api/hospital/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dr. Jest Test", specialization: "Testing" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.doctor.status).toBe("AVAILABLE");

    const listRes = await request(app).get("/api/hospital/doctors").set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.doctors.some((d: { id: string }) => d.id === createRes.body.doctor.id)).toBe(true);
  });
});

describe("Facilities", () => {
  it("upserts a facility", async () => {
    const res = await request(app)
      .put("/api/hospital/facilities/MRI")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "AVAILABLE", quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.facility.status).toBe("AVAILABLE");
  });
});

describe("Emergency status", () => {
  it("updates the hospital's emergency status", async () => {
    const res = await request(app)
      .put("/api/hospital/me/emergency-status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ emergencyStatus: "LIMITED" });

    expect(res.status).toBe(200);
    expect(res.body.hospital.emergencyStatus).toBe("LIMITED");
  });
});
