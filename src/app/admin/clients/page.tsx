import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { PageHeader } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { iso, num, txt } from "../_lib/format";
import ClientsView, { type ClientRow } from "./ClientsView";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Clients" />
        <NoDb />
      </>
    );
  }

  const rows = await withSchema(
    () => sql`
      SELECT c.*,
        (SELECT count(*) FROM projects p WHERE p.client_id = c.id) AS project_count,
        (SELECT count(*) FROM projects p WHERE p.client_id = c.id
           AND p.status NOT IN ('delivered', 'archived')) AS active_projects,
        (SELECT string_agg(p.name, ', ' ORDER BY p.created_at DESC) FROM projects p WHERE p.client_id = c.id) AS project_names
      FROM clients c ORDER BY c.created_at DESC
    `
  );

  const clients: ClientRow[] = rows.map((c) => ({
    id: num(c.id),
    name: txt(c.name),
    company: txt(c.company),
    email: txt(c.email),
    phone: txt(c.phone),
    status: txt(c.status) || "lead",
    notes: txt(c.notes),
    createdAt: iso(c.created_at) ?? "",
    projects: num(c.project_count),
    activeProjects: num(c.active_projects),
    projectNames: txt(c.project_names),
  }));

  return (
    <>
      <PageHeader
        title="Clients"
        description="Your client book: who they are, how to reach them, and what you're building together."
      />
      <ClientsView clients={clients} />
    </>
  );
}
