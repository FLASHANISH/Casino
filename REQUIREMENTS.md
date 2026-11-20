# Gambling Game Website — Requirements & Build Spec

Taiyaar: 2026-11-20 (Fri) ~15:30 IST. Anish ne aaj 15:09–15:16 IST side chat "Requirements for gambling game website" mein poocha — pehle "200+ games, full working, kya kya lagega", phir "Real money wala chahiye", phir "all world ke liye banana hai aur sell v krna hai", phir "Dono karna hai" (ek baar script bechna + monthly rent pe white-label dena, dono).

**Status sach: abhi koi code nahi bana hai.** Main chat mein "kaam start kar diya hai, ban te hi bhej dunga" bola gaya tha, par workspace mein is project ki koi file, folder ya tracking item nahi hai. Ye spec wahi gap bharne ke liye hai — isse build shuru ho sakta hai, bina baar-baar wahi sawaal pooche.

## Anish ke decisions (locked)

| Decision | Answer |
|---|---|
| Money type | Real money (demo coins nahi) |
| Scope | All world (sirf India nahi) |
| Games | 200+ games (Phase 1 mein 10 apne games, Phase 2 mein provider se 200+) |
| Sell model | Dono — (a) script ek baar bechna, (b) monthly rent pe white-label dena |
| Base language | English (+ multi-language baad mein) |
| Base currency | USD + USDT crypto (global); India ke liye manual UPI starting mein |

## Phase 1 — Global MVP (pehle banna hai)

- Login/signup, KYC / age verification (18+), wallet (USD + USDT)
- Deposit/withdraw: manual UPI (India start) + USDT crypto (global). Normal Razorpay/Paytm gambling allow nahi karte — isliye manual UPI: user UPI pe pay kare, UTR/screenshot de, admin approve kare, balance add ho. Withdraw bhi admin se.
- Admin panel: users, deposits, withdrawals, games on/off, profit/loss, bonus settings
- Super Admin panel (Phase 3 ki neev yahin se): naye client ki site banao — naam, logo, colour, domain, games on/off, commission set karo. Client ka alag admin, alag users, alag wallet.
- 10 apne games (real-money logic ke saath): Crash/Aviator-style, Mines, Dice, Slots, Teen Patti, Andar Bahar, Roulette, Dragon Tiger — ye 8 naam assistant ne diye the; **2 aur Anish ko chunne hain** (options: Baccarat, Blackjack, Hi-Lo, Plinko, Wheel, Andar Bahar variant).
- Stack: Frontend React/Next.js, Backend Node.js, Database Postgres/MySQL, live games ke liye WebSockets. Hosting: VPS/dedicated + Cloudflare + DDoS protection + SSL (~$100–500/month, assistant ke estimate se).

## Phase 2 — 200+ games + license (MVP ke baad)

- Aggregator API se 200+ slots + live casino: Slotegrator / SoftSwiss / BetConstruct, ya direct Pragmatic Play / Evolution / Spribe. Inka account, setup fee aur monthly/revenue share lagta hai — **ye kharcha Anish ko dena padega, assistant uske naam pe khareed nahi sakta.**
- License: Curacao / Anjouan, approx $15k–25k/year + offshore company. **Bina license ke bada provider account nahi deta** — ye Phase 2 ka sabse bada blocker hai.
- Auto payment: high-risk card gateway + crypto; UPI sirf India manual flow tak.

## Phase 3 — White-label selling (dono models)

- (a) One-time script sale: poora code + setup guide ek baar becho.
- (b) Monthly rent: $500–2000/month per client + revenue share (assistant ka estimate — **final price Anish ko fix karna hai**).
- Multi-tenant design zaroori: ek hi code se 100 alag sites — tenant isolation (har client ke users/wallet/games alag), per-tenant branding, domain, commission.

## Legal / risk — seedhi baat (assistant ne chat mein bhi bola tha)

- India mein real-money gambling most states mein illegal hai; global license (Curacao/Anjouan) se 100+ countries cover hote hain, lekin **USA, UK, Australia jaise countries ko block karna padega**.
- KYC/age verification har country ke liye compulsory.
- **Real-money launch license + KYC + payment compliance ke bina nahi karna** — pehle demo-coins mode mein test karo, phir licensed real-money mode.
- Is spec mein payment ban ya geo-block se bachne ka koi tareeka nahi diya gaya hai.

## Wallet / fairness — build mein ye na chhoote

- Wallet ledger: har deposit/bet/win/withdraw ek audit entry; balance kabhi negative nahi; withdraw sirf settled balance se.
- RNG: har game ka result server-side, seed-based, provably-fair hash dikhao (Crash/Mines/Dice ke liye zaroori).
- Limits: deposit limit, loss limit, self-exclusion, session timeout — bina inke real-money site adhuri hai.
- Admin approval queue: UPI deposit (UTR/screenshot check) aur har withdraw request.

## Anish se chahiye — 6 cheezein, inke bina build atakega

1. **Brand naam + domain** — Decided 2026-11-20: **Quvanta** (search me is naam ki koi casino website nahi mili; domain khareedna baaki hai)
2. **Starter 10 games ki final list** — Decided 2026-11-20: 8 + **Blackjack + Plinko** (Anish ne apne hisab se rakhne ko bola tha)
3. **Sell pricing** — script ek baar kitne mein? Rent monthly kitna + revenue share kitna %?
4. **UPI ID aur USDT wallet address** — ye chat mein mat bhejo; jab build setup hoga tab `.env` mein daalenge. Abhi sirf ye bata do ki UPI + USDT (kaunsa network — TRC20?) dono rahenge ya sirf ek.
5. **License budget/timeline** — Curacao/Anjouan ($15k–25k/year) Phase 2 mein lena hai ya pehle MVP bina license ke demo mode mein chalana hai?
6. **Blocked countries ki list confirm karo** — USA, UK, Australia ke alawa aur koi?

## Rough cost/time (assistant ke chat estimates)

- Domain + hosting: $20–50/month; server: $100–500/month.
- Site banana (assistant ki taraf se): free; provider + license ka kharcha alag se Anish ka.
- Aggregator wali ready-made site: 2–4 hafte, $5k–10k setup + monthly. Fully custom: 3–6 mahine, $15k+.
- Phase 1 MVP ka realistic order: spec (ye file) → brand/domain → wallet + 10 games → admin + super admin → demo-mode test → Phase 2 (provider/license).

## Sources (chat)

- Side chat "Requirements for gambling game website", 2026-11-20 09:39:51–09:46:01Z: user ke 4 messages (200+ games; real money; all world + sell; dono) aur assistant ke replies (6 cheezein, manual UPI flow, Phase 1/2/3 plan, cost estimates, legal risk note).
