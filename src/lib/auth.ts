import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

async function ensureUsersFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch (e) {
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function getUsers(): Promise<StoredUser[]> {
  await ensureUsersFile();
  const raw = await fs.readFile(usersFile, "utf-8");
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch (e) {
    return [];
  }
}

export async function saveUsers(users: StoredUser[]) {
  await ensureUsersFile();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// DB helpers
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  if (process.env.DATABASE_URL) {
    const rows = await (db as any)`SELECT id, name, email, password_hash AS "passwordHash", created_at AS "createdAt" FROM app_user WHERE email = ${email} LIMIT 1`;
    if (rows && rows.length > 0) return rows[0] as StoredUser;
    return null;
  }

  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createUser(user: StoredUser): Promise<StoredUser> {
  if (process.env.DATABASE_URL) {
    await (db as any)`INSERT INTO app_user (id, name, email, password_hash, created_at) VALUES (${user.id}, ${user.name}, ${user.email}, ${user.passwordHash}, ${user.createdAt})`;
    return user;
  }

  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
  return user;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, 310_000, 32, "sha256").toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = crypto.pbkdf2Sync(password, salt, 310_000, 32, "sha256").toString("hex");
  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(key, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
