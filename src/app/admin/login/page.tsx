"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { btnCls, inputCls } from "../_components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(params.get("from") || "/admin");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error || "Login failed.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-900/70 p-8"
    >
      <h1 className="font-display text-xl font-semibold text-white">
        PKDM <span className="text-accent">Admin</span>
      </h1>
      <p className="mt-1 text-sm text-haze">Enter the admin password to continue.</p>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className={`${inputCls} mt-6`}
      />
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <button type="submit" disabled={loading || !password} className={`${btnCls} mt-4 w-full`}>
        {loading ? "Signing in…" : "Sign in"}
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
