"use client";

import { useEffect, useState } from "react";
import { api, credits, loadState, referralLink, type AppState } from "@/lib/client";

export function WalletPage() {
  const [d, setD] = useState<AppState | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [depMethod, setDepMethod] = useState<"UPI" | "USDT">("UPI");
  const [depAmount, setDepAmount] = useState("");
  const [depRef, setDepRef] = useState("");
  const [depShot, setDepShot] = useState("");
  const [wdMethod, setWdMethod] = useState<"UPI" | "USDT">("UPI");
  const [wdAmount, setWdAmount] = useState("");
  const [wdDest, setWdDest] = useState("");
  const [depLimit, setDepLimit] = useState("");
  const [lossLimit, setLossLimit] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadState()
      .then((s) => {
        setD(s);
        setDepLimit(String(s.user?.depositLimit ?? 0));
        setLossLimit(String(s.user?.lossLimit ?? 0));
      })
      .catch((e) => setErr(e.message));
  }, []);

  async function refresh() {
    setD(await loadState());
  }

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/deposit", {
        method: depMethod,
        amount: Number(depAmount),
        ref: depRef,
        screenshotRef: depShot,
      });
      setNote("Deposit request submitted. Your balance credits only after admin approval.");
      setDepAmount("");
      setDepRef("");
      setDepShot("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Deposit failed");
    }
  }

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/withdraw", {
        method: wdMethod,
        amount: Number(wdAmount),
        destination: wdDest,
      });
      setNote("Withdraw request submitted. Balance debits only on admin approval.");
      setWdAmount("");
      setWdDest("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Withdraw failed");
    }
  }

  async function saveLimits(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    try {
      await api("/api/limits", {
        depositLimit: Number(depLimit) || 0,
        lossLimit: Number(lossLimit) || 0,
      });
      setNote("Limits saved.");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save limits");
    }
  }

  if (!d) return <p className="mt-10 text-center text-[var(--dim)]">Loading wallet...</p>;
  const user = d.user;
  if (!user) return <p className="mt-10 text-center">Please log in.</p>;

  return (
    <div className="mt-4 space-y-6">
      <section className="glass p-5">
        <h1 className="font-serif text-3xl">Wallet — Real Money</h1>
        <p className="mt-1 text-sm text-[var(--dim)]">
          New accounts start at $0.00. There are no bonuses of any kind — no signup, daily or
          promo bonus anywhere in Quvanta.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-black/40 p-4">
            <p className="text-xs tracking-widest text-[var(--dim)]">TOTAL BALANCE</p>
            <p className="font-serif text-3xl gold-text">{credits(user.balance)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-black/40 p-4">
            <p className="text-xs tracking-widest text-[var(--dim)]">USD</p>
            <p className="font-serif text-2xl">{credits(user.balanceUsd)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-black/40 p-4">
            <p className="text-xs tracking-widest text-[var(--dim)]">USDT</p>
            <p className="font-serif text-2xl">{credits(user.balanceUsdt)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--dim)]">KYC status: {user.kycStatus}</p>
      </section>

      {err && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {err}
        </p>
      )}
      {note && (
        <p className="text-sm text-[var(--good)]" role="status">
          {note}
        </p>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <form onSubmit={deposit} className="glass p-5">
          <h2 className="font-serif text-2xl">Deposit</h2>
          <p className="mt-1 text-sm text-[var(--dim)]">
            Pay the platform address below, then submit the amount with your UTR / tx-hash. The
            balance credits only after admin approval.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              UPI ID: <strong className="gold-text">{d.settings["upi_id"] || "—"}</strong>
            </p>
            <p className="break-all">
              USDT (TRC20):{" "}
              <strong className="gold-text">{d.settings["usdt_address"] || "—"}</strong>
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              Method
              <select
                value={depMethod}
                onChange={(e) => setDepMethod(e.target.value as "UPI" | "USDT")}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
              >
                <option value="UPI">UPI</option>
                <option value="USDT">USDT</option>
              </select>
            </label>
            <label className="block text-sm">
              Amount
              <input
                required
                type="number"
                min="1"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="e.g. 100"
              />
            </label>
            <label className="block text-sm">
              UTR number (UPI) / transaction hash (USDT)
              <input
                required
                value={depRef}
                onChange={(e) => setDepRef(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="UTR / tx-hash"
              />
            </label>
            <label className="block text-sm">
              Screenshot reference (optional)
              <input
                value={depShot}
                onChange={(e) => setDepShot(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="e.g. payment screenshot filename"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-black"
            >
              Submit deposit request
            </button>
          </div>
        </form>

        <form onSubmit={withdraw} className="glass p-5">
          <h2 className="font-serif text-2xl">Withdraw</h2>
          <p className="mt-1 text-sm text-[var(--dim)]">
            KYC must be verified first. The balance debits only on admin approval, when the
            operator pays out.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              Method
              <select
                value={wdMethod}
                onChange={(e) => setWdMethod(e.target.value as "UPI" | "USDT")}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
              >
                <option value="UPI">UPI</option>
                <option value="USDT">USDT</option>
              </select>
            </label>
            <label className="block text-sm">
              Amount
              <input
                required
                type="number"
                min="1"
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="e.g. 50"
              />
            </label>
            <label className="block text-sm">
              Your UPI ID / USDT address
              <input
                required
                value={wdDest}
                onChange={(e) => setWdDest(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
                placeholder="Where to send your money"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg border border-[var(--accent)] py-2.5 font-semibold"
            >
              Submit withdraw request
            </button>
          </div>
        </form>
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Refer &amp; Earn — Rs 10 per referral</h2>
        <p className="mt-1 text-sm text-[var(--dim)]">
          Your referral code: <strong className="gold-text">{user.referralCode}</strong> — every
          signup with it credits Rs 10 real money to your wallet (added as 10.00 to your
          balance). Earned so far: <strong className="gold-text">Rs {d.referralEarned}</strong> (
          {d.referrals.length} referrals).
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
        {d.referrals.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {d.referrals.map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <span>
                  {r.name} ({r.email})
                </span>
                <span className="text-[var(--good)]">+Rs 10</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Responsible Gaming Limits</h2>
        <form onSubmit={saveLimits} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            Daily deposit limit (USD, 0 = no limit)
            <input
              type="number"
              min="0"
              value={depLimit}
              onChange={(e) => setDepLimit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Daily loss limit (USD, 0 = no limit)
            <input
              type="number"
              min="0"
              value={lossLimit}
              onChange={(e) => setLossLimit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/50 px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg border border-[var(--accent)] py-2.5 text-sm"
            >
              Save limits
            </button>
          </div>
        </form>
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Requests</h2>
        {d.requests.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--dim)]">No deposit or withdraw requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {d.requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {r.kind} via {r.method} — {r.amount} {r.currency}
                  {r.ref ? ` — ${r.ref}` : ""}
                  {r.status === "rejected" && r.rejectReason ? ` — ${r.rejectReason}` : ""}
                </span>
                <span
                  className={
                    r.status === "approved"
                      ? "text-[var(--good)]"
                      : r.status === "rejected"
                        ? "text-[var(--danger)]"
                        : "text-[var(--accent2)]"
                  }
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-5">
        <h2 className="font-serif text-2xl">Ledger</h2>
        {d.ledger.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--dim)]">No transactions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {d.ledger.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {l.type} — {l.note}
                </span>
                <span className={l.amount >= 0 ? "text-[var(--good)]" : "text-[var(--danger)]"}>
                  {l.amount >= 0 ? "+" : ""}
                  {l.amount.toFixed(2)} {l.currency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
