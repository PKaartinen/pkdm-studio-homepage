import { hasDb, sql } from "@/lib/db";
import { Card, EmptyState, PageHeader, btnCls, btnGhostCls, inputCls } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { createProject, deleteProject, updateProject } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["planning", "in progress", "review", "delivered", "maintenance", "archived"] as const;

const statusColor: Record<string, string> = {
  planning: "bg-white/10 text-white",
  "in progress": "bg-accent/15 text-accent",
  review: "bg-yellow-400/15 text-yellow-300",
  delivered: "bg-emerald-400/15 text-emerald-300",
  maintenance: "bg-purple-400/15 text-purple-300",
  archived: "bg-white/5 text-haze",
};

export default async function ProjectsPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Projects" />
        <NoDb />
      </>
    );
  }

  const [projects, clients] = await Promise.all([
    sql`
      SELECT p.*, c.name AS client_name,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status <> 'done') AS open_tasks
      FROM projects p LEFT JOIN clients c ON c.id = p.client_id
      ORDER BY (p.status = 'archived'), p.created_at DESC
    `,
    sql`SELECT id, name FROM clients ORDER BY name`,
  ]);

  const clientOptions = (
    <>
      <option value="">— no client —</option>
      {clients.map((c) => (
        <option key={Number(c.id)} value={Number(c.id)}>
          {String(c.name)}
        </option>
      ))}
    </>
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every engagement, linked to its client, with status, budget and deadline."
      />

      <Card title="Add a project" className="mb-4">
        <form action={createProject} className="grid gap-2 md:grid-cols-6">
          <input
            name="name"
            placeholder="Project name *"
            required
            className={`${inputCls} md:col-span-2`}
          />
          <select name="client_id" className={inputCls}>
            {clientOptions}
          </select>
          <select name="status" defaultValue="planning" className={inputCls}>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <input name="budget" placeholder="Budget (e.g. €3,500)" className={inputCls} />
          <input name="due_date" type="date" className={inputCls} />
          <textarea
            name="notes"
            placeholder="Scope / notes"
            rows={1}
            className={`${inputCls} md:col-span-5`}
          />
          <button className={btnCls}>Add project</button>
        </form>
      </Card>

      {projects.length === 0 ? (
        <EmptyState>No projects yet — add your first one above.</EmptyState>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const id = Number(p.id);
            const status = String(p.status);
            const due = p.due_date ? String(p.due_date).slice(0, 10) : "";
            const overdue = due && status !== "delivered" && status !== "archived" && due < new Date().toISOString().slice(0, 10);
            return (
              <Card key={id}>
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${statusColor[status] ?? "bg-white/10 text-white"}`}
                  >
                    {status}
                  </span>
                  {p.client_name ? (
                    <span className="text-haze">
                      for <span className="text-white/80">{String(p.client_name)}</span>
                    </span>
                  ) : null}
                  <span className="text-haze">
                    {Number(p.open_tasks)} open task{Number(p.open_tasks) === 1 ? "" : "s"}
                  </span>
                  {overdue ? (
                    <span className="rounded-full bg-red-400/15 px-2 py-0.5 font-semibold text-red-300">
                      OVERDUE
                    </span>
                  ) : null}
                </div>
                <form action={updateProject} className="grid gap-2 md:grid-cols-6">
                  <input type="hidden" name="id" value={id} />
                  <input
                    name="name"
                    defaultValue={String(p.name)}
                    className={`${inputCls} md:col-span-2`}
                  />
                  <select
                    name="client_id"
                    defaultValue={p.client_id ? Number(p.client_id) : ""}
                    className={inputCls}
                  >
                    {clientOptions}
                  </select>
                  <select name="status" defaultValue={status} className={inputCls}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    name="budget"
                    defaultValue={String(p.budget)}
                    placeholder="Budget"
                    className={inputCls}
                  />
                  <input name="due_date" type="date" defaultValue={due} className={inputCls} />
                  <textarea
                    name="notes"
                    defaultValue={String(p.notes)}
                    placeholder="Scope / notes"
                    rows={1}
                    className={`${inputCls} md:col-span-5`}
                  />
                  <div className="flex gap-2">
                    <button className={`${btnCls} flex-1`}>Save</button>
                    <button formAction={deleteProject} className={btnGhostCls}>
                      Delete
                    </button>
                  </div>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
