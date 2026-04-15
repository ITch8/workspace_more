export default function HomePage() {
  return (
    <section className="grid-12">
      <article className="card col-12">
        <h1 className="display-1">ReplyBoost Workspace</h1>
        <p className="text-muted">
          Manage campaigns, import leads in bulk, and track outreach progress in one
          focused workspace.
        </p>
      </article>
      <article className="card col-4">
        <h2 className="text-lg font-semibold">Campaign Flow</h2>
        <p className="text-muted">Create, run, pause and archive with status updates.</p>
      </article>
      <article className="card col-4">
        <h2 className="text-lg font-semibold">CSV Import</h2>
        <p className="text-muted">Queue-based processing with worker support.</p>
      </article>
      <article className="card col-4">
        <h2 className="text-lg font-semibold">Fast Navigation</h2>
        <p className="text-muted">Hybrid top and side navigation for quick access.</p>
      </article>
    </section>
  );
}
