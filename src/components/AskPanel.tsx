import { useRef, useState } from "react";
import { askStream, type SearchResult } from "../lib/cortex";

/** Renders [src_N] citation markers as accent badges linked to sources. */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[src_\d+\])/g);
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-fg)]/90">
      {parts.map((part, i) => {
        const m = part.match(/^\[src_(\d+)\]$/);
        return m ? (
          <sup key={i} className="mx-0.5 font-mono text-[10px] font-semibold text-[var(--color-accent)]">
            [{m[1]}]
          </sup>
        ) : (
          part
        );
      })}
    </p>
  );
}

export default function AskPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busyRef.current) return;
    busyRef.current = true;
    setAnswer("");
    setSources([]);
    setError(null);
    setStage("starting");
    try {
      for await (const ev of askStream(question)) {
        if (ev.status) setStage(ev.status.stage);
        if (ev.sources) setSources(ev.sources);
        if (ev.content) setAnswer((a) => a + ev.content);
        if (ev.error) setError(ev.error);
        if (ev.done) setStage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStage(null);
      busyRef.current = false;
    }
  }

  return (
    <div>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Ask AI
      </h2>

      <form onSubmit={run} className="mt-4 flex gap-px">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your knowledge base…"
          className="w-full border border-[var(--color-line)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={stage !== null}
          className="border border-[var(--color-line)] px-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        >
          {stage !== null ? "…" : "Ask"}
        </button>
      </form>

      {stage && (
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-faint)]">
          {stage}…
        </p>
      )}
      {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}

      {answer && (
        <div className="mt-6 border border-[var(--color-line)] bg-[var(--color-card)] p-4">
          <AnswerText text={answer} />
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
            Sources
          </p>
          <ul className="mt-2 space-y-1">
            {sources.map((s) => (
              <li key={s.chunk_id} className="truncate font-mono text-xs text-[var(--color-muted)]">
                <span className="text-[var(--color-accent)]">[{s.sid ?? "•"}]</span>{" "}
                {s.metadata.filename ?? s.document_id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
