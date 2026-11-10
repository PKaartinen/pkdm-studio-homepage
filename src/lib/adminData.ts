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
    SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS day, count(*) AS sessions
    FROM sessions
    WHERE started_at > now() - ${days + " days"}::interval
    GROUP BY 1 ORDER BY 1
  `;
  // Fill gaps so the chart shows every day. (`day` comes back as text: the
  // driver would turn a SQL date into a JS Date, which never matches a key.)
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

// ---------------------------------------------------------------------------
// Business view (overview page)
// ---------------------------------------------------------------------------

/** Headline counts for this period and the one before it (for deltas). */
export async function periodCompare(days: Range) {
  const cur = `${days} days`;
  const prev = `${days * 2} days`;
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM sessions WHERE started_at > now() - ${cur}::interval) AS sessions,
      (SELECT count(*) FROM sessions WHERE started_at > now() - ${prev}::interval AND started_at <= now() - ${cur}::interval) AS sessions_prev,
      (SELECT count(DISTINCT visitor_id) FROM sessions WHERE started_at > now() - ${cur}::interval) AS visitors,
      (SELECT count(DISTINCT visitor_id) FROM sessions WHERE started_at > now() - ${prev}::interval AND started_at <= now() - ${cur}::interval) AS visitors_prev,
      (SELECT count(*) FROM events WHERE type = 'pageview' AND created_at > now() - ${cur}::interval) AS pageviews,
      (SELECT count(*) FROM events WHERE type = 'pageview' AND created_at > now() - ${prev}::interval AND created_at <= now() - ${cur}::interval) AS pageviews_prev,
      (SELECT count(*) FROM leads WHERE created_at > now() - ${cur}::interval) AS leads,
      (SELECT count(*) FROM leads WHERE created_at > now() - ${prev}::interval AND created_at <= now() - ${cur}::interval) AS leads_prev
  `;
  const pair = (k: string) => ({ now: num(row?.[k]), prev: num(row?.[`${k}_prev`]) });
  return {
    sessions: pair("sessions"),
    visitors: pair("visitors"),
    pageviews: pair("pageviews"),
    leads: pair("leads"),
  };
}

/** % change, or null when there's no baseline to compare against. */
export function delta(now: number, prev: number): number | null {
  if (!prev) return null;
  return ((now - prev) / prev) * 100;
}

/** What needs doing today: unanswered leads, overdue work, deadlines. */
export async function attention(today: string) {
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM leads WHERE status = 'new') AS new_leads,
      (SELECT count(*) FROM leads WHERE status = 'new' AND created_at < now() - interval '24 hours') AS overdue_leads,
      (SELECT min(created_at) FROM leads WHERE status = 'new') AS oldest_new,
      (SELECT count(*) FROM tasks WHERE status <> 'done' AND due_date < ${today}::date) AS overdue_tasks,
      (SELECT count(*) FROM tasks WHERE status <> 'done' AND due_date = ${today}::date) AS today_tasks,
      (SELECT count(*) FROM tasks WHERE status = 'doing') AS doing_tasks,
      (SELECT count(*) FROM projects WHERE status NOT IN ('delivered', 'archived') AND due_date < ${today}::date) AS overdue_projects,
      (SELECT count(*) FROM projects WHERE status NOT IN ('delivered', 'archived')
         AND due_date >= ${today}::date AND due_date <= ${today}::date + 7) AS soon_projects,
      (SELECT count(*) FROM projects WHERE status NOT IN ('delivered', 'archived')) AS active_projects
  `;
  const newest = await sql`
    SELECT id, name, help, created_at FROM leads WHERE status = 'new'
    ORDER BY created_at ASC LIMIT 4
  `;
  return {
    newLeads: num(row?.new_leads),
    overdueLeads: num(row?.overdue_leads),
    oldestNew: row?.oldest_new ? text(row.oldest_new instanceof Date ? row.oldest_new.toISOString() : row.oldest_new) : null,
    overdueTasks: num(row?.overdue_tasks),
    todayTasks: num(row?.today_tasks),
    doingTasks: num(row?.doing_tasks),
    overdueProjects: num(row?.overdue_projects),
    soonProjects: num(row?.soon_projects),
    activeProjects: num(row?.active_projects),
    waiting: newest.map((l) => ({
      id: num(l.id),
      name: text(l.name),
      help: text(l.help),
      createdAt: l.created_at instanceof Date ? l.created_at.toISOString() : text(l.created_at),
    })),
  };
}

/** Where leads come from: the source of the session that submitted. */
export async function leadSources(days: Range, limit = 6) {
  const rows = await sql`
    SELECT
      CASE
        WHEN s.id IS NULL THEN 'Unknown (not tracked)'
        WHEN s.utm_source <> '' THEN 'utm: ' || s.utm_source
        WHEN s.referrer = '' THEN 'Direct / none'
        ELSE regexp_replace(regexp_replace(s.referrer, '^https?://([^/]+).*$', '\\1'), '^www\\.', '')
      END AS source,
      count(*) AS leads
    FROM leads l
    LEFT JOIN sessions s ON s.id = l.session_id AND l.session_id <> ''
    WHERE l.created_at > now() - ${days + " days"}::interval
    GROUP BY 1 ORDER BY leads DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ source: text(r.source), leads: num(r.leads) }));
}

/** Sessions → sessions that saw /contact → leads. */
export async function contactFunnel(days: Range) {
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM sessions WHERE started_at > now() - ${days + " days"}::interval) AS sessions,
      (SELECT count(DISTINCT session_id) FROM events
         WHERE type = 'pageview' AND path = '/contact' AND created_at > now() - ${days + " days"}::interval) AS saw_contact,
      (SELECT count(*) FROM leads WHERE created_at > now() - ${days + " days"}::interval) AS leads
  `;
  return {
    sessions: num(row?.sessions),
    sawContact: num(row?.saw_contact),
    leads: num(row?.leads),
  };
}
