import crypto from "crypto";

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
