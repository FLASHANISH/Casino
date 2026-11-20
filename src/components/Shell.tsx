"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api, type AppState } from "@/lib/client";
import { formatMoney } from "@/lib/countries";

const NAV: [string, string][] = [
  ["/lobby", "Lobby"],
  ["/sports", "Sportsbook"],
  ["/ipl", "IPL"],
  ["/worldcup", "World Cups"],
  ["/wallet", "Wallet"],
  ["/profile", "Profile"],
];

export function Shell({
  state,
  children,
}: {
  state: AppState | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const user = state?.user ?? null;

  async function logout() {
    await api("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  return (
    <div className="felt min-h-screen text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[#07070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <Link href="/lobby" className="text-left">
            <span className="font-serif text-xl tracking-[0.18em] gold-text sm:text-2xl">
              QUVANTA
            </span>
            <span className="block text-[10px] tracking-[0.3em] text-[var(--dim)]">
              PREMIUM CASINO &amp; SPORTS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
                aria-label="Notifications"
                aria-expanded={showNotifs}
              >
                🔔
              </button>
              {showNotifs && (
                <div className="glass absolute right-0 top-11 w-72 p-3 text-sm shadow-2xl" role="status">
                  <p className="font-semibold gold-text">Notifications</p>
                  <p className="mt-2">{state?.settings["promo_banner"] || "Welcome to Quvanta."}</p>
                  <p className="mt-2 text-[var(--dim)]">{state?.settings["tournament_note"] || ""}</p>
                  <p className="mt-2 text-[var(--dim)]">
                    {user
                      ? `Refer & Earn: share your code ${user.referralCode} - you get ${formatMoney(10, user.currency)} real money (credited as 10.00 in your wallet balance) for every signup. See Wallet.`
                      : "Log in to deposit real money via UPI or USDT."}
                  </p>
                </div>
              )}
            </div>
            {user && (
              <>
                <Link
                  href="/wallet"
                  className="rounded-full border border-[var(--accent)] px-3 py-1.5 text-left"
                >
                  <span className="block text-[9px] tracking-widest text-[var(--dim)]">
                    REAL BALANCE - REAL MONEY
                  </span>
                  <span className="block font-serif leading-none gold-text">
                    {formatMoney(user.balance, user.currency)}
                  </span>
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black"
                >
                  {user.name.split(" ")[0]}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Main sections">
          {NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
                pathname === href
                  ? "bg-[var(--accent)] font-semibold text-black"
                  : "border border-[var(--border)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-relaxed text-[var(--dim)]">
        <div className="border-t border-[var(--border)] pt-5">
          <p>
            18+ only. Quvanta is a <strong className="text-[var(--text)]">real-money</strong>{" "}
            platform: deposits via UPI / USDT and withdrawals are approved manually after
            verification, and KYC is required before withdraw. Real-money play is in demo
            mode until the operator adds a valid gaming licence, KYC and payment
            compliance. Play responsibly.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["faq", "terms", "privacy", "responsible"] as const).map((p) => (
              <Link
                key={p}
                href={`/info/${p}`}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 capitalize"
              >
                {p === "responsible" ? "Responsible Gaming" : p}
              </Link>
            ))}
          </div>
          <p className="mt-3">
            Sports data:{" "}
            {state?.hasLiveKeys
              ? "API keys connected - live mode"
              : "DEMO fixtures (labelled) until API keys are connected"}
            . Support: {state?.settings["support_email"] || "support email will appear here once set"}.
          </p>
        </div>
      </footer>
    </div>
  );
}
