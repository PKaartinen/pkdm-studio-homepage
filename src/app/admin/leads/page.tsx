import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { mailConfigured, mailRecipients } from "@/lib/leadMail";
import { PageHeader } from "../_components/ui";
import { RefreshButton } from "../_components/Bits";
import NoDb from "../_components/NoDb";
import { iso, num, sourceOf, txt } from "../_lib/format";
import LeadsBoard, { type LeadRow } from "./LeadsBoard";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; status?: string }>;
}) {
  const params = await searchParams;
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Leads" />
        <NoDb />
      </>
    );
  }

  const [rows, [stats]] = await withSchema(() =>
    Promise.all([
      sql`
        SELECT l.*,
          s.landing_path, s.referrer, s.utm_source, s.utm_campaign, s.device, s.browser, s.country,
          (SELECT count(*) FROM events e WHERE e.session_id = l.session_id AND e.type = 'pageview') AS pages_viewed,
          c.name AS client_name
        FROM leads l
        LEFT JOIN sessions s ON s.id = l.session_id AND l.session_id <> ''
        LEFT JOIN clients c ON c.id = l.client_id
        ORDER BY l.created_at DESC
        LIMIT 500
      `,
      sql`
        SELECT
          avg(extract(epoch FROM (contacted_at - created_at))) FILTER (
            WHERE contacted_at IS NOT NULL AND created_at > now() - interval '90 days'
          ) AS avg_response_s,
          count(*) FILTER (WHERE status = 'won' AND created_at > now() - interval '90 days') AS won_90,
          count(*) FILTER (WHERE status IN ('won', 'lost') AND created_at > now() - interval '90 days') AS closed_90
        FROM leads
      `,
    ])
  );

  const leads: LeadRow[] = rows.map((r) => ({
    id: num(r.id),
    name: txt(r.name),
    email: txt(r.email),
    help: txt(r.help),
    message: txt(r.message),
    notes: txt(r.notes),
    status: txt(r.status) || "new",
    sourcePath: txt(r.source_path),
    createdAt: iso(r.created_at) ?? new Date().toISOString(),
    contactedAt: iso(r.contacted_at),
    emailStatus: txt(r.email_status),
    emailError: txt(r.email_error),
    clientId: r.client_id == null ? null : num(r.client_id),
    clientName: txt(r.client_name),
    session: r.landing_path
      ? {
          landing: txt(r.landing_path),
          source: sourceOf(txt(r.referrer), txt(r.utm_source)),
          campaign: txt(r.utm_campaign),
          device: txt(r.device),
          browser: txt(r.browser),
          country: txt(r.country),
          pages: num(r.pages_viewed),
        }
      : null,
  }));

  const avgResponseH = stats?.avg_response_s == null ? null : num(stats.avg_response_s) / 3600;
  const closed = num(stats?.closed_90);
  const winRate = closed ? (num(stats?.won_90) / closed) * 100 : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-haze">
            Every contact form enquiry lands here the moment it&apos;s sent. Reply inside 24 hours,
            move it through the pipeline, and turn the good ones into clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/leads/export"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-ink-900/70 px-3 py-1.5 text-xs text-haze transition-colors hover:text-white"
            title="Download every lead as a CSV file"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
            Export CSV
          </a>
          <RefreshButton />
        </div>
      </div>

      <LeadsBoard
        leads={leads}
        focusId={Number(params.lead) || null}
        initialFilter={params.status ?? null}
        mail={{ ready: mailConfigured(), recipients: mailRecipients().length }}
        stats={{ avgResponseH, winRate }}
      />
    </>
  );
}
