import { z } from "zod";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  currentAdmin,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  currentPassword: z.string().min(1).max(72),
  newUsername: z.string().trim().max(40).default(""),
  newPassword: z.string().max(72).default(""),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const me = await currentAdmin();
  if (!me) return err("Access denied.", 403);
  if (!(await verifyPassword(parsed.data.currentPassword, me.passwordHash))) {
    return err("Current password is wrong - credentials not changed.");
  }
  const patch: { username?: string; passwordHash?: string } = {};
  const nu = (parsed.data.newUsername ?? "").trim();
  if (nu && nu.toLowerCase() !== me.username.toLowerCase()) {
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(nu)) {
      return err("Username must be 3-40 characters: letters, numbers, dot, underscore or dash only.");
    }
    const all = await prisma.user.findMany();
    const clash = all.find(
      (x) =>
        x.id !== me.id &&
        (x.username.toLowerCase() === nu.toLowerCase() ||
          x.email.toLowerCase() === nu.toLowerCase()),
    );
    if (clash) return err("That username is already taken. Pick another one.");
    patch.username = nu;
  }
  if (parsed.data.newPassword) {
    if (parsed.data.newPassword.length < 6) {
      return err("New password must be at least 6 characters.");
    }
    patch.passwordHash = await hashPassword(parsed.data.newPassword);
  }
  if (!patch.username && !patch.passwordHash) {
    return err("Nothing to change - enter a new username or a new password.");
  }
  await prisma.user.update({ where: { id: me.id }, data: patch });
  // Sign out every other admin session; the current one stays in.
  const myToken = cookies().get(ADMIN_COOKIE)?.value;
  await prisma.session.deleteMany({
    where: { userId: me.id, kind: "admin", NOT: { token: myToken ?? "" } },
  });
  return json({ ok: true, username: patch.username ?? me.username });
}
