"use client";

import { useMemo, useState } from "react";
import { ActionButton, ActionForm, SubmitButton, toFormData, useAction } from "../_components/ActionForm";
import { Chip, TONE_CHIP, Toolbar, inputCls } from "../_components/Fields";
import { dueLabel } from "../_lib/format";
import { createTask, deleteTask, setTaskStatus } from "../actions";

export type TaskRow = {
  id: number;
  title: string;
  status: string;
  priority: string;
  due: string;
  notes: string;
  projectId: number | null;
  projectName: string;
  completedAt: string | null;
};
type ProjectOpt = { id: number; name: string; closed: boolean };

const COLUMNS = [
  { key: "todo", label: "To do", dot: "bg-white/60" },
  { key: "doing", label: "In progress", dot: "bg-accent" },
  { key: "done", label: "Done", dot: "bg-emerald-300" },
] as const;

const PRIORITY: Record<string, string> = {
  high: "border-red-400/30 bg-red-400/10 text-red-300",
  medium: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
  low: "border-white/10 text-haze",
};

const sel = inputCls.replace("w-full", "w-auto");

function TaskCard({ t }: { t: TaskRow }) {
  const { run } = useAction();
  const idx = COLUMNS.findIndex((c) => c.key === t.status);
  const prev = COLUMNS[idx - 1];
  const next = COLUMNS[idx + 1];
  const due = t.due && t.status !== "done" ? dueLabel(t.due) : null;
  const done = t.status === "done";

  return (
    <div
      className={`admin-rise group rounded-xl border bg-ink-950/60 p-3 transition-colors hover:border-white/[0.16] ${
        due?.tone === "red" ? "border-red-400/25" : "border-white/[0.07]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <ActionButton
          action={setTaskStatus}
          fields={{ id: t.id, status: done ? "todo" : "done" }}
          variant="subtle"
          size="sm"
          title={done ? "Mark as not done" : "Mark as done"}
          className={`!mt-0.5 !h-5 !w-5 !rounded-full !p-0 border ${
            done ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-200" : "border-white/20 text-transparent hover:border-emerald-400/60 hover:text-emerald-300"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </ActionButton>
        <p className={`min-w-0 flex-1 text-sm leading-snug ${done ? "text-haze line-through decoration-white/20" : "text-white/90"}`}>
          {t.title}
        </p>
        <button
          type="button"
          title="Delete task"
          onClick={async () => {
            const r = await run(deleteTask, toFormData({ id: t.id }), {
              extras: (res) => {
                const restore = res.ok ? (res.data as { restore?: Record<string, string> } | undefined)?.restore : undefined;
                return restore
                  ? {
                      action: {
                        label: "Undo",
                        onClick: () => void run(createTask, toFormData({ ...restore, restore: "1" })),
                      },
                    }
                  : undefined;
              },
            });
            void r;
          }}
          className="shrink-0 rounded-md p-1 text-haze/40 opacity-100 transition-all hover:bg-red-400/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[1.875rem] text-[11px]">
        <Chip className={PRIORITY[t.priority] ?? PRIORITY.low}>{t.priority}</Chip>
        {t.projectName ? <span className="max-w-[10rem] truncate text-haze">{t.projectName}</span> : null}
        {due ? <Chip className={TONE_CHIP[due.tone]}>{due.text}</Chip> : null}
      </div>
      <div className="mt-2.5 flex gap-1.5 pl-[1.875rem]">
        {prev ? (
          <ActionButton action={setTaskStatus} fields={{ id: t.id, status: prev.key }} size="sm" variant="ghost" title={`Move to ${prev.label}`}>
            ← {prev.label}
          </ActionButton>
        ) : null}
        {next ? (
          <ActionButton action={setTaskStatus} fields={{ id: t.id, status: next.key }} size="sm" variant="ghost" title={`Move to ${next.label}`}>
            {next.label} →
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

export default function WorkBoard({
  tasks,
  projects,
  initialProject,
}: {
  tasks: TaskRow[];
  projects: ProjectOpt[];
  initialProject: number | null;
}) {
  const [projectFilter, setProjectFilter] = useState<number | "all" | "none">(initialProject ?? "all");
  const [showAllDone, setShowAllDone] = useState(false);

  const filtered = useMemo(
    () =>
      tasks.filter((t) =>
        projectFilter === "all" ? true : projectFilter === "none" ? t.projectId === null : t.projectId === projectFilter
      ),
    [tasks, projectFilter]
  );

  const overdue = filtered.filter((t) => t.status !== "done" && t.due && dueLabel(t.due).tone === "red").length;
  const today = filtered.filter((t) => t.status !== "done" && t.due && dueLabel(t.due).text === "Due today").length;

  return (
    <>
      <div className="admin-rise mb-4 rounded-2xl border border-white/[0.08] bg-ink-900/70 p-4">
        <ActionForm action={createTask} resetOnSuccess focusAfterReset="title" className="flex flex-col gap-2 lg:flex-row">
          <input
            name="title"
            required
            placeholder="Add a task and press Enter…"
            className={`${inputCls} lg:flex-1`}
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            <select
              name="project_id"
              defaultValue={typeof projectFilter === "number" ? projectFilter : ""}
              key={String(projectFilter)}
              className={`${sel} min-w-0 flex-1 lg:max-w-[12rem]`}
              aria-label="Project"
            >
              <option value="">No project</option>
              {projects
                .filter((p) => !p.closed)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select name="priority" defaultValue="medium" className={sel} aria-label="Priority">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input name="due_date" type="date" className={sel} aria-label="Due date" />
            <SubmitButton pendingLabel="Adding">Add task</SubmitButton>
          </div>
        </ActionForm>
      </div>

      <Toolbar>
        <div className="flex flex-wrap items-center gap-3 text-xs text-haze">
          <label className="inline-flex items-center gap-2">
            <span>Project</span>
            <select
              value={String(projectFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setProjectFilter(v === "all" || v === "none" ? v : Number(v));
              }}
              className={`${sel} !py-1.5 text-xs`}
            >
              <option value="all">All projects</option>
              <option value="none">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.closed ? " (closed)" : ""}
                </option>
              ))}
            </select>
          </label>
          {overdue ? <Chip className={TONE_CHIP.red}>{overdue} overdue</Chip> : null}
          {today ? <Chip className={TONE_CHIP.amber}>{today} due today</Chip> : null}
        </div>
      </Toolbar>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          let colTasks = filtered.filter((t) => t.status === col.key);
          const total = colTasks.length;
          if (col.key === "done") {
            colTasks = [...colTasks].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
            if (!showAllDone) colTasks = colTasks.slice(0, 12);
          }
          return (
            <section key={col.key} className="rounded-2xl border border-white/[0.08] bg-ink-900/50 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-haze">
                <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                {col.label}
                <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] tabular-nums text-haze">{total}</span>
              </h2>
              {colTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-haze/70">
                  {col.key === "todo" ? "Nothing queued. Add a task above." : col.key === "doing" ? "Nothing in progress." : "Nothing finished yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {colTasks.map((t) => (
                    <TaskCard key={t.id} t={t} />
                  ))}
                </div>
              )}
              {col.key === "done" && total > 12 ? (
                <button type="button" onClick={() => setShowAllDone((v) => !v)} className="mt-3 w-full text-center text-xs text-accent hover:text-accent-soft">
                  {showAllDone ? "Show recent only" : `Show all ${total}`}
                </button>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
