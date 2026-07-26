"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Check, Clock3, Database, ExternalLink,
  Loader2, LogOut, RefreshCw, Search, ShieldCheck, Sparkles,
  TriangleAlert, X,
} from "lucide-react";
import Link from "next/link";
import "./growth-admin.css";

type Job = {
  id: number;
  type: string;
  status: string;
  priority: number;
  attempts: number;
  quality_score: number | null;
  error_message: string | null;
  created_at: string;
};

type Review = {
  id: number;
  content_key: string;
  status: string;
  quality_score: number;
  reasons: string | string[];
  source_count: number;
  created_at: string;
};

type Snapshot = {
  available: boolean;
  jobs?: Job[];
  reviews?: Review[];
  tools?: { total: number; categories: number };
  counts?: Array<{ status: string; count: number }>;
};

function parseReasons(value: string | string[]) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

function StatusPill({ value }: { value: string }) {
  return <span className={`growth-status growth-status--${value}`}>{value.replace("_", " ")}</span>;
}

export default function GrowthAdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [category, setCategory] = useState("");
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async (secret = password) => {
    setBusy("load");
    const response = await fetch("/api/admin/growth", {
      headers: { "x-admin-password": secret },
      cache: "no-store",
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      setAuthenticated(false);
      setMessage({ type: "error", text: data.error || "Access denied." });
      return false;
    }
    setSnapshot(data);
    setAuthenticated(true);
    setMessage(null);
    return true;
  }, [password]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => load(), 30_000);
    return () => window.clearInterval(timer);
  }, [authenticated, load]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) return;
    await load(password);
  }

  async function mutate(body: Record<string, unknown>, key: string) {
    setBusy(key);
    const response = await fetch("/api/admin/growth", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok || !data.success) {
      setMessage({ type: "error", text: data.error || "Action failed." });
      return;
    }
    setMessage({
      type: "success",
      text: body.action === "queue"
        ? `Job #${data.jobId} entered the review pipeline.`
        : "Review queue updated.",
    });
    setCategory("");
    await load();
  }

  const reviews = useMemo(() => {
    const term = search.toLowerCase();
    return (snapshot?.reviews ?? []).filter((item) =>
      item.content_key.toLowerCase().includes(term) || item.status.toLowerCase().includes(term)
    );
  }, [search, snapshot]);

  const queued = snapshot?.counts?.find((item) => item.status === "queued")?.count ?? 0;
  const pending = snapshot?.reviews?.filter((item) => item.status === "pending").length ?? 0;
  const completed = snapshot?.counts?.find((item) => item.status === "completed")?.count ?? 0;

  if (!authenticated) {
    return (
      <main className="growth-login">
        <form className="growth-login__card" onSubmit={login}>
          <div className="growth-brandmark" aria-hidden="true">TC</div>
          <p className="growth-eyebrow">Private operations</p>
          <h1>Growth control room</h1>
          <p className="growth-muted">Review sources, quality and publishing decisions before content reaches ToolCompare.</p>
          <label htmlFor="growth-password">Admin password</label>
          <input
            id="growth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message && <p className="growth-inline-error"><TriangleAlert size={16} />{message.text}</p>}
          <button className="growth-primary" type="submit" disabled={busy === "load"}>
            {busy === "load" ? <Loader2 className="growth-spin" size={18} /> : <ShieldCheck size={18} />}
            Open control room
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="growth-shell">
      <aside className="growth-sidebar">
        <div className="growth-sidebar__brand"><span>TC</span><strong>ToolCompare</strong></div>
        <nav aria-label="Management">
          <a href="#overview" className="is-active"><Activity size={18} />Overview</a>
          <a href="#queue"><Clock3 size={18} />Review queue <b>{pending}</b></a>
          <a href="#jobs"><RefreshCw size={18} />Automation</a>
          <Link href="/" target="_blank"><ExternalLink size={18} />View site</Link>
        </nav>
        <button className="growth-sidebar__logout" onClick={() => {
          setAuthenticated(false);
          setPassword("");
          setSnapshot(null);
        }}><LogOut size={18} />Lock dashboard</button>
      </aside>

      <main className="growth-main">
        <header className="growth-topbar" id="overview">
          <div>
            <p className="growth-eyebrow">Operations / Growth</p>
            <h1>Publishing pipeline</h1>
          </div>
          <button className="growth-icon-button" aria-label="Refresh dashboard" onClick={() => load()} disabled={busy === "load"}>
            <RefreshCw size={18} className={busy === "load" ? "growth-spin" : ""} />
          </button>
        </header>

        {!snapshot?.available && (
          <section className="growth-db-warning">
            <Database size={22} />
            <div><strong>Database connection required</strong><p>Set the DB_* variables on Hostinger to activate queues, reviews and cron processing.</p></div>
          </section>
        )}

        {message && (
          <div className={`growth-flash growth-flash--${message.type}`}>
            {message.type === "success" ? <Check size={17} /> : <TriangleAlert size={17} />}
            {message.text}
            <button aria-label="Dismiss message" onClick={() => setMessage(null)}><X size={16} /></button>
          </div>
        )}

        <section className="growth-kpis" aria-label="Pipeline summary">
          <article><span>Published tools</span><strong>{snapshot?.tools?.total ?? "—"}</strong><small>{snapshot?.tools?.categories ?? 0} categories</small></article>
          <article><span>Waiting jobs</span><strong>{queued}</strong><small>worker-ready</small></article>
          <article><span>Needs review</span><strong>{pending}</strong><small>human decision</small></article>
          <article><span>Completed jobs</span><strong>{completed}</strong><small>all time</small></article>
        </section>

        <section className="growth-compose">
          <div>
            <p className="growth-eyebrow">Controlled generation</p>
            <h2>Queue a researched tool batch</h2>
            <p className="growth-muted">Drafts need two sources and an 80+ quality score. Nothing publishes automatically.</p>
          </div>
          <form onSubmit={(event) => {
            event.preventDefault();
            mutate({ action: "queue", category, count }, "queue");
          }}>
            <label htmlFor="growth-category">Category</label>
            <div className="growth-compose__row">
              <input
                id="growth-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="e.g. customer support software"
                maxLength={100}
                required
              />
              <select aria-label="Draft count" value={count} onChange={(event) => setCount(Number(event.target.value))}>
                <option value={1}>1 draft</option>
                <option value={3}>3 drafts</option>
                <option value={5}>5 drafts</option>
              </select>
              <button className="growth-primary" disabled={!snapshot?.available || busy === "queue"}>
                {busy === "queue" ? <Loader2 className="growth-spin" size={18} /> : <Sparkles size={18} />}Queue
              </button>
            </div>
          </form>
        </section>

        <section className="growth-panel" id="queue">
          <div className="growth-panel__head">
            <div><p className="growth-eyebrow">Editorial gate</p><h2>Review queue</h2></div>
            <label className="growth-search"><Search size={17} /><span className="sr-only">Search reviews</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter drafts" /></label>
          </div>
          <div className="growth-review-list">
            {reviews.length === 0 ? (
              <div className="growth-empty"><ShieldCheck size={26} /><strong>Queue is clear</strong><p>New AI drafts will wait here for a human decision.</p></div>
            ) : reviews.map((review) => (
              <article className="growth-review" key={review.id}>
                <div className="growth-review__score" data-pass={review.quality_score >= 80}>
                  <strong>{review.quality_score}</strong><span>/100</span>
                </div>
                <div className="growth-review__body">
                  <div><h3>{review.content_key}</h3><StatusPill value={review.status} /></div>
                  <p>{review.source_count} sources · {new Date(review.created_at).toLocaleDateString()}</p>
                  {parseReasons(review.reasons).slice(0, 2).map((reason) => <small key={reason}>{reason}</small>)}
                </div>
                {review.status === "pending" && (
                  <div className="growth-review__actions">
                    <button onClick={() => mutate({ action: "reject", reviewId: review.id }, `reject-${review.id}`)}>Reject</button>
                    <button onClick={() => mutate({ action: "retry", reviewId: review.id }, `retry-${review.id}`)}>Regenerate</button>
                    <button className="growth-primary" disabled={review.quality_score < 80 || review.source_count < 2} onClick={() => mutate({ action: "approve", reviewId: review.id }, `approve-${review.id}`)}>Approve</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="growth-panel" id="jobs">
          <div className="growth-panel__head"><div><p className="growth-eyebrow">Worker history</p><h2>Automation jobs</h2></div></div>
          <div className="growth-table-wrap">
            <table>
              <thead><tr><th>Job</th><th>Status</th><th>Attempts</th><th>Quality</th><th>Created</th></tr></thead>
              <tbody>
                {(snapshot?.jobs ?? []).map((job) => (
                  <tr key={job.id}>
                    <td><strong>#{job.id}</strong><span>{job.type.replace("_", " ")}</span></td>
                    <td><StatusPill value={job.status} /></td>
                    <td>{job.attempts}</td>
                    <td>{job.quality_score ?? "—"}</td>
                    <td>{new Date(job.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="growth-footer">
          <span>Worker endpoint: POST /api/cron/growth</span>
          <Link href="/tools/hubspot-crm" target="_blank">Inspect a live page <ArrowUpRight size={15} /></Link>
        </footer>
      </main>
    </div>
  );
}
