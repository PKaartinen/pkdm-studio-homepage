import { hasDb } from "@/lib/db";
import {
  entryExitPages,
  fmtDuration,
  parseRange,
  recentJourneys,
  topTransitions,
} from "@/lib/adminData";
import { BarRow, Card, EmptyState, PageHeader } from "../_components/ui";
import NoDb from "../_components/NoDb";

export const dynamic = "force-dynamic";

export default async function JourneysPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);

  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Visitor journeys" />
        <NoDb />
      </>
    );
  }

  const [journeys, transitions, entryExit] = await Promise.all([
    recentJourneys(range, 40),
    topTransitions(range, 12),
    entryExitPages(range, 10),
  ]);

  const maxTrans = Math.max(1, ...transitions.map((t) => t.count));

  return (
    <>
      <PageHeader
        title="Visitor journeys"
        description="How individual visitors move through the site — entry page, path taken, time spent, and whether they converted into a lead."
        range={range}
        basePath="/admin/journeys"
      />

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card title="Top page-to-page flows">
          {transitions.length === 0 ? (
            <EmptyState>Not enough multi-page visits yet.</EmptyState>
          ) : (
            transitions.map((t, i) => (
              <BarRow key={i} label={`${t.from} → ${t.to}`} value={t.count} max={maxTrans} />
            ))
          )}
        </Card>
        <Card title="Entry → exit pages">
          {entryExit.length === 0 ? (
            <EmptyState>No sessions yet.</EmptyState>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-haze/70">
                  <th className="pb-2 font-medium">Entered on</th>
                  <th className="pb-2 font-medium">Left from</th>
                  <th className="pb-2 text-right font-medium">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {entryExit.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    <td className="max-w-[160px] truncate py-2 text-white/90">{r.entry}</td>
                    <td className="max-w-[160px] truncate py-2 text-white/90">{r.exit}</td>
                    <td className="py-2 text-right tabular-nums text-haze">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Recent sessions">
        {journeys.length === 0 ? (
          <EmptyState>No sessions recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {journeys.map((j) => (
              <li key={j.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-haze">
                  <span className="text-white/80">
                    {new Date(j.startedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>{j.device}</span>
                  <span>{j.browser}</span>
                  {j.country ? <span>{j.country}</span> : null}
                  {j.utmSource ? <span className="text-accent">utm: {j.utmSource}</span> : null}
                  {j.referrer ? (
                    <span className="max-w-[220px] truncate">from {j.referrer}</span>
                  ) : (
                    <span>direct</span>
                  )}
                  <span>{fmtDuration(j.totalMs)}</span>
                  {j.converted ? (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-semibold text-emerald-300">
                      LEAD
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                  {j.steps.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 ? <span className="text-haze/50">→</span> : null}
                      <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-white/90">
                        {s.path}
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
