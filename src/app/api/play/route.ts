import { z } from "zod";
import prisma from "@/lib/prisma";
import { ensureSeed } from "@/lib/seed";
import { applyDelta, currentPlayer, totalBalance } from "@/lib/auth";
import { newRoundHash, playRound } from "@/lib/games";
import { err, json, money, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  game: z.string().min(1).max(80),
  bet: z.number().min(0.5).max(5000),
  choice: z.string().max(40).default(""),
  target: z.number().min(0).max(10000).default(2),
  count: z.number().int().min(0).max(25).default(3),
});

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;

  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);
  if (me.suspended) return err("This account is suspended. Contact support.", 403);

  const cfg = await prisma.gameConfig.findUnique({ where: { slug: args.game } });
  if (!cfg) return err("Game not found.");
  if (!cfg.enabled) return err("This game is currently unavailable.");
  if (args.bet < cfg.minBet || args.bet > cfg.maxBet) {
    return err(`Bet must be between $${cfg.minBet} and $${cfg.maxBet}.`);
  }
  if (args.bet > totalBalance(me)) {
    return err("Insufficient real-money balance. Deposit via UPI or USDT in your Wallet first.");
  }
  if (me.lossLimit > 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const myBets = await prisma.bet.findMany({
      where: { userId: me.id, createdAt: { gte: todayStart } },
    });
    const todayLoss = myBets.reduce((a, b) => a + Math.min(0, b.profit), 0);
    if (-todayLoss >= me.lossLimit) {
      return err(
        `Daily loss limit of $${me.lossLimit} reached. Play is paused until tomorrow - set or change limits in your Wallet.`,
      );
    }
  }

  const engine = cfg.engine || cfg.slug;
  const outcome = playRound({
    engine,
    bet: args.bet,
    choice: args.choice ?? "",
    target: args.target ?? 2,
    count: args.count ?? 3,
  });
  const fairHash = newRoundHash(args.game, me.id);
  const payout = money(args.bet * outcome.multiplier);
  const profit = money(payout - args.bet);
  const pools = applyDelta(me, profit);
  const newBalance = money(pools.balanceUsd + pools.balanceUsdt);

  await prisma.$transaction([
    prisma.user.update({ where: { id: me.id }, data: pools }),
    prisma.bet.create({
      data: {
        userId: me.id,
        game: cfg.name,
        betAmount: args.bet,
        payout,
        profit,
        detail: outcome.detail,
        fairHash,
      },
    }),
    prisma.ledger.create({
      data: {
        userId: me.id,
        type: profit >= 0 ? "win" : "bet",
        amount: profit,
        currency: "USD",
        note: `${cfg.name}: ${outcome.detail}`,
      },
    }),
    prisma.gameConfig.update({
      where: { slug: args.game },
      data: { plays: { increment: 1 } },
    }),
  ]);

  return json({
    win: payout > args.bet,
    payout,
    profit,
    multiplier: outcome.multiplier,
    balance: newBalance,
    detail: outcome.detail,
    reveal: outcome.reveal,
    fairHash,
    cards: outcome.cards,
    mines: outcome.mines,
    picks: outcome.picks,
    roll: outcome.roll,
    bin: outcome.bin,
    crashPoint: outcome.crashPoint,
  });
}
