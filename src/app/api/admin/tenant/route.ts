import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  domain: z.string().max(80).default(""),
  currency: z.string().max(10).default("USD"),
  commission: z.number().min(0).max(90).default(15),
  monthlyRent: z.number().min(0).max(100000).default(750),
  model: z.string().max(20).default("rent"),
  color: z.string().max(10).default("#0a0a0f"),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      domain: parsed.data.domain ?? "",
      currency: parsed.data.currency ?? "USD",
      commission: parsed.data.commission ?? 15,
      monthlyRent: parsed.data.monthlyRent ?? 750,
      model: parsed.data.model ?? "rent",
      color: parsed.data.color ?? "#0a0a0f",
      status: "active",
    },
  });
  return json({ ok: true });
}
