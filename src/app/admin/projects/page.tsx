import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { PageHeader } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { iso, num, txt, ymd } from "../_lib/format";
import ProjectsView, { type ProjectRow } from "./ProjectsView";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Projects" />
        <NoDb />
      </>
    );
  }

  const [rows, clients] = await withSchema(() =>
    Promise.all([
      sql`
        SELECT p.*, c.name AS client_name,
          (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status <> 'done') AS open_tasks,
          (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) AS all_tasks
        FROM projects p LEFT JOIN clients c ON c.id = p.client_id
        ORDER BY (p.status = 'archived'), (p.status = 'delivered'), p.due_date NULLS LAST, p.created_at DESC
      `,
      sql`SELECT id, name FROM clients ORDER BY name`,
    ])
  );

  const projects: ProjectRow[] = rows.map((p) => ({
    id: num(p.id),
    name: txt(p.name),
    status: txt(p.status) || "planning",
    clientId: p.client_id == null ? null : num(p.client_id),
    clientName: txt(p.client_name),
    budget: txt(p.budget),
    due: ymd(p.due_date),
    notes: txt(p.notes),
    createdAt: iso(p.created_at) ?? "",
    openTasks: num(p.open_tasks),
    allTasks: num(p.all_tasks),
  }));

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every engagement with its client, status, budget and deadline. Overdue and due-soon work is flagged."
      />
      <ProjectsView
        projects={projects}
        clients={clients.map((c) => ({ id: num(c.id), name: txt(c.name) }))}
      />
    </>
  );
}
