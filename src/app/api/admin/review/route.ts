import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyDelta, currentAdmin, totalBalance } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  requestId: z.number().int(),
  approve: z.boolean(),
  reason: z.string().trim().max(200).default(""),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);

  const r = await prisma.moneyRequest.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!r) return err("Request not found.");
  if (r.status !== "pending") return err(`This request is already ${r.status}.`);
  const u = await prisma.user.findUnique({ where: { id: r.userId } });
  if (!u) return err("Player account not found.");

  if (!parsed.data.approve) {
    await prisma.$transaction([
      prisma.moneyRequest.update({
        where: { id: r.id },
        data: {
          status: "rejected",
          rejectReason: parsed.data.reason || "Rejected after verification",
        },
      }),
      prisma.ledger.create({
        data: {
          userId: u.id,
          type: `${r.kind}-rejected`,
          amount: 0,
          currency: r.currency,
          note: `${r.kind === "deposit" ? "Deposit" : "Withdraw"} of ${r.amount} ${r.currency} rejected: ${parsed.data.reason || "no reason given"}`,
        },
      }),
    ]);
    return json({ ok: true });
  }

  if (r.kind === "deposit") {
    const pools =
      r.currency === "USDT"
        ? { balanceUsd: u.balanceUsd, balanceUsdt: Math.round((u.balanceUsdt + r.amount) * 100) / 100 }
        : { balanceUsd: Math.round((u.balanceUsd + r.amount) * 100) / 100, balanceUsdt: u.balanceUsdt };
    await prisma.$transaction([
      prisma.user.update({ where: { id: u.id }, data: pools }),
      prisma.ledger.create({
        data: {
          userId: u.id,
          type: "deposit",
          amount: r.amount,
          currency: r.currency,
          note: `Deposit approved - ${r.method} UTR/Tx: ${r.ref}`,
        },
      }),
      prisma.moneyRequest.update({ where: { id: r.id }, data: { status: "approved" } }),
    ]);
  } else {
    if (r.amount > totalBalance(u)) {
      return err("Player balance is now lower than this withdraw amount - cannot approve.");
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: u.id },
        data: applyDelta(u, -r.amount),
      }),
      prisma.ledger.create({
        data: {
          userId: u.id,
          type: "withdraw",
          amount: -r.amount,
          currency: r.currency,
          note: `Withdraw approved - paid via ${r.method} to ${r.destination}`,
        },
      }),
      prisma.moneyRequest.update({ where: { id: r.id }, data: { status: "approved" } }),
    ]);
  }
  return json({ ok: true });
}
