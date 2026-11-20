const PAGES: Record<string, { title: string; body: string[] }> = {
  faq: {
    title: "Frequently Asked Questions",
    body: [
      "How do I deposit? Pay the UPI ID or USDT address shown in your Wallet, then submit the amount with your UTR / tx-hash. Your balance credits only after admin approval.",
      "Why is my deposit not credited yet? Every deposit is verified manually. Rejections carry a reason you can see in your Wallet.",
      "How do I withdraw? Enter the amount and your UPI ID / USDT address in the Wallet. KYC must be verified first. The balance debits only on admin approval.",
      "Is there a bonus? No. There are no bonuses of any kind — no signup, daily or promo bonus. New accounts start at $0.00.",
      "How does Refer & Earn work? Share your referral code or link. Every signup with it credits Rs 10 real money to your wallet (added as 10.00 to your balance).",
      "Why does the sportsbook say DEMO? No sports API key is connected yet. Quvanta never fakes live scores — add a key and the same pages go live.",
      "Are the games fair? Every round is settled on the server and shows a provably-fair hash.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "You must be 18 years or older to use Quvanta. Your date of birth is checked at signup.",
      "All play is real money. Deposits and withdrawals are manual (UPI / USDT) and approved by the operator after verification.",
      "Bets are final once placed. The operator may suspend accounts for fraud, abuse or breach of these terms.",
      "Real-money operation requires a valid gaming licence in the operator's jurisdiction. Players are responsible for complying with the law where they live.",
      "Winnings are paid only to the verified payment details on the account. KYC verification is required before the first withdraw.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We store your name, email, date of birth and payment references only to run your account, verify your age and process deposits and withdrawals.",
      "Passwords are stored as salted hashes — never in plain text. Session tokens are stored server-side.",
      "We never sell your data. Payment details are used only for the deposit / withdraw flow you request.",
      "Contact the operator (support email in Settings) to request a copy or deletion of your account data.",
    ],
  },
  responsible: {
    title: "Responsible Gaming",
    body: [
      "Gambling should be entertainment, never a way to make money. Only play with money you can afford to lose.",
      "Set daily deposit and loss limits in your Wallet. Limits apply immediately.",
      "Take a break any time — log out and step away. If gambling stops being fun, stop playing.",
      "If you feel you may have a problem, contact support and ask for self-exclusion: your account will be suspended.",
      "18+ only. If you are under 18, do not use this site.",
    ],
  },
};

export function InfoPage({ page }: { page: string }) {
  const p = PAGES[page];
  if (!p) {
    return (
      <div className="mt-10">
        <h1 className="font-serif text-3xl">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--dim)]">This info page does not exist.</p>
      </div>
    );
  }
  return (
    <div className="mt-6 max-w-3xl">
      <h1 className="font-serif text-3xl">{p.title}</h1>
      <div className="glass mt-4 space-y-3 p-5 text-sm leading-relaxed">
        {p.body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
