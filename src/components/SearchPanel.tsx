import { useState } from "react";
import { search, type SearchResult } from "../lib/cortex";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await search(query, { top_k: 5 });
      setResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Hybrid Search
      </h2>

      <form onSubmit={run} className="mt-4 flex gap-px">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your knowledge base…"
          className="w-full border border-[var(--color-line)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={busy}
          className="border border-[var(--color-line)] px-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        >
          {busy ? "…" : "Go"}
        </button>
      </form>

      {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}

      <ul className="mt-6 space-y-px">
        {results.map((r) => (
          <li key={r.chunk_id} className="border border-[var(--color-line)] bg-[var(--color-card)] p-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate font-mono text-xs text-[var(--color-muted)]">
                {r.metadata.filename ?? r.document_id}
              </span>
              <span className="font-mono text-xs text-[var(--color-accent)]">
                {r.score.toFixed(3)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-fg)]/90">
              {r.content}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
