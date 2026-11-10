import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import { PageHeader } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { iso, num, txt, ymd } from "../_lib/format";
import WorkBoard, { type TaskRow } from "./WorkBoard";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Work board" />
        <NoDb />
      </>
    );
  }

  const [rows, projects] = await withSchema(() =>
    Promise.all([
      sql`
        SELECT t.*, p.name AS project_name
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        ORDER BY
          CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
          t.due_date NULLS LAST, t.created_at DESC
      `,
      sql`SELECT id, name, status FROM projects ORDER BY (status IN ('archived', 'delivered')), name`,
    ])
  );

  const tasks: TaskRow[] = rows.map((t) => ({
    id: num(t.id),
    title: txt(t.title),
    status: txt(t.status) || "todo",
    priority: txt(t.priority) || "medium",
    due: ymd(t.due_date),
    notes: txt(t.notes),
    projectId: t.project_id == null ? null : num(t.project_id),
    projectName: txt(t.project_name),
    completedAt: iso(t.completed_at),
  }));

  return (
    <>
      <PageHeader
        title="Work board"
        description="Everything on your plate across clients and projects. High priority and overdue work floats to the top."
      />
      <WorkBoard
        tasks={tasks}
        projects={projects.map((p) => ({
          id: num(p.id),
          name: txt(p.name),
          closed: ["archived", "delivered"].includes(txt(p.status)),
        }))}
        initialProject={Number(project) || null}
      />
    </>
  );
}
