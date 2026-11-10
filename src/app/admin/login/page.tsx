"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { inputCls } from "../_components/ui";
import { Spinner } from "../_components/ActionForm";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setDone(true);
        const from = params.get("from");
        router.push(from && from.startsWith("/admin") ? from : "/admin");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => null);
      setError(body?.error || "Login failed.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setShake((n) => n + 1);
    setLoading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      key={shake}
      className={`w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-900/70 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ${
        shake ? "animate-[admin-shake_.4s_ease-in-out]" : "admin-rise"
      }`}
    >
      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <h1 className="font-display text-xl font-semibold text-white">
        PKDM <span className="text-accent">Admin</span>
      </h1>
      <p className="mt-1 text-sm text-haze">Enter the admin password to continue.</p>
      <label className="relative mt-6 block">
        <span className="sr-only">Password</span>
        <input
          type={show ? "text" : "password"}
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
          placeholder="Password"
          aria-invalid={!!error}
          className={`${inputCls} pr-16 ${error ? "border-red-400/50" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-haze hover:text-white"
        >
          {show ? "Hide" : "Show"}
        </button>
      </label>
      {caps ? <p className="mt-2 text-xs text-yellow-300">Caps Lock is on.</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Spinner /> : null}
        {done ? "Opening dashboard…" : loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
