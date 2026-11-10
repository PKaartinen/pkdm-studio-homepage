import type { Metadata } from "next";
import { hasDb, sql } from "@/lib/db";
import { withSchema } from "@/lib/schema";
import AdminNav, { type NavBadges } from "./_components/AdminNav";
import { ToastProvider } from "./_components/Toaster";
import { isAdmin } from "./_lib/guard";
import { todayYmd } from "./_lib/format";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · PKDM Admin" },
  robots: { index: false, follow: false },
};

async function badges(): Promise<NavBadges> {
  if (!hasDb() || !(await isAdmin())) return {};
  try {
    const [row] = await withSchema(
      () => sql`
        SELECT
          (SELECT count(*) FROM leads WHERE status = 'new') AS new_leads,
          (SELECT count(*) FROM leads WHERE status = 'new' AND created_at < now() - interval '24 hours') AS overdue_leads,
          (SELECT count(*) FROM tasks WHERE status <> 'done' AND due_date <= ${todayYmd()}::date) AS due_tasks
      `
    );
    return {
      leads: Number(row?.new_leads) || 0,
      leadsUrgent: (Number(row?.overdue_leads) || 0) > 0,
      work: Number(row?.due_tasks) || 0,
    };
  } catch {
    return {};
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative z-10 min-h-screen bg-ink-950 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
          <AdminNav badges={await badges()} />
          <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
