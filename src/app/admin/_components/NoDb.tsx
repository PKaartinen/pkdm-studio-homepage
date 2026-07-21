export default function NoDb() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-sm leading-relaxed text-haze">
      <h2 className="mb-3 font-display text-lg font-semibold text-white">
        Database not connected yet
      </h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          In your <span className="text-white">Vercel dashboard</span> → Storage → Create
          Database → <span className="text-white">Neon (Postgres)</span>, and connect it to the{" "}
          <span className="text-white">pkdm-studio-homepage</span> project (this injects{" "}
          <code className="text-accent">DATABASE_URL</code> automatically).
        </li>
        <li>
          Locally: run <code className="text-accent">vercel env pull .env.local</code> (or paste
          the connection string into <code className="text-accent">.env.local</code>).
        </li>
        <li>
          Run <code className="text-accent">npm run db:setup</code> once to create the tables.
        </li>
        <li>Redeploy / restart the dev server, and data will start flowing.</li>
      </ol>
    </div>
  );
}
