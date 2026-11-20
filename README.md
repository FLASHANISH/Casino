# Quvanta — Premium Casino & Sports Entertainment Platform (Vercel Edition)

Quvanta is a premium, dark black-and-gold casino and sports entertainment
platform built for global use and for resale — both as a one-time script sale
and as a monthly white-label rental.

It ships with **232 distinct game listings**, a real-money wallet (UPI + USDT,
admin-approved), a sportsbook with dedicated **IPL** and **World Cup** sections,
a full user account system, a **Refer & Earn** programme, and a powerful
operator dashboard.

> **Current money model (final):** Real money only. No fake/demo coins for
> players, and **no bonuses of any kind** — no signup bonus, no daily bonus,
> no promo bonus. New accounts start at **$0.00**.

## What this version is

This is the **standalone Vercel build** of Quvanta:

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript, Tailwind CSS 3 |
| Backend | Next.js Route Handlers (`src/app/api/*`), server-settled games |
| Database | PostgreSQL via Prisma (Neon free tier by default) |
| Auth | bcrypt password hashing, DB session tokens in httpOnly cookies |
| Fairness | Server-side settlement with a provably-fair hash per round |

It is a port of the hosted build's logic (auth, wallet, 10 game engines,
232-game catalog, referrals, sportsbook, operator tools) to standard
Next.js + Postgres. There is no Bun, no Hatch SDK, no SQLite and no
`file:` dependency in this package — it runs on Vercel serverless as-is.

## Quick access — player pages

| Page | URL |
|---|---|
| First page (login / create account) | `/` |
| Dashboard / Lobby | `/lobby` |
| Games | `/lobby` and `/game/<game-slug>` |
| Sportsbook | `/sports` |
| IPL dashboard | `/ipl` |
| World Cup | `/worldcup` |
| Wallet | `/wallet` |
| Profile | `/profile` |
| Info pages (FAQ, Terms, Privacy, Responsible Gaming) | `/info/faq` and related routes |

The first page is login / create account only. Logged-out visitors see nothing
else — the lobby, games, sportsbook, IPL, World Cup, wallet and profile all
live behind login.

## Game library — 232 distinct games

| Category | Count | Examples |
|---|---:|---|
| Slot games | 80 | Classic, Mega, Fruit, Adventure, Jackpot, Fantasy and Egyptian slots |
| Table games | 32 | Blackjack, European and American Roulette, Baccarat, Poker, Sic Bo, Dragon Tiger |
| Card games | 32 | Teen Patti, Andar Bahar, Rummy, Poker variants, Solitaire, Call Break |
| Arcade games | 32 | Crash, Plinko, Mines, Dice, Limbo, Wheel Spin, Tower, Balloon |
| Live casino listings | 22 | Live Roulette, Live Blackjack, Live Baccarat, Live Game Shows, Live Poker |
| Sports mini games | 24 | Virtual Cricket, Virtual Football, Penalty Shootout, Basketball, Racing |

**Playable in-house engines (10):** Crash, Mines, Dice, Slots, Teen Patti,
Andar Bahar, Roulette, Dragon Tiger, Blackjack and Plinko. These run natively,
settle on the server (`src/lib/games.ts` + `POST /api/play`), and store a
provably-fair hash on every round. The remaining catalogue entries are provider
slots: they launch through the modular provider layer once an aggregator
contract is connected (see API directory below).

## Sportsbook, IPL and World Cup

- **Sportsbook (`/sports`):** Cricket (IPL, ICC Cricket World Cup, T20 World
  Cup, Champions Trophy, Asia Cup, Test, ODI, T20 Internationals, BBL, PSL,
  CPL, The Hundred), Football (FIFA World Cup, UEFA Champions League, Premier
  League, La Liga, Serie A, Bundesliga, Ligue 1, Europa League), plus Tennis,
  Basketball, Volleyball, Badminton, Hockey, Baseball, Formula 1 and Esports.
- **IPL dashboard (`/ipl`):** all 10 IPL teams, match schedule, live-score area,
  points table and standings, Orange Cap / Purple Cap leaderboards.
- **World Cup pages (`/worldcup`):** Cricket World Cup, T20 World Cup and FIFA
  Football World Cup — fixtures, groups, knockout stages, points tables.

> **No fake live data:** until a sports API key is saved in Settings, all
> fixtures and scores are clearly labelled **DEMO**. Quvanta never presents
> invented scores as live. Adding a key switches the same pages to live data.

## Real-money wallet — deposit and withdraw

- **Currencies:** USD balance and USDT balance. New accounts start at **0.00**
  — there is no starting balance and no bonus.
- **Deposit (manual UPI + USDT):** the player pays the platform UPI ID or USDT
  (TRC20) address shown in the Wallet, then submits the amount with the
  **UTR number (UPI)** or **transaction hash (USDT)** and a screenshot
  reference. The request waits in the approval queue. The balance is credited
  **only when the operator approves** after verifying the UTR / tx-hash.
  Rejections carry a reason the player can see.
- **Withdraw:** the player enters the amount and their UPI ID or USDT address.
  **KYC must be verified first.** The balance is debited **only on approval**.
- **Ledger:** every deposit, bet, win, referral credit, adjustment and withdraw
  is written to the wallet ledger; the balance can never go negative, and
  withdrawals are allowed only from settled balance.
- **Limits:** players can set daily deposit and loss limits in the Wallet
  (responsible gaming).

Standard payment gateways generally do not accept gambling merchants, which is
why the launch flow is manual UPI + USDT with approval. An automatic high-risk
card / crypto gateway can be added later under the operator's own merchant
account and licence.

## Refer & Earn — Rs 10 per referral

- Every user gets a **unique referral code and referral link**, shown in the
  Wallet and Profile.
- When a new user signs up using that code or link, the referrer is credited
  **Rs 10 real money**, shown as **10.00** in the wallet balance.
- The referrer sees a referral history in the Wallet; the operator dashboard
  shows total referrals and total referral payouts.
- **Bonus policy:** there is no other bonus anywhere in the product — no signup
  bonus, no daily bonus, no promo bonus.

## Accounts

- Registration, login, sessions that persist (30-day httpOnly cookies), bcrypt
  password hashing, 18+ date-of-birth check at signup, wrong-password errors,
  email verification code for KYC, password reset with a code, user profile,
  game and match history, favourite games, responsible-gaming controls, account
  suspension by the operator.

## Operator dashboard

The operator dashboard covers totals (users, games, GGR, deposits,
withdrawals, referral payouts), the deposit / withdraw approval queue, game
management, user management (suspend, balance adjust), settings (payments,
API keys, banners, geo-block), white-label tenants, and a launch checklist.
Operator setup is documented separately in `OWNER-SETUP.md` — that file is
git-ignored and must never be published to a public repo.

## Selling models — dono tareeke

| Model | How it works |
|---|---|
| One-time script sale | Sell the full code package with this README and setup support; the buyer hosts it on their own Vercel + Neon account and uses their own API keys, UPI ID, USDT address and licence |
| Monthly white-label rent | Create a tenant in the operator dashboard, set the rent and commission %, and give the client their own branded site, operator access, users and wallet |

Suggested rent discussed for this project is $500–$2,000 per month per client
plus a revenue share — the final price is set by the owner. A buyer or tenant
never receives the owner's API keys, payment addresses or licence; each
operator configures their own.

## Tech stack & project structure

```
quvanta-vercel/
  package.json            Next.js 14, React 18, Prisma 5, bcryptjs, zod
  next.config.mjs         Next.js config
  vercel.json             Vercel build settings (Prisma generate + migrate + build)
  tailwind.config.ts      Tailwind + gold/black theme
  prisma/
    schema.prisma         PostgreSQL schema (users, sessions, wallet, ledger,
                          bets, sports_bets, requests, games_config, fixtures,
                          settings, tenants)
    seed.ts               Idempotent seed: operator account, demo player,
                          232-game catalog, demo fixtures, default settings
  src/
    app/                  App Router pages: / (login gate), /lobby,
                          /game/[slug], /sports, /ipl, /worldcup, /wallet,
                          /profile, /info/[page]
    app/api/              Route Handlers: auth, state, play, sports-bet,
                          deposit, withdraw, limits, favorite, sports-live
    components/           AuthGate, Shell, Lobby, GameDetail, GameArt,
                          WalletPage, ProfilePage, SportsPages, InfoPage
    lib/                  prisma client, auth (bcrypt + sessions),
                          catalog (232 games), games (10 engines),
                          seed, state, live sports fetch
```

## Install & setup (local)

```bash
# 1. Clone and enter the folder
git clone https://github.com/<owner>/<repo>.git quvanta
cd quvanta

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in your own values
cp .env.example .env.local

# 4. Create the database tables and seed demo data
npx prisma migrate dev --name init
npm run db:seed

# 5. Start the dev server
npm run dev
```

Then open http://localhost:3000 — the first page is login / create account.
See `OWNER-SETUP.md` for the initial operator login.

## Deploy to Vercel (production)

### 1. Create a free Neon PostgreSQL database

1. Sign up at https://neon.tech (free tier is enough to start).
2. Create a project (region closest to your players, e.g. Singapore for India).
3. Create a database named `quvanta`.
4. Copy the **pooled** connection string — it looks like
   `postgresql://user:password@ep-xxx-pooler.<region>.aws.neon.tech/quvanta?sslmode=require`
   (use the `-pooler` host: Vercel serverless needs pooled connections).

### 2. Push this code to GitHub and import into Vercel

```bash
git init
git add .
git commit -m "Quvanta — Vercel edition (Next.js + Prisma + Postgres)"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

1. In Vercel (https://vercel.com/new), **Import** the repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command is set in `vercel.json`: `prisma generate && prisma migrate deploy && next build`.
4. Add the environment variables below, then **Deploy**.

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled Postgres connection string |
| `SESSION_SECRET` | Yes | Long random string (`openssl rand -base64 48`) |
| `CRICAPI_KEY` | No | CricketData.org key — scores go live when set |
| `ODDS_API_KEY` | No | The Odds API key — odds go live when set |
| `UPI_ID` | No | Platform UPI ID shown to players (default `quvanta@upi`) |
| `USDT_ADDRESS` | No | Platform USDT (TRC20) address shown to players |
| `SEED_ADMIN_EMAIL` | No | Operator account email seeded on a fresh DB |

After the first deploy, the build runs migrations and the seed runs on first
request (the app seeds itself idempotently). Verify: open the site, create a
player account (starts at $0.00), play a demo round only after a test deposit
is approved, and check the sports pages show the DEMO badge until keys are set.

### Post-deployment checklist

- [ ] Operator password changed (see `OWNER-SETUP.md`); demo player account removed before public launch
- [ ] Real UPI ID and USDT (TRC20) address set in Settings, and a test deposit approved end-to-end
- [ ] Test withdraw completed with KYC verified
- [ ] CricAPI key saved — IPL page shows live data, no DEMO badge
- [ ] Odds API key saved — sportsbook odds load
- [ ] Geo-block list matches your licence; 18+ and responsible-gaming pages live
- [ ] Licence, KYC process and payment compliance in place **before** accepting real funds

## Configuration — environment variables and settings

Runtime configuration lives in the operator Settings page (database `settings`
table) and in `.env` / Vercel env vars. Never put a real key, password or
payment address in chat, in the README, or in committed code.

| Setting / variable | What it is | Where to get it |
|---|---|---|
| `cricapi_key` / `CRICAPI_KEY` | Cricket scores API key | CricketData.org — see API directory |
| `odds_api_key` / `ODDS_API_KEY` | Live odds API key | The Odds API — see API directory |
| `upi_id` / `UPI_ID` | Platform UPI ID players pay deposits to | Your own UPI account |
| `usdt_address` / `USDT_ADDRESS` | Platform USDT (TRC20) deposit / payout address | Your own crypto wallet |
| `brand_name` | Site brand name | Default: Quvanta |
| `support_email` | Support email shown on the site | Your own mailbox |
| `geo_block` | Blocked jurisdictions list | Default: `US, UK, AU` — confirm with your licence |
| `DATABASE_URL` | PostgreSQL connection string | Neon (see deploy steps) |
| `SESSION_SECRET` | Signs login sessions | Generate a long random value; never reuse a demo value |

## API directory — API kaha milega (free + paid)

Prices below were checked on **2026-11-20** — always re-check the price on the
provider's own site before paying. Every key is created on **your own account**
on the provider's site, then pasted into **Settings** (or the matching Vercel
env var). Never share a key in chat.

### 1. IPL / cricket live scores API

These APIs give fixtures, live scores and player / team statistics for the IPL
dashboard and sportsbook. They do **not** give betting odds and they do **not**
place bets.

| Provider | Free plan | Paid plan (from) | Signup |
|---|---|---|---|
| CricketData.org (CricAPI) | Lifetime free, 100 hits/day | $5.99/month (2,000 hits/day) | https://cricketdata.org |
| Entity Sport | Free, 1,000 requests/day | $29/month Starter | https://www.apisports.net/providers/entity-sport |
| API Cricket | 14-day free trial | $20/month Starter | https://www.api-cricket.com/ |
| Roanuz Cricket API | Pay-as-you-go / limited entry | €176/month billed annually | https://sports.dev.roanuz.com/ |

**How to connect it:** sign up → copy your API key → Settings → `cricapi_key`
(or `CRICAPI_KEY` env var) → Save → reload `/ipl`.

### 2. Live betting odds API

This API returns odds only. It does not place or settle bets — settlement stays
in Quvanta's own wallet and approval flow.

| Provider | Free plan | Paid plan (from) | Signup |
|---|---|---|---|
| The Odds API | Free, 500 credits/month | ~$25–30/month | https://the-odds-api.com |

> **Warning — similar names, different companies:** `odds-api.io` and
> `odds-api.net` are separate services. Use exactly **the-odds-api.com**.

### 3. 200+ games provider API (Phase 2 — B2B, no free tier)

The 10 in-house games need no API. The full third-party catalogue comes from a
**game aggregator** through one integration. There is no free tier: account,
setup fee and monthly / revenue-share terms are negotiated, and a gaming
licence is normally required before a provider account is issued.

| Provider | What it gives | Signup |
|---|---|---|
| Slotegrator — APIgrator | One integration, 30,000+ games from 180+ providers | https://slotegrator.pro/analytical_articles/working-with-slotegrator-how-we-help-you-grow/ |

Other aggregators — SoftSwiss, BetConstruct, Pragmatic Play, Evolution and
Spribe — are sales-only: contact their sales teams directly. **Order of
work:** licence first → aggregator contract → provider credentials in env →
catalogue sync → demo mode per provider before real-money launch.

### 4. Payments, KYC and email — no API key needed to launch

| Need | Launch solution in Quvanta | When to buy an API |
|---|---|---|
| Deposits / withdrawals | Manual UPI + USDT with UTR / tx-hash and approval — no gateway needed | Add a high-risk card / crypto gateway later, on your own merchant account, after licensing |
| KYC / age check | 18+ date-of-birth check at signup + email verification before withdraw | Add a document-verification provider later if your licence requires it |
| Email | Verification / reset codes are shown in-app (no email service connected) | Any SMTP provider on your own account works |

## Security

- bcrypt password hashing (cost 12) — plain passwords are never stored
- httpOnly, SameSite cookies; login rate limiting; server-side session tokens
- Role-based permissions: operator actions require an operator session; players
  are blocked from operator routes
- Input validation on every API route (zod), parameterised queries via Prisma
  (SQL-injection safe), XSS-safe rendering
- Wallet integrity: balance never goes negative, every movement is a ledger
  entry, deposits and withdrawals move money only on approval
- API keys are stored server-side only and never returned to the client

## Responsible gaming and legal — read before launch

- **18+ only.** Date of birth is checked at signup and KYC is verified before
  withdrawals.
- Built-in safeguards: daily deposit limits, loss limits, session controls,
  and operator suspension / self-exclusion.
- **Licence required:** real-money operation requires a valid gaming licence
  (for example Curaçao / Anjouan, roughly $15k–25k per year at the operator's
  cost), full KYC verification and payment compliance for the target
  jurisdictions. Until then, keep the platform in demo / preview use and do
  not accept real player funds.
- Real-money gambling is illegal in most Indian states, and restricted
  jurisdictions such as the USA, UK and Australia must be geo-blocked
  (Settings → `geo_block`). The operator — not the software — is responsible
  for complying with the law in every market they serve.
- Only integrate authorised, licensed game providers and official / licensed
  sports data APIs.

## What is still remaining — jo reh gaya hai

| Item | Status | Owner |
|---|---|---|
| Live sports data | DEMO fixtures until keys are added | Operator buys CricAPI + Odds API keys (free tiers available) |
| 200+ third-party games | 232 listings ready; 10 in-house games playable | Aggregator contract (Slotegrator) + licence unlock provider launches |
| Real UPI ID / USDT address | Placeholder values in settings | Operator sets real values in Settings |
| Domain | Not purchased | Operator confirms and buys the domain, adds it in Vercel → Domains |
| Gaming licence | Not obtained | Operator (Curaçao / Anjouan, ~$15k–25k/year) |
| Real screenshots | No binary images in this repo | Capture each live page after deploy |

## FAQ

**Where is the operator dashboard?** Operator setup is documented separately
in `OWNER-SETUP.md` (kept out of the public repo).

**API key kahan daalna hai?** Settings. `cricapi_key` for scores, `odds_api_key`
for odds. Keys are never shown back after saving.

**Sports page pe DEMO kyun likha hai?** No valid API key is saved yet. Quvanta
never fakes live scores — add a key and the same pages go live.

**Deposit approve hone pe hi balance kyun badhta hai?** By design: the player
pays by UPI / USDT and submits the UTR / tx-hash; the operator verifies it and
approves. The same approval flow protects withdrawals.

**Referral ka Rs 10 kab milta hai?** Instantly, when a new user completes
signup with your referral code or link. It appears as 10.00 in the wallet with
a ledger entry and a referral-history record.

**Bonus kyun nahi hai?** Removed by design in the final real-money version —
no signup, daily or promo bonus exists anywhere in the product.

## Support

Set your own support email in Settings (`support_email`) before selling or
launching — buyers and players should always reach the operator of their own
site, not the original developer.
