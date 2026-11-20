import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  email: z.string().trim().email().max(120),
  code: z.string().trim().min(4).max(10),
  newPassword: z.string().min(6).max(72),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const { email, code, newPassword } = parsed.data;
  const lower = email.toLowerCase();
  const acct = await prisma.user.findUnique({ where: { email: lower } });
  if (!acct || !acct.resetCode || acct.resetCode.toUpperCase() !== code.toUpperCase()) {
    return err("Wrong reset code.");
  }
  await prisma.user.update({
    where: { email: lower },
    data: { passwordHash: await hashPassword(newPassword), resetCode: "" },
  });
  return json({ ok: true });
}
