import { NextResponse } from "next/server";
import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { isAdmin } from "@/app/admin/_lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every lead as CSV (opens cleanly in Excel, Numbers and Google Sheets). */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: "No database configured." }, { status: 500 });

  const rows = await withSchema(
    () => sql`
      SELECT l.id, l.created_at, l.name, l.email, l.help, l.status, l.message, l.notes,
        l.source_path, l.contacted_at, l.email_status,
        s.landing_path, s.referrer, s.utm_source, s.utm_medium, s.utm_campaign, s.device, s.country
      FROM leads l
      LEFT JOIN sessions s ON s.id = l.session_id AND l.session_id <> ''
      ORDER BY l.created_at DESC
    `
  );

  const cols = [
    ["id", "ID"],
    ["created_at", "Received"],
    ["name", "Name"],
    ["email", "Email"],
    ["help", "Needs"],
    ["status", "Status"],
    ["message", "Message"],
    ["notes", "Notes"],
    ["contacted_at", "First contacted"],
    ["source_path", "Sent from"],
    ["landing_path", "Landing page"],
    ["referrer", "Referrer"],
    ["utm_source", "UTM source"],
    ["utm_medium", "UTM medium"],
    ["utm_campaign", "UTM campaign"],
    ["device", "Device"],
    ["country", "Country"],
    ["email_status", "Email notification"],
  ] as const;

  const cell = (v: unknown) => {
    let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
    // Neutralise spreadsheet formula injection from visitor-supplied text.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv =
    "﻿" +
    [cols.map((c) => c[1]).join(","), ...rows.map((r) => cols.map(([k]) => cell(r[k])).join(","))].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pkdm-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
