// Shared server-side state loader: public catalog, fixtures, settings
// plus, when a player is logged in, their wallet, history and referrals.
// API keys are never returned to the client (only a hasLiveKeys flag).

import prisma from "./prisma";
import { ensureSeed } from "./seed";
import { totalBalance, type SessionUser } from "./auth";

export type PublicGame = {
  slug: string;
  name: string;
  category: string;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  rtp: number;
  plays: number;
  description: string;
  engine: string;
  tag: string;
  hue: number;
};

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  balance: number;
  balanceUsd: number;
  balanceUsdt: number;
  kycStatus: string;
  favorites: string[];
  referralCode: string;
  depositLimit: number;
  lossLimit: number;
  country: string;
  currency: string;
};

export function pubUser(u: SessionUser): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username || "",
    role: u.role,
    balance: totalBalance(u),
    balanceUsd: u.balanceUsd,
    balanceUsdt: u.balanceUsdt,
    kycStatus: u.kycStatus,
    favorites: u.favorites ? u.favorites.split(",").filter(Boolean) : [],
    referralCode: u.referralCode,
    depositLimit: u.depositLimit,
    lossLimit: u.lossLimit,
    country: u.country || "",
    currency: u.currency || "USD",
  };
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const pick = (k: string) => rows.find((x) => x.key === k)?.value ?? "";
  return {
    promo_banner: pick("promo_banner"),
    tournament_note: pick("tournament_note"),
    support_email: pick("support_email"),
    geo_block: pick("geo_block"),
    brand_name: pick("brand_name"),
    upi_id: pick("upi_id"),
    usdt_address: pick("usdt_address"),
  };
}

export async function hasLiveKeys(): Promise<boolean> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["odds_api_key", "cricapi_key"] } },
  });
  return rows.some((s) => s.value.trim() !== "");
}

export async function getState(me: SessionUser | null) {
  await ensureSeed();
  const [games, fixtures] = await Promise.all([
    prisma.gameConfig.findMany({ orderBy: { slug: "asc" } }),
    prisma.fixture.findMany({ orderBy: { id: "asc" } }),
  ]);
  const settings = await getPublicSettings();
  const live = await hasLiveKeys();

  let bets: Awaited<ReturnType<typeof prisma.bet.findMany>> = [];
  let ledger: Awaited<ReturnType<typeof prisma.ledger.findMany>> = [];
  let sBets: Awaited<ReturnType<typeof prisma.sportsBet.findMany>> = [];
  let reqs: Awaited<ReturnType<typeof prisma.moneyRequest.findMany>> = [];
  let referrals: { id: number; name: string; email: string; earned: number; createdAt: string }[] = [];

  if (me) {
    [bets, ledger, sBets, reqs] = await Promise.all([
      prisma.bet.findMany({
        where: { userId: me.id },
        orderBy: { id: "desc" },
        take: 40,
      }),
      prisma.ledger.findMany({
        where: { userId: me.id },
        orderBy: { id: "desc" },
        take: 40,
      }),
      prisma.sportsBet.findMany({
        where: { userId: me.id },
        orderBy: { id: "desc" },
        take: 20,
      }),
      prisma.moneyRequest.findMany({
        where: { userId: me.id },
        orderBy: { id: "desc" },
        take: 30,
      }),
    ]);
    const referred = await prisma.user.findMany({
      where: { referredBy: me.id },
      orderBy: { id: "desc" },
    });
    referrals = referred.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      earned: 10,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  return {
    user: me ? pubUser(me) : null,
    games: games.map((g) => ({
      slug: g.slug,
      name: g.name,
      category: g.category,
      enabled: g.enabled,
      minBet: g.minBet,
      maxBet: g.maxBet,
      rtp: g.rtp,
      plays: g.plays,
      description: g.description,
      engine: g.engine,
      tag: g.tag,
      hue: g.hue,
    })) as PublicGame[],
    bets: bets.map((b) => ({
      id: b.id,
      game: b.game,
      betAmount: b.betAmount,
      payout: b.payout,
      profit: b.profit,
      detail: b.detail,
      fairHash: b.fairHash,
      createdAt: b.createdAt.toISOString(),
    })),
    ledger: ledger.map((l) => ({
      id: l.id,
      type: l.type,
      amount: l.amount,
      currency: l.currency,
      note: l.note,
      createdAt: l.createdAt.toISOString(),
    })),
    fixtures: fixtures.map((f) => ({
      id: f.id,
      team1: f.team1,
      team2: f.team2,
      venue: f.venue,
      startsAt: f.startsAt,
      odds1: f.odds1,
      odds2: f.odds2,
      isDemo: f.isDemo,
      league: f.league,
      sport: f.sport,
    })),
    sportsBets: sBets.map((s) => ({
      id: s.id,
      fixtureLabel: s.fixtureLabel,
      pick: s.pick,
      odds: s.odds,
      stake: s.stake,
      potential: s.potential,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    settings,
    hasLiveKeys: live,
    totalGames: games.length,
    requests: reqs.map((r) => ({
      id: r.id,
      kind: r.kind,
      method: r.method,
      amount: r.amount,
      currency: r.currency,
      ref: r.ref,
      destination: r.destination,
      status: r.status,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt.toISOString(),
    })),
    referrals,
    referralEarned: referrals.length * 10,
  };
}

export type AppState = Awaited<ReturnType<typeof getState>>;
