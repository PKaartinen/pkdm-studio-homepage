import { NextRequest, NextResponse } from "next/server";
import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { mailConfigured, sendLeadNotification } from "@/lib/leadMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact form endpoint.
 *
 * 1. Validates the enquiry (plus a honeypot and a light per-IP rate limit).
 * 2. Saves it as a lead, so it shows up in /admin/leads even when the
 *    visitor's browser blocks analytics.
 * 3. Emails every inbox in CONTACT_TO through Resend, with reply-to set to
 *    the visitor, and records the delivery result on the lead.
 *
 * Responds { ok, stored, emailed, leadId }. When `emailed` is false the
 * browser falls back to Web3Forms so the enquiry still reaches an inbox.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  }

  // Honeypot: pretend success so bots learn nothing.
  if (body.botcheck) return NextResponse.json({ ok: true, stored: false, emailed: true });

  const name = str(body.name, 200);
  const email = str(body.email, 200).toLowerCase();
  const help = str(body.help, 200);
  const message = str(body.message, 5000);
  const path = str(body.path, 300) || "/contact";
  const sid = str(body.sid, 64);

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "Please fill in your name, email, and a short message." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, field: "email", error: "That email address doesn't look quite right." },
      { status: 400 }
    );
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "That's a lot of messages in a row. Please wait a few minutes, or email us directly." },
      { status: 429 }
    );
  }

  const createdAt = new Date();
  type Ctx = { referrer?: string; utm?: string; device?: string; country?: string };
  let saved: { leadId: number; duplicate: boolean; ctx: Ctx } | null = null;

  if (hasDb()) {
    try {
      saved = await withSchema(async () => {
        // Same person, same message within 10 minutes = a double submit.
        const [dupe] = await sql`
          SELECT id FROM leads
          WHERE email = ${email} AND message = ${message}
            AND created_at > now() - interval '10 minutes'
          ORDER BY id DESC LIMIT 1
        `;
        if (dupe) return { leadId: Number(dupe.id), duplicate: true, ctx: {} };

        const [row] = await sql`
          INSERT INTO leads (name, email, help, message, source_path, session_id, email_status, updated_at)
          VALUES (${name}, ${email}, ${help}, ${message}, ${path}, ${sid}, 'pending', now())
          RETURNING id
        `;
        let ctx: Ctx = {};
        if (sid) {
          const [s] = await sql`
            SELECT referrer, utm_source, utm_medium, utm_campaign, device, country
            FROM sessions WHERE id = ${sid}
          `;
          if (s) {
            ctx = {
              referrer: String(s.referrer || "").replace(/^https?:\/\//, "").slice(0, 120),
              utm: [s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(" / "),
              device: String(s.device || ""),
              country: String(s.country || ""),
            };
          }
        }
        return { leadId: Number(row.id), duplicate: false, ctx };
      });
    } catch (err) {
      console.error("contact: storing lead failed", err);
    }
  }

  const leadId = saved?.leadId ?? null;
  const ctx = saved?.ctx ?? {};

  if (saved?.duplicate) {
    return NextResponse.json({ ok: true, stored: true, emailed: true, leadId, duplicate: true });
  }

  const mail = await sendLeadNotification({
    id: leadId,
    name,
    email,
    help,
    message,
    path,
    createdAt,
    ...ctx,
  });
  if (mail.status === "failed") console.error("contact: email failed", mail.error);

  if (leadId !== null) {
    try {
      await sql`
        UPDATE leads SET email_status = ${mail.status},
          email_error = ${mail.status === "sent" ? "" : mail.error}
        WHERE id = ${leadId}
      `;
    } catch (err) {
      console.error("contact: recording email status failed", err);
    }
  }

  const stored = leadId !== null;
  const emailed = mail.status === "sent";
  if (!stored && !emailed && !mailConfigured()) {
    // Nothing server-side is set up; let the browser fallback handle it.
    return NextResponse.json({ ok: false, stored, emailed, fallback: true });
  }
  return NextResponse.json({ ok: stored || emailed, stored, emailed, leadId });
}
