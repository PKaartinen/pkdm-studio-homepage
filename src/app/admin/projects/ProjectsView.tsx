"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  ActionForm,
  DirtyHint,
  Spinner,
  SubmitButton,
  toFormData,
  useAction,
} from "../_components/ActionForm";
import { Chip, Field, FilterTabs, NewPanelToggle, SearchBox, TONE_CHIP, Toolbar, inputCls } from "../_components/Fields";
import { dueLabel } from "../_lib/format";
import { createProject, deleteProject, setProjectStatus, updateProject } from "../actions";

export type ProjectRow = {
  id: number;
  name: string;
  status: string;
  clientId: number | null;
  clientName: string;
  budget: string;
  due: string;
  notes: string;
  createdAt: string;
  openTasks: number;
  allTasks: number;
};
type ClientOpt = { id: number; name: string };

const STATUSES = [
  { key: "planning", label: "Planning", chip: "border-white/15 bg-white/[0.05] text-white", dot: "bg-white/70" },
  { key: "in progress", label: "In progress", chip: "border-accent/25 bg-accent/10 text-accent", dot: "bg-accent" },
  { key: "review", label: "Review", chip: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300", dot: "bg-yellow-300" },
  { key: "delivered", label: "Delivered", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-300" },
  { key: "maintenance", label: "Maintenance", chip: "border-purple-400/25 bg-purple-400/10 text-purple-300", dot: "bg-purple-300" },
  { key: "archived", label: "Archived", chip: "border-white/10 text-haze", dot: "bg-haze/60" },
] as const;
const meta = (k: string) => STATUSES.find((s) => s.key === k) ?? STATUSES[0];
const ACTIVE = new Set(["planning", "in progress", "review", "maintenance"]);

function ProjectFields({ p, clients }: { p?: ProjectRow; clients: ClientOpt[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Field label="Project" hint="required" className="lg:col-span-2">
        <input name="name" defaultValue={p?.name} required placeholder="Marketing site rebuild" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Client">
        <select name="client_id" defaultValue={p?.clientId ?? ""} className={inputCls}>
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={p?.status ?? "planning"} className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Budget">
        <input name="budget" defaultValue={p?.budget} placeholder="e.g. 3,500 EUR" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Due date">
        <input name="due_date" type="date" defaultValue={p?.due} className={inputCls} />
      </Field>
      <Field label="Scope / notes" className="sm:col-span-2 lg:col-span-6">
        <textarea name="notes" defaultValue={p?.notes} rows={2} placeholder="What's in scope, links, decisions…" className={`${inputCls} resize-y`} />
      </Field>
    </div>
  );
}

function StatusSelect({ p }: { p: ProjectRow }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(p.status);
  useEffect(() => setValue(p.status), [p.status]);
  const m = meta(value);
  const change = async (next: string, isUndo = false) => {
    const before = value;
    setValue(next);
    const r = await run(setProjectStatus, toFormData({ id: p.id, status: next }), {
      extras: () => (isUndo ? undefined : { action: { label: "Undo", onClick: () => void change(before, true) } }),
    });
    if (!r.ok) setValue(before);
  };
  return (
    <label className={`relative inline-flex items-center rounded-full border pl-2.5 pr-1 text-[11px] font-semibold ${m.chip}`}>
      <span className="sr-only">Status</span>
      {pending ? <Spinner className="mr-1.5 h-2.5 w-2.5" /> : <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${m.dot}`} />}
      <select
        value={value}
        disabled={pending}
        onChange={(e) => void change(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-0.5 pr-5 focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key} className="bg-ink-900 text-white">
            {s.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-1.5 h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

function ProjectCard({ p, clients }: { p: ProjectRow; clients: ClientOpt[] }) {
  const [editing, setEditing] = useState(false);
  const done = p.status === "delivered" || p.status === "archived";
  const due = p.due && !done ? dueLabel(p.due) : null;
  const progress = p.allTasks ? Math.round(((p.allTasks - p.openTasks) / p.allTasks) * 100) : null;

  return (
    <article
      className={`admin-rise rounded-2xl border bg-ink-900/70 transition-colors hover:border-white/[0.14] ${
        due?.tone === "red" ? "border-red-400/25" : "border-white/[0.08]"
      } ${p.status === "archived" ? "opacity-70" : ""}`}
    >
      <div className="flex flex-wrap items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="font-display text-base font-semibold text-white">{p.name}</h2>
            <StatusSelect p={p} />
            {due ? <Chip className={TONE_CHIP[due.tone]}>{due.text}</Chip> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-haze">
            <span>
              {p.clientName ? (
                <>
                  for <span className="text-white/85">{p.clientName}</span>
                </>
              ) : (
                <span className="text-haze/60">No client linked</span>
              )}
            </span>
            {p.budget ? <span>Budget {p.budget}</span> : null}
            <Link href={`/admin/work?project=${p.id}`} className="hover:text-white">
              {p.openTasks} open task{p.openTasks === 1 ? "" : "s"}
            </Link>
          </div>
          {progress !== null ? (
            <div className="mt-3 flex max-w-xs items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[11px] tabular-nums text-haze">{progress}%</span>
            </div>
          ) : null}
          {p.notes && !editing ? <p className="mt-2 line-clamp-2 max-w-3xl whitespace-pre-wrap text-sm text-white/70">{p.notes}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-haze transition-colors hover:border-white/25 hover:text-white"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <ActionButton
            action={deleteProject}
            fields={{ id: p.id }}
            variant="danger"
            pendingLabel="Deleting"
            confirm={{
              title: `Delete ${p.name}?`,
              body: p.allTasks
                ? `Its ${p.allTasks} task${p.allTasks === 1 ? "" : "s"} on the work board will be deleted too. Consider Archived instead to keep the history.`
                : "The project and its notes will be removed for good. Consider Archived instead to keep the history.",
              confirmLabel: "Delete project",
            }}
          >
            Delete
          </ActionButton>
        </div>
      </div>
      {editing ? (
        <div className="admin-rise border-t border-white/[0.06] p-5">
          <ActionForm action={updateProject} onSuccess={() => setEditing(false)} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <ProjectFields p={p} clients={clients} />
            <div className="flex items-center justify-end gap-3">
              <DirtyHint />
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-haze hover:text-white">
                Cancel
              </button>
              <SubmitButton requireDirty pendingLabel="Saving">
                Save changes
              </SubmitButton>
            </div>
          </ActionForm>
        </div>
      ) : null}
    </article>
  );
}

export default function ProjectsView({ projects, clients }: { projects: ProjectRow[]; clients: ClientOpt[] }) {
  const [adding, setAdding] = useState(projects.length === 0);
  const [filter, setFilter] = useState<string>("active");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length, active: 0 };
    for (const p of projects) {
      c[p.status] = (c[p.status] ?? 0) + 1;
      if (ACTIVE.has(p.status)) c.active++;
    }
    return c;
  }, [projects]);

  const shown = projects.filter((p) => {
    if (filter === "active" ? !ACTIVE.has(p.status) : filter !== "all" && p.status !== filter) return false;
    const n = q.trim().toLowerCase();
    return !n || [p.name, p.clientName, p.notes, p.budget].some((f) => f.toLowerCase().includes(n));
  });

  return (
    <>
      <Toolbar>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: "active", label: "Active", count: counts.active },
            ...STATUSES.map((s) => ({ key: s.key as string, label: s.label, count: counts[s.key] ?? 0, dot: s.dot })),
            { key: "all", label: "All", count: counts.all },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <SearchBox value={q} onChange={setQ} placeholder="Search projects" />
          <NewPanelToggle open={adding} onToggle={() => setAdding((v) => !v)} label="New project" />
        </div>
      </Toolbar>

      {adding ? (
        <div className="admin-rise mb-5 rounded-2xl border border-accent/20 bg-ink-900/70 p-5">
          <p className="mb-4 font-display text-sm font-semibold text-white">New project</p>
          <ActionForm action={createProject} resetOnSuccess focusAfterReset="name" className="space-y-3">
            <ProjectFields clients={clients} />
            <div className="flex items-center justify-end gap-3">
              <DirtyHint />
              <SubmitButton pendingLabel="Adding">Add project</SubmitButton>
            </div>
          </ActionForm>
        </div>
      ) : null}

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
          No projects yet. Add your first one above.
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
          {filter === "active" && !q ? "Nothing active right now." : "No projects match."}{" "}
          <button type="button" onClick={() => (setQ(""), setFilter("all"))} className="text-accent hover:text-accent-soft">
            Show all
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <ProjectCard key={p.id} p={p} clients={clients} />
          ))}
        </div>
      )}
    </>
  );
}
