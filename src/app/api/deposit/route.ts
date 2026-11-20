import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer } from "@/lib/auth";
import { formatMoney } from "@/lib/countries";
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
  const userCurrency = me.currency || "USD";

  // UPI is available only for INR wallets; everyone else uses USDT.
  if (args.method === "UPI" && userCurrency !== "INR") {
    return err(
      `UPI deposits are available only for INR wallets. Your wallet currency is ${userCurrency} — please deposit via USDT.`,
    );
  }
  const requestCurrency = args.method === "USDT" ? "USDT" : userCurrency;

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
        `This deposit would cross your daily deposit limit of ${formatMoney(me.depositLimit, userCurrency)}. Lower the amount or raise the limit in your Wallet.`,
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
        currency: requestCurrency,
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
        currency: requestCurrency,
        note: `Deposit request via ${args.method} - UTR/Tx: ${args.ref} - awaiting verification`,
      },
    }),
  ]);
  return json({ ok: true });
}
