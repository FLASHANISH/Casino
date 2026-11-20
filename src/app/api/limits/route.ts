import { z } from "zod";
import prisma from "@/lib/prisma";
import { currentPlayer } from "@/lib/auth";
import { err, json, parseBody } from "@/lib/api-helpers";

const schema = z.object({
  depositLimit: z.number().min(0).max(1000000),
  lossLimit: z.number().min(0).max(1000000),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.res;
  const me = await currentPlayer();
  if (!me) return err("Please log in first.", 401);
  await prisma.user.update({
    where: { id: me.id },
    data: {
      depositLimit: parsed.data.depositLimit,
      lossLimit: parsed.data.lossLimit,
    },
  });
  return json({ ok: true });
}
