import { NextRequest, NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { ensureSchema, isMissingTableError } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "pageview",
  "page_leave",
  "click",
  "lead",
  "cta_click",
  "custom",
]);

const BOT_RE =
  /bot|crawler|spider|crawling|headless|lighthouse|pingdom|monitor|preview|scrape/i;

function browserFromUA(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}

function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  // Silently accept when no DB is configured so the public site never errors.
  if (!hasDb()) return NextResponse.json({ ok: true, stored: false });

  const ua = req.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return NextResponse.json({ ok: true, stored: false });

  let body: {
    sid?: string;
    vid?: string;
    meta?: Record<string, unknown>;
    events?: { type?: string; path?: string; ts?: number; data?: Record<string, unknown> }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const sid = str(body.sid, 64);
  const vid = str(body.vid, 64);
  const events = Array.isArray(body.events) ? body.events.slice(0, 100) : [];
  if (!sid || !vid || events.length === 0) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const meta = body.meta ?? {};
  const search = str(meta.search, 500);
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const country =
    req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "";

  const ingest = async () => {
    // Upsert the session (first write creates it, later writes refresh last_seen).
    await sql`
      INSERT INTO sessions (id, visitor_id, landing_path, referrer, utm_source, utm_medium, utm_campaign, device, browser, screen_w, country)
      VALUES (
        ${sid}, ${vid},
        ${str(meta.landing, 300) || "/"},
        ${str(meta.referrer, 500)},
        ${params.get("utm_source")?.slice(0, 100) ?? ""},
        ${params.get("utm_medium")?.slice(0, 100) ?? ""},
        ${params.get("utm_campaign")?.slice(0, 100) ?? ""},
        ${str(meta.device, 20) || "desktop"},
        ${browserFromUA(ua)},
        ${Number(meta.screen_w) || 0},
        ${country.slice(0, 8)}
      )
      ON CONFLICT (id) DO UPDATE SET last_seen_at = now()
    `;

    for (const ev of events) {
      const type = str(ev.type, 40);
      if (!ALLOWED_TYPES.has(type)) continue;
      const path = str(ev.path, 300) || "/";
      const data = ev.data && typeof ev.data === "object" ? ev.data : {};
      const ts = Number(ev.ts);
      const createdAt =
        Number.isFinite(ts) && Math.abs(Date.now() - ts) < 1000 * 60 * 60 * 24
          ? new Date(ts)
          : new Date();

      if (type === "lead") {
        await sql`
          INSERT INTO leads (name, email, help, message, source_path, session_id)
          VALUES (
            ${str(data.name, 200)}, ${str(data.email, 200)},
            ${str(data.help, 200)}, ${str(data.message, 4000)},
            ${path}, ${sid}
          )
        `;
      }

      await sql`
        INSERT INTO events (session_id, type, path, created_at, data)
        VALUES (${sid}, ${type}, ${path}, ${createdAt.toISOString()}, ${JSON.stringify(data)}::jsonb)
      `;
    }
  };

  try {
    try {
      await ingest();
    } catch (err) {
      // First-ever request on a fresh database: create the tables, then retry.
      if (!isMissingTableError(err)) throw err;
      await ensureSchema();
      await ingest();
    }
  } catch (err) {
    console.error("track error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
