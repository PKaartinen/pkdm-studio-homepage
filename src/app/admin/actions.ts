"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

/**
 * Server actions for the CRM side of the admin (leads, clients, projects,
 * tasks). Auth is enforced by middleware on all /admin routes, which includes
 * these action invocations.
 */

const s = (fd: FormData, key: string, max = 2000) =>
  String(fd.get(key) ?? "").slice(0, max);
const n = (fd: FormData, key: string) => {
  const v = Number(fd.get(key));
  return Number.isFinite(v) && v > 0 ? v : null;
};
const d = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

// ---- Leads -----------------------------------------------------------------

export async function updateLead(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`
    UPDATE leads SET status = ${s(fd, "status", 30)}, notes = ${s(fd, "notes")}
    WHERE id = ${id}
  `;
  revalidatePath("/admin/leads");
}

export async function deleteLead(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`DELETE FROM leads WHERE id = ${id}`;
  revalidatePath("/admin/leads");
}

export async function convertLeadToClient(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  const [lead] = await sql`SELECT name, email, message FROM leads WHERE id = ${id}`;
  if (lead) {
    await sql`
      INSERT INTO clients (name, email, status, notes)
      VALUES (${String(lead.name)}, ${String(lead.email)}, 'active',
              ${"From lead #" + id + ": " + String(lead.message ?? "").slice(0, 500)})
    `;
    await sql`UPDATE leads SET status = 'won' WHERE id = ${id}`;
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
}

// ---- Clients ----------------------------------------------------------------

export async function createClient(fd: FormData) {
  const name = s(fd, "name", 200).trim();
  if (!name) return;
  await sql`
    INSERT INTO clients (name, company, email, phone, status, notes)
    VALUES (${name}, ${s(fd, "company", 200)}, ${s(fd, "email", 200)},
            ${s(fd, "phone", 50)}, ${s(fd, "status", 30) || "lead"}, ${s(fd, "notes")})
  `;
  revalidatePath("/admin/clients");
}

export async function updateClient(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`
    UPDATE clients SET
      name = ${s(fd, "name", 200)}, company = ${s(fd, "company", 200)},
      email = ${s(fd, "email", 200)}, phone = ${s(fd, "phone", 50)},
      status = ${s(fd, "status", 30)}, notes = ${s(fd, "notes")}
    WHERE id = ${id}
  `;
  revalidatePath("/admin/clients");
}

export async function deleteClient(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`DELETE FROM clients WHERE id = ${id}`;
  revalidatePath("/admin/clients");
  revalidatePath("/admin/projects");
}

// ---- Projects ----------------------------------------------------------------

export async function createProject(fd: FormData) {
  const name = s(fd, "name", 200).trim();
  if (!name) return;
  await sql`
    INSERT INTO projects (name, client_id, status, budget, due_date, notes)
    VALUES (${name}, ${n(fd, "client_id")}, ${s(fd, "status", 30) || "planning"},
            ${s(fd, "budget", 100)}, ${d(fd, "due_date")}, ${s(fd, "notes")})
  `;
  revalidatePath("/admin/projects");
}

export async function updateProject(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`
    UPDATE projects SET
      name = ${s(fd, "name", 200)}, client_id = ${n(fd, "client_id")},
      status = ${s(fd, "status", 30)}, budget = ${s(fd, "budget", 100)},
      due_date = ${d(fd, "due_date")}, notes = ${s(fd, "notes")}
    WHERE id = ${id}
  `;
  revalidatePath("/admin/projects");
  revalidatePath("/admin/work");
}

export async function deleteProject(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`DELETE FROM projects WHERE id = ${id}`;
  revalidatePath("/admin/projects");
  revalidatePath("/admin/work");
}

// ---- Tasks (work board) --------------------------------------------------------

export async function createTask(fd: FormData) {
  const title = s(fd, "title", 300).trim();
  if (!title) return;
  await sql`
    INSERT INTO tasks (title, project_id, priority, due_date, status)
    VALUES (${title}, ${n(fd, "project_id")}, ${s(fd, "priority", 20) || "medium"},
            ${d(fd, "due_date")}, 'todo')
  `;
  revalidatePath("/admin/work");
}

export async function setTaskStatus(fd: FormData) {
  const id = n(fd, "id");
  const status = s(fd, "status", 20);
  if (!id || !["todo", "doing", "done"].includes(status)) return;
  await sql`
    UPDATE tasks SET status = ${status},
      completed_at = ${status === "done" ? new Date().toISOString() : null}
    WHERE id = ${id}
  `;
  revalidatePath("/admin/work");
}

export async function deleteTask(fd: FormData) {
  const id = n(fd, "id");
  if (!id) return;
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  revalidatePath("/admin/work");
}
