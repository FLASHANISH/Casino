// Idempotent database seeding — ported from the hosted build's `ensure()`.
// Safe to call on every request: it only inserts what is missing and never
// touches credentials after the operator changes them.

import prisma from "./prisma";
import { allGames, FIXTURES } from "./catalog";
import { hashPassword, refCodeFor } from "./auth";

let seeded = false;

const DEFAULT_SETTINGS: [string, string][] = [
  ["odds_api_key", ""],
  ["cricapi_key", ""],
  ["brand_name", "Quvanta"],
  ["support_email", ""],
  ["geo_block", "US, UK, AU"],
  [
    "promo_banner",
    "Real-money casino: deposit via UPI or USDT, withdraw after KYC - verification on every request",
  ],
  ["upi_id", process.env.UPI_ID || "quvanta@upi"],
  ["usdt_address", process.env.USDT_ADDRESS || ""],
  ["tournament_note", "Quvanta Champions Cup - leaderboard by total wins"],
];

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  try {
    // Games catalog (232 distinct listings).
    const existingGames = await prisma.gameConfig.findMany({
      select: { slug: true },
    });
    const haveSlugs = new Set(existingGames.map((g) => g.slug));
    const all = allGames();
    for (const g of all) {
      if (haveSlugs.has(g.slug)) continue;
      await prisma.gameConfig.create({
        data: {
          slug: g.slug,
          name: g.name,
          category: g.category,
          rtp: g.rtp,
          enabled: true,
          minBet: 1,
          maxBet: 500,
          plays: 0,
          description: g.description,
          engine: g.engine,
          tag: g.tag,
          hue: g.hue,
        },
      });
    }

    // Demo fixtures (labelled DEMO until API keys are connected).
    const existingFixtures = await prisma.fixture.findMany({
      select: { team1: true, team2: true },
    });
    const haveFixture = new Set(
      existingFixtures.map((f) => `${f.team1}|${f.team2}`),
    );
    for (const f of FIXTURES) {
      if (haveFixture.has(`${f.team1}|${f.team2}`)) continue;
      await prisma.fixture.create({ data: { ...f, isDemo: true } });
    }

    // Default settings.
    const existingSettings = await prisma.setting.findMany({
      select: { key: true },
    });
    const haveKeys = new Set(existingSettings.map((s) => s.key));
    for (const [key, value] of DEFAULT_SETTINGS) {
      if (haveKeys.has(key)) continue;
      await prisma.setting.create({ data: { key, value } });
    }
    // Env keys win over empty stored keys (Vercel env vars are the source
    // of truth for API keys when set).
    if (process.env.CRICAPI_KEY) {
      await prisma.setting.upsert({
        where: { key: "cricapi_key" },
        update: { value: process.env.CRICAPI_KEY },
        create: { key: "cricapi_key", value: process.env.CRICAPI_KEY },
      });
    }
    if (process.env.ODDS_API_KEY) {
      await prisma.setting.upsert({
        where: { key: "odds_api_key" },
        update: { value: process.env.ODDS_API_KEY },
        create: { key: "odds_api_key", value: process.env.ODDS_API_KEY },
      });
    }

    // Users: exactly ONE admin, seeded once. Player signup always creates
    // role=player, and any extra admin rows are demoted.
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const adminEmail =
        process.env.SEED_ADMIN_EMAIL || "admin@quvanta.gg";
      await prisma.user.create({
        data: {
          name: "Quvanta Admin",
          email: adminEmail,
          username: "admin",
          passwordHash: await hashPassword("admin@123"),
          role: "admin",
          dob: "1990-01-01",
          kycStatus: "verified - 18+",
          balanceUsd: 0,
          balanceUsdt: 0,
          referralCode: "",
        },
      });
      await prisma.user.create({
        data: {
          name: "Demo Player",
          email: "player@quvanta.gg",
          passwordHash: await hashPassword("player123"),
          role: "player",
          dob: "1998-05-10",
          kycStatus: "verified - 18+",
          balanceUsd: 0,
          balanceUsdt: 0,
          referralCode: "",
        },
      });
    }

    const allUsers = await prisma.user.findMany();
    for (const u of allUsers) {
      if (!u.referralCode) {
        await prisma.user.update({
          where: { id: u.id },
          data: { referralCode: refCodeFor(u.email, u.id) },
        });
      }
    }
    const admins = allUsers.filter((u) => u.role === "admin");
    for (const extra of admins.slice(1)) {
      await prisma.user.update({
        where: { id: extra.id },
        data: { role: "player" },
      });
    }

    seeded = true;
  } catch (err) {
    // Seeding is best-effort at request time (e.g. migrations not yet run
    // on a fresh deploy). The explicit `prisma db seed` step is the
    // authoritative one; request handlers surface the real DB error.
    if (process.env.NODE_ENV === "development") console.error("ensureSeed:", err);
  }
}
