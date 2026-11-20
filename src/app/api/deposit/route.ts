import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  method: z.enum(["UPI", "USDT"]),
  amount: z.number().min(1).max(100000),
  ref: z.string().trim().min(4).max(120),
  screenshotRef: z.string().trim().max(200).default(""),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);

  if (me.depositLimit > 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const mine = await prisma.moneyRequest.findMany({
      where: { userId: me.id, createdAt: { gte: todayStart } },
    });
    const todayDep = mine
      .filter((r) => r.kind === "deposit" && r.status !== "rejected")
      .reduce((a, r) => a + r.amount, 0);
    if (todayDep + args.amount > me.depositLimit) {
      return err(
        `This deposit would cross your daily deposit limit of $${me.depositLimit}. Lower the amount or raise the limit in your Wallet.`,
      );
    }
  }

  await prisma.$transaction([
    prisma.moneyRequest.create({
      data: {
        userId: me.id,
        kind: "deposit",
        method: args.method,
        amount: args.amount,
        currency: args.method === "USDT" ? "USDT" : "USD",
        ref: args.ref,
        screenshotRef: args.screenshotRef ?? "",
        status: "pending",
      },
    }),
    prisma.ledger.create({
      data: {
        userId: me.id,
        type: "deposit-request",
        amount: 0,
        currency: args.method === "USDT" ? "USDT" : "USD",
        note: `Deposit request via ${args.method} - UTR/Tx: ${args.ref} - awaiting verification`,
      },
    }),
  ]);
  return json({ ok: true });
}
