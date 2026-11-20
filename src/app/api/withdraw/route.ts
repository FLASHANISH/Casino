import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer, totalBalance } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  method: z.enum(["UPI", "USDT"]),
  amount: z.number().min(1).max(100000),
  destination: z.string().trim().min(4).max(160),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);
  if (me.kycStatus.includes("pending")) {
    return err(
      "KYC verification required before withdraw. Verify your email in Profile first - withdraw unlocks once KYC shows verified.",
    );
  }
  if (args.amount > totalBalance(me)) {
    return err("Insufficient real-money balance for this withdraw amount.");
  }
  const pending = await prisma.moneyRequest.findMany({
    where: { userId: me.id },
  });
  const held = pending
    .filter((r) => r.kind === "withdraw" && r.status === "pending")
    .reduce((a, r) => a + r.amount, 0);
  if (args.amount + held > totalBalance(me)) {
    return err("You already have a pending withdraw holding this balance. Wait for review.");
  }

  await prisma.$transaction([
    prisma.moneyRequest.create({
      data: {
        userId: me.id,
        kind: "withdraw",
        method: args.method,
        amount: args.amount,
        currency: args.method === "USDT" ? "USDT" : "USD",
        destination: args.destination,
        status: "pending",
      },
    }),
    prisma.ledger.create({
      data: {
        userId: me.id,
        type: "withdraw-request",
        amount: 0,
        currency: args.method === "USDT" ? "USDT" : "USD",
        note: `Withdraw request via ${args.method} to ${args.destination} - balance debits only on approval`,
      },
    }),
  ]);
  return json({ ok: true });
}
