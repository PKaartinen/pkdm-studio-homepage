"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionButton, ActionForm, DirtyHint, SubmitButton } from "../_components/ActionForm";
import { CopyButton } from "../_components/Bits";
import { Chip, Field, FilterTabs, NewPanelToggle, SearchBox, Toolbar, inputCls } from "../_components/Fields";
import { createClient, deleteClient, updateClient } from "../actions";

export type ClientRow = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  createdAt: string;
  projects: number;
  activeProjects: number;
  projectNames: string;
};

const STATUSES = [
  { key: "active", label: "Active", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300", dot: "bg-emerald-300" },
  { key: "lead", label: "Lead", chip: "border-accent/25 bg-accent/10 text-accent", dot: "bg-accent" },
  { key: "on hold", label: "On hold", chip: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300", dot: "bg-yellow-300" },
  { key: "past", label: "Past", chip: "border-white/10 bg-white/[0.04] text-haze", dot: "bg-haze" },
] as const;
const meta = (k: string) => STATUSES.find((s) => s.key === k) ?? STATUSES[1];

function ClientFields({ c }: { c?: ClientRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Name" hint="required">
        <input name="name" defaultValue={c?.name} required placeholder="Jane Doe" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Company">
        <input name="company" defaultValue={c?.company} placeholder="Acme Ltd" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={c?.email} placeholder="jane@acme.com" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Phone">
        <input name="phone" defaultValue={c?.phone} placeholder="+372 …" className={inputCls} autoComplete="off" />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={c?.status ?? "lead"} className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" className="sm:col-span-2 lg:col-span-5">
        <textarea
          name="notes"
          defaultValue={c?.notes}
          rows={2}
          placeholder="Context, preferences, billing details…"
          className={`${inputCls} resize-y`}
        />
      </Field>
    </div>
  );
}

function ClientCard({ c }: { c: ClientRow }) {
  const [editing, setEditing] = useState(false);
  const m = meta(c.status);
  const since = c.createdAt
    ? new Date(c.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "";

  return (
    <article className="admin-rise rounded-2xl border border-white/[0.08] bg-ink-900/70 transition-colors hover:border-white/[0.14]">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-display text-sm font-semibold text-white">
          {(c.company || c.name).slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-display text-base font-semibold text-white">{c.name}</h2>
            {c.company ? <span className="text-sm text-haze">{c.company}</span> : null}
            <Chip className={m.chip}>
              <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
              {m.label}
            </Chip>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {c.email ? (
              <span className="inline-flex items-center gap-1">
                <a href={`mailto:${c.email}`} className="text-accent-soft hover:text-accent hover:underline">
                  {c.email}
                </a>
                <CopyButton value={c.email} label="" toastTitle="Email copied" />
              </span>
            ) : null}
            {c.phone ? (
              <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="text-haze hover:text-white">
                {c.phone}
              </a>
            ) : null}
            <span className="text-xs text-haze/70">
              <Link href="/admin/projects" className="hover:text-white" title={c.projectNames || undefined}>
                {c.projects} project{c.projects === 1 ? "" : "s"}
                {c.activeProjects ? ` · ${c.activeProjects} active` : ""}
              </Link>
              {since ? ` · since ${since}` : ""}
            </span>
          </div>
          {c.notes && !editing ? (
            <p className="mt-2 line-clamp-2 max-w-3xl whitespace-pre-wrap text-sm text-white/70">{c.notes}</p>
          ) : null}
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
            action={deleteClient}
            fields={{ id: c.id }}
            variant="danger"
            pendingLabel="Deleting"
            confirm={{
              title: `Delete ${c.name}?`,
              body: c.projects
                ? `Their ${c.projects} project${c.projects === 1 ? "" : "s"} will be kept but no longer linked to a client.`
                : "This client record and its notes will be removed for good.",
              confirmLabel: "Delete client",
            }}
          >
            Delete
          </ActionButton>
        </div>
      </div>
      {editing ? (
        <div className="admin-rise border-t border-white/[0.06] p-5">
          <ActionForm action={updateClient} onSuccess={() => setEditing(false)} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <ClientFields c={c} />
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

export default function ClientsView({ clients }: { clients: ClientRow[] }) {
  const [adding, setAdding] = useState(clients.length === 0);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: clients.length };
    for (const x of clients) c[x.status] = (c[x.status] ?? 0) + 1;
    return c;
  }, [clients]);

  const shown = clients.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    const n = q.trim().toLowerCase();
    return !n || [c.name, c.company, c.email, c.notes].some((f) => f.toLowerCase().includes(n));
  });

  return (
    <>
      <Toolbar>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: "all", label: "All", count: counts.all },
            ...STATUSES.map((s) => ({ key: s.key as string, label: s.label, count: counts[s.key] ?? 0, dot: s.dot })),
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <SearchBox value={q} onChange={setQ} placeholder="Search clients" />
          <NewPanelToggle open={adding} onToggle={() => setAdding((v) => !v)} label="New client" />
        </div>
      </Toolbar>

      {adding ? (
        <div className="admin-rise mb-5 rounded-2xl border border-accent/20 bg-ink-900/70 p-5">
          <p className="mb-4 font-display text-sm font-semibold text-white">New client</p>
          <ActionForm action={createClient} resetOnSuccess focusAfterReset="name" className="space-y-3">
            <ClientFields />
            <div className="flex items-center justify-end gap-3">
              <DirtyHint />
              <SubmitButton pendingLabel="Adding">Add client</SubmitButton>
            </div>
          </ActionForm>
        </div>
      ) : null}

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
          No clients yet. Add one above, or use <span className="text-white">Make client</span> on a lead.
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
          No clients match.{" "}
          <button type="button" onClick={() => (setQ(""), setFilter("all"))} className="text-accent hover:text-accent-soft">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((c) => (
            <ClientCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </>
  );
}
