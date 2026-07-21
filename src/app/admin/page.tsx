import { hasDb } from "@/lib/db";
import {
  countrySplit,
  dailyTraffic,
  deviceSplit,
  fmtDuration,
  overviewStats,
  parseRange,
  topPages,
  topReferrers,
} from "@/lib/adminData";
import { BarRow, Card, PageHeader, Stat, TrendChart, EmptyState } from "./_components/ui";
import NoDb from "./_components/NoDb";

export const dynamic = "force-dynamic";

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

  const [stats, daily, pages, referrers, devices, countries] = await Promise.all([
    overviewStats(range),
    dailyTraffic(range),
    topPages(range, 8),
    topReferrers(range, 8),
    deviceSplit(range),
    countrySplit(range, 8),
  ]);

  const maxPage = Math.max(1, ...pages.map((p) => p.views));
  const maxRef = Math.max(1, ...referrers.map((r) => r.sessions));
  const maxDev = Math.max(1, ...devices.map((d) => d.sessions));
  const maxCountry = Math.max(1, ...countries.map((c) => c.sessions));

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Traffic, engagement and conversion for the last ${range} days.`}
        range={range}
        basePath="/admin"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Visitors" value={stats.visitors.toLocaleString()} />
        <Stat label="Sessions" value={stats.sessions.toLocaleString()} />
        <Stat label="Pageviews" value={stats.pageviews.toLocaleString()} />
        <Stat label="Leads" value={stats.leads.toLocaleString()} sub="Contact form submits" />
        <Stat
          label="Conversion"
          value={`${stats.convRate.toFixed(1)}%`}
          sub="Leads / sessions"
        />
        <Stat
          label="Avg. time on page"
          value={fmtDuration(stats.avgDurationMs)}
          sub={`Avg. scroll ${Math.round(stats.avgScroll)}%`}
        />
      </div>

      <Card title={`Sessions per day (${range}d)`} className="mt-4">
        {daily.some((d) => d.sessions > 0) ? (
          <TrendChart points={daily} />
        ) : (
          <EmptyState>No traffic recorded yet — data appears as soon as visitors arrive.</EmptyState>
        )}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Top pages">
          {pages.length === 0 ? (
            <EmptyState>No pageviews yet.</EmptyState>
          ) : (
            pages.map((p) => (
              <BarRow key={p.path} label={p.path} value={p.views} max={maxPage} />
            ))
          )}
        </Card>
        <Card title="Traffic sources">
          {referrers.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            referrers.map((r) => (
              <BarRow key={r.source} label={r.source} value={r.sessions} max={maxRef} />
            ))
          )}
        </Card>
        <Card title="Devices">
          {devices.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            devices.map((d) => (
              <BarRow key={d.device} label={d.device} value={d.sessions} max={maxDev} />
            ))
          )}
        </Card>
        <Card title="Countries">
          {countries.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            countries.map((c) => (
              <BarRow key={c.country} label={c.country} value={c.sessions} max={maxCountry} />
            ))
          )}
        </Card>
      </div>
    </>
  );
}
