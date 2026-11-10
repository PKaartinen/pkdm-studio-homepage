import { site } from "@/data/site";

/**
 * Lead notification email, sent through Resend's REST API (no SDK needed).
 *
 * Env:
 *   RESEND_API_KEY  required to send. Without it nothing is emailed and the
 *                   contact form falls back to Web3Forms in the browser.
 *   CONTACT_TO      comma-separated inboxes that get every enquiry.
 *                   Defaults to the public studio inbox. (Kept in env so
 *                   personal addresses never land in this public repo.)
 *   CONTACT_FROM    sender, e.g. "PKDM Studio Website <website@pkdmstudio.com>".
 *                   Its domain must be verified in Resend.
 */

export type LeadForMail = {
  id: number | null;
  name: string;
  email: string;
  help: string;
  message: string;
  path: string;
  referrer?: string;
  utm?: string;
  device?: string;
  country?: string;
  createdAt: Date;
};

export type MailResult =
  | { status: "sent"; id: string; to: string[] }
  | { status: "failed"; error: string; to: string[] }
  | { status: "skipped"; error: string; to: string[] };

export function mailRecipients(): string[] {
  const raw = process.env.CONTACT_TO || site.email;
  const list = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return Array.from(new Set(list));
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function when(d: Date) {
  return d.toLocaleString("en-GB", {
    timeZone: "Europe/Tallinn",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function replyHref(lead: LeadForMail) {
  const subject = "Re: your project enquiry";
  const body = `Hi ${firstName(lead.name)},\n\nThanks for reaching out to PKDM Studio.\n\n\n\nBest,\nPietu\n\n---\n${lead.message
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")}`;
  return `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function render(lead: LeadForMail) {
  const adminUrl = `${site.url}/admin/leads${lead.id ? `?lead=${lead.id}` : ""}`;
  const rows: [string, string][] = [
    ["Name", esc(lead.name)],
    ["Email", `<a href="mailto:${esc(lead.email)}" style="color:#0b6bcb">${esc(lead.email)}</a>`],
    ["Needs", esc(lead.help || "Not specified")],
    ["Sent from", esc(lead.path || "/")],
  ];
  if (lead.referrer) rows.push(["Came from", esc(lead.referrer)]);
  if (lead.utm) rows.push(["Campaign", esc(lead.utm)]);
  if (lead.device || lead.country)
    rows.push(["Device", esc([lead.device, lead.country].filter(Boolean).join(" · "))]);
  rows.push(["Received", esc(when(lead.createdAt))]);

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8ef">
<tr><td style="background:#05070d;padding:20px 28px;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em">PKDM <span style="color:#69edfe">Studio</span> <span style="color:#8b98ad;font-weight:400">· new enquiry</span></td></tr>
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 6px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">${esc(lead.help || "New enquiry")}</p>
<h1 style="margin:0 0 4px;font-size:22px;line-height:1.3">${esc(lead.name)} wants to talk</h1>
<p style="margin:0;font-size:14px;color:#64748b">Reply within 24 hours to keep the promise on the site.</p>
</td></tr>
<tr><td style="padding:20px 28px 4px">
<div style="background:#f8fafc;border:1px solid #e3e8ef;border-radius:10px;padding:16px 18px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(lead.message)}</div>
</td></tr>
<tr><td style="padding:16px 28px 4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 0;color:#64748b;width:110px;vertical-align:top">${k}</td><td style="padding:6px 0">${v}</td></tr>`
  )
  .join("\n")}
</table>
</td></tr>
<tr><td style="padding:20px 28px 28px">
<a href="${esc(replyHref(lead))}" style="display:inline-block;background:#05070d;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;margin:0 8px 8px 0">Reply to ${esc(firstName(lead.name))}</a>
<a href="${esc(adminUrl)}" style="display:inline-block;background:#e9fbfe;color:#05070d;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;border:1px solid #bdf3fb;margin:0 0 8px">Open in admin</a>
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8">Sent by the contact form on ${esc(site.url.replace(/^https?:\/\//, ""))}. Hitting reply goes straight to ${esc(lead.email)}.</p>
</td></tr></table></body></html>`;

  const text = [
    `New enquiry from ${lead.name} <${lead.email}>`,
    `Needs: ${lead.help || "Not specified"}`,
    "",
    lead.message,
    "",
    `Sent from: ${lead.path || "/"}`,
    ...(lead.referrer ? [`Came from: ${lead.referrer}`] : []),
    ...(lead.utm ? [`Campaign: ${lead.utm}`] : []),
    `Received: ${when(lead.createdAt)}`,
    "",
    `Open in admin: ${adminUrl}`,
  ].join("\n");

  return { html, text };
}

export async function sendLeadNotification(
  lead: LeadForMail,
  opts: { retry?: boolean } = {}
): Promise<MailResult> {
  const to = mailRecipients();
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "skipped", error: "RESEND_API_KEY is not set", to };
  if (to.length === 0) return { status: "skipped", error: "CONTACT_TO has no valid address", to };

  const from = process.env.CONTACT_FROM || "PKDM Studio Website <website@pkdmstudio.com>";
  const { html, text } = render(lead);
  const subject = `New enquiry: ${lead.name}${lead.help ? ` (${lead.help})` : ""}`.slice(0, 180);

  try {
    const endpoint =
      (process.env.NODE_ENV !== "production" && process.env.RESEND_LOCAL_ENDPOINT) ||
      "https://api.resend.com/emails";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // First send is idempotent per lead (double-submits never double-email);
        // a manual retry from the admin must go out again, so it skips the key.
        ...(lead.id && !opts.retry
          ? { "Idempotency-Key": `lead-${lead.id}-${lead.createdAt.getTime()}` }
          : {}),
      },
      body: JSON.stringify({ from, to, reply_to: lead.email, subject, html, text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok || !body?.id) {
      return {
        status: "failed",
        error: (body?.message || `Resend responded ${res.status}`).slice(0, 300),
        to,
      };
    }
    return { status: "sent", id: body.id, to };
  } catch (err) {
    return {
      status: "failed",
      error: (err instanceof Error ? err.message : "Network error").slice(0, 300),
      to,
    };
  }
}
