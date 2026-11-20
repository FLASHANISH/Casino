import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({ slug: z.string().min(1).max(80) });

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  await prisma.gameConfig.delete({ where: { slug: parsed.data.slug } });
  return json({ ok: true });
}
