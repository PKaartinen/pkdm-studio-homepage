import { hasDb } from "@/lib/db";
import { fmtDuration, parseRange, scrollDepthByPage } from "@/lib/adminData";
import { Card, EmptyState, PageHeader } from "../_components/ui";
import NoDb from "../_components/NoDb";

export const dynamic = "force-dynamic";

const MILESTONES = [25, 50, 75, 90] as const;

function DepthFunnel({ reached }: { reached: Record<25 | 50 | 75 | 90, number> }) {
  return (
    <div className="flex items-end gap-1.5">
      {MILESTONES.map((m) => {
        const pct = reached[m];
        return (
          <div key={m} className="flex w-12 flex-col items-center gap-1">
            <span className="text-[11px] tabular-nums text-haze">{Math.round(pct)}%</span>
            <div className="flex h-16 w-full items-end rounded bg-white/[0.05]">
              <div
                className="w-full rounded bg-gradient-to-t from-accent-deep to-accent"
                style={{ height: `${Math.max(3, pct)}%` }}
              />
            </div>
            <span className="text-[10px] text-haze/60">{m}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function PagesView({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);

  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Pages & scroll depth" />
        <NoDb />
      </>
    );
  }

  const pages = await scrollDepthByPage(range);

  return (
    <>
      <PageHeader
        title="Pages & scroll depth"
        description="How far visitors scroll on each page, and how long they stay. Bars show the share of visits that reached each depth milestone — a steep drop-off tells you where people lose interest."
        range={range}
        basePath="/admin/pages"
      />

      {pages.length === 0 ? (
        <EmptyState>
          No scroll data yet. It&apos;s recorded when a visitor leaves a page, so it appears
          shortly after your first tracked visits.
        </EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pages.map((p) => (
            <Card key={p.path}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-white">
                    {p.path}
                  </p>
                  <p className="mt-1 text-xs text-haze">
                    {p.samples.toLocaleString()} visits · avg scroll{" "}
                    <span className="text-white">{Math.round(p.avgScroll)}%</span> · avg time{" "}
                    <span className="text-white">{fmtDuration(p.avgTimeMs)}</span>
                  </p>
                  <div className="mt-3 h-1.5 w-48 max-w-full rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent"
                      style={{ width: `${Math.min(100, p.avgScroll)}%` }}
                    />
                  </div>
                </div>
                <DepthFunnel reached={p.reached} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
