import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import prisma from "./prisma";

export const PLAYER_COOKIE = "quvanta_session";
export const ADMIN_COOKIE = "quvanta_admin_session";

/** Deterministic referral code, same scheme as the hosted build. */
export function refCodeFor(email: string, id: number): string {
  const h = createHash("sha256")
    .update(`ref:${email.toLowerCase()}:${id}`)
    .digest("hex");
  return ("QV" + h.slice(0, 6)).toUpperCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function createSession(userId: number, kind: "player" | "admin") {
  const token = newToken();
  await prisma.session.create({ data: { token, userId, kind } });
  return token;
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function setPlayerCookie(token: string) {
  cookies().set(PLAYER_COOKIE, token, COOKIE_OPTS);
}

export async function setAdminCookie(token: string) {
  cookies().set(ADMIN_COOKIE, token, COOKIE_OPTS);
}

export async function clearPlayerCookie() {
  cookies().delete(PLAYER_COOKIE);
}

export async function clearAdminCookie() {
  cookies().delete(ADMIN_COOKIE);
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  role: string;
  dob: string;
  kycStatus: string;
  balanceUsd: number;
  balanceUsdt: number;
  suspended: boolean;
  verifyCode: string;
  resetCode: string;
  referralCode: string;
  referredBy: number;
  depositLimit: number;
  lossLimit: number;
  favorites: string;
  country: string;
  currency: string;
};

export async function userFromToken(
  token: string | undefined | null,
  kind?: "player" | "admin",
): Promise<SessionUser | null> {
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { token } });
  if (!s) return null;
  if (kind && s.kind !== kind) return null;
  const u = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!u) return null;
  return u as SessionUser;
}

export async function currentPlayer(): Promise<SessionUser | null> {
  return userFromToken(cookies().get(PLAYER_COOKIE)?.value);
}

export async function currentAdmin(): Promise<SessionUser | null> {
  const u = await userFromToken(cookies().get(ADMIN_COOKIE)?.value, "admin");
  if (!u || u.role !== "admin") return null;
  return u;
}

export function totalBalance(u: {
  balanceUsd: number;
  balanceUsdt: number;
}): number {
  return Math.round((u.balanceUsd + u.balanceUsdt) * 100) / 100;
}

/** Signed delta across the USD pool first, then USDT. Never goes negative. */
export function applyDelta(
  u: { balanceUsd: number; balanceUsdt: number },
  delta: number,
): { balanceUsd: number; balanceUsdt: number } {
  let usd = u.balanceUsd;
  let usdt = u.balanceUsdt;
  if (delta >= 0) {
    usd += delta;
  } else {
    let need = -delta;
    const fromUsd = Math.min(usd, need);
    usd -= fromUsd;
    need -= fromUsd;
    usdt -= need;
  }
  return {
    balanceUsd: Math.round(usd * 100) / 100,
    balanceUsdt: Math.round(Math.max(0, usdt) * 100) / 100,
  };
}

export function ageFromDob(dob: string): number {
  const d = new Date(`${dob}T00:00:00`);
  if (isNaN(d.getTime())) return -1;
  return (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
}
