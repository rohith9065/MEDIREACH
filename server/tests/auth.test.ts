import request from "supertest";
import express from "express";
import { createApp } from "../src/app";
import { pool } from "../src/config/db";
import { requireAuth } from "../src/middleware/auth.middleware";
import { requireRole } from "../src/middleware/rbac.middleware";
import { errorHandler } from "../src/middleware/error.middleware";
import { ROLES } from "../../shared/constants/roles";

const app = createApp();

const testEmails: string[] = [
  "jest.register@medireach.test",
  "jest.duplicate@medireach.test",
  "jest.login@medireach.test",
];

const HOSPITAL_REG_EMAILS: string[] = [];
const HOSPITAL_REG_NUMBERS: string[] = [];

afterAll(async () => {
  // Hospitals first — hospital_staff cascades off either side, but the ordering matches the
  // established convention in hospital.test.ts (hospital rows before the users they reference).
  if (HOSPITAL_REG_NUMBERS.length > 0) {
    await pool.query(`DELETE FROM hospitals WHERE registration_number = ANY($1)`, [HOSPITAL_REG_NUMBERS]);
  }
  await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [[...testEmails, ...HOSPITAL_REG_EMAILS]]);
  await pool.end();
});

describe("POST /api/auth/register", () => {
  it("creates a PATIENT account and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jest Patient",
      email: "jest.register@medireach.test",
      password: "Passw0rd!",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.role).toBe(ROLES.PATIENT);
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("rejects a duplicate email", async () => {
    const payload = {
      name: "Jest Duplicate",
      email: "jest.duplicate@medireach.test",
      password: "Passw0rd!",
    };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "X",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});

describe("POST /api/auth/login", () => {
  const credentials = {
    name: "Jest Login",
    email: "jest.login@medireach.test",
    password: "Passw0rd!",
  };

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send(credentials);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPassword!" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jest Me",
      email: "jest.me@medireach.test",
      password: "Passw0rd!",
    });
    token = res.body.token;
    testEmails.push("jest.me@medireach.test");
  });

  it("returns the current user with a valid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("jest.me@medireach.test");
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("requireRole middleware", () => {
  it("blocks a token whose role is not permitted", async () => {
    const patientRes = await request(app).post("/api/auth/register").send({
      name: "Jest Rbac",
      email: "jest.rbac@medireach.test",
      password: "Passw0rd!",
    });
    testEmails.push("jest.rbac@medireach.test");
    const token = patientRes.body.token;

    // Temporary test-only protected route to exercise requireRole without touching
    // production routes (nothing in Phase 1 is role-gated yet).
    const rbacApp = express();
    rbacApp.use(express.json());
    rbacApp.get(
      "/super-admin-only",
      requireAuth,
      requireRole(ROLES.SUPER_ADMIN),
      (_req, res) => res.status(200).json({ ok: true }),
    );
    rbacApp.use(errorHandler);

    const res = await request(rbacApp).get("/super-admin-only").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/register-hospital", () => {
  const QUERY_LAT = 11.0;
  const QUERY_LNG = 76.0;

  it("creates a HOSPITAL_ADMIN, a PENDING/unverified hospital, and the staff link atomically", async () => {
    const email = "jest.hospital-register@medireach.test";
    const regNumber = "MEDIREACH-TEST-JEST-REG-HOSPITAL";
    HOSPITAL_REG_EMAILS.push(email);
    HOSPITAL_REG_NUMBERS.push(regNumber);

    const res = await request(app).post("/api/auth/register-hospital").send({
      hospitalName: "Jest Register Hospital",
      registrationNumber: regNumber,
      adminName: "Jest Hospital Admin",
      adminEmail: email,
      adminPassword: "Passw0rd!",
      latitude: QUERY_LAT,
      longitude: QUERY_LNG,
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.role).toBe(ROLES.HOSPITAL_ADMIN);

    // The returned token should work immediately — proves the hospital_staff link was created.
    const meRes = await request(app).get("/api/hospital/me").set("Authorization", `Bearer ${res.body.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.hospital.name).toBe("Jest Register Hospital");
    expect(meRes.body.hospital.status).toBe("PENDING");

    // Invisible to patients until a super admin verifies it.
    const nearbyRes = await request(app)
      .get("/api/hospitals/nearby")
      .query({ lat: QUERY_LAT, lng: QUERY_LNG, radiusKm: 5 });
    const names = nearbyRes.body.hospitals.map((h: { name: string }) => h.name);
    expect(names).not.toContain("Jest Register Hospital");
  });

  it("rejects a duplicate registration number", async () => {
    const emailA = "jest.hospital-dup-a@medireach.test";
    const emailB = "jest.hospital-dup-b@medireach.test";
    const regNumber = "MEDIREACH-TEST-JEST-REG-DUP";
    HOSPITAL_REG_EMAILS.push(emailA, emailB);
    HOSPITAL_REG_NUMBERS.push(regNumber);

    const payload = (adminEmail: string) => ({
      hospitalName: "Jest Dup Hospital",
      registrationNumber: regNumber,
      adminName: "Jest Dup Admin",
      adminEmail,
      adminPassword: "Passw0rd!",
    });

    const first = await request(app).post("/api/auth/register-hospital").send(payload(emailA));
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/auth/register-hospital").send(payload(emailB));
    expect(second.status).toBe(409);
  });

  it("rejects a duplicate admin email", async () => {
    const email = "jest.hospital-dup-email@medireach.test";
    const regA = "MEDIREACH-TEST-JEST-REG-EMAIL-A";
    const regB = "MEDIREACH-TEST-JEST-REG-EMAIL-B";
    HOSPITAL_REG_EMAILS.push(email);
    HOSPITAL_REG_NUMBERS.push(regA, regB);

    const first = await request(app).post("/api/auth/register-hospital").send({
      hospitalName: "Jest Email Hospital A",
      registrationNumber: regA,
      adminName: "Jest Email Admin",
      adminEmail: email,
      adminPassword: "Passw0rd!",
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/auth/register-hospital").send({
      hospitalName: "Jest Email Hospital B",
      registrationNumber: regB,
      adminName: "Jest Email Admin",
      adminEmail: email,
      adminPassword: "Passw0rd!",
    });
    expect(second.status).toBe(409);
  });

  it("rejects an invalid payload", async () => {
    const res = await request(app).post("/api/auth/register-hospital").send({
      hospitalName: "X",
      registrationNumber: "",
      adminName: "Y",
      adminEmail: "not-an-email",
      adminPassword: "short",
    });
    expect(res.status).toBe(400);
  });
});
