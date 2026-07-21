import { neon } from "@neondatabase/serverless";

/**
 * Lazily-initialised Neon Postgres client.
 *
 * The Neon/Vercel integration injects DATABASE_URL (and POSTGRES_URL) into the
 * environment automatically. We resolve lazily so the app still builds and the
 * public site still works when no database is configured yet.
 */
let _sql: ReturnType<typeof neon> | null = null;

export function getDbUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function hasDb(): boolean {
  return Boolean(getDbUrl());
}

function client() {
  if (!_sql) {
    const url = getDbUrl();
    if (!url) {
      throw new Error(
        "No database configured. Set DATABASE_URL (add the Neon integration in Vercel, then `vercel env pull .env.local` for local dev)."
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

export function sql(strings: TemplateStringsArray, ...params: unknown[]) {
  return client()(strings, ...params) as Promise<Record<string, unknown>[]>;
}

/** Raw single-statement query (used for schema DDL). */
export function sqlRaw(text: string) {
  return client().query(text, []) as Promise<Record<string, unknown>[]>;
}
