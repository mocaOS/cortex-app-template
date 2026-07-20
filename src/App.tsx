import SearchPanel from "./components/SearchPanel";
import AskPanel from "./components/AskPanel";

/**
 * Demo shell — replace with your app.
 * The two panels exercise the full client contract (search + streaming ask),
 * so keep them around until your own features cover both paths.
 */
export default function App() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-16">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          Cortex App
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-[-0.04em] md:text-7xl">
          My Cortex App
        </h1>
        <p className="mt-4 max-w-xl text-[--color-muted]">
          A starting point wired to your knowledge graph. Edit{" "}
          <code className="font-mono text-sm text-[--color-fg]">src/App.tsx</code> and build the
          app you imagine.
        </p>
      </header>

      <main className="grid gap-px border border-[--color-line] bg-[--color-line] lg:grid-cols-2">
        <section className="bg-[--color-bg] p-8">
          <SearchPanel />
        </section>
        <section className="bg-[--color-bg] p-8">
          <AskPanel />
        </section>
      </main>

      <footer className="mt-10 font-mono text-xs text-[--color-faint]">
        POWERED BY CORTEX — YOUR KNOWLEDGE, YOUR GRAPH
      </footer>
    </div>
  );
}
