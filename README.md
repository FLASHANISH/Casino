# Quvanta — Premium Casino & Sports Entertainment Platform

Quvanta is a premium, dark black-and-gold, glassmorphism casino and sports entertainment platform built for global use and for resale — both as a one-time script sale and as a monthly white-label rental.

It ships with **232 distinct game listings**, a real-money wallet (UPI + USDT, admin-approved), a sportsbook with dedicated **IPL** and **World Cup** sections, a full user account system, a **Refer & Earn** programme, and a powerful admin dashboard on its own separate URL with its own login.

> **Current money model (final):** Real money only. No fake/demo coins for players, and **no bonuses of any kind** — no signup bonus, no daily bonus, no promo bonus. New accounts start at **0.00**. See [Real-money wallet](#real-money-wallet--deposit-and-withdraw) and [Refer & Earn](#refer--earn--rs-10-per-referral).

## Quick access — URLs and demo accounts

| Page | URL (add after your domain) | Who can open it |
|---|---|---|
| Player site / Lobby | `#/` | Everyone |
| Games | `#/` (lobby) and `#/game/<game-slug>` | Everyone; playing needs login |
| Sportsbook | `#/sports` | Everyone |
| IPL dashboard | `#/ipl` | Everyone |
| World Cup | `#/worldcup` | Everyone |
| Wallet | `#/wallet` | Logged-in players |
| Profile | `#/profile` | Logged-in players |
| Player login / signup | `#/login` / `#/signup` | Everyone (18+ only at signup) |
| **Admin panel** | **`#/admin`** | **Admins only — separate login** |
| Info pages (FAQ, Terms, Privacy, Responsible Gaming) | `#/info/faq` and related info routes | Everyone |

Demo accounts (change these before any public launch):

| Role | Email | Password |
|---|---|---|
| Admin | admin@quvanta.gg | admin123 |
| Player | player@quvanta.gg | player123 |

Admin access is role-based: a player account opening `#/admin` gets access denied, and the player site carries no admin link. In the hosted build the admin URL is the hash route `#/admin`; in a standalone deployment the same panel is served on the literal `/admin` path.

## Screenshots

The four frames below name the exact file each screenshot must be saved as, and list what that page must show. Open the live site, open each page below, take a full-page screenshot, and save it over the matching file in the `screenshots/` folder — the README links will then display the real pages.

### 1. Homepage / Lobby

![Quvanta homepage and game lobby](screenshots/01-homepage.png)

What this page shows: hero banner with the promo announcement, featured / popular / new game rows from the 232-game library with category-correct thumbnails (slots look like slots, card games show cards), Live Sports, IPL and World Cup sections, promotions, the Champions Cup tournament note, and recently played games.

### 2. Game page

![Quvanta game page](screenshots/02-game-page.png)

What this page shows: one playable game opened from its own detail page — for example Crash with its animated chart and cash-out slider, or Blackjack / Teen Patti with real cards and chips. Every round is settled on the server and shows a provably-fair hash. The page also carries the game's own description, category, and related games.

### 3. Wallet — real-money deposit, withdraw and Refer & Earn

![Quvanta real-money wallet](screenshots/03-wallet.png)

What this page shows: the real balance (USD + USDT), the deposit form (pay the platform UPI ID or USDT address, then submit amount + UTR / tx-hash), the withdraw form (KYC verified first), the complete transaction ledger, responsible-gaming limits, and the Refer & Earn block with the user's own referral code and link.

### 4. Admin dashboard

![Quvanta admin dashboard](screenshots/04-admin-dashboard.png)

What this page shows: the separate admin panel at `#/admin` after admin login — totals for users, games, GGR, deposits / withdrawals and referral payouts, the deposit / withdraw approval queue, game management, user management, banners and promotions, API-key and payment settings, and the launch checklist.

## Features at a glance

- **Design:** premium dark black-and-gold theme, glassmorphism cards, smooth animations, fully responsive on desktop, tablet and mobile, fast loading with lightweight game engines (no heavy streaming, so games do not buffer).
- **Homepage:** hero banner, featured / popular / new games, live sports, IPL, Cricket World Cup, Football World Cup, upcoming matches, live-score area, tournaments, promotions and announcements, recently played games.
- **Accounts:** registration, login, secure sessions that survive reload, hashed passwords, 18+ date-of-birth check at signup, wrong-password errors, user profile, game and match history, favourite games, responsible-gaming controls, account suspension by admin.
- **Languages and pages:** English and Hindi-ready structure, search and filters, notifications / announcements, customer-support and FAQ, Terms and Conditions, Privacy Policy, and Responsible Gaming pages.

## Game library — 232 distinct games

Every game has its own unique listing, thumbnail, category, description and detail page. The library is organised as:

| Category | Count | Examples |
|---|---:|---|
| Slot games | 50+ | Classic, Mega, Fruit, Adventure, Jackpot, Fantasy and Egyptian slots |
| Table games | 30+ | Blackjack, European and American Roulette, Baccarat, Poker, Video Poker, Sic Bo, Dragon Tiger |
| Card games | 30+ | Teen Patti, Andar Bahar, Rummy, Poker variants, Solitaire, Call Break, Blackjack variants |
| Arcade games | 30+ | Crash, Plinko, Mines, Dice, Limbo, Wheel Spin, Tower, Balloon |
| Live casino listings | 20+ | Live Roulette, Live Blackjack, Live Baccarat, Live Game Shows, Live Poker |
| Sports mini games | 20+ | Virtual Cricket, Virtual Football, Penalty Shootout, Basketball, Racing, Virtual Horse Racing |

**Playable in-house engines (10):** Crash, Mines, Dice, Slots, Teen Patti, Andar Bahar, Roulette, Dragon Tiger, Blackjack and Plinko. These run natively, settle on the server, and store a provably-fair hash on every round. The remaining catalogue entries are provider slots: they launch through the modular provider layer once an aggregator contract is connected (see [Game provider API](#3-200-games-provider-api-phase-2--b2b-no-free-tier)). Only use original or properly licensed game assets and providers.

## Sportsbook, IPL and World Cup

- **Sportsbook (`#/sports`):** Cricket (IPL, ICC Cricket World Cup, T20 World Cup, Champions Trophy, Asia Cup, Test, ODI, T20 Internationals, domestic leagues, Big Bash, PSL, CPL, The Hundred), Football (FIFA World Cup, UEFA Champions League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Europa League), plus Tennis, Basketball, Volleyball, Badminton, Hockey, Baseball, Formula 1 and Esports sections, with fixtures, a bet-slip style interface and match history.
- **IPL dashboard (`#/ipl`):** all IPL teams, match schedule, live-score area, upcoming and completed matches, points table and standings, player statistics, and Orange Cap / Purple Cap leaderboards.
- **World Cup pages (`#/worldcup`):** Cricket World Cup, T20 World Cup and FIFA Football World Cup — fixtures, groups, knockout stages (quarter-finals, semi-finals, final), points tables, team profiles and player statistics.

> **No fake live data:** until a sports API key is saved in Admin → Settings, all fixtures and scores are clearly labelled **DEMO**. Quvanta never presents invented scores as live. Adding a key switches the same pages to live data — see [API directory](#api-directory--api-kaha-milega-free--paid).

## Real-money wallet — deposit and withdraw

- **Currencies:** USD balance and USDT balance. New accounts start at **0.00** — there is no starting balance and no bonus.
- **Deposit (manual UPI + USDT):** the player pays the platform UPI ID or USDT (TRC20) address shown in the Wallet (both are set by the admin in Admin → Settings), then submits the amount with the **UTR number (UPI)** or **transaction hash (USDT)** and a screenshot reference. The request waits in the admin approval queue. The balance is credited **only when an admin approves** after verifying the UTR / tx-hash. Rejections carry a reason the player can see.
- **Withdraw:** the player enters the amount and their UPI ID or USDT address. **KYC must be verified first.** The balance is debited **only on admin approval**, when the operator pays out. Rejections carry a reason.
- **Ledger:** every deposit, bet, win, referral credit, adjustment and withdraw is written to the wallet ledger; the balance can never go negative, and withdrawals are allowed only from settled balance.
- **Limits:** players can set daily deposit and loss limits in the Wallet (responsible gaming).

Standard payment gateways generally do not accept gambling merchants, which is why the launch flow is manual UPI + USDT with admin approval. An automatic high-risk card / crypto gateway can be added later under the operator's own merchant account and licence.

## Refer & Earn — Rs 10 per referral

- Every user gets a **unique referral code and referral link**, shown in the Wallet and Profile.
- When a new user signs up using that code or link, the referrer is credited **Rs 10 real money**, shown as **10.00** in the wallet balance.
- The referrer sees a referral history in the Wallet; the admin dashboard shows total referrals and total referral payouts.
- **Bonus policy:** there is no other bonus anywhere in the product — no signup bonus, no daily bonus, no promo bonus. Do not re-enable one from older builds or screenshots.

## Admin panel

Open `#/admin` and sign in with an admin account. The admin dashboard covers:

- Totals: registered users, active users, total games, GGR, deposits, withdrawals, referral payouts
- Deposit / withdraw approval queue (verify UTR / tx-hash before approving)
- Game management: add, edit, remove, enable / disable games, manage categories and thumbnails
- Sports, tournaments and match-data management; banners and promotions management
- User accounts: view, adjust balance (with ledger entry), verify KYC, suspend accounts
- Responsible-gaming settings, API configuration, website settings (brand name, support email, promo banner, geo-block list, UPI ID, USDT address)
- Admin activity / audit logging through the ledger and settings history
- **White-label tenants (Super Admin):** create a tenant with name, domain, currency, commission % and model (one-time sale or monthly rent) for resale

## Selling models — dono tareeke

| Model | How it works |
|---|---|
| One-time script sale | Sell the full code package with this README and setup support; the buyer hosts it on their own server and uses their own API keys, UPI ID, USDT address and licence |
| Monthly white-label rent | Create a tenant in Admin → Tenants, set the rent and commission %, and give the client their own branded site, admin, users and wallet |

Suggested rent discussed for this project is $500–$2,000 per month per client plus a revenue share — the final price is set by the owner. A buyer or tenant never receives the owner's API keys, payment addresses or licence; each operator configures their own.

## Technology stack

**This hosted build (what is running today):**

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Tailwind CSS 4 |
| Backend | TypeScript server actions (Bun runtime) |
| Database | SQLite with Drizzle ORM |
| Auth | Salted password hashing, server-side session tokens, role-based access (player / admin) |
| Fairness | Server-side settlement with a provably-fair hash per round |

**Standalone production stack (code-sale version — same features, mapped 1:1):**

| Layer | Technology |
|---|---|
| Frontend | Next.js + React + TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js secure REST APIs |
| Database | PostgreSQL with Prisma ORM |
| Auth | Secure session management, role-based access control (admin and user roles) |

The hosted build is served as a single-page application, which is why its routes are hash routes (`#/admin`, `#/wallet`, and so on). The standalone version serves the same pages on literal paths (`/admin`, `/wallet`). The hosted artifact itself is **not** directly exportable to GitHub as code; the script-sale package is the standalone build produced from this same specification.

## Database structure

Hosted build tables (Drizzle / SQLite; the standalone build uses the same names in PostgreSQL / Prisma):

| Table | Holds |
|---|---|
| `users` | Accounts: name, email, password hash, date of birth, role, KYC status, USD / USDT balances, referral code |
| `sessions` | Server-side login session tokens |
| `wallet` | Wallet state per user |
| `ledger` | Audit entry for every deposit, bet, win, referral, adjustment and withdraw |
| `bets` | Casino game rounds with provably-fair hashes |
| `sports_bets` | Sportsbook bets and settlement |
| `requests` | Deposit and withdraw requests in the admin approval queue |
| `games_config` | The 232-game catalogue: slug, category, description, thumbnail, enabled state, provider mapping |
| `fixtures` | Sports fixtures for sportsbook, IPL and World Cup pages |
| `settings` | Site settings and API keys: `cricapi_key`, `odds_api_key`, `upi_id`, `usdt_address`, `brand_name`, `support_email`, `geo_block`, `promo_banner`, `tournament_note` |
| `tenants` | White-label clients: name, domain, currency, commission, monthly rent, model, brand colour, status |

The full platform specification also defines `Admins`, `GameCategories`, `GameProviders`, `Sports`, `Teams`, `Tournaments`, `Matches`, `Players`, `MatchStatistics`, `VirtualWallets` / `VirtualTransactions` (superseded by the real-money `wallet` / `ledger`), `Favorites`, `Notifications`, `Promotions` and `AuditLogs` — favourites, history and audit data are stored on the tables above in the hosted build and split into their own tables in the standalone schema.

## Installation and setup

### Prerequisites

- Node.js 20+ (or Bun 1.3+ for the hosted-build toolchain)
- PostgreSQL 15+ for the standalone build (the hosted build uses its bundled SQLite database — no database setup needed)
- A domain name with DNS access, and a server / VPS for deployment
- Your own accounts and API keys from the [API directory](#api-directory--api-kaha-milega-free--paid) — keys are always created on the operator's own account; nobody else can buy them for you

### Run the hosted build locally

```bash
# 1. Unzip / clone the project and enter the folder
cd quvanta

# 2. Install dependencies
bun install        # or: npm install

# 3. Build the client and server
bun run build      # or: npm run build

# 4. Start the app, then open it in the browser
bun run start      # use the start command supplied with your package
```

Then open the player site at `#/` and the admin panel at `#/admin` using the demo accounts in [Quick access](#quick-access--urls-and-demo-accounts). On first run the database seeds the demo admin, the demo player, the 232-game catalogue, the default settings and DEMO-labelled sports fixtures automatically.

### Standalone (Next.js + PostgreSQL) setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template and fill in your own values (see below)
cp .env.example .env

# 3. Create the database schema and seed demo data
npx prisma migrate deploy
npx prisma db seed

# 4. Build and start
npm run build
npm run start
```

### Configuration — environment variables and admin settings

The hosted build stores runtime configuration in **Admin → Settings** (database `settings` table). The standalone build reads the same values from `.env`. Never put a real key, password or payment address in chat, in the README, or in committed code.

| Setting / variable | What it is | Where to get it |
|---|---|---|
| `cricapi_key` / `CRICAPI_KEY` | Cricket scores API key | CricketData.org — see API directory |
| `odds_api_key` / `ODDS_API_KEY` | Live odds API key | The Odds API — see API directory |
| `upi_id` / `UPI_ID` | Platform UPI ID players pay deposits to | Your own UPI account |
| `usdt_address` / `USDT_ADDRESS` | Platform USDT (TRC20) deposit / payout address | Your own crypto wallet |
| `brand_name` | Site brand name | Default: Quvanta |
| `support_email` | Support email shown on the site | Your own mailbox |
| `geo_block` | Blocked jurisdictions list | Default: `US, UK, AU` — confirm with your licence |
| `promo_banner` | Announcement banner text | Set in Admin → Settings |
| `DATABASE_URL` | PostgreSQL connection string (standalone only) | Your database host |
| Session / JWT secret | Signs login sessions (standalone only) | Generate a long random value; never reuse the demo value |

After saving API keys in Admin → Settings, reload the Sportsbook / IPL pages: DEMO badges disappear only when a valid key is present and returning data. If a key is wrong or the quota is over, the pages show an API error / loading state instead of inventing scores.

## API directory — API kaha milega (free + paid)

Prices below were checked on **2026-11-20** — always re-check the price on the provider's own site before paying. Every key is created on **your own account** on the provider's site, then pasted into **Admin → Settings** (hosted build) or `.env` (standalone build). Never share a key in chat.

### 1. IPL / cricket live scores API

These APIs give fixtures, live scores and player / team statistics for the IPL dashboard and sportsbook. They do **not** give betting odds and they do **not** place bets.

| Provider | Free plan | Paid plan (from) | Signup |
|---|---|---|---|
| CricketData.org (CricAPI) | Lifetime free, 100 hits/day, a few minutes behind live; commercial use needs a paid plan | $5.99/month (2,000 hits/day) | Link below |
| Entity Sport | Free, 1,000 requests/day, cricket only | $29/month Starter (50,000 requests/month) | Review / pricing page below — sign up from the provider link on that page |
| API Cricket | 14-day free trial | $20/month Starter (8,000 requests/day) | Link below |
| Roanuz Cricket API | Pay-as-you-go / limited Essential entry | €176/month billed annually (Essential, 14 APIs) | Link below |

Signup links:

- CricketData.org (CricAPI): https://cricketdata.org — this is the recommended starting point: free tier first, cheapest paid upgrade. Note: the old `cricapi.com` domain is the legacy site; the current site is CricketData.org.
- Entity Sport (review / pricing page): https://www.apisports.net/providers/entity-sport
- API Cricket: https://www.api-cricket.com/
- Roanuz Cricket API: https://sports.dev.roanuz.com/

**How to connect it:** sign up → copy your API key → Admin → Settings → `cricapi_key` → Save → reload `#/ipl`. The IPL schedule, scores, points table and caps leaderboards then come from the API instead of DEMO fixtures.

### 2. Live betting odds API

This API returns odds only. It does not place or settle bets — settlement stays in Quvanta's own wallet and admin flow.

| Provider | Free plan | Paid plan (from) | Signup |
|---|---|---|---|
| The Odds API | Free, 500 credits/month | ~$25–30/month (20,000 credits/month) | Link below |

- The Odds API: https://the-odds-api.com — covers 70+ sports and 40+ bookmakers, live and pre-match odds, including cricket.

> **Warning — similar names, different companies:** `odds-api.io` and `odds-api.net` are separate services with different pricing. Use exactly **the-odds-api.com** for The Odds API. Sportradar and Betfair are enterprise / sales-only odds sources with no self-serve signup; contact their sales teams directly if the platform reaches that scale.

**How to connect it:** sign up → copy your API key → Admin → Settings → `odds_api_key` → Save → reload `#/sports`.

### 3. 200+ games provider API (Phase 2 — B2B, no free tier)

The 10 in-house games need no API. The full third-party catalogue (slots, live casino, crash titles from major studios) comes from a **game aggregator** through one integration. There is no free tier: account, setup fee and monthly / revenue-share terms are negotiated, and a gaming licence is normally required before a provider account is issued.

| Provider | What it gives | Signup |
|---|---|---|
| Slotegrator — APIgrator | One integration, 30,000+ certified games from 180+ providers (slots, live casino, poker, crash), plus sportsbook options | Link below |

- Slotegrator — how working with APIgrator works: https://slotegrator.pro/analytical_articles/working-with-slotegrator-how-we-help-you-grow/

Other aggregators and studios named for this phase — SoftSwiss, BetConstruct, Pragmatic Play, Evolution and Spribe — are also sales-only: contact their sales teams directly for a quote; do not trust a guessed signup URL. **Order of work:** licence first → aggregator contract → provider credentials in Admin → Settings / `.env` → catalogue sync maps each provider game to its listing, thumbnail and launch URL → demo mode per provider for testing before real-money launch.

### 4. Football and other-sports data

The dedicated World Cup and league sections reuse the same two connections above wherever the provider covers the sport: The Odds API covers football and 70+ other sports for odds, and Entity Sport / Roanuz cover multiple sports for scores and fixtures. If you need deeper football-only data (line-ups, xG, historical archives), buy a dedicated football data plan from the same class of provider on your own account and add its key the same way — do not display any score as "live" unless it comes from a connected, authorised API.

### 5. Payments, KYC and email — no API key needed to launch

| Need | Launch solution in Quvanta | When to buy an API |
|---|---|---|
| Deposits / withdrawals | Manual UPI + USDT with UTR / tx-hash and admin approval — no gateway account needed | Add a high-risk card / crypto gateway later, on your own merchant account, after licensing |
| KYC / age check | 18+ date-of-birth check at signup + admin KYC verification before the first withdraw | Add a document-verification provider later if your licence requires automated KYC |
| Email (verification, password reset, support) | Set `support_email` in Admin → Settings; use your own mailbox / SMTP credentials in the standalone `.env` | Any SMTP provider on your own account works |
| Hosting, domain, SSL | See [Deployment](#deployment) | Domain and server are bought by the operator |

### API summary — kaunsi API, kahan se, kitne me

| Purpose | First choice | Free? | Paid from |
|---|---|---|---|
| IPL / cricket scores | CricketData.org (CricAPI) | Yes — 100 hits/day | $5.99/month |
| Cricket scores (more quota) | Entity Sport | Yes — 1,000 req/day | $29/month |
| Cricket scores + standings | API Cricket | 14-day trial | $20/month |
| Cricket scores (pro, ball-by-ball) | Roanuz | Limited entry | €176/month |
| Live odds (all sports) | The Odds API | Yes — 500 credits/month | ~$25–30/month |
| 200+ third-party games | Slotegrator APIgrator | No — B2B quote only | Contract + licence required |
| Payments | Manual UPI + USDT (built in) | No API needed | Gateway later, own account |

## Deployment

### Option A — VPS (recommended for real-money operation)

1. Buy a VPS / dedicated server and a domain from a registrar of your choice. Point the domain's DNS `A` record to the server IP. (The Quvanta brand name was checked against existing casino websites when chosen; domain availability for `quvanta.com` / `quvanta.bet` must still be confirmed at the registrar before purchase.)
2. Install Node.js 20+ (or Bun), PostgreSQL (standalone build), a process manager such as PM2, and Nginx.
3. Upload / clone the code, install dependencies, set `.env` (standalone) as in [Configuration](#configuration--environment-variables-and-admin-settings), run migrations and seed, then build:

```bash
npm install
npx prisma migrate deploy && npx prisma db seed
npm run build
pm2 start npm --name quvanta -- start
pm2 save
```

4. Configure Nginx as a reverse proxy to the app port, then enable free SSL with Let's Encrypt (Certbot) and force HTTPS.
5. Put the site behind Cloudflare for CDN caching and DDoS protection — this, plus the lightweight in-house game engines, is what keeps pages and games loading without buffering.
6. Open `#/admin`, change the demo admin password, set your real UPI ID and USDT address, paste your API keys, and set the geo-block list.

### Option B — Managed hosting (demo / staging)

The hosted build can be shared as a live link for demos and buyer previews. Do not take real player funds on a demo deployment: real-money operation belongs on your own server, under your own licence, with the checklist below completed.

### Post-deployment checklist

- [ ] Demo admin and player passwords changed; demo accounts removed before public launch
- [ ] Real UPI ID and USDT (TRC20) address set in Admin → Settings, and a test deposit approved end-to-end
- [ ] Test withdraw completed with KYC verified
- [ ] CricAPI key saved — IPL page shows live data, no DEMO badge
- [ ] Odds API key saved — sportsbook odds load
- [ ] Geo-block list matches your licence; 18+ and responsible-gaming pages live
- [ ] SSL active, Cloudflare enabled, database backups scheduled
- [ ] Licence, KYC process and payment compliance in place **before** accepting real funds

## Security

- Salted password hashing — plain passwords are never stored; login attempts are rate-limited
- Server-side session tokens; API keys are stored server-side only, masked in responses, and never shown back in the admin UI or sent to logged-out visitors
- Role-based permissions: admin actions require an admin session; players are blocked from `#/admin`
- Input validation on every action, parameterised database queries (SQL-injection safe), XSS-safe rendering, CSRF protection on state-changing requests in the standalone build
- Wallet integrity: balance never goes negative, every movement is a ledger entry, deposits and withdrawals move money only on admin approval
- Audit logging of admin actions, balance adjustments and settings changes

## Responsible gaming and legal — read before launch

- **18+ only.** Date of birth is checked at signup and KYC is verified before withdrawals.
- Built-in safeguards: daily deposit limits, loss limits, session controls, and admin suspension / self-exclusion.
- **Licence required:** real-money operation requires a valid gaming licence (for example Curaçao / Anjouan, roughly $15k–25k per year at the operator's cost), full KYC verification and payment compliance for the target jurisdictions. Until then, keep the platform in demo / preview use and do not accept real player funds.
- Real-money gambling is illegal in most Indian states, and restricted jurisdictions such as the USA, UK and Australia must be geo-blocked (Admin → Settings → `geo_block`). The operator — not the software — is responsible for complying with the law in every market they serve.
- Only integrate authorised, licensed game providers and official / licensed sports data APIs.

## What is still remaining — jo reh gaya hai

| Item | Status | Owner |
|---|---|---|
| Live sports data | DEMO fixtures until keys are added | Operator buys CricAPI + Odds API keys (free tiers available) and pastes them in Admin → Settings |
| 200+ third-party games | 232 listings ready; 10 in-house games playable | Aggregator contract (Slotegrator) + licence unlock provider launches |
| Real UPI ID / USDT address | Demo placeholders in settings | Operator sets real values in Admin → Settings |
| Domain | Not purchased; availability not yet verified | Operator confirms and buys the domain |
| Gaming licence | Not obtained | Operator (Curaçao / Anjouan, ~$15k–25k/year) |
| Standalone GitHub code package | Hosted build is not directly exportable | Standalone Next.js + PostgreSQL package is produced from this specification for script sale |
| Real screenshots in this README | Four named frames supplied in `screenshots/` | Capture each live page and save over the matching file |

## FAQ

**Admin page kahan hai?** Open the site and add `#/admin` at the end of the URL, then sign in with an admin account. Players cannot open it.

**API key kahan daalna hai?** Admin → Settings. `cricapi_key` for scores, `odds_api_key` for odds. Keys are never shown back after saving.

**Sports page pe DEMO kyun likha hai?** No valid API key is saved yet. Quvanta never fakes live scores — add a key and the same pages go live.

**Deposit approve hone pe hi balance kyun badhta hai?** By design: the player pays by UPI / USDT and submits the UTR / tx-hash; an admin verifies it and approves. The same approval flow protects withdrawals.

**Referral ka Rs 10 kab milta hai?** Instantly, when a new user completes signup with your referral code or link. It appears as 10.00 in the wallet with a ledger entry and a referral-history record.

**Bonus kyun nahi hai?** Removed by design in the final real-money version — no signup, daily or promo bonus exists anywhere in the product.

## Support

Set your own support email in Admin → Settings (`support_email`) before selling or launching — buyers and players should always reach the operator of their own site, not the original developer.
