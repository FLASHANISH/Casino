import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wallet = sqliteTable("wallet", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  balanceUsd: real("balance_usd").notNull().default(0),
  balanceUsdt: real("balance_usdt").notNull().default(0),
  kycStatus: text("kyc_status").notNull().default("verified"),
  username: text("username").notNull().default("player"),
});

export const ledger = sqliteTable("ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().default(0),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const bets = sqliteTable("bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().default(0),
  game: text("game").notNull(),
  betAmount: real("bet_amount").notNull(),
  payout: real("payout").notNull(),
  profit: real("profit").notNull(),
  detail: text("detail").notNull().default(""),
  fairHash: text("fair_hash").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().default(0),
  kind: text("kind", { enum: ["deposit", "withdraw"] }).notNull(),
  method: text("method").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  ref: text("ref").notNull().default(""),
  rejectReason: text("reject_reason").notNull().default(""),
  destination: text("destination").notNull().default(""),
  screenshotRef: text("screenshot_ref").notNull().default(""),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const gamesConfig = sqliteTable("games_config", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Originals"),
  enabled: integer("enabled").notNull().default(1),
  minBet: real("min_bet").notNull().default(1),
  maxBet: real("max_bet").notNull().default(500),
  rtp: real("rtp").notNull().default(97),
  plays: integer("plays").notNull().default(0),
  description: text("description").notNull().default(""),
  engine: text("engine").notNull().default("slots"),
  tag: text("tag").notNull().default(""),
  hue: integer("hue").notNull().default(45),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const tenants = sqliteTable("tenants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  domain: text("domain").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  commission: real("commission").notNull().default(15),
  monthlyRent: real("monthly_rent").notNull().default(750),
  model: text("model").notNull().default("rent"),
  status: text("status").notNull().default("active"),
  color: text("color").notNull().default("#0C2B1E"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const fixtures = sqliteTable("fixtures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team1: text("team1").notNull(),
  team2: text("team2").notNull(),
  venue: text("venue").notNull().default(""),
  startsAt: text("starts_at").notNull().default(""),
  odds1: real("odds1").notNull(),
  odds2: real("odds2").notNull(),
  isDemo: integer("is_demo").notNull().default(1),
  league: text("league").notNull().default("IPL"),
  sport: text("sport").notNull().default("Cricket"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  username: text("username").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""),
  role: text("role").notNull().default("player"),
  dob: text("dob").notNull().default(""),
  kycStatus: text("kyc_status").notNull().default("verified — 18+"),
  balanceUsd: real("balance_usd").notNull().default(0),
  balanceUsdt: real("balance_usdt").notNull().default(0),
  suspended: integer("suspended").notNull().default(0),
  lastBonus: text("last_bonus").notNull().default(""),
  verifyCode: text("verify_code").notNull().default(""),
  resetCode: text("reset_code").notNull().default(""),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: integer("referred_by").notNull().default(0),
  depositLimit: real("deposit_limit").notNull().default(0),
  lossLimit: real("loss_limit").notNull().default(0),
  favorites: text("favorites").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const sportsBets = sqliteTable("sports_bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().default(0),
  fixtureLabel: text("fixture_label").notNull(),
  pick: text("pick").notNull(),
  odds: real("odds").notNull(),
  stake: real("stake").notNull(),
  potential: real("potential").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});
