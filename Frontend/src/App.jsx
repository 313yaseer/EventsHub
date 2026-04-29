export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
        <span className="mb-6 inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
          EventsHub
        </span>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Vite, React, and Tailwind are wired up.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          This is the base frontend scaffold. Start building pages, routes, and
          data flows from here.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            className="rounded-full bg-[var(--primary)] px-5 py-3 font-medium text-white transition hover:opacity-90"
            href="https://vite.dev/"
            target="_blank"
            rel="noreferrer"
          >
            Vite Docs
          </a>
          <a
            className="rounded-full border border-white/15 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/5"
            href="https://tailwindcss.com/docs/installation/using-vite"
            target="_blank"
            rel="noreferrer"
          >
            Tailwind Docs
          </a>
        </div>
      </section>
    </main>
  )
}
