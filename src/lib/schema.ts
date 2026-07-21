import { sqlRaw } from "@/lib/db";

/**
 * Idempotent database schema for the admin dashboard.
 *
 * This is the canonical schema used in production (auto-applied on first use
 * and via /api/admin/setup). scripts/setup-db.mjs mirrors these statements
 * for local/one-off setup — keep both in sync when changing the schema.
 */
export const SCHEMA_STATEMENTS: string[] = [
  // ---- Analytics -----------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS sessions (
    id           text PRIMARY KEY,
    visitor_id   text NOT NULL,
    started_at   timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    landing_path text NOT NULL DEFAULT '/',
    referrer     text NOT NULL DEFAULT '',
    utm_source   text NOT NULL DEFAULT '',
    utm_medium   text NOT NULL DEFAULT '',
    utm_campaign text NOT NULL DEFAULT '',
    device       text NOT NULL DEFAULT 'desktop',
    browser      text NOT NULL DEFAULT '',
    screen_w     int  NOT NULL DEFAULT 0,
    country      text NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions (started_at)`,
  `CREATE INDEX IF NOT EXISTS sessions_visitor_idx ON sessions (visitor_id)`,

  `CREATE TABLE IF NOT EXISTS events (
    id         bigserial PRIMARY KEY,
    session_id text NOT NULL,
    type       text NOT NULL,
    path       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    data       jsonb NOT NULL DEFAULT '{}'::jsonb
  )`,
  `CREATE INDEX IF NOT EXISTS events_type_path_idx ON events (type, path, created_at)`,
  `CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at)`,

  // ---- Leads ----------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS leads (
    id          serial PRIMARY KEY,
    name        text NOT NULL DEFAULT '',
    email       text NOT NULL DEFAULT '',
    help        text NOT NULL DEFAULT '',
    message     text NOT NULL DEFAULT '',
    source_path text NOT NULL DEFAULT '',
    session_id  text NOT NULL DEFAULT '',
    status      text NOT NULL DEFAULT 'new',
    notes       text NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now()
  )`,

  // ---- CRM ---------------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS clients (
    id         serial PRIMARY KEY,
    name       text NOT NULL,
    company    text NOT NULL DEFAULT '',
    email      text NOT NULL DEFAULT '',
    phone      text NOT NULL DEFAULT '',
    status     text NOT NULL DEFAULT 'lead',
    notes      text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS projects (
    id         serial PRIMARY KEY,
    client_id  int REFERENCES clients(id) ON DELETE SET NULL,
    name       text NOT NULL,
    status     text NOT NULL DEFAULT 'planning',
    budget     text NOT NULL DEFAULT '',
    due_date   date,
    notes      text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id           serial PRIMARY KEY,
    project_id   int REFERENCES projects(id) ON DELETE CASCADE,
    title        text NOT NULL,
    status       text NOT NULL DEFAULT 'todo',
    priority     text NOT NULL DEFAULT 'medium',
    due_date     date,
    notes        text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
  )`,
];

/** Applies the schema. Safe to run repeatedly. */
export async function ensureSchema(): Promise<void> {
  for (const stmt of SCHEMA_STATEMENTS) {
    await sqlRaw(stmt);
  }
}

/** True when an error looks like "the tables haven't been created yet". */
export function isMissingTableError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return e?.code === "42P01" || /relation .* does not exist/i.test(e?.message ?? "");
}
