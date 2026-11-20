import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({ code: z.string().trim().min(4).max(10) });

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);
  if (!me.verifyCode || me.verifyCode.toUpperCase() !== parsed.data.code.toUpperCase()) {
    return err("Wrong verification code.");
  }
  await prisma.user.update({
    where: { id: me.id },
    data: { kycStatus: "verified - 18+", verifyCode: "" },
  });
  return json({ ok: true });
}
