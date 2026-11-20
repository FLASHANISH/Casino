import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyDelta, currentAdmin, totalBalance } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  userId: z.number().int(),
  amount: z.number().min(-100000).max(100000),
  note: z.string().max(120).default("Balance adjustment"),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);
  const u = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!u) return err("User not found.");
  if (totalBalance(u) + parsed.data.amount < 0) {
    return err("Balance cannot go negative.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: u.id },
      data: applyDelta(u, parsed.data.amount),
    }),
    prisma.ledger.create({
      data: {
        userId: u.id,
        type: "adjust",
        amount: parsed.data.amount,
        currency: "USD",
        note: parsed.data.note,
      },
    }),
  ]);
  return json({ ok: true });
}
