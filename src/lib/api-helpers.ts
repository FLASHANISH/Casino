import { NextResponse } from "next/server";
import { z } from "zod";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse + validate a JSON body with a zod schema, or return an error. */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: err("Invalid JSON body.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      res: err(parsed.error.issues[0]?.message ?? "Invalid input."),
    };
  }
  return { ok: true, data: parsed.data };
}

export function money(n: number): number {
  return Math.round(n * 100) / 100;
}
