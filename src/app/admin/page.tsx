import Link from "next/link";
import { hasDb } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { mailConfigured } from "@/lib/leadMail";
import {
  attention,
  contactFunnel,
  countrySplit,
  dailyTraffic,
  delta,
  deviceSplit,
  fmtDuration,
  leadSources,
  overviewStats,
  parseRange,
  periodCompare,
  topPages,
  topReferrers,
} from "@/lib/adminData";
import { BarRow, Card, PageHeader, Stat, TrendChart, EmptyState } from "./_components/ui";
import { RefreshButton, TimeAgo } from "./_components/Bits";
import NoDb from "./_components/NoDb";
import { todayYmd } from "./_lib/format";

export const dynamic = "force-dynamic";

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Tallinn", hour: "numeric", hour12: false }).format(new Date())
  );
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function AttentionRow({
  href,
  tone,
  title,
  detail,
}: {
  href: string;
  tone: "red" | "amber" | "accent" | "ok";
  title: string;
  detail?: React.ReactNode;
}) {
  const dot = {
    red: "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]",
    amber: "bg-yellow-300",
    accent: "bg-accent",
    ok: "bg-emerald-300",
  }[tone];
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-950/40 px-4 py-3 transition-colors hover:border-white/[0.16] hover:bg-white/[0.02]"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-white">{title}</span>
        {detail ? <span className="mt-0.5 block truncate text-xs text-haze">{detail}</span> : null}
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-haze/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);

  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Overview" />
        <NoDb />
      </>
    );
  }

  const [stats, cmp, daily, pages, referrers, devices, countries, todo, sources, funnel] = await withSchema(() =>
    Promise.all([
      overviewStats(range),
      periodCompare(range),
      dailyTraffic(range),
      topPages(range, 8),
      topReferrers(range, 8),
      deviceSplit(range),
      countrySplit(range, 8),
      attention(todayYmd()),
      leadSources(range),
      contactFunnel(range),
    ])
  );

  const maxPage = Math.max(1, ...pages.map((p) => p.views));
  const maxRef = Math.max(1, ...referrers.map((r) => r.sessions));
  const maxDev = Math.max(1, ...devices.map((d) => d.sessions));
  const maxCountry = Math.max(1, ...countries.map((c) => c.sessions));
  const maxSource = Math.max(1, ...sources.map((s) => s.leads));
  const prevConv = cmp.sessions.prev ? (cmp.leads.prev / cmp.sessions.prev) * 100 : 0;

  const rows: React.ComponentProps<typeof AttentionRow>[] = [];
  if (todo.newLeads) {
    rows.push({
      href: "/admin/leads?status=new",
      tone: todo.overdueLeads ? "red" : "accent",
      title: `${todo.newLeads} lead${todo.newLeads === 1 ? "" : "s"} waiting for a reply${
        todo.overdueLeads ? `, ${todo.overdueLeads} past 24h` : ""
      }`,
      detail: todo.waiting.length ? (
        <>
          {todo.waiting.map((w) => w.name || "Unnamed").join(", ")}
          {todo.oldestNew ? (
            <>
              {" · oldest "}
              <TimeAgo iso={todo.oldestNew} />
            </>
          ) : null}
        </>
      ) : undefined,
    });
  }
  if (todo.overdueTasks)
    rows.push({ href: "/admin/work", tone: "red", title: `${todo.overdueTasks} overdue task${todo.overdueTasks === 1 ? "" : "s"}` });
  if (todo.todayTasks)
    rows.push({ href: "/admin/work", tone: "amber", title: `${todo.todayTasks} task${todo.todayTasks === 1 ? "" : "s"} due today` });
  if (todo.overdueProjects)
    rows.push({ href: "/admin/projects", tone: "red", title: `${todo.overdueProjects} project${todo.overdueProjects === 1 ? "" : "s"} past the deadline` });
  if (todo.soonProjects)
    rows.push({ href: "/admin/projects", tone: "amber", title: `${todo.soonProjects} project deadline${todo.soonProjects === 1 ? "" : "s"} in the next 7 days` });
  if (!mailConfigured())
    rows.push({
      href: "/admin/leads",
      tone: "amber",
      title: "Lead email notifications are off",
      detail: "Add RESEND_API_KEY and CONTACT_TO in Vercel to get an email for every enquiry.",
    });

  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "–");

  return (
    <>
      <PageHeader
        title={greeting()}
        description={`Here's how the site and the pipeline are doing over the last ${range} days.`}
        range={range}
        basePath="/admin"
        actions={<RefreshButton />}
      />

      {/* Needs attention */}
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Needs your attention">
          {rows.length ? (
            <div className="space-y-2">
              {rows.map((r) => (
                <AttentionRow key={r.title} {...r} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-4 text-sm text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              All clear: no unanswered leads, nothing overdue.
            </div>
          )}
        </Card>
        <Card title="In flight">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: "Active projects", v: todo.activeProjects, href: "/admin/projects" },
              { k: "Tasks in progress", v: todo.doingTasks, href: "/admin/work" },
              { k: "New leads", v: todo.newLeads, href: "/admin/leads?status=new" },
            ].map((x) => (
              <Link key={x.k} href={x.href} className="rounded-xl border border-white/[0.06] bg-ink-950/40 px-2 py-4 transition-colors hover:border-white/[0.16]">
                <p className="font-display text-2xl font-semibold text-white">{x.v}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-haze">{x.k}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Link href="/admin/leads" className="rounded-lg border border-white/10 px-3 py-2 text-center text-haze transition-colors hover:text-white">
              Open leads
            </Link>
            <Link href="/admin/work" className="rounded-lg border border-white/10 px-3 py-2 text-center text-haze transition-colors hover:text-white">
              Add a task
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Visitors" value={stats.visitors.toLocaleString()} delta={delta(cmp.visitors.now, cmp.visitors.prev)} />
        <Stat label="Sessions" value={stats.sessions.toLocaleString()} delta={delta(cmp.sessions.now, cmp.sessions.prev)} />
        <Stat label="Pageviews" value={stats.pageviews.toLocaleString()} delta={delta(cmp.pageviews.now, cmp.pageviews.prev)} href="/admin/pages" />
        <Stat
          label="Leads"
          value={stats.leads.toLocaleString()}
          sub="Contact form enquiries"
          delta={delta(cmp.leads.now, cmp.leads.prev)}
          href="/admin/leads?status=all"
        />
        <Stat
          label="Conversion"
          value={`${stats.convRate.toFixed(1)}%`}
          sub="Leads / sessions"
          delta={prevConv ? delta(stats.convRate, prevConv) : null}
        />
        <Stat
          label="Avg. time on page"
          value={fmtDuration(stats.avgDurationMs)}
          sub={`Avg. scroll ${Math.round(stats.avgScroll)}%`}
        />
      </div>

      <Card title={`Sessions per day (${range}d)`} className="mt-4">
        {daily.some((d) => d.sessions > 0) ? (
          <>
            <TrendChart points={daily} />
            <div className="mt-2 flex justify-between text-[11px] text-haze/60">
              <span>{new Date(daily[0].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <span>Today</span>
            </div>
          </>
        ) : (
          <EmptyState>No traffic recorded yet. Data appears as soon as visitors arrive.</EmptyState>
        )}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="From visit to enquiry">
          <div className="space-y-3">
            {[
              { k: "Sessions", v: funnel.sessions, of: funnel.sessions },
              { k: "Opened the contact page", v: funnel.sawContact, of: funnel.sessions },
              { k: "Sent an enquiry", v: funnel.leads, of: funnel.sessions },
            ].map((s, i) => (
              <div key={s.k}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-white/90">{s.k}</span>
                  <span className="tabular-nums text-haze">
                    {s.v.toLocaleString()}
                    {i ? <span className="ml-2 text-haze/60">{pct(s.v, s.of)}</span> : null}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent"
                    style={{ width: `${s.of ? Math.max(2, (s.v / s.of) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-haze/70">
              {funnel.sawContact
                ? `${pct(funnel.leads, funnel.sawContact)} of visits that reach the contact page turn into an enquiry.`
                : "Once people visit the contact page, you'll see how many go on to send it."}
            </p>
          </div>
        </Card>
        <Card title="Where leads come from">
          {sources.length === 0 ? (
            <EmptyState>No leads in this period yet.</EmptyState>
          ) : (
            sources.map((s) => <BarRow key={s.source} label={s.source} value={s.leads} max={maxSource} />)
          )}
        </Card>
        <Card title="Top pages">
          {pages.length === 0 ? (
            <EmptyState>No pageviews yet.</EmptyState>
          ) : (
            pages.map((p) => <BarRow key={p.path} label={p.path} value={p.views} max={maxPage} />)
          )}
        </Card>
        <Card title="Traffic sources">
          {referrers.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            referrers.map((r) => <BarRow key={r.source} label={r.source} value={r.sessions} max={maxRef} />)
          )}
        </Card>
        <Card title="Devices">
          {devices.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            devices.map((d) => <BarRow key={d.device} label={d.device} value={d.sessions} max={maxDev} />)
          )}
        </Card>
        <Card title="Countries">
          {countries.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            countries.map((c) => <BarRow key={c.country} label={c.country} value={c.sessions} max={maxCountry} />)
          )}
        </Card>
      </div>
    </>
  );
}
