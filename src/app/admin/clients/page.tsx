import { hasDb, sql } from "@/lib/db";
import { Card, EmptyState, PageHeader, btnCls, btnGhostCls, inputCls } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { createClient, deleteClient, updateClient } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["lead", "active", "past", "on hold"] as const;

export default async function ClientsPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Clients" />
        <NoDb />
      </>
    );
  }

  const clients = await sql`
    SELECT c.*,
      (SELECT count(*) FROM projects p WHERE p.client_id = c.id) AS project_count
    FROM clients c ORDER BY c.created_at DESC
  `;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Your client book — contact details, status, and notes in one place."
      />

      <Card title="Add a client" className="mb-4">
        <form action={createClient} className="grid gap-2 md:grid-cols-5">
          <input name="name" placeholder="Name *" required className={inputCls} />
          <input name="company" placeholder="Company" className={inputCls} />
          <input name="email" type="email" placeholder="Email" className={inputCls} />
          <input name="phone" placeholder="Phone" className={inputCls} />
          <select name="status" defaultValue="lead" className={inputCls}>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <textarea
            name="notes"
            placeholder="Notes"
            rows={1}
            className={`${inputCls} md:col-span-4`}
          />
          <button className={btnCls}>Add client</button>
        </form>
      </Card>

      {clients.length === 0 ? (
        <EmptyState>No clients yet — add your first one above.</EmptyState>
      ) : (
        <div className="space-y-4">
          {clients.map((c) => {
            const id = Number(c.id);
            return (
              <Card key={id}>
                <form action={updateClient} className="grid gap-2 md:grid-cols-6">
                  <input type="hidden" name="id" value={id} />
                  <input name="name" defaultValue={String(c.name)} className={inputCls} />
                  <input
                    name="company"
                    defaultValue={String(c.company)}
                    placeholder="Company"
                    className={inputCls}
                  />
                  <input
                    name="email"
                    defaultValue={String(c.email)}
                    placeholder="Email"
                    className={inputCls}
                  />
                  <input
                    name="phone"
                    defaultValue={String(c.phone)}
                    placeholder="Phone"
                    className={inputCls}
                  />
                  <select name="status" defaultValue={String(c.status)} className={inputCls}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <p className="self-center text-xs text-haze">
                    {Number(c.project_count)} project{Number(c.project_count) === 1 ? "" : "s"} ·
                    since{" "}
                    {new Date(String(c.created_at)).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <textarea
                    name="notes"
                    defaultValue={String(c.notes)}
                    placeholder="Notes"
                    rows={1}
                    className={`${inputCls} md:col-span-5`}
                  />
                  <div className="flex gap-2">
                    <button className={`${btnCls} flex-1`}>Save</button>
                    <button formAction={deleteClient} className={btnGhostCls}>
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
