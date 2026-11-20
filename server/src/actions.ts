
import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { desc, eq } from "drizzle-orm";
import * as schema from "./schema";

function hashOf(s: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
const pwHash = (email: string, pw: string) => hashOf(`quvanta:${email.toLowerCase()}:${pw}:${hashOf(email.toLowerCase())}`);
function cardName(rank: number, suit: string): string { const r = rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : String(rank); return `${r}${suit}`; }
function dealCards(n: number): { rank: number; suit: string; label: string }[] {
  const suits = ["\u2660", "\u2665", "\u2666", "\u2663"]; const used = new Set<string>(); const out: { rank: number; suit: string; label: string }[] = [];
  while (out.length < n) { const rank = 2 + Math.floor(Math.random() * 13); const suit = suits[Math.floor(Math.random() * 4)] ?? "\u2660"; const key = `${rank}-${suit}`; if (used.has(key)) continue; used.add(key); out.push({ rank, suit, label: cardName(rank, suit) }); }
  return out;
}
function handValue(ranks: number[]): number { let total = 0, aces = 0; for (const r of ranks) { if (r === 14) { aces++; total += 11; } else total += Math.min(r, 10); } while (total > 21 && aces > 0) { total -= 10; aces--; } return total; }
function tpScore(cards: { rank: number; suit: string }[]): { score: number; label: string } {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a); const flush = cards.every((c) => c.suit === (cards[0]?.suit ?? ""));
  const uniq = [...new Set(ranks)]; const straight = uniq.length === 3 && ((uniq[0] ?? 0) - (uniq[2] ?? 0) === 2); const trio = uniq.length === 1;
  const pairRank = ranks.find((r, i) => ranks[i + 1] === r); const high = ranks[0] ?? 0;
  if (trio) return { score: 600 + high, label: "Trio (Trail)" }; if (straight && flush) return { score: 500 + high, label: "Pure Sequence" };
  if (straight) return { score: 400 + high, label: "Sequence" }; if (flush) return { score: 300 + high, label: "Colour / Flush" };
  if (pairRank !== undefined) return { score: 200 + pairRank, label: "Pair" }; return { score: 100 + high, label: "High Card" };
}
function choose(n: number, k: number): number { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; }
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function refCodeFor(email: string, id: number): string { return ("QV" + hashOf(`ref:${email.toLowerCase()}:${id}`).slice(0, 6)).toUpperCase(); }
type UserRow = typeof schema.users.$inferSelect;
function totalBalance(u: UserRow): number { return Math.round((u.balanceUsd + u.balanceUsdt) * 100) / 100; }
// Applies a signed delta across the USD pool first, then the USDT pool. Returns the new pool values.
function applyDelta(u: UserRow, delta: number): { balanceUsd: number; balanceUsdt: number } {
  let usd = u.balanceUsd, usdt = u.balanceUsdt;
  if (delta >= 0) { usd += delta; } else { let need = -delta; const fromUsd = Math.min(usd, need); usd -= fromUsd; need -= fromUsd; usdt -= need; }
  return { balanceUsd: Math.round(usd * 100) / 100, balanceUsdt: Math.round(Math.max(0, usdt) * 100) / 100 };
}

// ---------- 200+ distinct game catalog ----------
type CatDef = { category: string; engine: string; themes: string[]; kinds: string[]; blurb: string };
const CATALOG: CatDef[] = [
  { category: "Slots", engine: "slots", blurb: "reel slot with themed symbols, pair pays and a three-of-a-kind jackpot line", themes: ["Egyptian Gold", "Fruit Party", "Mega Fortune", "Dragon Pearl", "Aztec Temple", "Lucky Sevens", "Diamond Rush", "Pirate Bounty", "Neon Nights", "Wild West Gold", "Zeus Thunder", "Candy Kingdom", "Samurai Honor", "Viking Voyage", "Jungle King", "Space Odyssey", "Mermaid Treasure", "Pharaoh's Tomb", "Buffalo Stampede", "Royal Crown"], kinds: ["Classic", "Mega", "Deluxe", "Jackpot"] },
  { category: "Table Games", engine: "blackjack", blurb: "table game with real cards, dealer rules and chip betting", themes: ["Blackjack Pro", "European Roulette", "American Roulette", "Baccarat Royale", "Three Card Poker", "Video Poker Deluxe", "Sic Bo Supreme", "Dragon Tiger Table", "Casino Hold'em", "Roulette Royale", "French Roulette", "Pontoon", "Red Dog", "Craps Table", "Mini Baccarat", "Lightning Roulette"], kinds: ["Classic", "VIP"] },
  { category: "Card Games", engine: "teenpatti", blurb: "card game with dealt hands, ranked combinations and head-to-head showdown", themes: ["Teen Patti Gold", "Andar Bahar Nights", "Rummy Royale", "Call Break King", "Solitaire Classic", "Poker Texas Star", "Omaha Nights", "Blackjack Switch", "Teen Patti Joker", "Muflis Mania", "AK47 Showdown", "Dragon Tiger Cards", "Pool Rummy", "Points Rummy", "Deals Rummy", "Hearts Classic"], kinds: ["Classic", "Pro"] },
  { category: "Arcade", engine: "crash", blurb: "fast arcade round with instant rounds, rising multipliers and cash-out timing", themes: ["Crash X", "Plinko Drop", "Mines Pro", "Dice Roll", "Limbo Line", "Wheel Spin", "Tower Climb", "Balloon Pop", "Hi-Lo Rush", "Keno Arcade", "Coin Flip", "Goal Rush", "Turbo Crash", "Mega Wheel", "Diamond Mines", "Rocket Crash"], kinds: ["Classic", "Turbo"] },
  { category: "Live Casino", engine: "roulette", blurb: "live-style hosted table with a dealer shoe, real cards and streamed-table presentation", themes: ["Live Roulette VIP", "Live Blackjack Salon", "Live Baccarat Lounge", "Live Teen Patti Studio", "Live Dragon Tiger", "Live Andar Bahar Studio", "Immersive Roulette", "Speed Baccarat Live", "Live Mega Wheel", "Live Poker Room", "Live Sic Bo Studio"], kinds: ["Live", "VIP Live"] },
  { category: "Sports Mini Games", engine: "dice", blurb: "sports mini game with quick rounds, animated action and instant results", themes: ["Virtual Cricket Clash", "Virtual Football League", "Penalty Shootout Pro", "Basketball Hoops Rush", "Turbo Racing", "Virtual Horse Racing", "Cricket Super Over", "Football Penalty Stars", "Derby Racing Gold", "Grand Prix Turbo", "Tennis Ace Rush", "Kabaddi Raid Rush"], kinds: ["Virtual", "Turbo"] },
];
const ENGINE_ROTATE: Record<string, string[]> = {
  Slots: ["slots"], "Table Games": ["blackjack", "roulette", "dice", "teenpatti"], "Card Games": ["teenpatti", "blackjack", "dragontiger", "andarbahar"],
  Arcade: ["crash", "plinko", "mines", "dice"], "Live Casino": ["roulette", "blackjack", "teenpatti", "andarbahar", "dragontiger"], "Sports Mini Games": ["dice", "plinko", "crash", "mines"],
};
function buildCatalog() {
  const out: { slug: string; name: string; category: string; engine: string; rtp: number; description: string; tag: string; hue: number }[] = [];
  CATALOG.forEach((c, ci) => {
    let i = 0;
    for (const theme of c.themes) for (const kind of c.kinds) {
      const name = `${theme} ${kind}`; const engines = ENGINE_ROTATE[c.category] ?? ["slots"]; const engine = engines[i % engines.length] ?? "slots";
      out.push({ slug: slugify(name), name, category: c.category, engine, rtp: 95 + ((i * 7 + ci * 3) % 45) / 10, tag: i % 9 === 0 ? "Featured" : i % 7 === 0 ? "Popular" : i % 11 === 0 ? "New" : "", hue: (ci * 55 + i * 23) % 360, description: `${name} is a ${c.category.toLowerCase()} title on Quvanta: a ${c.blurb}. Played with real money from your Quvanta wallet (USD / USDT).` });
      i++;
    }
  });
  return out;
}
const CORE_GAMES = [
  { slug: "crash", name: "Crash", category: "Arcade", engine: "crash", rtp: 97, tag: "Featured", hue: 16, description: "The original Crash: watch the multiplier climb on a live chart and cash out before it bursts. Real-money play." },
  { slug: "mines", name: "Mines", category: "Arcade", engine: "mines", rtp: 97, tag: "Popular", hue: 150, description: "A 5x5 minefield. Uncover gems tile by tile, dodge the hidden mines and bank your multiplier. Real-money play." },
  { slug: "dice", name: "Dice", category: "Arcade", engine: "dice", rtp: 98, tag: "Popular", hue: 210, description: "Set your target and roll under or over it. The lower the chance, the bigger the payout. Real-money play." },
  { slug: "slots", name: "Slots Classic 7s", category: "Slots", engine: "slots", rtp: 96, tag: "Featured", hue: 45, description: "Three-reel classic: three 7s pay the 20x jackpot line, pairs pay too. Real-money play." },
  { slug: "teenpatti", name: "Teen Patti", category: "Card Games", engine: "teenpatti", rtp: 97, tag: "Featured", hue: 280, description: "India's favourite three-card showdown against the dealer - trio, pure sequence, pair and high card rankings. Real-money play." },
  { slug: "andarbahar", name: "Andar Bahar", category: "Card Games", engine: "andarbahar", rtp: 97, tag: "", hue: 330, description: "A joker card is drawn, then cards deal alternately to Andar and Bahar until the joker's rank matches. Real-money play." },
  { slug: "roulette", name: "Roulette European", category: "Table Games", engine: "roulette", rtp: 97.3, tag: "Popular", hue: 0, description: "Single-zero European wheel: red/black, even/odd, green zero or a straight number at 36x. Real-money play." },
  { slug: "dragontiger", name: "Dragon Tiger", category: "Card Games", engine: "dragontiger", rtp: 96.7, tag: "", hue: 25, description: "One card for Dragon, one for Tiger - higher card wins, ties pay 8x. Real-money play." },
  { slug: "blackjack", name: "Blackjack", category: "Table Games", engine: "blackjack", rtp: 99, tag: "Featured", hue: 120, description: "Beat the dealer to 21. Blackjack pays 3:2, dealer stands on 17. Real-money play." },
  { slug: "plinko", name: "Plinko", category: "Arcade", engine: "plinko", rtp: 97, tag: "New", hue: 190, description: "Drop the ball through 8 rows of pegs into 9 bins - the edges pay 5.6x. Real-money play." },
];
const FIXTURES: { team1: string; team2: string; venue: string; startsAt: string; odds1: number; odds2: number; league: string; sport: string }[] = [
  { team1: "Mumbai Indians", team2: "Chennai Super Kings", venue: "Wankhede Stadium, Mumbai", startsAt: "Demo fixture - next IPL window", odds1: 1.85, odds2: 1.95, league: "IPL", sport: "Cricket" },
  { team1: "Royal Challengers Bengaluru", team2: "Kolkata Knight Riders", venue: "M. Chinnaswamy Stadium, Bengaluru", startsAt: "Demo fixture - next IPL window", odds1: 1.9, odds2: 1.9, league: "IPL", sport: "Cricket" },
  { team1: "Delhi Capitals", team2: "Sunrisers Hyderabad", venue: "Arun Jaitley Stadium, Delhi", startsAt: "Demo fixture - next IPL window", odds1: 2.0, odds2: 1.8, league: "IPL", sport: "Cricket" },
  { team1: "Rajasthan Royals", team2: "Punjab Kings", venue: "Sawai Mansingh Stadium, Jaipur", startsAt: "Demo fixture - next IPL window", odds1: 1.75, odds2: 2.05, league: "IPL", sport: "Cricket" },
  { team1: "Lucknow Super Giants", team2: "Gujarat Titans", venue: "Ekana Stadium, Lucknow", startsAt: "Demo fixture - next IPL window", odds1: 1.95, odds2: 1.85, league: "IPL", sport: "Cricket" },
  { team1: "India", team2: "Australia", venue: "Demo fixture - ICC World Cup window", startsAt: "Demo fixture - World Cup window", odds1: 1.8, odds2: 2.0, league: "ICC World Cup", sport: "Cricket" },
  { team1: "England", team2: "Pakistan", venue: "Demo fixture - ICC World Cup window", startsAt: "Demo fixture - World Cup window", odds1: 1.9, odds2: 1.9, league: "ICC World Cup", sport: "Cricket" },
  { team1: "Real Madrid", team2: "Manchester City", venue: "Demo fixture - Champions League window", startsAt: "Demo fixture - UCL window", odds1: 2.4, odds2: 2.6, league: "Champions League", sport: "Football" },
  { team1: "Arsenal", team2: "Liverpool", venue: "Demo fixture - Premier League window", startsAt: "Demo fixture - PL window", odds1: 2.2, odds2: 2.9, league: "Premier League", sport: "Football" },
  { team1: "Argentina", team2: "France", venue: "Demo fixture - FIFA World Cup window", startsAt: "Demo fixture - FIFA WC window", odds1: 2.5, odds2: 2.7, league: "FIFA World Cup", sport: "Football" },
];
async function ensure(ctx: Ctx) {
  const db = ctx.db<typeof schema>();
  // Additive, idempotent seeding: works on a fresh DB and on the previous build's DB.
  const existingGames = await db.select().from(schema.gamesConfig);
  const haveSlugs = new Set(existingGames.map((g) => g.slug));
  const all = [...CORE_GAMES, ...buildCatalog()];
  for (const g of all) {
    if (haveSlugs.has(g.slug)) {
      // Repair core rows created by the previous build (wrong engine/empty description).
      if (CORE_GAMES.some((c) => c.slug === g.slug)) await db.update(schema.gamesConfig).set({ engine: g.engine, description: g.description, tag: g.tag, hue: g.hue, category: g.category, name: g.name }).where(eq(schema.gamesConfig.slug, g.slug));
      else { const cur = existingGames.find((x) => x.slug === g.slug); if (cur && cur.description.includes("virtual demo credits")) await db.update(schema.gamesConfig).set({ description: g.description }).where(eq(schema.gamesConfig.slug, g.slug)); }
      continue;
    }
    await db.insert(schema.gamesConfig).values({ slug: g.slug, name: g.name, category: g.category, rtp: g.rtp, enabled: 1, minBet: 1, maxBet: 500, plays: 0, description: g.description, engine: g.engine, tag: g.tag, hue: g.hue });
  }
  const existingFixtures = await db.select().from(schema.fixtures);
  const haveFixture = new Set(existingFixtures.map((f) => `${f.team1}|${f.team2}`));
  for (const f of FIXTURES) if (!haveFixture.has(`${f.team1}|${f.team2}`)) await db.insert(schema.fixtures).values({ ...f, isDemo: 1 });
  const defaults: [string, string][] = [["odds_api_key", ""], ["cricapi_key", ""], ["brand_name", "Quvanta"], ["support_email", ""], ["geo_block", "US, UK, AU"], ["promo_banner", "Real-money casino: deposit via UPI or USDT, withdraw after KYC - verification on every request"], ["upi_id", "quvanta@upi"], ["usdt_address", "TQuvantaUsdtWalletAddressSetByAdmin"], ["tournament_note", "Quvanta Champions Cup - leaderboard by total wins"]];
  const existingSettings = await db.select().from(schema.settings);
  const haveKeys = new Set(existingSettings.map((s) => s.key));
  for (const [key, value] of defaults) if (!haveKeys.has(key)) await db.insert(schema.settings).values({ key, value });
  // Repair the previous build's bonus banner copy (bonuses are removed in the real-money build).
  for (const [k, v] of [["upi_id", "quvanta@upi"], ["usdt_address", "TQuvantaUsdtWalletAddressSetByAdmin"]] as [string, string][]) { const cur = existingSettings.find((x) => x.key === k); if (cur && cur.value.trim() === "") await db.update(schema.settings).set({ value: v }).where(eq(schema.settings.key, k)); }
  const oldBanner = existingSettings.find((x) => x.key === "promo_banner" && x.value.includes("Welcome Bonus"));
  if (oldBanner) await db.update(schema.settings).set({ value: "Real-money casino: deposit via UPI or USDT, withdraw after KYC - verification on every request" }).where(eq(schema.settings.key, "promo_banner"));
  // Scrub the operator-portal wording from the player-visible banner: the
  // player site never mentions the portal, so the banner must not either.
  const portalBanner = existingSettings.find((x) => x.key === "promo_banner" && x.value.toLowerCase().includes("admin"));
  if (portalBanner) await db.update(schema.settings).set({ value: "Real-money casino: deposit via UPI or USDT, withdraw after KYC - verification on every request" }).where(eq(schema.settings.key, "promo_banner"));
  const existingUsers = await db.select().from(schema.users).limit(1);
  if (existingUsers.length === 0) {
    await db.insert(schema.users).values({ name: "Quvanta Admin", email: "admin@quvanta.gg", username: "admin", passwordHash: pwHash("admin@quvanta.gg", "admin@123"), role: "admin", dob: "1990-01-01", kycStatus: "verified - 18+", balanceUsd: 0, balanceUsdt: 0 });
    await db.insert(schema.users).values({ name: "Demo Player", email: "player@quvanta.gg", passwordHash: pwHash("player@quvanta.gg", "player123"), role: "player", dob: "1998-05-10", kycStatus: "verified - 18+", balanceUsd: 0, balanceUsdt: 0 });
  }
  const legacyCodes = await db.select().from(schema.settings);
  for (const row of legacyCodes) if (row.key.startsWith("verify_") || row.key.startsWith("reset_")) await db.delete(schema.settings).where(eq(schema.settings.key, row.key));
  const allUsers = await db.select().from(schema.users);
  for (const u of allUsers) if (!u.referralCode) await db.update(schema.users).set({ referralCode: refCodeFor(u.email, u.id) }).where(eq(schema.users.id, u.id));
  // Single-admin rule: there is exactly ONE admin account, ever. Player signup
  // always creates role=player, and any extra admin rows (from older builds)
  // are demoted here so multiple admins can never exist.
  const admins = allUsers.filter((u) => u.role === "admin");
  for (const extra of admins.slice(1)) await db.update(schema.users).set({ role: "player" }).where(eq(schema.users.id, extra.id));
  const primaryAdmin = admins[0];
  // Initialise the one admin's login exactly once: username "admin", password
  // "admin@123". This runs only while the username is still empty (fresh seed
  // or a pre-username build) - after the admin changes their username or
  // password in the dashboard, this block never touches the credentials again.
  if (primaryAdmin && !primaryAdmin.username) {
    await db.update(schema.users).set({ username: "admin", passwordHash: pwHash(primaryAdmin.email, "admin@123") }).where(eq(schema.users.id, primaryAdmin.id));
  }
  return db;
}
type DB = Awaited<ReturnType<typeof ensure>>;
async function userFromToken(db: DB, token: string) {
  if (!token) return null;
  const s = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).limit(1);
  if (!s[0]) return null;
  const u = await db.select().from(schema.users).where(eq(schema.users.id, s[0].userId)).limit(1);
  return u[0] ?? null;
}
async function requireUser(db: DB, token: string) { const u = await userFromToken(db, token); if (!u) throw new Error("Please log in first."); if (u.suspended === 1) throw new Error("This account is suspended. Contact support."); return u; }
async function requireAdmin(db: DB, token: string) { const u = await requireUser(db, token); if (u.role !== "admin") throw new Error("Access denied."); return u; }
async function newSession(db: DB, userId: number) { const token = hashOf(`${Date.now()}-${Math.random()}-${userId}`) + hashOf(`${Math.random()}-q`); await db.insert(schema.sessions).values({ token, userId }); return token; }
const ok = z.object({ ok: z.literal(true) });
const credResponse = z.object({ ok: z.literal(true), username: z.string() });
const userShape = z.object({ id: z.number(), name: z.string(), email: z.string(), username: z.string(), role: z.string(), balance: z.number(), balanceUsd: z.number(), balanceUsdt: z.number(), kycStatus: z.string(), favorites: z.array(z.string()), referralCode: z.string(), depositLimit: z.number(), lossLimit: z.number() });
function pubUser(u: UserRow) { return { id: u.id, name: u.name, email: u.email, username: u.username || "", role: u.role, balance: totalBalance(u), balanceUsd: u.balanceUsd, balanceUsdt: u.balanceUsdt, kycStatus: u.kycStatus, favorites: u.favorites ? u.favorites.split(",").filter(Boolean) : [], referralCode: u.referralCode || refCodeFor(u.email, u.id), depositLimit: u.depositLimit, lossLimit: u.lossLimit }; }
const loginAttempts = new Map<string, number[]>();

export const Actions = {
  getState: defineAction({
    description: "Returns public catalog, sports fixtures, promotions and (when a session token is given) the logged-in user's wallet, history and favorites.",
    request: z.object({ token: z.string().max(200).default("") }),
    response: z.object({
      user: userShape.nullable(),
      games: z.array(z.object({ slug: z.string(), name: z.string(), category: z.string(), enabled: z.boolean(), minBet: z.number(), maxBet: z.number(), rtp: z.number(), plays: z.number(), description: z.string(), engine: z.string(), tag: z.string(), hue: z.number() })),
      bets: z.array(z.object({ id: z.number(), game: z.string(), betAmount: z.number(), payout: z.number(), profit: z.number(), detail: z.string(), fairHash: z.string(), createdAt: z.string() })),
      ledger: z.array(z.object({ id: z.number(), type: z.string(), amount: z.number(), currency: z.string(), note: z.string(), createdAt: z.string() })),
      fixtures: z.array(z.object({ id: z.number(), team1: z.string(), team2: z.string(), venue: z.string(), startsAt: z.string(), odds1: z.number(), odds2: z.number(), isDemo: z.boolean(), league: z.string(), sport: z.string() })),
      sportsBets: z.array(z.object({ id: z.number(), fixtureLabel: z.string(), pick: z.string(), odds: z.number(), stake: z.number(), potential: z.number(), status: z.string(), createdAt: z.string() })),
      settings: z.record(z.string(), z.string()),
      hasLiveKeys: z.boolean(),
      totalGames: z.number(),
      requests: z.array(z.object({ id: z.number(), kind: z.string(), method: z.string(), amount: z.number(), currency: z.string(), ref: z.string(), destination: z.string(), status: z.string(), rejectReason: z.string(), createdAt: z.string() })),
      referrals: z.array(z.object({ id: z.number(), name: z.string(), email: z.string(), earned: z.number(), createdAt: z.string() })),
      referralEarned: z.number(),
    }),
    async handler(ctx, args) {
      const db = await ensure(ctx);
      const me = await userFromToken(db, args.token);
      const games = await db.select().from(schema.gamesConfig);
      const fixtures = await db.select().from(schema.fixtures);
      const setRows = await db.select().from(schema.settings);
      // Public settings are picked by exact name only. The settings table holds no secrets:
      // auth codes live on the users table and API keys are never picked here.
      const pick = (k: string) => setRows.find((x) => x.key === k)?.value ?? "";
      const settings: Record<string, string> = {
        promo_banner: pick("promo_banner"), tournament_note: pick("tournament_note"), support_email: pick("support_email"),
        geo_block: pick("geo_block"), brand_name: pick("brand_name"), upi_id: pick("upi_id"), usdt_address: pick("usdt_address"),
      };
      let bets: typeof schema.bets.$inferSelect[] = [], ledger: typeof schema.ledger.$inferSelect[] = [], sBets: typeof schema.sportsBets.$inferSelect[] = [];
      let reqs: typeof schema.requests.$inferSelect[] = [], referred: UserRow[] = [];
      if (me) {
        bets = await db.select().from(schema.bets).where(eq(schema.bets.userId, me.id)).orderBy(desc(schema.bets.id)).limit(40);
        ledger = await db.select().from(schema.ledger).where(eq(schema.ledger.userId, me.id)).orderBy(desc(schema.ledger.id)).limit(40);
        sBets = await db.select().from(schema.sportsBets).where(eq(schema.sportsBets.userId, me.id)).orderBy(desc(schema.sportsBets.id)).limit(20);
        reqs = await db.select().from(schema.requests).where(eq(schema.requests.userId, me.id)).orderBy(desc(schema.requests.id)).limit(30);
        referred = await db.select().from(schema.users).where(eq(schema.users.referredBy, me.id)).orderBy(desc(schema.users.id));
      }
      return {
        user: me ? pubUser(me) : null,
        games: games.map((g) => ({ slug: g.slug, name: g.name, category: g.category, enabled: g.enabled === 1, minBet: g.minBet, maxBet: g.maxBet, rtp: g.rtp, plays: g.plays, description: g.description, engine: g.engine, tag: g.tag, hue: g.hue })),
        bets: bets.map((b) => ({ id: b.id, game: b.game, betAmount: b.betAmount, payout: b.payout, profit: b.profit, detail: b.detail, fairHash: b.fairHash, createdAt: b.createdAt.toISOString() })),
        ledger: ledger.map((l) => ({ id: l.id, type: l.type, amount: l.amount, currency: l.currency, note: l.note, createdAt: l.createdAt.toISOString() })),
        fixtures: fixtures.map((f) => ({ id: f.id, team1: f.team1, team2: f.team2, venue: f.venue, startsAt: f.startsAt, odds1: f.odds1, odds2: f.odds2, isDemo: f.isDemo === 1, league: f.league, sport: f.sport })),
        sportsBets: sBets.map((s) => ({ id: s.id, fixtureLabel: s.fixtureLabel, pick: s.pick, odds: s.odds, stake: s.stake, potential: s.potential, status: s.status, createdAt: s.createdAt.toISOString() })),
        settings, hasLiveKeys: setRows.some((s) => (s.key === "odds_api_key" || s.key === "cricapi_key") && s.value.trim() !== ""), totalGames: games.length,
        requests: reqs.map((r) => ({ id: r.id, kind: r.kind, method: r.method, amount: r.amount, currency: r.currency, ref: r.ref, destination: r.destination, status: r.status, rejectReason: r.rejectReason, createdAt: r.createdAt.toISOString() })),
        referrals: referred.map((u) => ({ id: u.id, name: u.name, email: u.email, earned: 10, createdAt: u.createdAt.toISOString() })),
        referralEarned: referred.length * 10,
      };
    },
  }),

  signup: defineAction({
    description: "Registers a new player account (18+ DOB check) with a $0.00 real-money balance and a unique referral code; if a valid referral code is given, the referrer is credited Rs 10 real money. Returns a session token plus a demo email-verification code.",
    request: z.object({ name: z.string().trim().min(2).max(60), email: z.string().trim().email().max(120), password: z.string().min(6).max(72), dob: z.string().min(8).max(10), referralCode: z.string().trim().max(20).default("") }),
    response: z.object({ token: z.string(), user: userShape, verifyCode: z.string() }),
    async handler(ctx, args) {
      const db = await ensure(ctx);
      const dob = new Date(`${args.dob}T00:00:00`);
      if (isNaN(dob.getTime())) throw new Error("Enter a valid date of birth.");
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) throw new Error("You must be 18 or older to register (KYC 18+).");
      if (age > 110) throw new Error("Enter a valid date of birth.");
      const email = args.email.toLowerCase();
      const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (existing[0]) throw new Error("An account with this email already exists. Please log in.");
      let referrer: UserRow | undefined;
      if (args.referralCode) {
        const allU = await db.select().from(schema.users);
        referrer = allU.find((x) => (x.referralCode || refCodeFor(x.email, x.id)).toUpperCase() === args.referralCode.toUpperCase());
      }
      const ins = await db.insert(schema.users).values({ name: args.name, email, passwordHash: pwHash(email, args.password), role: "player", dob: args.dob, kycStatus: "pending verification - 18+ confirmed", balanceUsd: 0, balanceUsdt: 0, referredBy: referrer ? referrer.id : 0 }).returning();
      const u = ins[0]; if (!u) throw new Error("Signup failed.");
      await db.update(schema.users).set({ referralCode: refCodeFor(email, u.id) }).where(eq(schema.users.id, u.id));
      u.referralCode = refCodeFor(email, u.id);
      if (referrer) {
        const pools = applyDelta(referrer, 10);
        await db.update(schema.users).set(pools).where(eq(schema.users.id, referrer.id));
        await db.insert(schema.ledger).values({ userId: referrer.id, type: "referral", amount: 10, currency: "INR", note: `Referral reward: ${args.name} signed up with your code - Rs 10 real money` });
      }
      const verifyCode = hashOf(`verify:${email}`).slice(0, 6).toUpperCase();
      // Auth codes live on the user row itself - never in the settings table.
      await db.update(schema.users).set({ verifyCode }).where(eq(schema.users.id, u.id));
      const token = await newSession(db, u.id);
      ctx.invalidateQueries();
      return { token, user: pubUser(u), verifyCode };
    },
  }),

  verifyEmail: defineAction({
    description: "Verifies a player's email with the demo verification code issued at signup.",
    request: z.object({ token: z.string().max(200), code: z.string().trim().min(4).max(10) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      if (!me.verifyCode || me.verifyCode.toUpperCase() !== args.code.toUpperCase()) throw new Error("Wrong verification code.");
      await db.update(schema.users).set({ kycStatus: "verified - 18+", verifyCode: "" }).where(eq(schema.users.id, me.id));
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  login: defineAction({
    description: "Logs a user in with email or username plus password, with basic rate limiting, and returns a session token. Players use their email; the single admin account can also log in with its username.",
    request: z.object({ identifier: z.string().trim().min(1).max(120), password: z.string().min(1).max(72) }),
    response: z.object({ token: z.string(), user: userShape }),
    async handler(ctx, args) {
      const db = await ensure(ctx); const ident = args.identifier.toLowerCase();
      const now = Date.now(); const attempts = (loginAttempts.get(ident) ?? []).filter((t) => now - t < 10 * 60 * 1000);
      if (attempts.length >= 8) throw new Error("Too many failed attempts. Wait 10 minutes and try again.");
      const all = await db.select().from(schema.users);
      // Email match wins over username match so the two can never be confused.
      const u = all.find((x) => x.email.toLowerCase() === ident) ?? all.find((x) => x.username !== "" && x.username.toLowerCase() === ident);
      if (!u || u.passwordHash !== pwHash(u.email, args.password)) { attempts.push(now); loginAttempts.set(ident, attempts); throw new Error("Wrong email/username or password. Check and try again."); }
      if (u.suspended === 1) throw new Error("This account is suspended. Contact support.");
      loginAttempts.delete(ident);
      const token = await newSession(db, u.id);
      return { token, user: pubUser(u) };
    },
  }),

  logout: defineAction({
    description: "Logs the current session out.",
    request: z.object({ token: z.string().max(200) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> { const db = await ensure(ctx); await db.delete(schema.sessions).where(eq(schema.sessions.token, args.token)); ctx.invalidateQueries(); return { ok: true as const }; },
  }),

  adminChangeCredentials: defineAction({
    description: "Operator-only: the single admin changes their own login username and/or password (current password required). The change is saved on the admin's user row, so the old username/password stop working immediately and the new ones keep working after reload. Other operator sessions are signed out.",
    request: z.object({ token: z.string().max(200), currentPassword: z.string().min(1).max(72), newUsername: z.string().trim().max(40).default(""), newPassword: z.string().max(72).default("") }),
    response: credResponse,
    async handler(ctx, args): Promise<z.infer<typeof credResponse>> {
      const db = await ensure(ctx); const me = await requireAdmin(db, args.token);
      if (me.passwordHash !== pwHash(me.email, args.currentPassword)) throw new Error("Current password is wrong - credentials not changed.");
      const patch: { username?: string; passwordHash?: string } = {};
      const nu = args.newUsername.trim();
      if (nu && nu.toLowerCase() !== me.username.toLowerCase()) {
        if (!/^[A-Za-z0-9._-]{3,40}$/.test(nu)) throw new Error("Username must be 3-40 characters: letters, numbers, dot, underscore or dash only.");
        const all = await db.select().from(schema.users);
        const clash = all.find((x) => x.id !== me.id && (x.username.toLowerCase() === nu.toLowerCase() || x.email.toLowerCase() === nu.toLowerCase()));
        if (clash) throw new Error("That username is already taken. Pick another one.");
        patch.username = nu;
      }
      if (args.newPassword) {
        if (args.newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
        patch.passwordHash = pwHash(me.email, args.newPassword);
      }
      if (!patch.username && !patch.passwordHash) throw new Error("Nothing to change - enter a new username or a new password.");
      await db.update(schema.users).set(patch).where(eq(schema.users.id, me.id));
      // Sign out every other session of this admin; the current one stays in.
      const mySessions = await db.select().from(schema.sessions).where(eq(schema.sessions.userId, me.id));
      for (const s of mySessions) if (s.token !== args.token) await db.delete(schema.sessions).where(eq(schema.sessions.token, s.token));
      ctx.invalidateQueries();
      return { ok: true as const, username: patch.username ?? me.username };
    },
  }),

  requestReset: defineAction({
    description: "Issues a demo password-reset code for an account email (no email service connected, so the code is shown in the app for demo use).",
    request: z.object({ email: z.string().trim().email().max(120) }),
    response: z.object({ resetCode: z.string() }),
    async handler(ctx, args) {
      const db = await ensure(ctx); const email = args.email.toLowerCase();
      const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (!rows[0]) throw new Error("No account found with this email.");
      const code = hashOf(`reset:${email}:${Date.now()}`).slice(0, 6).toUpperCase();
      await db.update(schema.users).set({ resetCode: code }).where(eq(schema.users.email, email));
      return { resetCode: code };
    },
  }),

  resetPassword: defineAction({
    description: "Resets a password using the demo reset code.",
    request: z.object({ email: z.string().trim().email().max(120), code: z.string().trim().min(4).max(10), newPassword: z.string().min(6).max(72) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const email = args.email.toLowerCase();
      const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1); const acct = rows[0];
      if (!acct || !acct.resetCode || acct.resetCode.toUpperCase() !== args.code.toUpperCase()) throw new Error("Wrong reset code.");
      await db.update(schema.users).set({ passwordHash: pwHash(email, args.newPassword), resetCode: "" }).where(eq(schema.users.email, email));
      return { ok: true as const };
    },
  }),

  toggleFavorite: defineAction({
    description: "Adds or removes a game from the logged-in player's favorites.",
    request: z.object({ token: z.string().max(200), slug: z.string().min(1).max(80) }),
    response: z.object({ favorites: z.array(z.string()) }),
    async handler(ctx, args) {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      const favs = me.favorites ? me.favorites.split(",").filter(Boolean) : [];
      const next = favs.includes(args.slug) ? favs.filter((f) => f !== args.slug) : [...favs, args.slug];
      await db.update(schema.users).set({ favorites: next.join(",") }).where(eq(schema.users.id, me.id));
      ctx.invalidateQueries(); return { favorites: next };
    },
  }),

  playGame: defineAction({
    description: "Plays one round of a casino game for the logged-in player with server-side real-money settlement (USD/USDT wallet) and a provably-fair hash.",
    request: z.object({
      token: z.string().max(200), game: z.string().min(1).max(80),
      bet: z.number().min(0.5).max(5000), choice: z.string().max(40).default(""),
      target: z.number().min(0).max(10000).default(2), count: z.number().int().min(0).max(25).default(3),
    }),
    response: z.object({ win: z.boolean(), payout: z.number(), profit: z.number(), multiplier: z.number(), balance: z.number(), detail: z.string(), reveal: z.string(), fairHash: z.string(), cards: z.array(z.string()), mines: z.array(z.number()), picks: z.array(z.number()), roll: z.number(), bin: z.number(), crashPoint: z.number() }),
    async handler(ctx, args) {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      const cfgRows = await db.select().from(schema.gamesConfig).where(eq(schema.gamesConfig.slug, args.game));
      const cfg = cfgRows[0]; if (!cfg) throw new Error("Game not found.");
      if (cfg.enabled !== 1) throw new Error("This game is currently unavailable.");
      if (args.bet < cfg.minBet || args.bet > cfg.maxBet) throw new Error(`Bet must be between $${cfg.minBet} and $${cfg.maxBet}.`);
      if (args.bet > totalBalance(me)) throw new Error("Insufficient real-money balance. Deposit via UPI or USDT in your Wallet first.");
      if (me.lossLimit > 0) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const myBets = await db.select().from(schema.bets).where(eq(schema.bets.userId, me.id));
        const todayLoss = myBets.filter((b) => b.createdAt >= todayStart).reduce((a, b) => a + Math.min(0, b.profit), 0);
        if (-todayLoss >= me.lossLimit) throw new Error(`Daily loss limit of $${me.lossLimit} reached. Play is paused until tomorrow - set or change limits in your Wallet.`);
      }
      const engine = cfg.engine || cfg.slug;
      const fairHash = hashOf(`${Date.now()}-${Math.random()}-${args.game}-${me.id}`);
      let multiplier = 0, detail = "", reveal = "";
      let cards: string[] = [], minesArr: number[] = [], picksArr: number[] = [], roll = 0, bin = 0, crashPoint = 0;
      if (engine === "crash") {
        const target = Math.min(10, Math.max(1.2, args.target)); const r = Math.random();
        const crash = Math.min(50, Math.max(1, 0.99 / (1 - r))); crashPoint = Math.round(crash * 100) / 100;
        multiplier = crash >= target ? target : 0; reveal = `Crashed at ${crash.toFixed(2)}x`;
        detail = multiplier > 0 ? `Cashed out at ${target.toFixed(2)}x before the crash at ${crash.toFixed(2)}x` : `Crashed at ${crash.toFixed(2)}x - your ${target.toFixed(2)}x cash-out was too late`;
      } else if (engine === "mines") {
        const mines = Math.min(10, Math.max(1, args.count)); const picks = Math.min(10, Math.max(1, Math.round(args.target)));
        const mineSet = new Set<number>(); while (mineSet.size < mines) mineSet.add(Math.floor(Math.random() * 25));
        const pickSet = new Set<number>(); while (pickSet.size < picks) pickSet.add(Math.floor(Math.random() * 25));
        minesArr = [...mineSet].sort((a, b) => a - b); picksArr = [...pickSet].sort((a, b) => a - b);
        const hit = picksArr.some((p) => mineSet.has(p));
        const fairMult = choose(25, picks) / Math.max(1, choose(25 - mines, picks));
        multiplier = hit ? 0 : Math.max(1.05, fairMult * 0.97);
        reveal = `Mines at tiles: ${minesArr.map((n) => n + 1).join(", ")}`;
        detail = hit ? `You uncovered ${picks} tiles and hit a mine (${mines} mines on the board)` : `Cleared ${picks} safe tiles with ${mines} mines hidden - ${multiplier.toFixed(2)}x`;
      } else if (engine === "dice") {
        const target = Math.min(95, Math.max(5, args.target)); roll = Math.round(Math.random() * 10000) / 100;
        const under = args.choice !== "over"; const win = under ? roll < target : roll > target; const chance = under ? target : 100 - target;
        multiplier = win ? (99 / chance) * 0.98 : 0; reveal = `Rolled ${roll.toFixed(2)}`;
        detail = win ? `${roll.toFixed(2)} ${under ? "under" : "over"} ${target} - win` : `${roll.toFixed(2)} missed ${under ? "under" : "over"} ${target}`;
      } else if (engine === "slots") {
        const syms = ["7", "BAR", "\u2666", "\u2660", "\u2665", "\u2663", "\u2605"];
        const pays: Record<string, number> = { "7": 20, "BAR": 10, "\u2666": 8, "\u2660": 5, "\u2665": 4, "\u2663": 3, "\u2605": 6 };
        const reels = [0, 1, 2].map(() => syms[Math.floor(Math.random() * syms.length)] ?? "\u2605");
        cards = reels; const [a, b, c] = reels;
        if (a && a === b && b === c) multiplier = pays[a] ?? 3; else if (a === b || b === c || a === c) multiplier = 1.4;
        reveal = reels.join("  |  ");
        detail = multiplier >= 3 ? `Three ${a} - jackpot line pays ${multiplier}x` : multiplier > 0 ? "A pair on the reels pays 1.4x" : `No matching symbols - ${reveal}`;
      } else if (engine === "teenpatti") {
        const dealt = dealCards(6); const player = dealt.slice(0, 3), dealer = dealt.slice(3, 6);
        cards = [...player.map((x) => x.label), ...dealer.map((x) => x.label)];
        const ps = tpScore(player), ds = tpScore(dealer);
        multiplier = ps.score > ds.score ? 1.95 : ps.score === ds.score ? 1 : 0;
        reveal = `You: ${player.map((x) => x.label).join(" ")} (${ps.label}) - Dealer: ${dealer.map((x) => x.label).join(" ")} (${ds.label})`;
        detail = multiplier > 1 ? `Your ${ps.label} beats dealer's ${ds.label}` : multiplier === 1 ? "Tie - bet returned" : `Dealer's ${ds.label} beats your ${ps.label}`;
      } else if (engine === "andarbahar") {
        const joker = dealCards(1)[0] ?? { rank: 7, suit: "\u2660", label: "7\u2660" };
        cards = [joker.label]; let dealt = 0, winSide = "Andar"; const deck = dealCards(30);
        for (let i = 0; i < deck.length; i++) { dealt = i + 1; const side = i % 2 === 0 ? "Andar" : "Bahar"; if (i < 8) cards.push(deck[i]?.label ?? ""); if ((deck[i]?.rank ?? 0) === joker.rank) { winSide = side; break; } }
        const pick = args.choice === "bahar" ? "Bahar" : "Andar";
        multiplier = pick === winSide ? (winSide === "Andar" ? 1.9 : 2.0) : 0;
        reveal = `Joker: ${joker.label} - Matched on ${winSide} after ${dealt} cards`;
        detail = multiplier > 0 ? `${winSide} matched the joker rank - your ${pick} bet wins` : `Card matched on ${winSide}, you backed ${pick}`;
      } else if (engine === "roulette") {
        const reds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
        const spin = Math.floor(Math.random() * 37); roll = spin;
        const color = spin === 0 ? "green" : reds.has(spin) ? "red" : "black"; const choice = args.choice || "red";
        let win = false, mult = 0;
        if (choice === "red" || choice === "black") { win = color === choice; mult = 2; }
        else if (choice === "green") { win = spin === 0; mult = 36; }
        else if (choice === "even") { win = spin !== 0 && spin % 2 === 0; mult = 2; }
        else if (choice === "odd") { win = spin % 2 === 1; mult = 2; }
        else { const n = parseInt(choice, 10); win = spin === n; mult = 36; }
        multiplier = win ? mult : 0; reveal = `Ball landed on ${spin} ${color}`;
        detail = win ? `${spin} ${color} - your ${choice} bet pays ${mult}x` : `${spin} ${color} - ${choice} misses`;
      } else if (engine === "dragontiger") {
        const [d, t] = dealCards(2); cards = [d?.label ?? "", t?.label ?? ""];
        const dr = d?.rank ?? 2, tr = t?.rank ?? 2; const winner = dr > tr ? "dragon" : tr > dr ? "tiger" : "tie"; const pick = args.choice || "dragon";
        multiplier = pick === winner ? (winner === "tie" ? 8 : 1.95) : 0;
        reveal = `Dragon ${d?.label ?? ""} vs Tiger ${t?.label ?? ""}`;
        detail = multiplier > 0 ? `${winner} wins - your pick was right` : `${winner} wins - you backed ${pick}`;
      } else if (engine === "blackjack") {
        const dealt = dealCards(10);
        const player = [dealt[0], dealt[1]].filter(Boolean) as { rank: number; label: string }[];
        const dealer = [dealt[2], dealt[3]].filter(Boolean) as { rank: number; label: string }[];
        let idx = 4; let pv = handValue(player.map((x) => x.rank));
        while (pv < 15 && idx < dealt.length) { const c = dealt[idx++]; if (c) player.push(c); pv = handValue(player.map((x) => x.rank)); }
        let dv = handValue(dealer.map((x) => x.rank));
        while (dv < 17 && idx < dealt.length) { const c = dealt[idx++]; if (c) dealer.push(c); dv = handValue(dealer.map((x) => x.rank)); }
        cards = [...player.map((x) => x.label), "|", ...dealer.map((x) => x.label)];
        const bj = player.length === 2 && pv === 21;
        if (bj) multiplier = 2.5; else if (pv > 21) multiplier = 0; else if (dv > 21) multiplier = 2; else if (pv > dv) multiplier = 2; else if (pv === dv) multiplier = 1;
        reveal = `You: ${player.map((x) => x.label).join(" ")} = ${pv} - Dealer: ${dealer.map((x) => x.label).join(" ")} = ${dv}`;
        detail = bj ? "Blackjack! Pays 3:2" : pv > 21 ? `Bust at ${pv}` : dv > 21 ? `Dealer busts at ${dv} - you win` : pv > dv ? `${pv} beats ${dv}` : pv === dv ? `Push at ${pv} - bet returned` : `Dealer ${dv} beats your ${pv}`;
      } else if (engine === "plinko") {
        const bins = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
        let rights = 0; for (let r = 0; r < 8; r++) if (Math.random() < 0.5) rights++;
        bin = rights; multiplier = bins[bin] ?? 1; reveal = `Ball landed in bin ${bin + 1} of 9`; detail = `Plinko bin pays ${multiplier}x`;
      } else { throw new Error("Unknown game engine."); }
      multiplier = Math.round(multiplier * 100) / 100;
      const payout = Math.round(args.bet * multiplier * 100) / 100;
      const profit = Math.round((payout - args.bet) * 100) / 100;
      const pools = applyDelta(me, profit);
      const newBalance = Math.round((pools.balanceUsd + pools.balanceUsdt) * 100) / 100;
      await db.update(schema.users).set(pools).where(eq(schema.users.id, me.id));
      await db.insert(schema.bets).values({ userId: me.id, game: cfg.name, betAmount: args.bet, payout, profit, detail, fairHash });
      await db.insert(schema.ledger).values({ userId: me.id, type: profit >= 0 ? "win" : "bet", amount: profit, currency: "USD", note: `${cfg.name}: ${detail}` });
      await db.update(schema.gamesConfig).set({ plays: cfg.plays + 1 }).where(eq(schema.gamesConfig.slug, args.game));
      ctx.invalidateQueries();
      return { win: payout > args.bet, payout, profit, multiplier, balance: newBalance, detail, reveal, fairHash, cards, mines: minesArr, picks: picksArr, roll, bin, crashPoint };
    },
  }),

  placeSportsBet: defineAction({
    description: "Places a real-money sportsbook bet on a fixture for the logged-in player (fixtures are demo data until sports API keys are connected).",
    request: z.object({ token: z.string().max(200), fixtureId: z.number().int(), pickTeam: z.string().min(1).max(80), stake: z.number().min(1).max(5000) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      const fRows = await db.select().from(schema.fixtures).where(eq(schema.fixtures.id, args.fixtureId)); const f = fRows[0];
      if (!f) throw new Error("Fixture not found.");
      const odds = args.pickTeam === f.team1 ? f.odds1 : f.odds2;
      if (args.stake > totalBalance(me)) throw new Error("Insufficient real-money balance for this stake. Deposit first.");
      await db.update(schema.users).set(applyDelta(me, -args.stake)).where(eq(schema.users.id, me.id));
      await db.insert(schema.sportsBets).values({ userId: me.id, fixtureLabel: `${f.team1} vs ${f.team2}`, pick: args.pickTeam, odds, stake: args.stake, potential: Math.round(args.stake * odds * 100) / 100, status: "open" });
      await db.insert(schema.ledger).values({ userId: me.id, type: "sports-bet", amount: -args.stake, currency: "USD", note: `${f.league} bet: ${args.pickTeam} @ ${odds} (demo fixture)` });
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  requestDeposit: defineAction({
    description: "Creates a real-money deposit request (manual UPI or USDT): the user pays the shown UPI ID / USDT address and submits the UTR / tx-hash plus a screenshot reference; the request waits in the admin approval queue and the balance is credited only on admin approval.",
    request: z.object({ token: z.string().max(200), method: z.enum(["UPI", "USDT"]), amount: z.number().min(1).max(100000), ref: z.string().trim().min(4).max(120), screenshotRef: z.string().trim().max(200).default("") }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      if (me.depositLimit > 0) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const mine = await db.select().from(schema.requests).where(eq(schema.requests.userId, me.id));
        const todayDep = mine.filter((r) => r.kind === "deposit" && r.status !== "rejected" && r.createdAt >= todayStart).reduce((a, r) => a + r.amount, 0);
        if (todayDep + args.amount > me.depositLimit) throw new Error(`This deposit would cross your daily deposit limit of $${me.depositLimit}. Lower the amount or raise the limit in your Wallet.`);
      }
      await db.insert(schema.requests).values({ userId: me.id, kind: "deposit", method: args.method, amount: args.amount, currency: args.method === "USDT" ? "USDT" : "USD", ref: args.ref, screenshotRef: args.screenshotRef, status: "pending" });
      await db.insert(schema.ledger).values({ userId: me.id, type: "deposit-request", amount: 0, currency: args.method === "USDT" ? "USDT" : "USD", note: `Deposit request via ${args.method} - UTR/Tx: ${args.ref} - awaiting verification` });
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  requestWithdraw: defineAction({
    description: "Creates a real-money withdraw request (UPI ID or USDT address). KYC verification is required. The balance is debited only when an admin approves the request.",
    request: z.object({ token: z.string().max(200), method: z.enum(["UPI", "USDT"]), amount: z.number().min(1).max(100000), destination: z.string().trim().min(4).max(160) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      if (me.kycStatus.includes("pending")) throw new Error("KYC verification required before withdraw. Verify your email in Profile first - withdraw unlocks once KYC shows verified.");
      if (args.amount > totalBalance(me)) throw new Error("Insufficient real-money balance for this withdraw amount.");
      const pending = await db.select().from(schema.requests).where(eq(schema.requests.userId, me.id));
      const held = pending.filter((r) => r.kind === "withdraw" && r.status === "pending").reduce((a, r) => a + r.amount, 0);
      if (args.amount + held > totalBalance(me)) throw new Error("You already have a pending withdraw holding this balance. Wait for review.");
      await db.insert(schema.requests).values({ userId: me.id, kind: "withdraw", method: args.method, amount: args.amount, currency: args.method === "USDT" ? "USDT" : "USD", destination: args.destination, status: "pending" });
      await db.insert(schema.ledger).values({ userId: me.id, type: "withdraw-request", amount: 0, currency: args.method === "USDT" ? "USDT" : "USD", note: `Withdraw request via ${args.method} to ${args.destination} - balance debits only on approval` });
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  setLimits: defineAction({
    description: "Saves the logged-in player's responsible-gaming limits: daily deposit limit and daily loss limit in USD (0 = no limit).",
    request: z.object({ token: z.string().max(200), depositLimit: z.number().min(0).max(1000000), lossLimit: z.number().min(0).max(1000000) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); const me = await requireUser(db, args.token);
      await db.update(schema.users).set({ depositLimit: args.depositLimit, lossLimit: args.lossLimit }).where(eq(schema.users.id, me.id));
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  getAdminState: defineAction({
    description: "Operator-only: dashboard stats, deposit/withdraw approval queue, referral totals, all users, activity logs, tenants and settings for the operator portal.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({
      stats: z.object({ totalWagered: z.number(), totalPayout: z.number(), ggr: z.number(), totalBets: z.number(), totalUsers: z.number(), totalGames: z.number(), totalReferrals: z.number(), referralPayouts: z.number(), pendingRequests: z.number() }),
      requests: z.array(z.object({ id: z.number(), userId: z.number(), userEmail: z.string(), kind: z.string(), method: z.string(), amount: z.number(), currency: z.string(), ref: z.string(), destination: z.string(), screenshotRef: z.string(), status: z.string(), rejectReason: z.string(), createdAt: z.string() })),
      users: z.array(z.object({ id: z.number(), name: z.string(), email: z.string(), role: z.string(), balance: z.number(), suspended: z.boolean(), kycStatus: z.string() })),
      logs: z.array(z.object({ id: z.number(), game: z.string(), betAmount: z.number(), profit: z.number(), detail: z.string(), createdAt: z.string() })),
      tenants: z.array(z.object({ id: z.number(), name: z.string(), domain: z.string(), currency: z.string(), commission: z.number(), monthlyRent: z.number(), model: z.string(), status: z.string(), color: z.string() })),
      settings: z.record(z.string(), z.string()), hasLiveKeys: z.boolean(),
    }),
    async handler(ctx, args) {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      const allBets = await db.select().from(schema.bets);
      const users = await db.select().from(schema.users);
      const games = await db.select().from(schema.gamesConfig);
      const logs = await db.select().from(schema.bets).orderBy(desc(schema.bets.id)).limit(30);
      const tenants = await db.select().from(schema.tenants).orderBy(desc(schema.tenants.id));
      const allReqs = await db.select().from(schema.requests).orderBy(desc(schema.requests.id)).limit(60);
      const emailOf = new Map(users.map((u) => [u.id, u.email]));
      const totalReferrals = users.filter((u) => u.referredBy > 0).length;
      const setRows = await db.select().from(schema.settings);
      const SECRET = new Set(["cricapi_key", "odds_api_key"]); const settings: Record<string, string> = {};
      for (const s of setRows) if (!s.key.startsWith("verify_") && !s.key.startsWith("reset_")) settings[s.key] = SECRET.has(s.key) ? "" : s.value;
      const totalWagered = allBets.reduce((a, b) => a + b.betAmount, 0); const totalPayout = allBets.reduce((a, b) => a + b.payout, 0);
      return {
        stats: { totalWagered, totalPayout, ggr: totalWagered - totalPayout, totalBets: allBets.length, totalUsers: users.length, totalGames: games.length, totalReferrals, referralPayouts: totalReferrals * 10, pendingRequests: allReqs.filter((r) => r.status === "pending").length },
        requests: allReqs.map((r) => ({ id: r.id, userId: r.userId, userEmail: emailOf.get(r.userId) ?? `#${r.userId}`, kind: r.kind, method: r.method, amount: r.amount, currency: r.currency, ref: r.ref, destination: r.destination, screenshotRef: r.screenshotRef, status: r.status, rejectReason: r.rejectReason, createdAt: r.createdAt.toISOString() })),
        users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, balance: totalBalance(u), suspended: u.suspended === 1, kycStatus: u.kycStatus })),
        logs: logs.map((b) => ({ id: b.id, game: b.game, betAmount: b.betAmount, profit: b.profit, detail: b.detail, createdAt: b.createdAt.toISOString() })),
        tenants: tenants.map((t) => ({ id: t.id, name: t.name, domain: t.domain, currency: t.currency, commission: t.commission, monthlyRent: t.monthlyRent, model: t.model, status: t.status, color: t.color })),
        settings, hasLiveKeys: setRows.some((s) => (s.key === "odds_api_key" || s.key === "cricapi_key") && s.value.trim() !== ""),
      };
    },
  }),

  adminReviewRequest: defineAction({
    description: "Admin approves or rejects a deposit/withdraw request. Approval credits a deposit or debits a withdraw (balance moves only on approval); rejection stores the admin's reason, shown to the player.",
    request: z.object({ token: z.string().max(200), requestId: z.number().int(), approve: z.boolean(), reason: z.string().trim().max(200).default("") }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      const rows = await db.select().from(schema.requests).where(eq(schema.requests.id, args.requestId)).limit(1); const r = rows[0];
      if (!r) throw new Error("Request not found.");
      if (r.status !== "pending") throw new Error(`This request is already ${r.status}.`);
      const uRows = await db.select().from(schema.users).where(eq(schema.users.id, r.userId)).limit(1); const u = uRows[0];
      if (!u) throw new Error("Player account not found.");
      if (!args.approve) {
        await db.update(schema.requests).set({ status: "rejected", rejectReason: args.reason || "Rejected after verification" }).where(eq(schema.requests.id, r.id));
        await db.insert(schema.ledger).values({ userId: u.id, type: `${r.kind}-rejected`, amount: 0, currency: r.currency, note: `${r.kind === "deposit" ? "Deposit" : "Withdraw"} of ${r.amount} ${r.currency} rejected: ${args.reason || "no reason given"}` });
        ctx.invalidateQueries(); return { ok: true as const };
      }
      if (r.kind === "deposit") {
        const pools = r.currency === "USDT" ? { balanceUsd: u.balanceUsd, balanceUsdt: Math.round((u.balanceUsdt + r.amount) * 100) / 100 } : { balanceUsd: Math.round((u.balanceUsd + r.amount) * 100) / 100, balanceUsdt: u.balanceUsdt };
        await db.update(schema.users).set(pools).where(eq(schema.users.id, u.id));
        await db.insert(schema.ledger).values({ userId: u.id, type: "deposit", amount: r.amount, currency: r.currency, note: `Deposit approved - ${r.method} UTR/Tx: ${r.ref}` });
      } else {
        if (r.amount > totalBalance(u)) throw new Error("Player balance is now lower than this withdraw amount - cannot approve.");
        await db.update(schema.users).set(applyDelta(u, -r.amount)).where(eq(schema.users.id, u.id));
        await db.insert(schema.ledger).values({ userId: u.id, type: "withdraw", amount: -r.amount, currency: r.currency, note: `Withdraw approved - paid via ${r.method} to ${r.destination}` });
      }
      await db.update(schema.requests).set({ status: "approved" }).where(eq(schema.requests.id, r.id));
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  adminSaveGame: defineAction({
    description: "Admin adds or edits a game listing (name, category, engine, RTP, description, tag).",
    request: z.object({ token: z.string().max(200), slug: z.string().max(80).default(""), name: z.string().trim().min(2).max(80), category: z.string().min(2).max(40), engine: z.string().min(2).max(30), rtp: z.number().min(80).max(99.9), description: z.string().max(500).default(""), tag: z.string().max(20).default("") }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      const slug = args.slug || slugify(args.name);
      const existing = await db.select().from(schema.gamesConfig).where(eq(schema.gamesConfig.slug, slug)).limit(1);
      if (existing[0]) await db.update(schema.gamesConfig).set({ name: args.name, category: args.category, engine: args.engine, rtp: args.rtp, description: args.description, tag: args.tag }).where(eq(schema.gamesConfig.slug, slug));
      else await db.insert(schema.gamesConfig).values({ slug, name: args.name, category: args.category, engine: args.engine, rtp: args.rtp, description: args.description || `${args.name} - played with real money (USD / USDT).`, tag: args.tag, enabled: 1, minBet: 1, maxBet: 500, plays: 0, hue: Math.floor(Math.random() * 360) });
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  adminDeleteGame: defineAction({
    description: "Admin removes a game listing from the catalog.",
    request: z.object({ token: z.string().max(200), slug: z.string().min(1).max(80) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> { const db = await ensure(ctx); await requireAdmin(db, args.token); await db.delete(schema.gamesConfig).where(eq(schema.gamesConfig.slug, args.slug)); ctx.invalidateQueries(); return { ok: true as const }; },
  }),

  toggleGame: defineAction({
    description: "Admin switches a game on or off in the lobby.",
    request: z.object({ token: z.string().max(200), slug: z.string().min(1).max(80), enabled: z.boolean() }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> { const db = await ensure(ctx); await requireAdmin(db, args.token); await db.update(schema.gamesConfig).set({ enabled: args.enabled ? 1 : 0 }).where(eq(schema.gamesConfig.slug, args.slug)); ctx.invalidateQueries(); return { ok: true as const }; },
  }),

  adminSuspendUser: defineAction({
    description: "Admin suspends or re-activates a user account.",
    request: z.object({ token: z.string().max(200), userId: z.number().int(), suspended: z.boolean() }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> { const db = await ensure(ctx); const admin = await requireAdmin(db, args.token); if (admin.id === args.userId) throw new Error("You cannot suspend your own admin account."); await db.update(schema.users).set({ suspended: args.suspended ? 1 : 0 }).where(eq(schema.users.id, args.userId)); ctx.invalidateQueries(); return { ok: true as const }; },
  }),

  adminAdjustCredits: defineAction({
    description: "Admin adjusts a user's real-money USD balance by a signed amount with a note; the adjustment is written to the wallet ledger.",
    request: z.object({ token: z.string().max(200), userId: z.number().int(), amount: z.number().min(-100000).max(100000), note: z.string().max(120).default("Balance adjustment") }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      const rows = await db.select().from(schema.users).where(eq(schema.users.id, args.userId)).limit(1); const u = rows[0];
      if (!u) throw new Error("User not found."); if (totalBalance(u) + args.amount < 0) throw new Error("Balance cannot go negative."); const pools = applyDelta(u, args.amount);
      await db.update(schema.users).set(pools).where(eq(schema.users.id, u.id));
      await db.insert(schema.ledger).values({ userId: u.id, type: "adjust", amount: args.amount, currency: "USD", note: args.note });
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  saveSettings: defineAction({
    description: "Admin saves site settings: API keys, promo banner, tournament note, support email, geo-block list.",
    request: z.object({ token: z.string().max(200), values: z.record(z.string(), z.string().max(500)) }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      for (const [key, value] of Object.entries(args.values)) {
        if ((key === "cricapi_key" || key === "odds_api_key") && value.trim() === "") continue;
        const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
        if (existing.length) await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key)); else await db.insert(schema.settings).values({ key, value });
      }
      ctx.invalidateQueries(); return { ok: true as const };
    },
  }),

  createTenant: defineAction({
    description: "Super Admin creates a white-label tenant record for script sale or monthly rent.",
    request: z.object({ token: z.string().max(200), name: z.string().trim().min(2).max(60), domain: z.string().max(80).default(""), currency: z.string().max(10).default("USD"), commission: z.number().min(0).max(90).default(15), monthlyRent: z.number().min(0).max(100000).default(750), model: z.string().max(20).default("rent"), color: z.string().max(10).default("#0a0a0f") }),
    response: ok,
    async handler(ctx, args): Promise<z.infer<typeof ok>> { const db = await ensure(ctx); await requireAdmin(db, args.token); await db.insert(schema.tenants).values({ name: args.name, domain: args.domain, currency: args.currency, commission: args.commission, monthlyRent: args.monthlyRent, model: args.model, color: args.color, status: "active" }); ctx.invalidateQueries(); return { ok: true as const }; },
  }),

  getReadme: defineAction({
    description: "Operator-only: returns the Quvanta README with architecture, setup, selling models and API directory. Requires an operator (admin) session - it is never served to player accounts.",
    request: z.object({ token: z.string().max(200) }),
    response: z.object({ markdown: z.string() }),
    async handler(ctx, args) {
      const db = await ensure(ctx); await requireAdmin(db, args.token);
      const md = [
        "# Quvanta - Premium Casino & Sports Entertainment Platform (Real-Money Edition)",
        "",
        "Premium dark black & gold glassmorphism platform: 200+ distinct game listings across Slots, Table, Card, Arcade, Live Casino and Sports Mini Games; full sportsbook (Cricket incl. IPL & World Cups, Football incl. FIFA WC & UCL, Tennis, Basketball and more); IPL dashboard with points table and caps leaders; user accounts with hashed passwords, sessions, RBAC (player/admin), favorites, history and responsible-gaming controls.",
        "",
        "## URLs & accounts",
        "- Player site: / (hash route #/) - lobby, games, sportsbook, wallet, profile. The player site contains NO link, button, tab or mention of the operator portal anywhere - not in the header, footer, login page, wallet, FAQ or any other player-visible page.",
        "- Operator portal (OWNER-ONLY SETUP NOTE - this is the only place this address is written down; never publish it on the player site): log in at #/admin-login (append #/admin-login to the site URL). Login and dashboard share that single hidden address - after a successful operator login the dashboard opens on the same #/admin-login page; there is no separate dashboard URL, and the old dashboard route is disabled. There is exactly ONE admin account and it can never be created from player signup: it is seeded once with username admin and initial password admin@123 - change both from the operator dashboard (Dashboard tab, Admin Account card) before launch; after a change the old login stops working and the new one persists across reloads. A demo player account is also seeded server-side; the owner shares its login details privately.",
        "",
        "## Screenshots (shown above this README in the Sell tab)",
        "1. Homepage / Lobby - hero, featured/popular/new game rows with per-game artwork, sports & tournament cards.",
        "2. Game detail page - big game artwork, server-settled play panel, bet controls, provably-fair result.",
        "3. Wallet - real-money deposit (UPI / USDT + UTR) and withdraw forms, Refer & Earn, request history, ledger.",
        "4. Admin dashboard - GGR stats, referral totals, pending-request count, activity logs, launch checklist.",
        "",
        "## Operator portal - where it is and how to open it (step by step, owner-only)",
        "1. Open the Quvanta site in the browser.",
        "2. Append #/admin-login at the end of the URL. There is deliberately NO link to this address anywhere on the player site - it can only be reached by typing it, so players never see it and cannot try operator logins from the player login page.",
        "3. The OPERATOR PORTAL LOGIN screen opens - a plain login form only, with no player-site branding and no link back to the player site.",
        "4. Log in with the single admin account: username admin, initial password admin@123. Immediately change both in Dashboard - Admin Account (Change Username / Change Password) - the change is saved server-side, survives reload, and the old username/password stop working at once. There is no admin signup anywhere: player registration always creates a player account, never an admin.",
        "5. After login the operator dashboard opens on the same hidden address: Dashboard stats, Deposit / Withdraw approval queue, Games (add/edit/remove/on-off), Users (suspend, balance adjust), Settings (payments, API keys, banners), Sell / Tenants / this README. The dashboard uses its own separate session - being logged in as a player does not open it.",
        "6. Player accounts get 'Access denied' on the portal login - only role=admin accounts can enter, and a player login attempt there creates no session.",
        "",
        "## Install & setup (standalone code-sale version)",
        "Requirements: Node.js 20+, PostgreSQL 14+ (production stack) or the bundled SQLite for the hosted demo build, a domain with HTTPS.",
        "1. Unzip the Quvanta package and open the folder in a terminal.",
        "2. Install dependencies: npm install",
        "3. Copy the env template: cp .env.example .env - then set DATABASE_URL (PostgreSQL connection string), SESSION_SECRET (long random string), ADMIN_EMAIL and ADMIN_PASSWORD (your real admin login - replaces the demo admin).",
        "4. Create the database tables: npx prisma migrate deploy (production stack) - the hosted build applies its Drizzle migrations automatically on first run.",
        "5. First run seeds: the admin account from .env, a demo player account (the owner shares its login privately; delete it before launch), the 200+ game catalog, demo sports fixtures and default settings (platform UPI ID quvanta@upi and a placeholder USDT address - replace both in Admin - Settings).",
        "6. Build and start: npm run build && npm start - the player site serves on / and the operator portal is reached only via its hidden login address (see the owner-only note above).",
        "7. Log in via the operator portal login, go to Settings: set your real UPI ID and USDT address, paste the sports API keys (see API directory below), set the support email and geo-block list.",
        "8. Before accepting real money: complete the licence / KYC / payment-compliance steps in the Launch Checklist on the admin dashboard.",
        "",
        "## Deployment steps",
        "1. Server: any VPS (2 GB RAM is enough to start) with Node.js 20+ and PostgreSQL, or Docker using the included compose file.",
        "2. Point your domain DNS (A record) to the server, put Nginx/Caddy in front as a reverse proxy to the app port, and enable HTTPS (Let's Encrypt) - never run real-money login/payment pages on plain HTTP.",
        "3. Set production env vars on the server (DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD) - never commit them to Git.",
        "4. Run migrations, start the app under a process manager (pm2 or systemd) so it restarts on crash/reboot, and enable daily database backups.",
        "5. Verify: player site loads (with no portal link anywhere on it), the operator portal login works, a test deposit request appears in the operator queue, and the sportsbook badge switches from DEMO to LIVE after you paste API keys.",
        "6. Keep the geo-block list (Admin - Settings) aligned with your licence; real-money gambling is illegal in most Indian states and restricted in the US/UK/AU by default.",
        "",
        "## API directory - where to get every API, free vs paid, and where the key goes",
        "All sports keys are pasted in Admin - Settings (stored server-side only, never shown again). Sportsbook shows DEMO until a key is saved, then switches to LIVE.",
        "",
        "IPL / cricket live scores (scores only - they do not place or settle bets):",
        "- CricketData.org (CricAPI) - https://cricketdata.org - FREE: 100 hits/day lifetime free plan. PAID: from $5.99/month. Key field in Admin - Settings: 'CricAPI / CricketData key'.",
        "- Entity Sport - https://www.apisports.net/providers/entity-sport - FREE: 1,000 requests/day. PAID: Starter $29/month. Signup happens on the provider's own site linked from that page. Key field: same CricAPI key field (one cricket key at a time).",
        "- API Cricket - https://www.api-cricket.com/ - FREE: 14-day free trial. PAID: Starter $20/month. Key field: same CricAPI key field.",
        "- Roanuz Cricket API - https://sports.dev.roanuz.com/ - No free tier. PAID: from EUR 176/month (enterprise-grade feeds). Key field: same CricAPI key field.",
        "",
        "Live betting odds (odds data only - the API never places a bet for you):",
        "- The Odds API - https://the-odds-api.com - FREE: 500 credits/month. PAID: about $25-30/month. Key field in Admin - Settings: 'The Odds API key'. Note: odds-api.io and odds-api.net are different companies - use exactly the-odds-api.com.",
        "",
        "200+ third-party casino games (Phase 2 aggregator - B2B only, no free tier, gaming licence required before contract):",
        "- Slotegrator APIgrator - https://slotegrator.pro/analytical_articles/working-with-slotegrator-how-we-help-you-grow/ - one integration, 30,000+ games from 180+ providers. PAID: quote-only (sales contract), no self-serve signup. Integration point: the provider layer maps each catalog game to an engine; the aggregator's launch URLs and server key are configured on the server (env), not in Admin - Settings.",
        "",
        "Crypto payments (for automated USDT deposits/withdraws - Phase 2; Phase 1 uses the manual USDT address + admin approval already built in):",
        "- CoinsPaid - crypto payment gateway (USDT/BTC etc.), B2B pricing on application (per-transaction processing fee, quote from their sales team). API keys go in the server env (PAYMENTS_API_KEY), never in the client.",
        "- NOWPayments - crypto payment gateway, FREE to start (pay-as-you-go), PAID: per-transaction fee from about 0.5-1% depending on coin/conversion. API key + IPN secret go in the server env; callback URL is set in their dashboard to your /api/payments/callback endpoint.",
        "Manual Phase 1 alternative (already live in this build): players pay the platform USDT address shown in Wallet and an admin approves each deposit - no gateway account needed.",
        "",
        "## Real-money wallet - UPI & USDT, admin-approved",
        "New accounts start at $0.00 real balance - there are no bonuses of any kind. DEPOSIT: the player pays the admin-set UPI ID or USDT address (Admin - Settings), then submits amount + UTR / tx-hash + screenshot reference; the request sits in the Admin approval queue and the balance is credited only when an admin approves (rejections carry a reason shown to the player). WITHDRAW: the player enters amount + UPI ID / USDT address; KYC must be verified first; the balance is debited only on admin approval. Every deposit, bet, win, referral and withdraw is written to the wallet ledger. Players can set daily deposit and loss limits in the Wallet (responsible gaming).",
        "",
        "## Refer & Earn - Rs 10 per signup",
        "Every user has a unique referral code and link (Profile / Wallet). When a new user signs up with that code, the referrer is credited Rs 10 real money instantly, with a referral history in the Wallet and totals (referrals + payouts) on the Admin dashboard.",
        "",
        "## LAUNCH WARNING - licence required (demo mode until then)",
        "WARNING: Real-money operation is DEMO MODE until the operator adds a valid licence. A real-money launch requires a Curacao / Anjouan gaming licence, full KYC verification and payment compliance, plus geo-blocking of restricted jurisdictions (Admin - Settings). Do not accept real player funds without them.",
        "",
        "## Architecture (standalone code-sale version)",
        "This hosted build: React + TypeScript client, server actions + SQLite/Drizzle. The spec's production stack maps 1:1 - Next.js/React/TypeScript/Tailwind frontend, Node API, PostgreSQL + Prisma, secure password hashing, rate-limited login, RBAC. Provider integration is modular: each catalog game maps to an engine (slots/cards/roulette/arcade); a Slotegrator-style aggregator can replace engines in Phase 2 under contract + licence.",
        "",
        "## Sports data",
        "Sportsbook runs on clearly-labelled DEMO fixtures until keys are saved in Admin - Settings: CricAPI/CricketData (https://cricketdata.org) for scores, The Odds API (https://the-odds-api.com) for odds. Never fake live scores: without keys the UI shows DEMO badges.",
        "",
        "## Selling - both models",
        "A) One-time script sale: full code + this README + setup support, buyer hosts. B) Monthly white-label rent: Admin - Tenants, suggested $500-$2,000/month + commission % (owner sets final price).",
        "",
        "## Responsible gaming & legal",
        "18+ only, DOB checked at signup. Deposit/loss limits are built into the Wallet; self-exclusion (admin suspend) and geo-blocking must be configured by the operator. Real-money gambling requires a licence (Curacao/Anjouan), KYC and payment compliance, and is illegal in most Indian states - this build stays in demo mode until the operator adds the licence.",
      ].join("\n");
      return { markdown: md };
    },
  }),
} satisfies ActionsModule;
