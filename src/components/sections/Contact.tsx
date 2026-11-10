"use client";

import { useState } from "react";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { ArrowRight } from "../ui/icons";
import { site } from "@/data/site";

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------
// 1. POST /api/contact: saves the lead for the admin dashboard and emails
//    every inbox in CONTACT_TO through Resend (reply-to = the visitor).
// 2. Fallback: if the server couldn't email (Resend not configured, or it
//    failed), submit to Web3Forms from the browser, one request per key
//    (on the free tier each key delivers to the one inbox it was made for).
// ---------------------------------------------------------------------------
const KEY_1 = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";
const KEY_2 = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY_2 ?? "";

function sessionId(): string {
  try {
    return sessionStorage.getItem("pkdm_sid") || "";
  } catch {
    return "";
  }
}

const helpOptions = [
  "New website or redesign",
  "Web app, members area or payments",
  "Landing page",
  "Website maintenance",
  "Something else",
];

type Status = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot — bots fill hidden fields; humans don't.
    if ((data.get("botcheck") as string)?.length) return;

    const name = (data.get("name") as string)?.trim();
    const email = (data.get("email") as string)?.trim();
    const message = (data.get("message") as string)?.trim();
    const help = data.get("help") as string;

    if (!name || !email || !message) {
      setStatus("error");
      setErrorMsg("Please fill in your name, email, and a short message.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus("error");
      setErrorMsg("That email address doesn't look quite right.");
      form.querySelector<HTMLInputElement>("#email")?.focus();
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    // --- 1. Our own endpoint ------------------------------------------------
    let stored = false;
    let emailed = false;
    let leadId: number | null = null;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          help,
          message,
          path: window.location.pathname,
          sid: sessionId(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 400 || res.status === 429) {
        setStatus("error");
        setErrorMsg(body?.error || "Please check the form and try again.");
        return;
      }
      stored = Boolean(body?.stored);
      emailed = Boolean(body?.emailed);
      leadId = typeof body?.leadId === "number" ? body.leadId : null;
    } catch {
      /* network hiccup: fall through to the browser fallback */
    }

    // --- 2. Browser fallback (Web3Forms) -------------------------------------
    let fallbackOk = false;
    const keys = [KEY_1, KEY_2].filter(Boolean);
    if (!emailed && keys.length) {
      const results = await Promise.allSettled(
        keys.map((key) =>
          fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: key,
              subject: `New project enquiry: ${name}`,
              from_name: "PKDM Studio Website",
              name,
              email,
              "What they need help with": help,
              message,
            }),
          }).then((r) => r.json())
        )
      );
      fallbackOk = results.some((r) => r.status === "fulfilled" && r.value?.success);
    }

    if (stored || emailed || fallbackOk) {
      setStatus("success");
      // The form collapses into a shorter confirmation; make sure it's seen.
      requestAnimationFrame(() => {
        const el = document.getElementById("contact-success");
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      // Conversion event for journeys. The lead itself is already saved
      // server-side; only send its details if the server couldn't store it.
      try {
        window.__pkdmTrack?.(
          "lead",
          leadId !== null ? { lead_id: leadId, help } : { name, email, help, message }
        );
      } catch {
        /* analytics must never break the form */
      }
      form.reset();
    } else {
      setStatus("error");
      setErrorMsg(
        "Something went wrong sending your message. Please try again or email " +
          site.email +
          "."
      );
    }
  }

  return (
    <section id="contact" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800/60 to-ink-900/40 p-7 sm:p-10 md:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />

          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Left: pitch */}
            <div>
              <SectionHeading
                eyebrow="Let's talk"
                title={
                  <>
                    Need to start{" "}
                    <span className="text-glow">a project?</span>
                  </>
                }
                description="Tell us what you're building. You'll get a thoughtful reply within 24 hours, straight from Pietu, the person doing the work."
              />
              <div className="mt-8 space-y-4 text-sm text-haze">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-2 text-white transition-colors hover:text-accent-soft"
                >
                  {site.email}
                </a>
                <p className="text-haze/80">{site.address}</p>
              </div>
            </div>

            {/* Right: form */}
            <div>
              {status === "success" ? (
                <Reveal>
                  <div
                    id="contact-success"
                    role="status"
                    className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-accent-soft/20 bg-accent/5 p-10 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink-950">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                        <path
                          d="m5 13 4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white">
                      Message sent!
                    </h3>
                    <p className="max-w-xs text-sm text-haze">
                      Thanks for reaching out. We&apos;ll reply within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="mt-2 text-sm font-medium text-accent-soft hover:text-white"
                    >
                      Send another message
                    </button>
                  </div>
                </Reveal>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  {/* Honeypot */}
                  <input
                    type="checkbox"
                    name="botcheck"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <Field label="Name" htmlFor="name">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      className="form-input"
                    />
                  </Field>

                  <Field label="Email" htmlFor="email">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      className="form-input"
                    />
                  </Field>

                  <Field label="What do you need help with?" htmlFor="help">
                    <select
                      id="help"
                      name="help"
                      defaultValue={helpOptions[0]}
                      className="form-input appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237aa0ff' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      }}
                    >
                      {helpOptions.map((o) => (
                        <option key={o} value={o} className="bg-ink-800">
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Message" htmlFor="message">
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      placeholder="A few lines about your project, timeline, and goals."
                      className="form-input resize-none"
                    />
                  </Field>

                  {status === "error" && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="group mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-all duration-300 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                  >
                    {status === "loading" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send message
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-haze/60">
                    We&apos;ll reply within 24h. No spam, ever.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-white/90">{label}</span>
      {children}
    </label>
  );
}
