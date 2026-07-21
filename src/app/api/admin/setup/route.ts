import { NextResponse } from "next/server";
import { hasDb } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Applies the database schema (idempotent). Protected by admin middleware.
 * Visit /api/admin/setup once after connecting a fresh database — although
 * /api/track also auto-creates the tables on first use.
 */
export async function GET() {
  if (!hasDb()) {
    return NextResponse.json(
      { ok: false, error: "No DATABASE_URL configured." },
      { status: 500 }
    );
  }
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, message: "Database schema is ready." });
  } catch (err) {
    console.error("setup error", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Setup failed." },
      { status: 500 }
    );
  }
}

export const POST = GET;
