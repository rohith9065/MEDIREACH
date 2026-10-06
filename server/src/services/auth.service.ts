import { RegisterInput, RegisterHospitalInput, LoginInput } from "../../../shared/validation/auth.schema";
import { ROLES } from "../../../shared/constants/roles";
import { PublicUser, AuthResponse } from "../../../shared/types/user";
import { createUser, findUserByEmail, findUserById, UserRow } from "../models/user.model";
import * as hospitalModel from "../models/hospital.model";
import { pool } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Public self-registration only ever creates PATIENT accounts. The other four roles
// are provisioned via seed data in Phase 1; real invite/approval flows (hospital admin
// inviting doctors, super admin approving hospitals) arrive in later phases.
export async function registerPatient(input: RegisterInput): Promise<AuthResponse> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: ROLES.PATIENT,
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

// Phase 9 — hospital self-registration. Creates the HOSPITAL_ADMIN user, a PENDING/unverified
// hospital, and the hospital_staff link atomically, then logs the new admin straight in — the
// hospital stays invisible to patients (see publicHospital.model.ts's verified/status filter)
// until a super admin approves it, but the admin can start setting up their profile right away.
export async function registerHospital(input: RegisterHospitalInput): Promise<AuthResponse> {
  const existingUser = await findUserByEmail(input.adminEmail);
  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }
  const existingHospital = await hospitalModel.findHospitalByRegistrationNumber(input.registrationNumber);
  if (existingHospital) {
    throw new AppError(409, "A hospital with this registration number is already registered");
  }

  const passwordHash = await hashPassword(input.adminPassword);
  const client = await pool.connect();
  let user: UserRow;
  try {
    await client.query("BEGIN");

    try {
      user = await createUser(
        { name: input.adminName, email: input.adminEmail, passwordHash, role: ROLES.HOSPITAL_ADMIN },
        client,
      );
      const hospital = await hospitalModel.createHospital(
        {
          name: input.hospitalName,
          registrationNumber: input.registrationNumber,
          phone: input.phone,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
        },
        client,
      );
      await hospitalModel.linkHospitalStaff(hospital.id, user.id, client);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(409, "That email or registration number was just taken — try again.");
      }
      throw err;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await comparePassword(input.password, user.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.is_active) {
    throw new AppError(403, "This account has been deactivated");
  }

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function getCurrentUser(id: string): Promise<PublicUser> {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return toPublicUser(user);
}
