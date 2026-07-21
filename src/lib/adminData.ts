import { sql } from "@/lib/db";

/**
 * Aggregate queries powering the admin analytics dashboard.
 * All ranges are "last N days" (UTC).
 */

export type Range = 7 | 30 | 90;

export function parseRange(v: string | string[] | undefined): Range {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return n === 7 || n === 90 ? n : 30;
}

const num = (v: unknown) => Number(v) || 0;
const text = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""));

export async function overviewStats(days: Range) {
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM sessions WHERE started_at > now() - ${days + " days"}::interval) AS sessions,
      (SELECT count(DISTINCT visitor_id) FROM sessions WHERE started_at > now() - ${days + " days"}::interval) AS visitors,
      (SELECT count(*) FROM events WHERE type = 'pageview' AND created_at > now() - ${days + " days"}::interval) AS pageviews,
      (SELECT count(*) FROM leads WHERE created_at > now() - ${days + " days"}::interval) AS leads,
      (SELECT coalesce(avg((data->>'duration_ms')::numeric), 0)
         FROM events WHERE type = 'page_leave' AND created_at > now() - ${days + " days"}::interval) AS avg_duration_ms,
      (SELECT coalesce(avg((data->>'max_scroll_pct')::numeric), 0)
         FROM events WHERE type = 'page_leave' AND created_at > now() - ${days + " days"}::interval) AS avg_scroll
  `;
  const sessions = num(row?.sessions);
  const leads = num(row?.leads);
  return {
    sessions,
    visitors: num(row?.visitors),
    pageviews: num(row?.pageviews),
    leads,
    convRate: sessions ? (leads / sessions) * 100 : 0,
    avgDurationMs: num(row?.avg_duration_ms),
    avgScroll: num(row?.avg_scroll),
  };
}

export async function dailyTraffic(days: Range) {
  const rows = await sql`
    SELECT date_trunc('day', started_at)::date AS day, count(*) AS sessions
    FROM sessions
    WHERE started_at > now() - ${days + " days"}::interval
    GROUP BY 1 ORDER BY 1
  `;
  // Fill gaps so the chart shows every day.
  const map = new Map(rows.map((r) => [text(r.day).slice(0, 10), num(r.sessions)]));
  const out: { day: string; sessions: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ day: d, sessions: map.get(d) ?? 0 });
  }
  return out;
}

export async function topPages(days: Range, limit = 15) {
  const rows = await sql`
    SELECT
      pv.path,
      count(*) FILTER (WHERE pv.type = 'pageview') AS views,
      coalesce(avg((pv.data->>'max_scroll_pct')::numeric) FILTER (WHERE pv.type = 'page_leave'), 0) AS avg_scroll,
      coalesce(avg((pv.data->>'duration_ms')::numeric) FILTER (WHERE pv.type = 'page_leave'), 0) AS avg_time_ms
    FROM events pv
    WHERE pv.type IN ('pageview', 'page_leave')
      AND pv.created_at > now() - ${days + " days"}::interval
    GROUP BY pv.path
    HAVING count(*) FILTER (WHERE pv.type = 'pageview') > 0
    ORDER BY views DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    path: text(r.path),
    views: num(r.views),
    avgScroll: num(r.avg_scroll),
    avgTimeMs: num(r.avg_time_ms),
  }));
}

export async function scrollDepthByPage(days: Range) {
  const rows = await sql`
    SELECT
      path,
      count(*) AS samples,
      coalesce(avg((data->>'max_scroll_pct')::numeric), 0) AS avg_scroll,
      count(*) FILTER (WHERE (data->>'max_scroll_pct')::numeric >= 25) AS r25,
      count(*) FILTER (WHERE (data->>'max_scroll_pct')::numeric >= 50) AS r50,
      count(*) FILTER (WHERE (data->>'max_scroll_pct')::numeric >= 75) AS r75,
      count(*) FILTER (WHERE (data->>'max_scroll_pct')::numeric >= 90) AS r90,
      coalesce(avg((data->>'duration_ms')::numeric), 0) AS avg_time_ms
    FROM events
    WHERE type = 'page_leave' AND created_at > now() - ${days + " days"}::interval
    GROUP BY path
    ORDER BY samples DESC
  `;
  return rows.map((r) => {
    const samples = num(r.samples) || 1;
    return {
      path: text(r.path),
      samples: num(r.samples),
      avgScroll: num(r.avg_scroll),
      avgTimeMs: num(r.avg_time_ms),
      reached: {
        25: (num(r.r25) / samples) * 100,
        50: (num(r.r50) / samples) * 100,
        75: (num(r.r75) / samples) * 100,
        90: (num(r.r90) / samples) * 100,
      },
    };
  });
}

export async function topReferrers(days: Range, limit = 10) {
  const rows = await sql`
    SELECT
      CASE
        WHEN referrer = '' AND utm_source = '' THEN 'Direct / none'
        WHEN utm_source <> '' THEN 'utm: ' || utm_source
        ELSE regexp_replace(referrer, '^https?://([^/]+).*$', '\\1')
      END AS source,
      count(*) AS sessions
    FROM sessions
    WHERE started_at > now() - ${days + " days"}::interval
    GROUP BY 1 ORDER BY sessions DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ source: text(r.source), sessions: num(r.sessions) }));
}

export async function deviceSplit(days: Range) {
  const rows = await sql`
    SELECT device, count(*) AS sessions
    FROM sessions
    WHERE started_at > now() - ${days + " days"}::interval
    GROUP BY device ORDER BY sessions DESC
  `;
  return rows.map((r) => ({ device: text(r.device), sessions: num(r.sessions) }));
}

export async function countrySplit(days: Range, limit = 10) {
  const rows = await sql`
    SELECT coalesce(nullif(country, ''), '??') AS country, count(*) AS sessions
    FROM sessions
    WHERE started_at > now() - ${days + " days"}::interval
    GROUP BY 1 ORDER BY sessions DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ country: text(r.country), sessions: num(r.sessions) }));
}

/** Recent visitor journeys: ordered page paths per session. */
export async function recentJourneys(days: Range, limit = 40) {
  const rows = await sql`
    SELECT
      s.id, s.started_at, s.device, s.browser, s.country, s.referrer, s.utm_source,
      coalesce(
        (SELECT json_agg(json_build_object('path', e.path, 'ts', e.created_at) ORDER BY e.created_at)
           FROM events e WHERE e.session_id = s.id AND e.type = 'pageview'),
        '[]'::json
      ) AS steps,
      (SELECT coalesce(sum((e.data->>'duration_ms')::numeric), 0)
         FROM events e WHERE e.session_id = s.id AND e.type = 'page_leave') AS total_ms,
      EXISTS (SELECT 1 FROM events e WHERE e.session_id = s.id AND e.type = 'lead') AS converted
    FROM sessions s
    WHERE s.started_at > now() - ${days + " days"}::interval
    ORDER BY s.started_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: text(r.id),
    startedAt: text(r.started_at),
    device: text(r.device),
    browser: text(r.browser),
    country: text(r.country),
    referrer: text(r.referrer),
    utmSource: text(r.utm_source),
    steps: (r.steps as { path: string; ts: string }[]) ?? [],
    totalMs: num(r.total_ms),
    converted: Boolean(r.converted),
  }));
}

/** Most common page→page transitions (flow between pages). */
export async function topTransitions(days: Range, limit = 15) {
  const rows = await sql`
    WITH ordered AS (
      SELECT session_id, path,
             lead(path) OVER (PARTITION BY session_id ORDER BY created_at) AS next_path
      FROM events
      WHERE type = 'pageview' AND created_at > now() - ${days + " days"}::interval
    )
    SELECT path AS from_path, next_path AS to_path, count(*) AS transitions
    FROM ordered
    WHERE next_path IS NOT NULL AND next_path <> path
    GROUP BY 1, 2 ORDER BY transitions DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    from: text(r.from_path),
    to: text(r.to_path),
    count: num(r.transitions),
  }));
}

export async function entryExitPages(days: Range, limit = 10) {
  const rows = await sql`
    WITH firsts AS (
      SELECT DISTINCT ON (session_id) session_id, path,
             first_value(path) OVER (PARTITION BY session_id ORDER BY created_at DESC) AS exit_path
      FROM events
      WHERE type = 'pageview' AND created_at > now() - ${days + " days"}::interval
      ORDER BY session_id, created_at ASC
    )
    SELECT path AS entry, exit_path AS exit, count(*) AS n
    FROM firsts GROUP BY 1, 2 ORDER BY n DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ entry: text(r.entry), exit: text(r.exit), count: num(r.n) }));
}

export function fmtDuration(ms: number): string {
  if (!ms) return "–";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
