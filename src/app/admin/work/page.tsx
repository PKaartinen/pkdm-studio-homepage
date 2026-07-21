import { hasDb, sql } from "@/lib/db";
import { Card, EmptyState, PageHeader, btnCls, inputCls } from "../_components/ui";
import NoDb from "../_components/NoDb";
import { createTask, deleteTask, setTaskStatus } from "../actions";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
] as const;

const priorityColor: Record<string, string> = {
  high: "bg-red-400/15 text-red-300",
  medium: "bg-yellow-400/15 text-yellow-300",
  low: "bg-white/10 text-haze",
};

type TaskRow = Record<string, unknown>;

function TaskCard({ task }: { task: TaskRow }) {
  const id = Number(task.id);
  const status = String(task.status);
  const due = task.due_date ? String(task.due_date).slice(0, 10) : "";
  const overdue = due && status !== "done" && due < new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-3">
      <p className={`text-sm ${status === "done" ? "text-haze line-through" : "text-white/90"}`}>
        {String(task.title)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${priorityColor[String(task.priority)] ?? "bg-white/10 text-haze"}`}
        >
          {String(task.priority)}
        </span>
        {task.project_name ? (
          <span className="text-haze">{String(task.project_name)}</span>
        ) : null}
        {due ? (
          <span className={overdue ? "font-semibold text-red-300" : "text-haze"}>
            due {due}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex gap-1.5">
        {COLUMNS.filter((c) => c.key !== status).map((c) => (
          <form key={c.key} action={setTaskStatus}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={c.key} />
            <button className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-haze transition-colors hover:border-accent/40 hover:text-accent">
              → {c.label}
            </button>
          </form>
        ))}
        <form action={deleteTask} className="ml-auto">
          <input type="hidden" name="id" value={id} />
          <button className="rounded-md px-2 py-1 text-[11px] text-haze/60 transition-colors hover:text-red-300">
            ✕
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function WorkPage() {
  if (!hasDb()) {
    return (
      <>
        <PageHeader title="Work board" />
        <NoDb />
      </>
    );
  }

  const [tasks, projects] = await Promise.all([
    sql`
      SELECT t.*, p.name AS project_name
      FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY
        CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        t.due_date NULLS LAST, t.created_at DESC
    `,
    sql`SELECT id, name FROM projects WHERE status NOT IN ('archived', 'delivered') ORDER BY name`,
  ]);

  return (
    <>
      <PageHeader
        title="Work board"
        description="Everything on your plate, across all clients and projects. High-priority and overdue work floats to the top."
      />

      <Card title="Add a task" className="mb-4">
        <form action={createTask} className="grid gap-2 md:grid-cols-5">
          <input
            name="title"
            placeholder="What needs doing? *"
            required
            className={`${inputCls} md:col-span-2`}
          />
          <select name="project_id" className={inputCls}>
            <option value="">— no project —</option>
            {projects.map((p) => (
              <option key={Number(p.id)} value={Number(p.id)}>
                {String(p.name)}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue="medium" className={inputCls}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
          <div className="flex gap-2">
            <input name="due_date" type="date" className={inputCls} />
            <button className={btnCls}>Add</button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => String(t.status) === col.key);
          return (
            <Card key={col.key} title={`${col.label} (${colTasks.length})`}>
              {colTasks.length === 0 ? (
                <EmptyState>Nothing here.</EmptyState>
              ) : (
                <div className="space-y-2">
                  {colTasks.map((t) => (
                    <TaskCard key={Number(t.id)} task={t} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
