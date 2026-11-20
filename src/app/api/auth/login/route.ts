import { z } from "zod";
import prisma from "@/lib/prisma";
import { ensureSeed } from "@/lib/seed";
import {
  createSession,
  setPlayerCookie,
  verifyPassword,
} from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";
import { pubUser } from "@/lib/state";

const schema = z.object({
  identifier: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(72),
});

// In-memory rate limit (per serverless instance; bcrypt cost is the
// main brute-force defence on Vercel).
const attempts = new Map<string, number[]>();

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;
  const ident = args.identifier.toLowerCase();
  const now = Date.now();
  const recent = (attempts.get(ident) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 8) {
    return err("Too many failed attempts. Wait 10 minutes and try again.", 429);
  }

  const all = await prisma.user.findMany();
  const u =
    all.find((x) => x.email.toLowerCase() === ident) ??
    all.find((x) => x.username !== "" && x.username.toLowerCase() === ident);
  if (!u || !(await verifyPassword(args.password, u.passwordHash))) {
    recent.push(now);
    attempts.set(ident, recent);
    return err("Wrong email/username or password. Check and try again.", 401);
  }
  if (u.suspended) return err("This account is suspended. Contact support.", 403);
  attempts.delete(ident);

  const token = await createSession(u.id, "player");
  await setPlayerCookie(token);
  return json({ ok: true, user: pubUser(u) });
}
