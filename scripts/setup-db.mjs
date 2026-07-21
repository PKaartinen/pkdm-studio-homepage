/**
 * One-time (idempotent) database schema setup for the PKDM Studio admin.
 *
 * Usage:
 *   npm run db:setup
 *
 * Reads the connection string from .env.local (DATABASE_URL or POSTGRES_URL).
 * Safe to re-run — every statement uses IF NOT EXISTS.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local loader (no extra dependency needed).
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error(
    "✗ No DATABASE_URL found.\n" +
      "  1. In Vercel: Storage → Create Database → Neon (Postgres), connect it to the project.\n" +
      "  2. Locally: run `vercel env pull .env.local` (or paste the connection string into .env.local as DATABASE_URL).\n" +
      "  3. Re-run `npm run db:setup`."
  );
  process.exit(1);
}

const sql = neon(url);

const statements = [
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

  // ---- Leads (contact form submissions) ------------------------------------
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

  // ---- CRM: clients / projects / work --------------------------------------
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

for (const stmt of statements) {
  // neon v1 requires .query() for conventional (non-tagged-template) calls.
  await sql.query(stmt, []);
}

console.log("✓ Database schema is ready (" + statements.length + " statements applied).");
