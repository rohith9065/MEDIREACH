import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import request from "supertest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../src/app";
import { initSockets } from "../src/sockets";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";
import { ROLES } from "../../shared/constants/roles";

const ADMIN_EMAIL = "jest.socket-admin@medireach.test";
const PASSWORD = "Passw0rd!";
const REGISTRATION_NUMBER = "MEDIREACH-TEST-JEST-SOCKET-0001";

let httpServer: HttpServer;
let baseUrl: string;
let hospitalId: string;
let adminToken: string;

beforeAll(async () => {
  const app = createApp();
  httpServer = createServer(app);
  initSockets(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;

  const passwordHash = await hashPassword(PASSWORD);

  const hospitalRes = await pool.query<{ id: string }>(
    `INSERT INTO hospitals (name, registration_number, verified, status)
     VALUES ($1, $2, true, 'VERIFIED')
     ON CONFLICT (registration_number) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Jest Socket Test Hospital", REGISTRATION_NUMBER],
  );
  hospitalId = hospitalRes.rows[0].id;

  await pool.query(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds)
     VALUES ($1, 'ICU', 10, 5)
     ON CONFLICT (hospital_id, bed_type) DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds`,
    [hospitalId],
  );

  const adminRes = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ["Jest Socket Admin", ADMIN_EMAIL, passwordHash, ROLES.HOSPITAL_ADMIN],
  );
  await pool.query(
    `INSERT INTO hospital_staff (hospital_id, user_id, role)
     VALUES ($1, $2, 'HOSPITAL_ADMIN')
     ON CONFLICT (user_id) DO UPDATE SET hospital_id = EXCLUDED.hospital_id`,
    [hospitalId, adminRes.rows[0].id],
  );

  const loginRes = await request(app).post("/api/auth/login").send({ email: ADMIN_EMAIL, password: PASSWORD });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await pool.query(`DELETE FROM hospitals WHERE registration_number = $1`, [REGISTRATION_NUMBER]);
  await pool.query(`DELETE FROM users WHERE email = $1`, [ADMIN_EMAIL]);
  await pool.end();
});

describe("Socket.IO real-time updates", () => {
  it("broadcasts hospital:bed-updated to subscribers when a bed is updated via the REST API", async () => {
    const client: ClientSocket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });

    try {
      await new Promise<void>((resolve, reject) => {
        client.on("connect", resolve);
        client.on("connect_error", reject);
      });

      await new Promise<void>((resolve) => client.emit("subscribe:hospital", { hospitalId }, resolve));

      const eventPromise = new Promise<{ bedType: string; occupiedBeds: number; availableBeds: number }>(
        (resolve) => {
          client.on("hospital:bed-updated", resolve);
        },
      );

      const putRes = await request(baseUrl)
        .put("/api/hospital/beds/ICU")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ totalBeds: 10, occupiedBeds: 7 });
      expect(putRes.status).toBe(200);

      const payload = await eventPromise;
      expect(payload.bedType).toBe("ICU");
      expect(payload.occupiedBeds).toBe(7);
      expect(payload.availableBeds).toBe(3);
    } finally {
      client.disconnect();
    }
  });

  it("does not deliver events to a socket that never subscribed to that hospital", async () => {
    const client: ClientSocket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });

    try {
      await new Promise<void>((resolve, reject) => {
        client.on("connect", resolve);
        client.on("connect_error", reject);
      });

      let received = false;
      client.on("hospital:bed-updated", () => {
        received = true;
      });

      await request(baseUrl)
        .put("/api/hospital/beds/ICU")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ totalBeds: 10, occupiedBeds: 8 });

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(received).toBe(false);
    } finally {
      client.disconnect();
    }
  });
});
