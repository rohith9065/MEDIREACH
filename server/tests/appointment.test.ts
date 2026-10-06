import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../src/app";
import { initSockets } from "../src/sockets";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import { ROLES } from "../../shared/constants/roles";

const ADMIN_EMAIL = "jest.appt-admin@medireach.test";
const PATIENT_EMAIL = "jest.appt-patient@medireach.test";
const OTHER_PATIENT_EMAIL = "jest.appt-other-patient@medireach.test";
const PASSWORD = "Passw0rd!";
const REGISTRATION_NUMBER = "MEDIREACH-TEST-JEST-APPT-0001";
const TODAY = new Date().toISOString().slice(0, 10);

let httpServer: HttpServer;
let baseUrl: string;
let app: ReturnType<typeof createApp>;
let hospitalId: string;
let doctorId: string;
let adminToken: string;
let patientToken: string;
let otherPatientToken: string;
let todayDow: number;
let firstAppointmentId: string;

async function login(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.body.token;
}

beforeAll(async () => {
  app = createApp();
  httpServer = createServer(app);
  initSockets(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;

  todayDow = new Date(`${TODAY}T00:00:00Z`).getUTCDay();

  const passwordHash = await hashPassword(PASSWORD);

  const hospitalRes = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, verified, status)
     VALUES ($1, $2, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Jest Appointment Test Hospital", REGISTRATION_NUMBER],
  );
  hospitalId = hospitalRes.rows[0].id;

  const doctorRes = await pool.query<{ id: string }>(
    `INSERT INTO doctors (hospital_id, name, specialization, status)
     VALUES ($1, 'Dr. Jest Appt', 'General Physician', 'AVAILABLE')
     RETURNING id`,
    [hospitalId],
  );
  doctorId = doctorRes.rows[0].id;

  await pool.query(
    `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES ($1, $2, '09:00', '11:00')
     ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`,
    [doctorId, todayDow],
  );

  const adminRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Appt Admin", ADMIN_EMAIL, passwordHash, ROLES.HOSPITAL_ADMIN],
  );
  await pool.query(
    `INSERT INTO hospital_staff (hospital_id, user_id, role) VALUES ($1, $2, 'HOSPITAL_ADMIN')
     ON CONFLICT (user_id) DO UPDATE SET hospital_id = EXCLUDED.hospital_id`,
    [hospitalId, adminRes.rows[0].id],
  );

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ["Jest Appt Patient", PATIENT_EMAIL, passwordHash, ROLES.PATIENT],
  );
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ["Jest Appt Other Patient", OTHER_PATIENT_EMAIL, passwordHash, ROLES.PATIENT],
  );

  adminToken = await login(ADMIN_EMAIL);
  patientToken = await login(PATIENT_EMAIL);
  otherPatientToken = await login(OTHER_PATIENT_EMAIL);
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await pool.query(`DELETE FROM hospitals WHERE registration_number = $1`, [REGISTRATION_NUMBER]);
  await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [[ADMIN_EMAIL, PATIENT_EMAIL, OTHER_PATIENT_EMAIL]]);
  await pool.end();
});

describe("Doctor schedule", () => {
  it("reflects the schedule set in fixtures", async () => {
    const res = await request(baseUrl)
      .get(`/api/hospital/doctors/${doctorId}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.windows).toEqual([{ dayOfWeek: todayDow, startTime: "09:00", endTime: "11:00" }]);
  });
});

describe("Booking flow", () => {
  it("returns generated slots based on the doctor's schedule", async () => {
    const res = await request(baseUrl)
      .get(`/api/hospitals/${hospitalId}/doctors/${doctorId}/slots`)
      .query({ date: TODAY });
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual(expect.arrayContaining([{ time: "09:00" }, { time: "09:20" }]));
  });

  it("books an appointment and assigns sequential token numbers", async () => {
    const res1 = await request(baseUrl)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ hospitalId, doctorId, appointmentDate: TODAY, appointmentTime: "09:00" });
    expect(res1.status).toBe(201);
    expect(res1.body.appointment.tokenNumber).toBe(1);
    expect(res1.body.appointment.appointmentDate).toBe(TODAY);
    firstAppointmentId = res1.body.appointment.id;

    const res2 = await request(baseUrl)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${otherPatientToken}`)
      .send({ hospitalId, doctorId, appointmentDate: TODAY, appointmentTime: "09:20" });
    expect(res2.status).toBe(201);
    expect(res2.body.appointment.tokenNumber).toBe(2);
  });

  it("rejects booking a slot that's already taken", async () => {
    const res = await request(baseUrl)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${otherPatientToken}`)
      .send({ hospitalId, doctorId, appointmentDate: TODAY, appointmentTime: "09:00" });
    expect(res.status).toBe(400);
  });

  it("prevents a genuine race for the same slot from double-booking", async () => {
    const attempt = () =>
      request(baseUrl)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ hospitalId, doctorId, appointmentDate: TODAY, appointmentTime: "09:40" });

    const [a, b] = await Promise.all([attempt(), attempt()]);
    const statuses = [a.status, b.status].sort();
    expect(statuses[0]).toBe(201);
    expect([400, 409]).toContain(statuses[1]);
  });

  it("does not let a patient cancel someone else's appointment", async () => {
    const res = await request(baseUrl)
      .put(`/api/appointments/${firstAppointmentId}/cancel`)
      .set("Authorization", `Bearer ${otherPatientToken}`);
    expect(res.status).toBe(404);
  });

  it("lets the owning patient cancel their own appointment", async () => {
    const res = await request(baseUrl)
      .put(`/api/appointments/${firstAppointmentId}/cancel`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
  });
});

describe("Queue management", () => {
  let secondToken: { id: string; tokenNumber: number };

  it("lists today's queue for the doctor", async () => {
    const res = await request(baseUrl)
      .get("/api/hospital/queue")
      .query({ doctorId, date: TODAY })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    secondToken = res.body.tokens.find((t: { tokenNumber: number }) => t.tokenNumber === 2);
    expect(secondToken).toBeDefined();
  });

  it("rejects completing a token that hasn't been called yet", async () => {
    const res = await request(baseUrl)
      .patch(`/api/hospital/queue/${secondToken.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it("calls, then completes a token", async () => {
    const callRes = await request(baseUrl)
      .patch(`/api/hospital/queue/${secondToken.id}/call`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(callRes.status).toBe(200);
    expect(callRes.body.token.status).toBe("CALLED");

    const completeRes = await request(baseUrl)
      .patch(`/api/hospital/queue/${secondToken.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.token.status).toBe("COMPLETED");
  });
});

describe("Socket.IO queue:updated", () => {
  it("emits queue:updated when a new appointment is booked", async () => {
    const client: ClientSocket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });
    try {
      await new Promise<void>((resolve, reject) => {
        client.on("connect", resolve);
        client.on("connect_error", reject);
      });
      await new Promise<void>((resolve) => client.emit("subscribe:hospital", { hospitalId }, resolve));

      const eventPromise = new Promise((resolve) => client.on("queue:updated", resolve));

      const res = await request(baseUrl)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ hospitalId, doctorId, appointmentDate: TODAY, appointmentTime: "10:00" });
      expect(res.status).toBe(201);

      await eventPromise;
    } finally {
      client.disconnect();
    }
  });
});
