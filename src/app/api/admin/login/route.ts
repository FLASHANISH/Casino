import { z } from "zod";
import prisma from "@/lib/prisma";
import { ensureSeed } from "@/lib/seed";
import { createSession, setAdminCookie, verifyPassword } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  identifier: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const ident = parsed.data.identifier.toLowerCase();
  const all = await prisma.user.findMany({ where: { role: "admin" } });
  const u =
    all.find((x) => x.email.toLowerCase() === ident) ??
    all.find((x) => x.username !== "" && x.username.toLowerCase() === ident);
  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash))) {
    return err("Wrong username or password.", 401);
  }
  if (u.suspended) return err("This account is suspended.", 403);
  const token = await createSession(u.id, "admin");
  await setAdminCookie(token);
  return json({ ok: true, username: u.username });
}
