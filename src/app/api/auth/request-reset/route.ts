import { z } from "zod";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({ email: z.string().trim().email().max(120) });

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const email = parsed.data.email.toLowerCase();
  const row = await prisma.user.findUnique({ where: { email } });
  if (!row) return err("No account found with this email.");
  const code = createHash("sha256")
    .update(`reset:${email}:${Date.now()}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  await prisma.user.update({ where: { email }, data: { resetCode: code } });
  // No email service is connected, so the code is returned to the app.
  return json({ resetCode: code });
}
