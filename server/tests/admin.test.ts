import request from "supertest";
import { createApp } from "../src/app";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import { ROLES } from "../../shared/constants/roles";

const app = createApp();

const PASSWORD = "Passw0rd!";

const SUPER_ADMIN_EMAIL = "jest.admin-superadmin@medireach.test";
const SUPER_ADMIN_TARGET_EMAIL = "jest.admin-superadmin-target@medireach.test";
const PATIENT_EMAIL = "jest.admin-patient@medireach.test";
const HOSPITAL_ADMIN_EMAIL = "jest.admin-hospitaladmin@medireach.test";
const DEACTIVATE_TARGET_EMAIL = "jest.admin-deactivate-target@medireach.test";

const REG_VERIFY = "MEDIREACH-TEST-JEST-ADMIN-VERIFY";
const REG_REJECT = "MEDIREACH-TEST-JEST-ADMIN-REJECT";

const QUERY_LAT = 10.0;
const QUERY_LNG = 76.5;

const ALL_TEST_EMAILS = [
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_TARGET_EMAIL,
  PATIENT_EMAIL,
  HOSPITAL_ADMIN_EMAIL,
  DEACTIVATE_TARGET_EMAIL,
];

let superAdminToken: string;
let superAdminId: string;
let patientToken: string;
let hospitalAdminToken: string;
let verifyHospitalId: string;
let rejectHospitalId: string;
let deactivateTargetId: string;

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.token;
}

async function createUser(name: string, email: string, role: string): Promise<string> {
  const passwordHash = await hashPassword(PASSWORD);
  const res = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true
     RETURNING id`,
    [name, email, passwordHash, role],
  );
  return res.rows[0].id;
}

async function createPendingHospital(name: string, registrationNumber: string): Promise<string> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, false, 'PENDING')
     ON CONFLICT (registration_number) DO UPDATE SET verified = false, status = 'PENDING'
     RETURNING id`,
    [name, registrationNumber, QUERY_LAT, QUERY_LNG],
  );
  return res.rows[0].id;
}

beforeAll(async () => {
  superAdminId = await createUser("Jest Super Admin", SUPER_ADMIN_EMAIL, ROLES.SUPER_ADMIN);
  await createUser("Jest Super Admin Target", SUPER_ADMIN_TARGET_EMAIL, ROLES.SUPER_ADMIN);
  await createUser("Jest Admin Patient", PATIENT_EMAIL, ROLES.PATIENT);
  await createUser("Jest Admin Hospital Admin", HOSPITAL_ADMIN_EMAIL, ROLES.HOSPITAL_ADMIN);
  deactivateTargetId = await createUser("Jest Deactivate Target", DEACTIVATE_TARGET_EMAIL, ROLES.PATIENT);

  verifyHospitalId = await createPendingHospital("Jest Admin Verify Hospital", REG_VERIFY);
  rejectHospitalId = await createPendingHospital("Jest Admin Reject Hospital", REG_REJECT);

  superAdminToken = await loginAs(SUPER_ADMIN_EMAIL);
  patientToken = await loginAs(PATIENT_EMAIL);
  hospitalAdminToken = await loginAs(HOSPITAL_ADMIN_EMAIL);
});

afterAll(async () => {
  await pool.query(`DELETE FROM hospitals WHERE registration_number = ANY($1)`, [[REG_VERIFY, REG_REJECT]]);
  await pool.query(`DELETE FROM audit_logs WHERE target_id = ANY($1)`, [
    [verifyHospitalId, rejectHospitalId, deactivateTargetId],
  ]);
  await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [ALL_TEST_EMAILS]);
  await pool.end();
});

describe("RBAC on /api/admin/*", () => {
  it("blocks a PATIENT token", async () => {
    const res = await request(app).get("/api/admin/hospitals").set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks a HOSPITAL_ADMIN token", async () => {
    const res = await request(app).get("/api/admin/hospitals").set("Authorization", `Bearer ${hospitalAdminToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks an unauthenticated request", async () => {
    const res = await request(app).get("/api/admin/hospitals");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/hospitals", () => {
  it("lists PENDING hospitals when filtered", async () => {
    const res = await request(app)
      .get("/api/admin/hospitals")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    const names = res.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toContain("Jest Admin Verify Hospital");
    expect(names).toContain("Jest Admin Reject Hospital");
  });
});

describe("PATCH /api/admin/hospitals/:id/verify", () => {
  it("verifies the hospital and writes an audit log entry", async () => {
    const res = await request(app)
      .patch(`/api/admin/hospitals/${verifyHospitalId}/verify`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.hospital.verified).toBe(true);
    expect(res.body.hospital.status).toBe("VERIFIED");

    const nearbyRes = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 5 });
    const names = nearbyRes.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).toContain("Jest Admin Verify Hospital");

    const logRes = await pool.query(
      `SELECT * FROM audit_logs WHERE target_id = $1 AND action = 'HOSPITAL_VERIFIED'`,
      [verifyHospitalId],
    );
    expect(logRes.rows.length).toBe(1);
    expect(logRes.rows[0].actor_user_id).toBe(superAdminId);
  });
});

describe("PATCH /api/admin/hospitals/:id/reject", () => {
  it("rejects the hospital and writes an audit log entry", async () => {
    const res = await request(app)
      .patch(`/api/admin/hospitals/${rejectHospitalId}/reject`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ reason: "Incomplete documentation" });

    expect(res.status).toBe(200);
    expect(res.body.hospital.verified).toBe(false);
    expect(res.body.hospital.status).toBe("REJECTED");

    const logRes = await pool.query(
      `SELECT * FROM audit_logs WHERE target_id = $1 AND action = 'HOSPITAL_REJECTED'`,
      [rejectHospitalId],
    );
    expect(logRes.rows.length).toBe(1);
    expect(logRes.rows[0].metadata).toEqual({ reason: "Incomplete documentation" });
  });
});

describe("GET /api/admin/users", () => {
  it("filters by role", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .query({ role: ROLES.PATIENT })
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.every((u: { role: string }) => u.role === ROLES.PATIENT)).toBe(true);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toContain(PATIENT_EMAIL);
  });
});

describe("PATCH /api/admin/users/:id/deactivate", () => {
  it("deactivates a user, logs it, and blocks their next login", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${deactivateTargetId}/deactivate`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);

    const logRes = await pool.query(`SELECT * FROM audit_logs WHERE target_id = $1 AND action = 'USER_DEACTIVATED'`, [
      deactivateTargetId,
    ]);
    expect(logRes.rows.length).toBe(1);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: DEACTIVATE_TARGET_EMAIL, password: PASSWORD });
    expect(loginRes.status).toBe(403);
  });

  it("refuses to deactivate a SUPER_ADMIN", async () => {
    const targetRes = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
      SUPER_ADMIN_TARGET_EMAIL,
    ]);
    const res = await request(app)
      .patch(`/api/admin/users/${targetRes.rows[0].id}/deactivate`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(400);
  });

  it("refuses to let a super admin deactivate themselves", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${superAdminId}/deactivate`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/audit-logs", () => {
  it("returns entries ordered newest-first", async () => {
    const res = await request(app).get("/api/admin/audit-logs").set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    const timestamps = res.body.logs.map((l: { createdAt: string }) => new Date(l.createdAt).getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });
});
