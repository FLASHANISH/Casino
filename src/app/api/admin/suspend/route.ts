import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({ userId: z.number().int(), suspended: z.boolean() });

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  if (admin.id === parsed.data.userId) {
    return err("You cannot suspend your own admin account.");
  }
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { suspended: parsed.data.suspended },
  });
  return json({ ok: true });
}
