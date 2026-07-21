import { hasDb, sql } from "@/lib/db";
import { Card, EmptyState, PageHeader, btnCls, btnGhostCls, inputCls } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { convertLeadToClient, deleteLead, updateLead } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "proposal", "won", "lost"] as const;

const statusColor: Record<string, string> = {
  new: "bg-accent/15 text-accent",
  contacted: "bg-yellow-400/15 text-yellow-300",
  proposal: "bg-purple-400/15 text-purple-300",
  won: "bg-emerald-400/15 text-emerald-300",
  lost: "bg-red-400/15 text-red-300",
};

export default async function LeadsPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Leads" />
        <NoDb />
      </>
    );
  }

  const leads = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every contact form submission is captured here automatically (alongside the email you already receive). Track each one from first contact to won or lost."
      />

      {leads.length === 0 ? (
        <EmptyState>
          No leads yet. New contact form submissions will appear here automatically.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const id = Number(lead.id);
            const status = String(lead.status);
            return (
              <Card key={id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-base font-semibold text-white">
                        {String(lead.name) || "(no name)"}
                      </p>
                      <a
                        href={`mailto:${String(lead.email)}`}
                        className="text-sm text-accent hover:underline"
                      >
                        {String(lead.email)}
                      </a>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[status] ?? "bg-white/10 text-white"}`}
                      >
                        {status}
                      </span>
                      <span className="text-xs text-haze">
                        {new Date(String(lead.created_at)).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {String(lead.source_path) ? ` · via ${String(lead.source_path)}` : ""}
                      </span>
                    </div>
                    {String(lead.help) ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-haze">
                        Needs: <span className="text-white/80">{String(lead.help)}</span>
                      </p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                      {String(lead.message)}
                    </p>
                  </div>

                  <div className="w-full max-w-xs space-y-2">
                    <form action={updateLead} className="space-y-2">
                      <input type="hidden" name="id" value={id} />
                      <select name="status" defaultValue={status} className={inputCls}>
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="notes"
                        defaultValue={String(lead.notes)}
                        placeholder="Notes (calls, follow-ups…)"
                        rows={2}
                        className={inputCls}
                      />
                      <button className={`${btnCls} w-full`}>Save</button>
                    </form>
                    <div className="flex gap-2">
                      <form action={convertLeadToClient} className="flex-1">
                        <input type="hidden" name="id" value={id} />
                        <button className="w-full rounded-lg border border-emerald-400/30 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-400/10">
                          → Client
                        </button>
                      </form>
                      <form action={deleteLead}>
                        <input type="hidden" name="id" value={id} />
                        <button className={btnGhostCls}>Delete</button>
                      </form>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
