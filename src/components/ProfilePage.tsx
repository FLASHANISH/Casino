"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, credits, loadState, referralLink, type AppState } from "@/lib/client";

export function ProfilePage() {
  const router = useRouter();
  const [d, setD] = useState<AppState | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadState().then(setD).catch((e) => setErr(e.message));
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/auth/verify", { code });
      setNote("Email verified. KYC is now verified — withdraw is unlocked.");
      setD(await loadState());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed");
    }
  }

  async function logout() {
    await api("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading profile...</p>;
  const user = d.user;
  if (!user) return <p className="mt-10 text-center">Please log in.</p>;

  return (
    <div className="mt-4 space-y-6">
      <section className="glass p-5">
        <h1 className="font-serif text-3xl">{user.name}</h1>
        <p className="mt-1 text-sm text-[var(--dim)]">
          {user.email} · {user.role} · Balance {credits(user.balance)}
        </p>
        <p className="mt-1 text-sm text-[var(--dim)]">KYC status: {user.kycStatus}</p>
        <p className="mt-1 text-sm text-[var(--dim)]">
          Referral code: <strong className="gold-text">{user.referralCode}</strong>
        </p>
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={referralLink(user.referralCode)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2 text-sm"
            aria-label="Your referral link"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(referralLink(user.referralCode));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        {user.kycStatus.includes("pending") && (
          <form onSubmit={verify} className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--dim)]">
              Complete KYC by entering the verification code issued at signup.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Verification code"
                className="flex-1 rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black"
              >
                Verify
              </button>
            </div>
          </form>
        )}
        {err && (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {err}
          </p>
        )}
        {note && (
          <p className="mt-3 text-sm text-[var(--good)]" role="status">
            {note}
          </p>
        )}
        <button
          type="button"
          onClick={logout}
          className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
        >
          Log out
        </button>
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Your Recent Rounds</h2>
        {d.bets.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--dim)]">No rounds played yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {d.bets.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <strong>{b.game}</strong>{" "}
                  <span className="text-[var(--dim)]">- {b.detail}</span>
                </span>
                <span className={b.profit >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>
                  {b.profit >= 0 ? "+" : ""}
                  {b.profit.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Sports Bets</h2>
        {d.sportsBets.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--dim)]">No sports bets yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {d.sportsBets.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {s.fixtureLabel} — {s.pick} @ {s.odds}
                </span>
                <span>
                  Stake {s.stake} · Potential {s.potential} · {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
