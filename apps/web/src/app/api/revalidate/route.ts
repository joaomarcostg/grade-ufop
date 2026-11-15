import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { catalogTag } from "@/server/catalog";

/**
 * Called by the scheduled sync after it loads new data, so seats show up on
 * the next visit instead of when the hourly cache runs out.
 *
 * POST /api/revalidate  {"institution": "ufop"}
 * Authorization: Bearer $REVALIDATE_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) return Response.json({ error: "REVALIDATE_TOKEN is not set" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), token)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const institution =
    body && typeof body === "object" && "institution" in body && typeof body.institution === "string"
      ? body.institution
      : null;
  if (!institution || !/^[a-z]{2,16}$/.test(institution)) {
    return Response.json({ error: 'expected {"institution": "<code>"}' }, { status: 400 });
  }

  // Seats go stale fast: the next request waits for fresh data instead of
  // being served the old copy.
  revalidateTag(catalogTag(institution), { expire: 0 });
  return Response.json({ revalidated: catalogTag(institution) });
}

function authorized(header: string | null, token: string): boolean {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
