import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyDelta, currentPlayer, totalBalance } from "@/lib/auth";
import { err, json, money, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  fixtureId: z.number().int(),
  pickTeam: z.string().min(1).max(80),
  stake: z.number().min(1).max(5000),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);

  const f = await prisma.fixture.findUnique({ where: { id: args.fixtureId } });
  if (!f) return err("Fixture not found.");
  const odds = args.pickTeam === f.team1 ? f.odds1 : f.odds2;
  if (args.stake > totalBalance(me)) {
    return err("Insufficient real-money balance for this stake. Deposit first.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: me.id },
      data: applyDelta(me, -args.stake),
    }),
    prisma.sportsBet.create({
      data: {
        userId: me.id,
        fixtureLabel: `${f.team1} vs ${f.team2}`,
        pick: args.pickTeam,
        odds,
        stake: args.stake,
        potential: money(args.stake * odds),
        status: "open",
      },
    }),
    prisma.ledger.create({
      data: {
        userId: me.id,
        type: "sports-bet",
        amount: -args.stake,
        currency: "USD",
        note: `${f.league} bet: ${args.pickTeam} @ ${odds} (demo fixture)`,
      },
    }),
  ]);
  return json({ ok: true });
}
