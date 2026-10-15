import { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { httpApi } from "../../utils/http";
import { useToast } from "../../context/ToastContext";
import Modal from "../../Components/Modal";
import Button from "../../Components/Button";
import { ArrowLeftIcon } from "../../Components/icons";

function StatCard({ label, value, accent = false }) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4 ${accent ? "bg-action/5 border-action/30" : "bg-surface border-border"}`}>
      <p className="text-[clamp(1.25rem,5vw,1.5rem)] leading-tight font-bold text-text-primary tabular-nums truncate">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5 leading-snug line-clamp-2 min-h-[2em]">{label}</p>
    </div>
  );
}

function typeLabel(t) {
  return { opportunity_feed: "Feed", opportunity_reel: "Reel", comment: "Comment", story: "Story", message: "Message", conversation: "Chat", user: "User" }[t] ?? t;
}

export default function AdminReports({ filters = {}, categories = [], types = [], stats = {}, reports = { data: [], meta: {} } }) {
  const page = usePage();
  const toast = useToast();
  const isAdmin = hasRole(page, "Admin");
  const rows = reports?.data ?? [];
  const meta = reports?.meta ?? {};

  const [local, setLocal] = useState({
    status: filters.status ?? "pending",
    types: filters.types ?? "",
    category: filters.category ?? "",
    severityMin: filters.severityMin ?? 0,
    search: filters.search ?? "",
    sort: filters.sort ?? "priority",
    order: filters.order ?? "desc",
  });
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptForm, setAcceptForm] = useState({ action: "warn", reason: "", duration_days: 7, remove_content: true });
  const [acting, setActing] = useState(false);

  useEffect(() => { setSearchDraft(filters.search ?? ""); }, [filters.search]);

  const apply = (patch = {}) => {
    const next = { ...local, ...patch };
    setLocal(next);
    router.get("/admin/reports", next, { preserveState: true, preserveScroll: true, replace: true });
  };

  const gotoPage = (p) => router.get("/admin/reports", { ...local, page: p }, { preserveState: true, preserveScroll: true });

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await httpApi.get(`/admin/reports/${id}`);
      setDetail(res);
    } catch (err) {
      toast.error(err.message || "Could not load report.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const doReject = async () => {
    if (rejectReason.trim().length < 10) { toast.error("Rejection reason required (min 10 characters)."); return; }
    setActing(true);
    try {
      await httpApi.post(`/admin/reports/${selectedId}/reject`, { reason: rejectReason.trim() });
      toast.success("Report rejected — reporter notified.");
      setRejectOpen(false); setRejectReason(""); setSelectedId(null); setDetail(null);
      router.reload({ only: ["reports", "stats"] });
    } catch (err) { toast.error(err.message || "Could not reject."); }
    finally { setActing(false); }
  };

  const doAccept = async () => {
    if (acceptForm.reason.trim().length < 10) { toast.error("Action reason required (min 10 characters)."); return; }
    setActing(true);
    try {
      await httpApi.post(`/admin/reports/${selectedId}/accept`, {
        action: acceptForm.action,
        reason: acceptForm.reason.trim(),
        duration_days: acceptForm.action === "suspend" ? Number(acceptForm.duration_days) : null,
        remove_content: !!acceptForm.remove_content,
      });
      toast.success("Action applied — both parties notified.");
      setAcceptOpen(false); setSelectedId(null); setDetail(null);
      setAcceptForm({ action: "warn", reason: "", duration_days: 7, remove_content: true });
      router.reload({ only: ["reports", "stats"] });
    } catch (err) { toast.error(err.message || "Could not apply action."); }
    finally { setActing(false); }
  };

  const typeSet = new Set((local.types ? String(local.types).split(",") : []).filter(Boolean));
  const toggleType = (t) => {
    const next = new Set(typeSet);
    if (next.has(t)) next.delete(t); else next.add(t);
    apply({ types: Array.from(next).join(",") });
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Head title="Reports" />
        <div className="mt-8 bg-error/5 border border-error/20 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-error">Admin access only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-clip">
      <Head title="Reports" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link href="/admin" aria-label="Back to admin" className="inline-flex items-center justify-center w-11 h-11 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors shrink-0">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1 basis-40">
          <h1 className="text-[clamp(1.25rem,4vw,1.5rem)] leading-tight font-semibold text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5 truncate">Review queue · reject with reason or accept with action</p>
        </div>
        <Link href="/admin" className="text-xs font-semibold text-action hover:underline shrink-0 min-h-[44px] inline-flex items-center">Dashboard</Link>
      </div>

      <section className="mt-4" aria-label="Queue stats">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard label="Pending" value={stats.pending ?? 0} accent />
          <StatCard label="Accepted today" value={stats.acceptedToday ?? 0} />
          <StatCard label="Rejected today" value={stats.rejectedToday ?? 0} />
          <StatCard label="High severity open" value={stats.highSeverity ?? 0} />
        </div>
      </section>

      <section className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden" aria-label="Filters">
        <div className="p-3 sm:p-4 grid gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") apply({ search: searchDraft }); }}
              placeholder="Search details, reporter, notes…"
              className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-2 min-h-[44px] text-base md:text-sm text-text-primary outline-none focus:border-action"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="min-h-[44px]" onClick={() => apply({ search: searchDraft })}>Search</Button>
              <select value={local.status} onChange={(e) => apply({ status: e.target.value })} className="bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm text-text-primary" aria-label="Status">
                {["pending", "accepted", "rejected", "all"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(types.length ? types : ["opportunity_feed", "opportunity_reel", "comment", "story", "message", "conversation", "user"]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-2.5 py-1.5 min-h-[36px] rounded-full border text-xs font-semibold transition-colors ${typeSet.has(t) ? "bg-action/10 border-action/30 text-action" : "border-border text-text-secondary hover:bg-bg"}`}
              >
                {typeLabel(t)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={local.category} onChange={(e) => apply({ category: e.target.value })} className="bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm text-text-primary" aria-label="Category">
              <option value="">All categories</option>
              {(categories ?? []).map((c) => <option key={c.key} value={c.key}>{c.label} ({c.severity})</option>)}
            </select>
            <select value={local.sort} onChange={(e) => apply({ sort: e.target.value })} className="bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm text-text-primary" aria-label="Sort">
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
              <option value="severity">Severity</option>
              <option value="reports">Reports score</option>
            </select>
            <select value={local.order} onChange={(e) => apply({ order: e.target.value })} className="bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm text-text-primary" aria-label="Order">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-text-secondary px-1">
              Sev ≥ {local.severityMin}
              <input type="range" min={0} max={90} step={10} value={local.severityMin} onChange={(e) => apply({ severityMin: Number(e.target.value) })} className="flex-1" />
            </label>
          </div>
        </div>
      </section>

      <section className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden" aria-label="Report queue">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary text-center">Queue is clear for these filters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}>
                <button onClick={() => openDetail(r.id)} className="w-full text-left flex items-start gap-3 px-3 py-3 sm:p-3 min-h-[64px] hover:bg-bg/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action">
                  <span className={`shrink-0 mt-0.5 min-w-[28px] h-6 px-1.5 grid place-items-center rounded-full text-[11px] font-bold tabular-nums ${r.priority >= 70 ? "bg-error/10 text-error" : r.priority >= 30 ? "bg-warning/10 text-warning" : "bg-bg text-text-secondary border border-border"}`}>
                    {r.priority}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide border border-border rounded-full px-2 py-0.5 text-text-secondary">{typeLabel(r.type)}</span>
                      {r.category && <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-bg border border-border text-text-secondary">{r.category.label} · {r.category.severity}</span>}
                      {r.siblingsCount > 1 && <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-action/10 text-action border border-action/20">×{r.siblingsCount} reports</span>}
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${r.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : r.status === "accepted" ? "bg-success/10 text-success border-success/20" : "bg-bg text-text-secondary border-border"}`}>{r.status}</span>
                    </span>
                    <span className="block text-sm text-text-primary leading-snug line-clamp-2 break-words mt-1">{r.details || `Report #${r.id} — no details`}</span>
                    <span className="block text-xs text-text-secondary truncate mt-0.5">by {r.reporter?.name ?? "unknown"} · {r.createdAgo}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {(meta.lastPage ?? 1) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-secondary tabular-nums">Page {meta.currentPage} of {meta.lastPage} · {meta.total} total</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={meta.currentPage <= 1} onClick={() => gotoPage(meta.currentPage - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={meta.currentPage >= meta.lastPage} onClick={() => gotoPage(meta.currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </section>

      <Modal isOpen={!!selectedId} onClose={() => { setSelectedId(null); setDetail(null); }} title={detail ? `Report #${detail.data?.id} · ${typeLabel(detail.data?.type)}` : "Loading report…"} maxWidth="max-w-2xl">
        {loadingDetail && <p className="text-sm text-text-secondary py-6 text-center">Loading…</p>}
        {detail && (
          <div className="grid gap-4">
            <div className="rounded-xl border border-border bg-bg p-3">
              <p className="text-xs font-semibold tracking-widest text-text-secondary">REPORTED CONTENT</p>
              <p className="text-sm text-text-primary mt-1 break-words">{detail.target?.preview}</p>
              {detail.target?.link && <Link href={detail.target.link} className="text-xs text-action hover:underline mt-1 inline-block">Open content</Link>}
              {detail.target?.hidden && <span className="ml-2 text-[10px] font-bold bg-error/10 text-error border border-error/20 rounded-full px-2 py-0.5">REMOVED/HIDDEN</span>}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-text-secondary">ALL REPORTS ON THIS TARGET ({detail.siblings?.length ?? 0})</p>
              <ul className="mt-1 divide-y divide-border border border-border rounded-xl overflow-hidden">
                {(detail.siblings ?? []).map((s) => (
                  <li key={s.id} className="px-3 py-2 bg-surface">
                    <p className="text-sm text-text-primary break-words">{s.category?.label} — {s.details || "no details"}</p>
                    <p className="text-xs text-text-secondary mt-0.5">by {s.reporter?.name} · {s.createdAgo} · {s.status}</p>
                  </li>
                ))}
              </ul>
            </div>
            {detail.history && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold tracking-widest text-text-secondary">OFFENDER HISTORY (judgement aid)</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[["Total", detail.history.totalReports], ["Accepted", detail.history.accepted], ["Rejected", detail.history.rejected], ["Pending", detail.history.pending]].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-border p-2 text-center">
                      <p className="text-lg font-bold text-text-primary tabular-nums">{v}</p>
                      <p className="text-[11px] text-text-secondary">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Warnings: {detail.history.warningCount} · Status: {detail.history.status}
                  {detail.offender && ` · ${detail.offender.name} (@${detail.offender.username ?? detail.offender.id})`}
                </p>
              </div>
            )}
            {(detail.data?.status === "pending") && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setRejectOpen(true); }}>Reject report…</Button>
                <Button variant="danger" className="flex-1" onClick={() => setAcceptOpen(true)}>Accept & act…</Button>
              </div>
            )}
            {detail.data?.status !== "pending" && (
              <p className="text-xs text-text-secondary">Resolved as {detail.data?.status} · {detail.data?.actionTaken} · {detail.data?.adminNote}</p>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject report" footer={<><Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button><Button variant="danger" disabled={acting} onClick={doReject}>{acting ? "Working…" : "Reject & notify reporter"}</Button></>}>
        <p className="text-sm text-text-secondary">Reason is required — it is sent to the reporter.</p>
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} maxLength={2000} placeholder="Why is this report not actionable? (min 10 chars)" className="mt-2 w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-action resize-none" />
      </Modal>

      <Modal isOpen={acceptOpen} onClose={() => setAcceptOpen(false)} title="Accept report & enforce" maxWidth="max-w-lg" footer={<><Button variant="ghost" onClick={() => setAcceptOpen(false)}>Cancel</Button><Button variant="danger" disabled={acting} onClick={doAccept}>{acting ? "Working…" : "Apply & notify both"}</Button></>}>
        <div className="grid gap-3">
          <label className="text-sm text-text-primary font-medium">Action
            <select value={acceptForm.action} onChange={(e) => setAcceptForm({ ...acceptForm, action: e.target.value })} className="mt-1 w-full bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm">
              <option value="warn">Warn user (notify + strike)</option>
              <option value="remove_content">Remove content only</option>
              <option value="suspend">Suspend account (timed)</option>
              <option value="ban">Ban account (permanent)</option>
            </select>
          </label>
          {acceptForm.action === "suspend" && (
            <label className="text-sm text-text-primary font-medium">Duration (days)
              <select value={acceptForm.duration_days} onChange={(e) => setAcceptForm({ ...acceptForm, duration_days: Number(e.target.value) })} className="mt-1 w-full bg-bg border border-border rounded-lg px-3 min-h-[44px] text-sm">
                {[1, 3, 7, 14, 30, 90].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={acceptForm.remove_content} onChange={(e) => setAcceptForm({ ...acceptForm, remove_content: e.target.checked })} className="w-5 h-5 accent-[var(--color-action)]" />
            Also remove the reported content
          </label>
          <textarea value={acceptForm.reason} onChange={(e) => setAcceptForm({ ...acceptForm, reason: e.target.value })} rows={4} maxLength={2000} placeholder="Reason sent to reporter + offender (min 10 chars)" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-action resize-none" />
        </div>
      </Modal>
    </div>
  );
}
