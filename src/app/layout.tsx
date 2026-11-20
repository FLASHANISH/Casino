import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quvanta — Premium Casino & Sports",
  description:
    "Quvanta is a premium, dark black-and-gold casino and sports entertainment platform. 232 games, real-money wallet (UPI + USDT), sportsbook, IPL and World Cup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="felt min-h-screen text-[var(--text)]">{children}</body>
    </html>
  );
}
