# Gambling Site — API Links (free + paid), README-ready

Prepared: 2026-11-20. Companion to `~/workspace/gambling-site-requirements.md`.
Anish asked on 2026-11-20 (09:49 UTC, side chat "Requirements for gambling game website"):
"Full code sell krna hai toh readme file mai detail sab batana aur api kaha milega
mere ko link site sab dena free wala aur paisa wala sab."
That reply never landed (the assistant reply was removed, and the later "Royal Vault"
artifact turned out to have no exportable code). This file is the verified answer,
ready to paste into the README. Prices checked 2026-11-20 — re-check on the provider
site before paying anything. API keys are always made on Anish's own account;
nobody else can buy them for him. Keys go in `.env` / Admin settings, never in chat.

## 1. IPL / cricket live scores (for the IPL sportsbook section)

Live scores only — these give fixtures/scores/stats, NOT betting odds and NOT
bet placement. Odds need section 2.

| Provider | What it is | Free tier | Paid from | Link |
|---|---|---|---|---|
| CricketData.org (CricAPI) | Cricket live scores, fixtures, player/team stats, incl. IPL | Lifetime free, 100 hits/day, a few minutes behind live; commercial use needs a paid plan | $5.99/month (2,000 hits/day) | https://cricketdata.org |
| Entity Sport | Cricket + multi-sport data, ball-by-ball, fantasy points, incl. IPL | Free, 1,000 requests/day, cricket only | $29/month (Starter, 50,000/month) | https://www.apisports.net/providers/entity-sport (review/pricing page — sign up from the provider link there) |
| API Cricket (api-cricket.com) | Live score, fixtures, odds data, H2H, standings | 14-day free trial | $20/month Starter (8,000 requests/day) | https://www.api-cricket.com/ |
| Roanuz Cricket API | Live scores, ball-by-ball, fantasy API, webhooks/WebSocket | Pay-as-you-go / Essential from €1/month (limited matches) | €176/month billed annually (Essential, 14 APIs) | https://sports.dev.roanuz.com/ |

Note: the old `cricapi.com` domain is the legacy CricAPI — the current site is
CricketData.org (https://cricketdata.org).

## 2. Live betting odds (for IPL / sportsbook odds + bet slip)

Odds data only — the API returns odds, it does not place or settle bets.
Settlement stays in the site's own wallet/admin flow.

| Provider | What it is | Free tier | Paid from | Link |
|---|---|---|---|---|
| The Odds API | Sports odds from 40+ bookmakers, 70+ sports, live + pre-match, historical odds | Free, 500 credits/month | ~$25–30/month (20,000 credits/month) | https://the-odds-api.com |

Warning — similar names, different companies: `odds-api.io` and `odds-api.net`
are separate odds-API services with their own pricing (from $65/month and
$30/month respectively). Use exactly `the-odds-api.com` for The Odds API.
Sportradar and Betfair were also named in chat as paid odds sources — both are
enterprise/sales-only, no self-serve signup, so no link is listed here; contact
their sales teams directly if the site reaches that stage.

## 3. 200+ casino games (Phase 2 — the aggregator)

No free tier here. All of these are B2B sales/quote-only — account, setup fee and
monthly/revenue-share are negotiated, and a licence is normally required before
a provider account is given (see the spec file, Phase 2).

| Provider | What it is | Link |
|---|---|---|
| Slotegrator — APIgrator | One integration, 30,000+ certified games from 180+ providers (slots, live casino, poker, crash); also Turnkey platform + Sportegrator sportsbook | https://slotegrator.pro/analytical_articles/working-with-slotegrator-how-we-help-you-grow/ |

Also named in the spec (no link verified in this check — contact sales directly,
do not trust a guessed URL): SoftSwiss, BetConstruct, Pragmatic Play, Evolution,
Spribe. Same rule as above: licence + contract first, then integration.

## 4. How this fits the build (README wording)

- Phase 1 MVP runs on demo data for IPL fixtures/odds until a key is added.
  Admin → Settings → API keys: paste the CricAPI / The Odds API key, and live
  scores + odds start flowing. No key = demo data, site still runs.
- Phase 2: Slotegrator (or equivalent aggregator) account + Curacao/Anjouan
  licence (~$15k–25k/year, Anish's cost) are the blockers — the code alone
  does not unlock 200+ games.
- Real-money launch needs licence + KYC + payment compliance first; India:
  real-money gambling is illegal in most states, and USA/UK/Australia must
  be geo-blocked (already in the spec file).

## Sources (checked 2026-11-20)

- CricketData.org pricing/free tier: SportDex provider page + API.market
  "7 Best Cricket APIs in 2026" (free 100 hits/day, paid from $5.99/mo).
- The Odds API free 500 credits + paid tiers: sportsapis.dev review and
  sportsgameodds.com free-sportsbook-APIs guide (https://the-odds-api.com).
- Slotegrator APIgrator 30,000+ games: slotegrator.pro (official site).
- Entity Sport / API Cricket / Roanuz pricing: apisports.net, api-cricket.com,
  sports.dev.roanuz.com.
