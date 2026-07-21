import { NextRequest, NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Click data for the heatmap view (auth enforced by middleware).
 * GET /api/admin/heatmap?path=/&device=desktop&range=30
 */
export async function GET(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ paths: [], clicks: [], elements: [] });

  const p = req.nextUrl.searchParams;
  const path = p.get("path") || "/";
  const device = p.get("device") || "all";
  const rangeN = Number(p.get("range"));
  const days = rangeN === 7 || rangeN === 90 ? rangeN : 30;
  const interval = `${days} days`;

  const pathsRows = await sql`
    SELECT path, count(*) AS n FROM events
    WHERE type = 'click' AND created_at > now() - ${interval}::interval
    GROUP BY path ORDER BY n DESC LIMIT 50
  `;

  const clicksRows = await sql`
    SELECT data FROM events
    WHERE type = 'click' AND path = ${path}
      AND created_at > now() - ${interval}::interval
      AND (${device} = 'all' OR data->>'device' = ${device})
    ORDER BY created_at DESC
    LIMIT 5000
  `;

  const elementsRows = await sql`
    SELECT
      coalesce(nullif(data->>'link', ''), data->>'sel') AS target,
      max(data->>'text') AS sample_text,
      count(*) AS clicks
    FROM events
    WHERE type = 'click' AND path = ${path}
      AND created_at > now() - ${interval}::interval
      AND (${device} = 'all' OR data->>'device' = ${device})
    GROUP BY 1 ORDER BY clicks DESC LIMIT 20
  `;

  return NextResponse.json({
    paths: pathsRows.map((r) => ({ path: r.path, clicks: Number(r.n) })),
    clicks: clicksRows.map((r) => r.data),
    elements: elementsRows.map((r) => ({
      target: r.target,
      text: r.sample_text,
      clicks: Number(r.clicks),
    })),
  });
}
