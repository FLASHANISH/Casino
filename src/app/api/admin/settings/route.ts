import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  values: z.record(z.string().max(500)),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  for (const [key, value] of Object.entries(parsed.data.values)) {
    if ((key === "cricapi_key" || key === "odds_api_key") && value.trim() === "") {
      continue;
    }
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  return json({ ok: true });
}
