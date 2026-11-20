import prisma from "@/lib/prisma";
import { currentAdmin, totalBalance } from "@/lib/auth";
import { err, json } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return err("Access denied.", 403);

  const [allBets, users, games, logs, tenants, allReqs, setRows] =
    await Promise.all([
      prisma.bet.findMany(),
      prisma.user.findMany({ orderBy: { id: "asc" } }),
      prisma.gameConfig.findMany(),
      prisma.bet.findMany({ orderBy: { id: "desc" }, take: 30 }),
      prisma.tenant.findMany({ orderBy: { id: "desc" } }),
      prisma.moneyRequest.findMany({ orderBy: { id: "desc" }, take: 60 }),
      prisma.setting.findMany(),
    ]);

  const emailOf = new Map(users.map((u) => [u.id, u.email]));
  const totalReferrals = users.filter((u) => u.referredBy > 0).length;
  const SECRET = new Set(["cricapi_key", "odds_api_key"]);
  const settings: Record<string, string> = {};
  for (const s of setRows) {
    if (s.key.startsWith("verify_") || s.key.startsWith("reset_")) continue;
    settings[s.key] = SECRET.has(s.key) ? "" : s.value;
  }
  const totalWagered = allBets.reduce((a, b) => a + b.betAmount, 0);
  const totalPayout = allBets.reduce((a, b) => a + b.payout, 0);

  return json({
    stats: {
      totalWagered,
      totalPayout,
      ggr: totalWagered - totalPayout,
      totalBets: allBets.length,
      totalUsers: users.length,
      totalGames: games.length,
      totalReferrals,
      referralPayouts: totalReferrals * 10,
      pendingRequests: allReqs.filter((r) => r.status === "pending").length,
    },
    requests: allReqs.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: emailOf.get(r.userId) ?? `#${r.userId}`,
      kind: r.kind,
      method: r.method,
      amount: r.amount,
      currency: r.currency,
      ref: r.ref,
      destination: r.destination,
      screenshotRef: r.screenshotRef,
      status: r.status,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt.toISOString(),
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      balance: totalBalance(u),
      suspended: u.suspended,
      kycStatus: u.kycStatus,
    })),
    logs: logs.map((b) => ({
      id: b.id,
      game: b.game,
      betAmount: b.betAmount,
      profit: b.profit,
      detail: b.detail,
      createdAt: b.createdAt.toISOString(),
    })),
    tenants: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      domain: t.domain,
      currency: t.currency,
      commission: t.commission,
      monthlyRent: t.monthlyRent,
      model: t.model,
      status: t.status,
      color: t.color,
    })),
    settings,
    hasLiveKeys: setRows.some(
      (s) =>
        (s.key === "odds_api_key" || s.key === "cricapi_key") &&
        s.value.trim() !== "",
    ),
  });
}
