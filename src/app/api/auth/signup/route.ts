import { z } from "zod";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { ensureSeed } from "@/lib/seed";
import {
  ageFromDob,
  applyDelta,
  createSession,
  hashPassword,
  refCodeFor,
  setPlayerCookie,
} from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(72),
  dob: z.string().min(8).max(10),
  referralCode: z.string().trim().max(20).default(""),
});

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const args = parsed.data;

  const age = ageFromDob(args.dob);
  if (age < 0) return err("Enter a valid date of birth.");
  if (age < 18) return err("You must be 18 or older to register (KYC 18+).");
  if (age > 110) return err("Enter a valid date of birth.");

  const email = args.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return err("An account with this email already exists. Please log in.");

  let referrer: { id: number; balanceUsd: number; balanceUsdt: number } | null = null;
  const referralCodeInput = args.referralCode ?? "";
  if (referralCodeInput) {
    const all = await prisma.user.findMany();
    referrer =
      all.find(
        (x) =>
          (x.referralCode || refCodeFor(x.email, x.id)).toUpperCase() ===
          referralCodeInput.toUpperCase(),
      ) ?? null;
  }

  // New accounts start at $0.00 real money. There are no bonuses of any kind.
  const u = await prisma.user.create({
    data: {
      name: args.name,
      email,
      passwordHash: await hashPassword(args.password),
      role: "player",
      dob: args.dob,
      kycStatus: "pending verification - 18+ confirmed",
      balanceUsd: 0,
      balanceUsdt: 0,
      referredBy: referrer ? referrer.id : 0,
    },
  });
  const referralCode = refCodeFor(email, u.id);
  await prisma.user.update({
    where: { id: u.id },
    data: { referralCode },
  });

  // Refer & Earn: Rs 10 real money to the referrer, instantly.
  if (referrer) {
    const pools = applyDelta(referrer, 10);
    await prisma.user.update({ where: { id: referrer.id }, data: pools });
    await prisma.ledger.create({
      data: {
        userId: referrer.id,
        type: "referral",
        amount: 10,
        currency: "INR",
        note: `Referral reward: ${args.name} signed up with your code - Rs 10 real money`,
      },
    });
  }

  const verifyCode = createHash("sha256")
    .update(`verify:${email}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  await prisma.user.update({
    where: { id: u.id },
    data: { verifyCode },
  });

  const token = await createSession(u.id, "player");
  await setPlayerCookie(token);
  return json({
    ok: true,
    verifyCode,
    user: { id: u.id, name: u.name, email: u.email, referralCode },
  });
}
