import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../src/app";
import { initSockets } from "../src/sockets";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import { ROLES } from "../../shared/constants/roles";

const app = createApp();

const PASSWORD = "Passw0rd!";
const HOSPITAL_REG = "MEDIREACH-TEST-JEST-AMBULANCE-HOSP";

const PATIENT_EMAIL = "jest.ambulance-patient@medireach.test";
const DRIVER_A_EMAIL = "jest.ambulance-driver-a@medireach.test";
const DRIVER_B_EMAIL = "jest.ambulance-driver-b@medireach.test";
const HOSPITAL_ADMIN_EMAIL = "jest.ambulance-hospitaladmin@medireach.test";
const VEHICLE_A = "JEST-AMB-A";
const VEHICLE_B = "JEST-AMB-B";

const PICKUP_LAT = 11.0;
const PICKUP_LNG = 76.0;

let hospitalId: string;
let patientId: string;
let driverAId: string;
let driverBId: string;
let ambulanceAId: string;
let ambulanceBId: string;

let patientToken: string;
let driverAToken: string;
let driverBToken: string;
let hospitalAdminToken: string;

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.token;
}

async function resetAmbulances(): Promise<void> {
  await pool.query(`UPDATE ambulances SET status = 'AVAILABLE' WHERE id = ANY($1)`, [[ambulanceAId, ambulanceBId]]);
  await pool.query(`DELETE FROM ambulance_request_declines WHERE ambulance_id = ANY($1)`, [
    [ambulanceAId, ambulanceBId],
  ]);
  await pool.query(`DELETE FROM ambulance_requests WHERE patient_id = $1`, [patientId]);
}

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD);

  const hospitalRes = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    ["Jest Ambulance Test Hospital", HOSPITAL_REG, PICKUP_LAT, PICKUP_LNG],
  );
  hospitalId = hospitalRes.rows[0].id;

  const patientRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Ambulance Patient", PATIENT_EMAIL, passwordHash, ROLES.PATIENT],
  );
  patientId = patientRes.rows[0].id;

  const hospitalAdminRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Ambulance Hospital Admin", HOSPITAL_ADMIN_EMAIL, passwordHash, ROLES.HOSPITAL_ADMIN],
  );
  await pool.query(
    `INSERT INTO hospital_staff (hospital_id, user_id, role)
     VALUES ($1, $2, 'HOSPITAL_ADMIN')
     ON CONFLICT (user_id) DO UPDATE SET hospital_id = EXCLUDED.hospital_id`,
    [hospitalId, hospitalAdminRes.rows[0].id],
  );

  const driverARes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Ambulance Driver A", DRIVER_A_EMAIL, passwordHash, ROLES.AMBULANCE_DRIVER],
  );
  driverAId = driverARes.rows[0].id;

  const driverBRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Ambulance Driver B", DRIVER_B_EMAIL, passwordHash, ROLES.AMBULANCE_DRIVER],
  );
  driverBId = driverBRes.rows[0].id;

  // A sits exactly at the pickup point (distance 0), B is ~5.5km away — A must be picked first.
  const ambulanceARes = await pool.query<{ id: string }>(
    `INSERT INTO ambulances (hospital_id, driver_id, vehicle_number, status, latitude, longitude)
     VALUES ($1, $2, $3, 'AVAILABLE', $4, $5)
     ON CONFLICT (driver_id) DO UPDATE SET status = 'AVAILABLE', latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    [hospitalId, driverAId, VEHICLE_A, PICKUP_LAT, PICKUP_LNG],
  );
  ambulanceAId = ambulanceARes.rows[0].id;

  const ambulanceBRes = await pool.query<{ id: string }>(
    `INSERT INTO ambulances (hospital_id, driver_id, vehicle_number, status, latitude, longitude)
     VALUES ($1, $2, $3, 'AVAILABLE', $4, $5)
     ON CONFLICT (driver_id) DO UPDATE SET status = 'AVAILABLE', latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude
     RETURNING id`,
    [hospitalId, driverBId, VEHICLE_B, PICKUP_LAT + 0.05, PICKUP_LNG],
  );
  ambulanceBId = ambulanceBRes.rows[0].id;

  patientToken = await loginAs(PATIENT_EMAIL);
  driverAToken = await loginAs(DRIVER_A_EMAIL);
  driverBToken = await loginAs(DRIVER_B_EMAIL);
  hospitalAdminToken = await loginAs(HOSPITAL_ADMIN_EMAIL);
});

afterEach(async () => {
  await resetAmbulances();
});

afterAll(async () => {
  await pool.query(`DELETE FROM hospitals WHERE registration_number = $1`, [HOSPITAL_REG]);
  await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [
    [PATIENT_EMAIL, DRIVER_A_EMAIL, DRIVER_B_EMAIL, HOSPITAL_ADMIN_EMAIL],
  ]);
  await pool.end();
});

describe("POST /api/ambulance-requests", () => {
  it("dispatches to the nearest AVAILABLE ambulance", async () => {
    const res = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });

    expect(res.status).toBe(201);
    expect(res.body.request.ambulanceId).toBe(ambulanceAId);
    expect(res.body.request.status).toBe("REQUESTED");

    const ambulanceRes = await pool.query(`SELECT status FROM ambulances WHERE id = $1`, [ambulanceAId]);
    expect(ambulanceRes.rows[0].status).toBe("ON_TRIP");
  });

  it("rejects a second request while one is already active", async () => {
    await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });

    const res = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });

    expect(res.status).toBe(409);
  });

  it("404s when no ambulance is AVAILABLE", async () => {
    await pool.query(`UPDATE ambulances SET status = 'OFFLINE' WHERE id = ANY($1)`, [[ambulanceAId, ambulanceBId]]);

    const res = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });

    expect(res.status).toBe(404);
  });
});

describe("decline-then-retry", () => {
  it("reassigns to the next-nearest ambulance, then cancels once every candidate has declined", async () => {
    const createRes = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });
    const requestId = createRes.body.request.id;
    expect(createRes.body.request.ambulanceId).toBe(ambulanceAId);

    const declineA = await request(app)
      .post(`/api/driver/requests/${requestId}/decline`)
      .set("Authorization", `Bearer ${driverAToken}`);
    expect(declineA.status).toBe(200);

    const afterDeclineA = await request(app)
      .get(`/api/ambulance-requests/${requestId}`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(afterDeclineA.body.request.ambulanceId).toBe(ambulanceBId);
    expect(afterDeclineA.body.request.status).toBe("REQUESTED");

    const statusesAfterA = await pool.query(`SELECT id, status FROM ambulances WHERE id = ANY($1)`, [
      [ambulanceAId, ambulanceBId],
    ]);
    const byId = Object.fromEntries(statusesAfterA.rows.map((r) => [r.id, r.status]));
    expect(byId[ambulanceAId]).toBe("AVAILABLE");
    expect(byId[ambulanceBId]).toBe("ON_TRIP");

    const declineB = await request(app)
      .post(`/api/driver/requests/${requestId}/decline`)
      .set("Authorization", `Bearer ${driverBToken}`);
    expect(declineB.status).toBe(200);

    const afterDeclineB = await request(app)
      .get(`/api/ambulance-requests/${requestId}`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(afterDeclineB.body.request.status).toBe("CANCELLED");
    expect(afterDeclineB.body.request.cancellationReason).toBe("NO_AMBULANCE_AVAILABLE");

    const statusesAfterB = await pool.query(`SELECT id, status FROM ambulances WHERE id = ANY($1)`, [
      [ambulanceAId, ambulanceBId],
    ]);
    const byId2 = Object.fromEntries(statusesAfterB.rows.map((r) => [r.id, r.status]));
    expect(byId2[ambulanceAId]).toBe("AVAILABLE");
    expect(byId2[ambulanceBId]).toBe("AVAILABLE");
  });
});

describe("accept + status transitions", () => {
  it("walks a request through all transitions to COMPLETED and frees the ambulance", async () => {
    const createRes = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });
    const requestId = createRes.body.request.id;

    const acceptRes = await request(app)
      .post(`/api/driver/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${driverAToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.request.status).toBe("ACCEPTED");

    const transitions = ["GOING_TO_PATIENT", "ARRIVED_AT_PATIENT", "GOING_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL", "COMPLETED"];
    for (const status of transitions) {
      const res = await request(app)
        .patch(`/api/driver/requests/${requestId}/status`)
        .set("Authorization", `Bearer ${driverAToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe(status);
    }

    const ambulanceRes = await pool.query(`SELECT status FROM ambulances WHERE id = $1`, [ambulanceAId]);
    expect(ambulanceRes.rows[0].status).toBe("AVAILABLE");
  });

  it("rejects an invalid status jump", async () => {
    const createRes = await request(app)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });
    const requestId = createRes.body.request.id;

    await request(app)
      .post(`/api/driver/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${driverAToken}`);

    const res = await request(app)
      .patch(`/api/driver/requests/${requestId}/status`)
      .set("Authorization", `Bearer ${driverAToken}`)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(400);
  });
});

describe("RBAC across ambulance route groups", () => {
  it("blocks a patient from hospital fleet-management routes", async () => {
    const res = await request(app).get("/api/hospital/ambulances").set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks a driver from patient ambulance-request routes", async () => {
    const res = await request(app).get("/api/ambulance-requests/active").set("Authorization", `Bearer ${driverAToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks a hospital admin from driver routes", async () => {
    const res = await request(app).get("/api/driver/me").set("Authorization", `Bearer ${hospitalAdminToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks a patient from driver routes", async () => {
    const res = await request(app).get("/api/driver/me").set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/hospital/ambulances", () => {
  it("rejects a duplicate vehicle number", async () => {
    const res = await request(app)
      .post("/api/hospital/ambulances")
      .set("Authorization", `Bearer ${hospitalAdminToken}`)
      .send({
        driverName: "Jest Dup Driver",
        driverEmail: "jest.ambulance-dup-vehicle@medireach.test",
        driverPassword: PASSWORD,
        vehicleNumber: VEHICLE_A,
      });
    expect(res.status).toBe(409);
  });

  it("rejects a duplicate driver email", async () => {
    const res = await request(app)
      .post("/api/hospital/ambulances")
      .set("Authorization", `Bearer ${hospitalAdminToken}`)
      .send({
        driverName: "Jest Dup Driver",
        driverEmail: DRIVER_A_EMAIL,
        driverPassword: PASSWORD,
        vehicleNumber: "JEST-AMB-NEWVEHICLE",
      });
    expect(res.status).toBe(409);
  });
});

describe("Socket.IO ambulance events", () => {
  let httpServer: HttpServer;
  let baseUrl: string;

  beforeAll(async () => {
    httpServer = createServer(app);
    initSockets(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("delivers ambulance:incoming-request only to the assigned driver's personal room", async () => {
    const driverASocket: ClientSocket = ioClient(baseUrl, {
      transports: ["websocket"],
      forceNew: true,
      auth: { token: driverAToken },
    });
    const driverBSocket: ClientSocket = ioClient(baseUrl, {
      transports: ["websocket"],
      forceNew: true,
      auth: { token: driverBToken },
    });

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          driverASocket.on("connect", resolve);
          driverASocket.on("connect_error", reject);
        }),
        new Promise<void>((resolve, reject) => {
          driverBSocket.on("connect", resolve);
          driverBSocket.on("connect_error", reject);
        }),
      ]);

      let bReceived = false;
      driverBSocket.on("ambulance:incoming-request", () => {
        bReceived = true;
      });
      const aEventPromise = new Promise<{ ambulanceId: string }>((resolve) => {
        driverASocket.on("ambulance:incoming-request", resolve);
      });

      const res = await request(baseUrl)
        .post("/api/ambulance-requests")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });
      expect(res.status).toBe(201);

      const payload = await aEventPromise;
      expect(payload.ambulanceId).toBe(ambulanceAId);

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(bReceived).toBe(false);
    } finally {
      driverASocket.disconnect();
      driverBSocket.disconnect();
    }
  });

  it("delivers ambulance:request-updated only within the subscribed request room", async () => {
    const createRes = await request(baseUrl)
      .post("/api/ambulance-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ pickupLatitude: PICKUP_LAT, pickupLongitude: PICKUP_LNG });
    const requestId = createRes.body.request.id;

    const subscribedSocket: ClientSocket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });
    const unsubscribedSocket: ClientSocket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          subscribedSocket.on("connect", resolve);
          subscribedSocket.on("connect_error", reject);
        }),
        new Promise<void>((resolve, reject) => {
          unsubscribedSocket.on("connect", resolve);
          unsubscribedSocket.on("connect_error", reject);
        }),
      ]);

      await new Promise<void>((resolve) => subscribedSocket.emit("subscribe:ambulanceRequest", { requestId }, resolve));

      let unsubscribedReceived = false;
      unsubscribedSocket.on("ambulance:request-updated", () => {
        unsubscribedReceived = true;
      });
      const subscribedEventPromise = new Promise<{ status: string }>((resolve) => {
        subscribedSocket.on("ambulance:request-updated", resolve);
      });

      const acceptRes = await request(baseUrl)
        .post(`/api/driver/requests/${requestId}/accept`)
        .set("Authorization", `Bearer ${driverAToken}`);
      expect(acceptRes.status).toBe(200);

      const payload = await subscribedEventPromise;
      expect(payload.status).toBe("ACCEPTED");

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(unsubscribedReceived).toBe(false);
    } finally {
      subscribedSocket.disconnect();
      unsubscribedSocket.disconnect();
    }
  });
});
