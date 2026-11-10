"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionButton,
  ActionForm,
  DirtyHint,
  Spinner,
  SubmitButton,
  toFormData,
  useAction,
} from "../_components/ActionForm";
import { CopyButton, TimeAgo, useNow } from "../_components/Bits";
import {
  convertLeadToClient,
  deleteLead,
  resendLeadEmail,
  saveLeadNotes,
  setLeadStatus,
} from "../actions";

export type LeadRow = {
  id: number;
  name: string;
  email: string;
  help: string;
  message: string;
  notes: string;
  status: string;
  sourcePath: string;
  createdAt: string;
  contactedAt: string | null;
  emailStatus: string;
  emailError: string;
  clientId: number | null;
  clientName: string;
  session: {
    landing: string;
    source: string;
    campaign: string;
    device: string;
    browser: string;
    country: string;
    pages: number;
  } | null;
};

export const LEAD_STATUSES = [
  { key: "new", label: "New", dot: "bg-accent", chip: "bg-accent/15 text-accent border-accent/25" },
  { key: "contacted", label: "Contacted", dot: "bg-yellow-300", chip: "bg-yellow-400/10 text-yellow-300 border-yellow-400/25" },
  { key: "proposal", label: "Proposal", dot: "bg-purple-300", chip: "bg-purple-400/10 text-purple-300 border-purple-400/25" },
  { key: "won", label: "Won", dot: "bg-emerald-300", chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25" },
  { key: "lost", label: "Lost", dot: "bg-red-300", chip: "bg-red-400/10 text-red-300 border-red-400/25" },
] as const;

const OPEN = new Set(["new", "contacted", "proposal"]);
const SLA_H = 24;

const statusMeta = (k: string) => LEAD_STATUSES.find((s) => s.key === k) ?? LEAD_STATUSES[0];

const AVATAR = [
  "from-cyan-400/30 to-blue-500/30 text-cyan-200",
  "from-violet-400/30 to-fuchsia-500/30 text-violet-200",
  "from-emerald-400/30 to-teal-500/30 text-emerald-200",
  "from-amber-400/30 to-orange-500/30 text-amber-200",
  "from-rose-400/30 to-pink-500/30 text-rose-200",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function replyHref(l: LeadRow) {
  const first = l.name.trim().split(/\s+/)[0] || "there";
  const body = `Hi ${first},\n\nThanks for reaching out to PKDM Studio.\n\n\n\nBest,\nPietu\n\n---\n${l.message
    .split("\n")
    .map((x) => `> ${x}`)
    .join("\n")}`;
  return `mailto:${l.email}?subject=${encodeURIComponent("Re: your project enquiry")}&body=${encodeURIComponent(body)}`;
}

function fmtHours(h: number) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

// ---------------------------------------------------------------------------

function SlaChip({ lead, now }: { lead: LeadRow; now: number | null }) {
  if (lead.status !== "new" || now === null) return null;
  const ageH = (now - new Date(lead.createdAt).getTime()) / 3600000;
  const left = SLA_H - ageH;
  if (left <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
        Reply overdue by {fmtHours(-left)}
      </span>
    );
  }
  const urgent = left < 6;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        urgent ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300" : "border-white/10 text-haze"
      }`}
      title="The site promises a reply within 24 hours"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      Reply within {fmtHours(left)}
    </span>
  );
}

function EmailChip({ lead, mailReady }: { lead: LeadRow; mailReady: boolean }) {
  const st = lead.emailStatus;
  if (st === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90" title="Notification email delivered to your inboxes">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16v12H4z" />
          <path d="m4 7 8 6 8-6" />
        </svg>
        Emailed
      </span>
    );
  }
  if (!st) return null; // submitted before server-side email existed
  const failed = st === "failed";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className={failed ? "text-red-300" : "text-haze"}
        title={lead.emailError || undefined}
      >
        {failed ? "Email failed" : st === "pending" ? "Email pending" : "Not emailed"}
        {lead.emailError ? `: ${lead.emailError.slice(0, 60)}` : ""}
      </span>
      {mailReady ? (
        <ActionButton
          action={resendLeadEmail}
          fields={{ id: lead.id }}
          size="sm"
          variant="subtle"
          pendingLabel="Sending"
          className="!px-1.5 !py-0.5 text-accent"
        >
          Resend
        </ActionButton>
      ) : null}
    </span>
  );
}

function StatusSelect({ lead }: { lead: LeadRow }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(lead.status);
  useEffect(() => setValue(lead.status), [lead.status]);
  const meta = statusMeta(value);

  const change = async (next: string, undoTo?: string) => {
    const before = value;
    setValue(next);
    const r = await run(setLeadStatus, toFormData({ id: lead.id, status: next }), {
      extras: () =>
        undoTo === undefined
          ? {
              action: {
                label: "Undo",
                onClick: () => void change(before, before),
              },
            }
          : undefined,
    });
    if (!r.ok) setValue(before);
  };

  return (
    <label className={`relative inline-flex items-center rounded-full border ${meta.chip} pl-2.5 pr-1 text-xs font-semibold`}>
      <span className="sr-only">Status</span>
      {pending ? <Spinner className="mr-1.5 h-2.5 w-2.5" /> : <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
      <select
        value={value}
        onChange={(e) => void change(e.target.value)}
        disabled={pending}
        className="cursor-pointer appearance-none bg-transparent py-1 pr-5 focus:outline-none"
      >
        {LEAD_STATUSES.map((s) => (
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

function ReplyButton({ lead }: { lead: LeadRow }) {
  const { run } = useAction();
  return (
    <a
      href={replyHref(lead)}
      onClick={() => {
        if (lead.status !== "new") return;
        void run(setLeadStatus, toFormData({ id: lead.id, status: "contacted" }), {
          extras: () => ({
            description: "Your mail app opened with a reply drafted.",
            action: {
              label: "Undo",
              onClick: () => void run(setLeadStatus, toFormData({ id: lead.id, status: "new" })),
            },
          }),
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-soft"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h11a5 5 0 0 1 5 5v6" />
      </svg>
      Reply
    </a>
  );
}

function LeadCard({
  lead,
  mailReady,
  now,
  focused,
}: {
  lead: LeadRow;
  mailReady: boolean;
  now: number | null;
  focused: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const long = lead.message.length > 320 || lead.message.split("\n").length > 6;
  const overdue =
    lead.status === "new" && now !== null && now - new Date(lead.createdAt).getTime() > SLA_H * 3600000;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);

  const s = lead.session;
  const context = [
    s?.source ? { k: "Source", v: s.source + (s.campaign ? ` · ${s.campaign}` : "") } : null,
    s?.landing ? { k: "Landed on", v: s.landing } : null,
    lead.sourcePath ? { k: "Sent from", v: lead.sourcePath } : null,
    s ? { k: "Visit", v: `${s.pages} page${s.pages === 1 ? "" : "s"} · ${[s.device, s.browser, s.country].filter(Boolean).join(" · ")}` } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <article
      ref={ref}
      id={`lead-${lead.id}`}
      className={`admin-rise relative overflow-hidden rounded-2xl border bg-ink-900/70 transition-colors duration-500 ${
        focused
          ? "border-accent/50 shadow-[0_0_0_4px_rgba(105,237,254,0.08)]"
          : overdue
            ? "border-red-400/25"
            : lead.status === "new"
              ? "border-accent/20"
              : "border-white/[0.08]"
      }`}
    >
      {lead.status === "new" ? (
        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[3px] ${overdue ? "bg-red-400/70" : "bg-accent/70"}`} />
      ) : null}
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px] lg:gap-6 lg:p-6">
        {/* Left: who + what */}
        <div className="min-w-0">
          <div className="flex items-start gap-3.5">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-semibold ${
                AVATAR[hash(lead.email || lead.name) % AVATAR.length]
              }`}
            >
              {initials(lead.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h2 className="font-display text-base font-semibold text-white">{lead.name || "(no name)"}</h2>
                <StatusSelect lead={lead} />
                <SlaChip lead={lead} now={now} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <a href={`mailto:${lead.email}`} className="truncate text-accent-soft hover:text-accent hover:underline">
                  {lead.email}
                </a>
                <CopyButton value={lead.email} label="Copy" toastTitle="Email copied" />
                <span className="text-haze/40">·</span>
                <TimeAgo iso={lead.createdAt} className="text-xs text-haze" />
                <span className="text-haze/40">·</span>
                <EmailChip lead={lead} mailReady={mailReady} />
              </div>
            </div>
          </div>

          {lead.help ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/85">
              <span className="text-haze">Needs</span>
              {lead.help}
            </p>
          ) : null}

          <div className="relative mt-3">
            <p
              className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/85 ${
                long && !expanded ? "max-h-[9.5rem] overflow-hidden" : ""
              }`}
            >
              {lead.message}
            </p>
            {long && !expanded ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900 to-transparent" />
            ) : null}
          </div>
          {long ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-accent hover:text-accent-soft"
            >
              {expanded ? "Show less" : "Read the whole message"}
            </button>
          ) : null}

          {context.length ? (
            <dl className="mt-4 grid gap-x-6 gap-y-1.5 border-t border-white/[0.05] pt-3 text-xs sm:grid-cols-2">
              {context.map((c) => (
                <div key={c.k} className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-haze/60">{c.k}</dt>
                  <dd className="truncate text-haze" title={c.v}>
                    {c.v}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Right: actions + notes */}
        <div className="flex flex-col gap-3 lg:border-l lg:border-white/[0.05] lg:pl-6">
          <div className="flex flex-wrap gap-2">
            <ReplyButton lead={lead} />
            {lead.clientId ? (
              <Link
                href="/admin/clients"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-400/10"
                title="This lead is linked to a client record"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                Client{lead.clientName ? `: ${lead.clientName}` : ""}
              </Link>
            ) : (
              <ActionButton
                action={convertLeadToClient}
                fields={{ id: lead.id }}
                variant="success"
                pendingLabel="Converting"
                confirm={{
                  tone: "default",
                  title: `Make ${lead.name || "this lead"} a client?`,
                  body: "Creates a client record (or links the existing one with the same email) and marks this lead as won.",
                  confirmLabel: "Make client",
                }}
              >
                Make client
              </ActionButton>
            )}
            <ActionButton
              action={deleteLead}
              fields={{ id: lead.id }}
              variant="danger"
              pendingLabel="Deleting"
              title="Delete lead"
              confirm={{
                title: "Delete this lead?",
                body: (
                  <>
                    The enquiry from <span className="text-white">{lead.name || lead.email}</span> and your notes on it
                    will be removed for good. Leads you lost can stay as &ldquo;Lost&rdquo; to keep your stats honest.
                  </>
                ),
                confirmLabel: "Delete lead",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V4.5h6V7m-9 0 1 13h10l1-13" />
              </svg>
              <span className="sr-only">Delete</span>
            </ActionButton>
          </div>

          <ActionForm action={saveLeadNotes} className="flex flex-1 flex-col gap-2">
            <input type="hidden" name="id" value={lead.id} />
            <label className="text-[11px] uppercase tracking-wider text-haze/60" htmlFor={`notes-${lead.id}`}>
              Notes
            </label>
            <textarea
              id={`notes-${lead.id}`}
              name="notes"
              defaultValue={lead.notes}
              placeholder="Call notes, budget, next step…"
              rows={3}
              className="min-h-[5.5rem] w-full flex-1 resize-y rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-haze/40 focus:border-accent/50 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <DirtyHint />
              <SubmitButton requireDirty size="sm" savedLabel="Saved" pendingLabel="Saving" className="ml-auto">
                Save notes
              </SubmitButton>
            </div>
          </ActionForm>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------

type Filter = "open" | "all" | (typeof LEAD_STATUSES)[number]["key"];

export default function LeadsBoard({
  leads,
  focusId,
  initialFilter,
  mail,
  stats,
}: {
  leads: LeadRow[];
  focusId: number | null;
  initialFilter: string | null;
  mail: { ready: boolean; recipients: number };
  stats: { avgResponseH: number | null; winRate: number | null };
}) {
  const now = useNow(60_000);
  const valid = ["open", "all", ...LEAD_STATUSES.map((s) => s.key)];
  const focusedLead = focusId ? leads.find((l) => l.id === focusId) : undefined;
  const [filter, setFilter] = useState<Filter>(() => {
    if (initialFilter && valid.includes(initialFilter)) return initialFilter as Filter;
    if (focusedLead && !OPEN.has(focusedLead.status)) return "all";
    return "open";
  });
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && t && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, open: 0 };
    for (const l of leads) {
      c[l.status] = (c[l.status] ?? 0) + 1;
      if (OPEN.has(l.status)) c.open++;
    }
    return c;
  }, [leads]);

  const overdue = now
    ? leads.filter((l) => l.status === "new" && now - new Date(l.createdAt).getTime() > SLA_H * 3600000).length
    : 0;

  const { shown, elsewhere } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matches = (l: LeadRow) =>
      !needle || [l.name, l.email, l.message, l.help, l.notes].some((f) => f.toLowerCase().includes(needle));
    const inTab = (l: LeadRow) =>
      filter === "all" || (filter === "open" ? OPEN.has(l.status) : l.status === filter);
    const hits = leads.filter(matches);
    const shown = hits.filter(inTab);
    return { shown, elsewhere: needle ? hits.length - shown.length : 0 };
  }, [leads, filter, q]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "open", label: "Open" },
    ...LEAD_STATUSES.map((s) => ({ key: s.key as Filter, label: s.label })),
    { key: "all", label: "All" },
  ];

  return (
    <>
      {/* Setup banner */}
      {!mail.ready ? (
        <div className="mb-5 flex flex-wrap items-start gap-3 rounded-2xl border border-yellow-400/25 bg-yellow-400/[0.06] p-4 text-sm">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-yellow-300" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-yellow-200">Email notifications aren&apos;t switched on yet</p>
            <p className="mt-1 text-haze">
              New enquiries are saved here either way. Add <code className="text-white">RESEND_API_KEY</code> in
              Vercel (and <code className="text-white">CONTACT_TO</code> for the inboxes) to get an email for every
              lead.
            </p>
          </div>
        </div>
      ) : null}

      {/* Pipeline summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Waiting for a reply",
            value: String(counts.new ?? 0),
            sub: overdue ? `${overdue} past the 24h promise` : "All inside 24h",
            alert: overdue > 0,
          },
          { label: "In conversation", value: String((counts.contacted ?? 0) + (counts.proposal ?? 0)), sub: `${counts.proposal ?? 0} with a proposal` },
          {
            label: "Avg. first reply",
            value: stats.avgResponseH == null ? "–" : fmtHours(stats.avgResponseH),
            sub: "Last 90 days",
            alert: stats.avgResponseH != null && stats.avgResponseH > SLA_H,
          },
          {
            label: "Win rate",
            value: stats.winRate == null ? "–" : `${Math.round(stats.winRate)}%`,
            sub: "Of closed leads, 90 days",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-ink-900/70 p-4">
            <p className="text-[11px] uppercase tracking-wider text-haze">{s.label}</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-white">{s.value}</p>
            <p className={`mt-0.5 text-xs ${s.alert ? "text-red-300" : "text-haze/70"}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 -mx-5 mb-4 flex flex-wrap items-center gap-3 border-b border-white/[0.05] bg-ink-950/85 px-5 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto px-1">
          {tabs.map((t) => {
            const active = filter === t.key;
            const meta = LEAD_STATUSES.find((s) => s.key === t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                  active ? "bg-white/[0.1] text-white" : "text-haze hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {meta ? <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> : null}
                {t.label}
                <span className={`tabular-nums ${active ? "text-white/70" : "text-haze/50"}`}>{counts[t.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <label className="relative w-full sm:ml-auto sm:w-64">
          <span className="sr-only">Search leads</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-haze/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setQ(""), e.currentTarget.blur())}
            placeholder="Search name, email, message"
            className="w-full rounded-full border border-white/10 bg-ink-900/70 py-1.5 pl-8 pr-8 text-sm text-white placeholder:text-haze/40 focus:border-accent/50 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 px-1 font-mono text-[10px] text-haze/60 sm:block">
            /
          </kbd>
        </label>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="font-display text-lg font-semibold text-white">No leads yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-haze">
            The moment someone sends the contact form, they&apos;ll appear here with where they came from and what
            they need{mail.ready ? `, and you'll get an email in ${mail.recipients} inbox${mail.recipients === 1 ? "" : "es"}` : ""}.
          </p>
          <Link href="/contact" target="_blank" className="mt-5 inline-block text-sm font-medium text-accent hover:text-accent-soft">
            Open the contact page ↗
          </Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
          {q ? (
            <>
              Nothing {filter === "all" ? "" : "here "}matches &ldquo;{q}&rdquo;.{" "}
              {elsewhere ? (
                <button type="button" onClick={() => setFilter("all")} className="text-accent hover:text-accent-soft">
                  Show {elsewhere} match{elsewhere === 1 ? "" : "es"} in other statuses
                </button>
              ) : (
                <button type="button" onClick={() => setQ("")} className="text-accent hover:text-accent-soft">
                  Clear search
                </button>
              )}
            </>
          ) : filter === "open" ? (
            "Inbox zero: every lead is won or lost. Nice."
          ) : (
            "No leads with this status."
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {elsewhere ? (
            <p className="text-xs text-haze">
              {elsewhere} more match{elsewhere === 1 ? "" : "es"} in other statuses.{" "}
              <button type="button" onClick={() => setFilter("all")} className="text-accent hover:text-accent-soft">
                Show all
              </button>
            </p>
          ) : null}
          {shown.map((l) => (
            <LeadCard key={l.id} lead={l} mailReady={mail.ready} now={now} focused={l.id === focusId} />
          ))}
          {shown.length >= 500 ? (
            <p className="text-center text-xs text-haze">Showing the latest 500 leads. Export CSV for the full list.</p>
          ) : null}
        </div>
      )}
    </>
  );
}
