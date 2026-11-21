"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Report, ResearchMode, TraceStep } from "@/lib/research";

const TASKS = [
  {
    label: "Explain a paper",
    query: "What is the ArXiv paper 1706.03762 about?",
  },
  {
    label: "Explain a method",
    query: "How do retrieval-augmented generation systems ground an answer?",
  },
  {
    label: "Compare ideas",
    query: "How do LLM agents use tools, and how is that different from one chat reply?",
  },
];

function safeHref(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export default function HomePage() {
  const [query, setQuery] = useState(TASKS[0].query);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [mode, setMode] = useState<ResearchMode | null>(null);
  const [error, setError] = useState("");

  async function ask(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 8 || running) return;
    setQuery(trimmed);
    setRunning(true);
    setSteps([]);
    setReport(null);
    setMode(null);
    setError("");
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "The desk could not start that question.");
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "trace"; step: TraceStep }
            | { type: "report"; report: Report; mode: ResearchMode }
            | { type: "error"; message: string };
          if (event.type === "trace") setSteps((current) => [...current, event.step]);
          if (event.type === "report") {
            setReport(event.report);
            setMode(event.mode);
          }
          if (event.type === "error") setError(event.message);
        }
      }
    } catch {
      setError("The connection dropped before the report finished.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="border-b border-border pb-8">
        <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">Research agent</p>
        <h1 className="font-display mt-2 text-4xl text-foreground sm:text-6xl">Arxnote</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Ask about a paper or a method. The agent opens ArXiv, records every lookup, and writes a short report that stays inside those sources.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Fact title="Search" body="Returns a list of links. You still do the reading." />
          <Fact title="Chat" body="Writes a fluent answer. The citations are easy to invent." />
          <Fact title="Arxnote" body="Opens the papers first, then writes from those abstracts." />
        </dl>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {TASKS.map((task) => (
                  <button
                    key={task.label}
                    type="button"
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setQuery(task.query);
                      if (!running) void ask(task.query);
                    }}
                  >
                    {task.label}
                  </button>
                ))}
              </div>
              <label htmlFor="question" className="text-sm font-medium">
                Question
              </label>
              <Textarea
                id="question"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={4}
                maxLength={400}
                className="min-h-28 bg-background text-base"
                placeholder="Ask about a paper, a method, or an ArXiv id"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{query.trim().length}/400</p>
                <Button size="lg" disabled={running || query.trim().length < 8} onClick={() => ask()}>
                  {running ? "Opening sources" : "Run the agent"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl">Scratchpad</h2>
                <Badge variant="outline">{steps.length === 0 ? "Waiting" : `${steps.length} calls`}</Badge>
              </div>
              {steps.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Each tool call lands here before the report: fetch a paper, search ArXiv, then write the answer.
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {steps.map((step, index) => (
                    <li key={`${step.tool}-${index}`} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs tracking-wide text-primary uppercase">{step.tool}</p>
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{step.input}</p>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 whitespace-pre-wrap">{step.output}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {report?.papers?.length ? (
            <div className="grid gap-3">
              {report.papers.map((paper) => {
                const href = safeHref(paper.url);
                return (
                  <a
                    key={paper.id || paper.title}
                    href={href ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border bg-card p-4 hover:border-primary"
                  >
                    <p className="font-mono text-[11px] tracking-wide text-primary uppercase">{paper.id}</p>
                    <p className="font-display mt-1 text-xl leading-snug">{paper.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{paper.authors}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6">{paper.excerpt}</p>
                  </a>
                );
              })}
            </div>
          ) : null}

          <Card className="min-h-80">
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Report</h2>
                {mode ? <Badge>{mode === "gpt-4o" ? "Written by gpt-4o" : "From the abstracts"}</Badge> : null}
              </div>
              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              {!report && !running ? (
                <p className="text-sm leading-7 text-muted-foreground">
                  Try “Explain a paper.” The scratchpad should show fetch_arxiv for 1706.03762, and the report should name Attention Is All You Need.
                </p>
              ) : null}
              {running && !report ? (
                <p className="text-sm leading-6 text-muted-foreground">Opening sources and writing the report.</p>
              ) : null}
              {report ? (
                <article className="flex flex-col gap-6">
                  <Section label="Introduction" body={report.introduction} />
                  <section>
                    <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Research steps</h3>
                    <ul className="mt-2 flex flex-col gap-1 text-sm leading-6">
                      {report.researchSteps.map((step) => (
                        <li key={step}>— {step}</li>
                      ))}
                    </ul>
                  </section>
                  <Section label="Report" body={report.mainBody} />
                  <Section label="Conclusion" body={report.conclusion} />
                  <section>
                    <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Sources</h3>
                    <ul className="mt-2 flex flex-col gap-1 text-sm">
                      {report.sources.map((source) => {
                        const href = safeHref(source);
                        return (
                          <li key={source}>
                            {href ? (
                              <a className="break-all underline decoration-border underline-offset-4" href={href} target="_blank" rel="noreferrer">
                                {source}
                              </a>
                            ) : (
                              source
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                </article>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <dt className="text-xs tracking-[0.18em] text-primary uppercase">{title}</dt>
      <dd className="mt-1 text-sm leading-6 text-muted-foreground">{body}</dd>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <section>
      <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</h3>
      <p className="mt-2 text-sm leading-7 whitespace-pre-wrap">{body}</p>
    </section>
  );
}
