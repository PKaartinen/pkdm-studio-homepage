"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { isSchemaDriftError, withSchema } from "@/lib/schema";
import { sendLeadNotification } from "@/lib/leadMail";
import { AdminAuthError, requireAdmin } from "./_lib/guard";
import { fail, ok, type ActionResult } from "./_lib/result";

/**
 * Server actions for the CRM side of the admin (leads, clients, projects,
 * tasks). Every action re-checks the admin session, validates its input and
 * returns an ActionResult, so the UI can always say what happened.
 */

const s = (fd: FormData, key: string, max = 2000) =>
  String(fd.get(key) ?? "").trim().slice(0, max);
const n = (fd: FormData, key: string) => {
  const v = Number(fd.get(key));
  return Number.isFinite(v) && v > 0 ? v : null;
};
const d = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LEAD_STATUSES = ["new", "contacted", "proposal", "won", "lost"];
const CLIENT_STATUSES = ["lead", "active", "past", "on hold"];
const PROJECT_STATUSES = ["planning", "in progress", "review", "delivered", "maintenance", "archived"];
const TASK_STATUSES = ["todo", "doing", "done"];
const PRIORITIES = ["high", "medium", "low"];

/** Runs an action body with auth, schema self-healing and friendly errors. */
async function run<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
    return await withSchema(body);
  } catch (err) {
    if (err instanceof AdminAuthError) return fail(err.message);
    console.error("admin action failed", err);
    if (isSchemaDriftError(err)) {
      return fail("The database tables aren't set up yet. Open Overview and run Initialize database.");
    }
    return fail("The database didn't accept that change. Please try again in a moment.");
  }
}

function touchLeads() {
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

// ---- Leads -----------------------------------------------------------------

export async function setLeadStatus(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    const status = s(fd, "status", 30);
    if (!id) return fail("That lead no longer exists. Reload the page.");
    if (!LEAD_STATUSES.includes(status)) return fail("Unknown status.");
    const [prev] = await sql`SELECT status, name FROM leads WHERE id = ${id}`;
    if (!prev) return fail("That lead no longer exists. Reload the page.");
    await sql`
      UPDATE leads SET status = ${status}, updated_at = now(),
        contacted_at = CASE
          WHEN ${status} <> 'new' AND contacted_at IS NULL THEN now()
          WHEN ${status} = 'new' THEN NULL
          ELSE contacted_at END
      WHERE id = ${id}
    `;
    touchLeads();
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return ok(`${String(prev.name) || "Lead"} moved to ${label}`, { prev: String(prev.status) });
  });
}

export async function saveLeadNotes(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That lead no longer exists. Reload the page.");
    const rows = await sql`
      UPDATE leads SET notes = ${s(fd, "notes", 8000)}, updated_at = now()
      WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) return fail("That lead no longer exists. Reload the page.");
    touchLeads();
    return ok("Notes saved");
  });
}

export async function resendLeadEmail(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That lead no longer exists. Reload the page.");
    const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`;
    if (!lead) return fail("That lead no longer exists. Reload the page.");
    const mail = await sendLeadNotification(
      {
        id,
        name: String(lead.name),
        email: String(lead.email),
        help: String(lead.help),
        message: String(lead.message),
        path: String(lead.source_path),
        createdAt: new Date(String(lead.created_at)),
      },
      { retry: true }
    );
    await sql`
      UPDATE leads SET email_status = ${mail.status},
        email_error = ${mail.status === "sent" ? "" : mail.error}
      WHERE id = ${id}
    `;
    touchLeads();
    if (mail.status === "sent") return ok(`Notification sent to ${mail.to.length} inbox${mail.to.length === 1 ? "" : "es"}`);
    if (mail.status === "skipped") return fail(`Email isn't set up yet: ${mail.error}.`);
    return fail(`Email failed: ${mail.error}`);
  });
}

export async function deleteLead(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That lead no longer exists. Reload the page.");
    const [row] = await sql`DELETE FROM leads WHERE id = ${id} RETURNING name`;
    if (!row) return fail("That lead was already deleted.");
    touchLeads();
    return ok(`Deleted lead from ${String(row.name) || "unknown"}`);
  });
}

export async function convertLeadToClient(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That lead no longer exists. Reload the page.");
    const [lead] = await sql`SELECT name, email, help, message, client_id FROM leads WHERE id = ${id}`;
    if (!lead) return fail("That lead no longer exists. Reload the page.");

    // Re-use an existing client with the same email instead of duplicating.
    const email = String(lead.email);
    const [existing] = email
      ? await sql`SELECT id, name FROM clients WHERE lower(email) = lower(${email}) LIMIT 1`
      : [];
    let clientId: number;
    let message: string;
    if (existing) {
      clientId = Number(existing.id);
      message = `Linked to existing client ${String(existing.name)}`;
    } else {
      const [row] = await sql`
        INSERT INTO clients (name, email, status, notes)
        VALUES (${String(lead.name)}, ${email}, 'active',
                ${`From lead #${id} (${String(lead.help) || "enquiry"}): ${String(lead.message ?? "").slice(0, 500)}`})
        RETURNING id
      `;
      clientId = Number(row.id);
      message = `${String(lead.name)} is now a client`;
    }
    await sql`
      UPDATE leads SET status = 'won', client_id = ${clientId}, updated_at = now(),
        contacted_at = coalesce(contacted_at, now())
      WHERE id = ${id}
    `;
    touchLeads();
    revalidatePath("/admin/clients");
    return ok(message, { clientId });
  });
}

// ---- Clients ----------------------------------------------------------------

function clientFields(fd: FormData) {
  const name = s(fd, "name", 200);
  const email = s(fd, "email", 200);
  const status = s(fd, "status", 30) || "lead";
  if (!name) return { error: fail("Give the client a name.", "name") };
  if (email && !EMAIL_RE.test(email)) return { error: fail("That email address doesn't look right.", "email") };
  if (!CLIENT_STATUSES.includes(status)) return { error: fail("Unknown status.", "status") };
  return {
    v: {
      name,
      email,
      status,
      company: s(fd, "company", 200),
      phone: s(fd, "phone", 50),
      notes: s(fd, "notes", 8000),
    },
  };
}

export async function createClient(fd: FormData) {
  return run(async () => {
    const f = clientFields(fd);
    if (f.error) return f.error;
    const c = f.v;
    await sql`
      INSERT INTO clients (name, company, email, phone, status, notes)
      VALUES (${c.name}, ${c.company}, ${c.email}, ${c.phone}, ${c.status}, ${c.notes})
    `;
    revalidatePath("/admin/clients");
    return ok(`Added ${c.name}`);
  });
}

export async function updateClient(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That client no longer exists. Reload the page.");
    const f = clientFields(fd);
    if (f.error) return f.error;
    const c = f.v;
    const rows = await sql`
      UPDATE clients SET name = ${c.name}, company = ${c.company}, email = ${c.email},
        phone = ${c.phone}, status = ${c.status}, notes = ${c.notes}
      WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) return fail("That client no longer exists. Reload the page.");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/projects");
    return ok(`Saved ${c.name}`);
  });
}

export async function deleteClient(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That client no longer exists. Reload the page.");
    const [row] = await sql`DELETE FROM clients WHERE id = ${id} RETURNING name`;
    if (!row) return fail("That client was already deleted.");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/projects");
    return ok(`Deleted ${String(row.name)}`);
  });
}

// ---- Projects ----------------------------------------------------------------

function projectFields(fd: FormData) {
  const name = s(fd, "name", 200);
  const status = s(fd, "status", 30) || "planning";
  if (!name) return { error: fail("Give the project a name.", "name") };
  if (!PROJECT_STATUSES.includes(status)) return { error: fail("Unknown status.", "status") };
  return {
    v: {
      name,
      status,
      clientId: n(fd, "client_id"),
      budget: s(fd, "budget", 100),
      due: d(fd, "due_date"),
      notes: s(fd, "notes", 8000),
    },
  };
}

export async function createProject(fd: FormData) {
  return run(async () => {
    const f = projectFields(fd);
    if (f.error) return f.error;
    const p = f.v;
    await sql`
      INSERT INTO projects (name, client_id, status, budget, due_date, notes)
      VALUES (${p.name}, ${p.clientId}, ${p.status}, ${p.budget}, ${p.due}, ${p.notes})
    `;
    revalidatePath("/admin/projects");
    revalidatePath("/admin/work");
    return ok(`Added project ${p.name}`);
  });
}

export async function updateProject(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That project no longer exists. Reload the page.");
    const f = projectFields(fd);
    if (f.error) return f.error;
    const p = f.v;
    const rows = await sql`
      UPDATE projects SET name = ${p.name}, client_id = ${p.clientId}, status = ${p.status},
        budget = ${p.budget}, due_date = ${p.due}, notes = ${p.notes}
      WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) return fail("That project no longer exists. Reload the page.");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/work");
    revalidatePath("/admin");
    return ok(`Saved ${p.name}`);
  });
}

export async function setProjectStatus(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    const status = s(fd, "status", 30);
    if (!id) return fail("That project no longer exists. Reload the page.");
    if (!PROJECT_STATUSES.includes(status)) return fail("Unknown status.");
    const [row] = await sql`
      UPDATE projects SET status = ${status} WHERE id = ${id} RETURNING name
    `;
    if (!row) return fail("That project no longer exists. Reload the page.");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/work");
    revalidatePath("/admin");
    return ok(`${String(row.name)} is now ${status}`);
  });
}

export async function deleteProject(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That project no longer exists. Reload the page.");
    const [row] = await sql`DELETE FROM projects WHERE id = ${id} RETURNING name`;
    if (!row) return fail("That project was already deleted.");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/work");
    revalidatePath("/admin");
    return ok(`Deleted ${String(row.name)} and its tasks`);
  });
}

// ---- Tasks (work board) --------------------------------------------------------

export async function createTask(fd: FormData) {
  return run(async () => {
    const title = s(fd, "title", 300);
    const priority = s(fd, "priority", 20) || "medium";
    const status = s(fd, "status", 20) || "todo";
    if (!title) return fail("Describe the task first.", "title");
    if (!PRIORITIES.includes(priority) || !TASK_STATUSES.includes(status)) return fail("Unknown option.");
    await sql`
      INSERT INTO tasks (title, project_id, priority, due_date, status, notes, completed_at)
      VALUES (${title}, ${n(fd, "project_id")}, ${priority}, ${d(fd, "due_date")}, ${status},
              ${s(fd, "notes", 4000)}, ${status === "done" ? new Date().toISOString() : null})
    `;
    revalidatePath("/admin/work");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok(fd.get("restore") ? "Task restored" : `Added "${title.slice(0, 60)}"`);
  });
}

export async function setTaskStatus(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    const status = s(fd, "status", 20);
    if (!id) return fail("That task no longer exists. Reload the page.");
    if (!TASK_STATUSES.includes(status)) return fail("Unknown status.");
    const [row] = await sql`
      UPDATE tasks SET status = ${status},
        completed_at = ${status === "done" ? new Date().toISOString() : null}
      WHERE id = ${id} RETURNING title
    `;
    if (!row) return fail("That task no longer exists. Reload the page.");
    revalidatePath("/admin/work");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    const label = status === "done" ? "Done" : status === "doing" ? "In progress" : "To do";
    return ok(`${label}: ${String(row.title).slice(0, 60)}`);
  });
}

export async function deleteTask(fd: FormData) {
  return run(async () => {
    const id = n(fd, "id");
    if (!id) return fail("That task no longer exists. Reload the page.");
    const [row] = await sql`
      DELETE FROM tasks WHERE id = ${id}
      RETURNING title, project_id, priority, due_date, status, notes
    `;
    if (!row) return fail("That task was already deleted.");
    revalidatePath("/admin/work");
    revalidatePath("/admin/projects");
    revalidatePath("/admin");
    return ok(`Deleted "${String(row.title).slice(0, 60)}"`, {
      restore: {
        title: String(row.title),
        project_id: row.project_id == null ? "" : String(row.project_id),
        priority: String(row.priority),
        due_date: row.due_date ? new Date(String(row.due_date)).toISOString().slice(0, 10) : "",
        status: String(row.status),
        notes: String(row.notes ?? ""),
      },
    });
  });
}
