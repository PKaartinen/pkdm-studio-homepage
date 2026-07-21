"use client";

import { useState } from "react";
import { btnCls } from "./_components/ui";

/**
 * Error boundary for the admin area. The most likely first-run failure is a
 * connected-but-empty database, so we offer a one-click schema setup.
 */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const setup = async () => {
    setRunning(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/setup", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        reset();
        return;
      }
      setMsg(body?.error || "Setup failed.");
    } catch {
      setMsg("Setup request failed.");
    }
    setRunning(false);
  };

  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-sm text-haze">
      <h2 className="mb-2 font-display text-lg font-semibold text-white">
        Something went wrong loading this view
      </h2>
      <p className="mb-6 max-w-xl leading-relaxed">
        If the database was just connected, the tables probably don&apos;t exist yet — click
        below to create them (safe to run any time). Otherwise, try reloading.
      </p>
      <div className="flex gap-3">
        <button onClick={setup} disabled={running} className={btnCls}>
          {running ? "Setting up…" : "Initialize database"}
        </button>
        <button
          onClick={() => reset()}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-haze hover:text-white"
        >
          Retry
        </button>
      </div>
      {msg ? <p className="mt-4 text-red-300">{msg}</p> : null}
    </div>
  );
}
