import type { Metadata } from "next";
import AdminNav from "./_components/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen bg-ink-950 text-white">
      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
