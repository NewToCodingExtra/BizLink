import { useEffect, useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { httpApi } from "../../utils/http";
import { profilePath } from "../../utils/profilePath";
import { useToast } from "../../context/ToastContext";
import AdminHeader from "../../components/Admin/AdminHeader";
import AdminStatCard from "../../components/Admin/AdminStatCard";
import ExportDropdown from "../../components/Admin/ExportDropdown";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import {
  FlagIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon,
  ShieldIcon,
  ArrowRightIcon,
  SpinnerIcon,
} from "../../components/icons";

function typeLabel(t) {
  return (
    {
      opportunity_feed: "Feed Post",
      opportunity_reel: "Reel",
      comment: "Comment",
      story: "Story",
      message: "Direct Message",
      conversation: "Chat",
      user: "User Account",
    }[t] ?? t
  );
}

export default function AdminReports({
  filters = {},
  categories = [],
  types = [],
  stats = {},
  reports = { data: [], meta: {} },
}) {
  const page = usePage();
  const toast = useToast();
  const isAdmin = hasRole(page, "Admin");
  const rows = reports?.data ?? [];
  const meta = reports?.meta ?? reports;

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
  const [acceptForm, setAcceptForm] = useState({
    action: "warn",
    reason: "",
    duration_days: 7,
    remove_content: true,
  });
  const [acting, setActing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  const apply = (patch = {}) => {
    const next = { ...local, ...patch };
    setLocal(next);
    setIsSearching(true);
    router.get("/admin/reports", next, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onFinish: () => setIsSearching(false),
    });
  };

  const handleSearchChange = (value) => {
    setSearchDraft(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      apply({ search: value, page: 1 });
    }, 280);
  };

  const handleClearSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchDraft("");
    apply({ search: "", page: 1 });
  };

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await httpApi.get(`/admin/reports/${id}`);
      const reportItem = res.report || res.data || res;
      setDetail({
        ...res,
        report: reportItem,
        data: reportItem,
      });
    } catch (err) {
      toast.error(err.message || "Could not load report details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const doReject = async () => {
    if (rejectReason.trim().length < 10) {
      toast.error("Rejection explanation required (minimum 10 characters).");
      return;
    }
    setActing(true);
    try {
      await httpApi.post(`/admin/reports/${selectedId}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.success("Report rejected — reporter notified.");
      setRejectOpen(false);
      setRejectReason("");
      setSelectedId(null);
      setDetail(null);
      router.reload({ only: ["reports", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not reject report.");
    } finally {
      setActing(false);
    }
  };

  const doAccept = async () => {
    if (acceptForm.reason.trim().length < 10) {
      toast.error("Enforcement reason required (minimum 10 characters).");
      return;
    }
    setActing(true);
    try {
      await httpApi.post(`/admin/reports/${selectedId}/accept`, {
        action: acceptForm.action,
        reason: acceptForm.reason.trim(),
        duration_days: acceptForm.action === "suspend" ? Number(acceptForm.duration_days) : null,
        remove_content: !!acceptForm.remove_content,
      });
      toast.success("Moderation action applied and logged.");
      setAcceptOpen(false);
      setSelectedId(null);
      setDetail(null);
      setAcceptForm({ action: "warn", reason: "", duration_days: 7, remove_content: true });
      router.reload({ only: ["reports", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not apply moderation action.");
    } finally {
      setActing(false);
    }
  };

  const typeSet = new Set((local.types ? String(local.types).split(",") : []).filter(Boolean));
  const toggleType = (t) => {
    const next = new Set(typeSet);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    apply({ types: Array.from(next).join(",") });
  };

  if (!isAdmin) {
    return null;
  }

  const statusOptions = [
    { id: "pending", label: "Pending" },
    { id: "accepted", label: "Accepted" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All Statuses" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Moderation Reports — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Moderation Reports"
        subtitle="Community reports queue & enforcement actions"
        activeTab="reports"
        badges={{ reports: stats.pending ?? 0 }}
        actions={
          <ExportDropdown defaultEndpoint="/admin/export/reports" defaultLabel="Reports" />
        }
      />

      {/* Modern Stat Cards */}
      <section aria-label="Queue Metrics" className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <AdminStatCard
            label="Pending Review"
            value={stats.pending ?? 0}
            sublabel="Awaiting operator decision"
            icon={FlagIcon}
            variant={(stats.pending ?? 0) > 0 ? "amber" : "default"}
          />
          <AdminStatCard
            label="High Severity Open"
            value={stats.highSeverity ?? 0}
            sublabel="Urgent policy breaches"
            icon={AlertTriangleIcon}
            variant={(stats.highSeverity ?? 0) > 0 ? "rose" : "default"}
          />
          <AdminStatCard
            label="Accepted Today"
            value={stats.acceptedToday ?? 0}
            sublabel="Enforcement applied"
            icon={CheckIcon}
            variant="emerald"
          />
          <AdminStatCard
            label="Rejected Today"
            value={stats.rejectedToday ?? 0}
            sublabel="Dismissed / no violation"
            icon={XIcon}
            variant="default"
          />
        </div>
      </section>

      {/* Filter and Search Box */}
      <section className="mb-4 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs space-y-3">
        {/* Row 1: Search + Status */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 min-w-0 flex items-center">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search reports, reporter name, offender notes, reason…"
              className="w-full bg-bg border border-border rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-text-primary outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all placeholder:text-text-secondary/60"
            />
            <div className="absolute left-3 pointer-events-none flex items-center justify-center">
              {isSearching ? (
                <SpinnerIcon className="w-4 h-4 text-action" />
              ) : (
                <SearchIcon className="w-4 h-4 text-text-secondary" />
              )}
            </div>
            {searchDraft && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear search"
                className="absolute right-2.5 w-5 h-5 rounded-full bg-border/60 hover:bg-border text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => apply({ status: opt.id })}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  local.status === opt.id
                    ? "bg-action text-white border-action shadow-xs"
                    : "bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Target Types Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mr-1">
            Target:
          </span>
          {(types.length
            ? types
            : [
                "opportunity_feed",
                "opportunity_reel",
                "comment",
                "story",
                "message",
                "conversation",
                "user",
              ]
          ).map((t) => {
            const isSelected = typeSet.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-action/15 text-action border-action/40 font-bold"
                    : "bg-bg text-text-secondary border-border hover:bg-surface"
                }`}
              >
                {typeLabel(t)}
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdowns & Slider */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60">
          <select
            value={local.category}
            onChange={(e) => apply({ category: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Category"
          >
            <option value="">All Categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} (Sev {c.severity})
              </option>
            ))}
          </select>

          <select
            value={local.sort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Sort"
          >
            <option value="priority">Sort: Priority Score</option>
            <option value="newest">Sort: Newest First</option>
            <option value="severity">Sort: Highest Severity</option>
            <option value="reports">Sort: Repeat Reports</option>
          </select>

          <select
            value={local.order}
            onChange={(e) => apply({ order: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Order"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <div className="flex items-center gap-2 px-2 rounded-xl bg-bg border border-border text-xs text-text-secondary">
            <span className="font-semibold text-text-primary shrink-0 tabular-nums">
              Sev ≥ {local.severityMin}
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={local.severityMin}
              onChange={(e) => apply({ severityMin: Number(e.target.value) })}
              className="flex-1 accent-action cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Reports Queue List */}
      <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto">
              <CheckIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Queue is clear</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No reports match your current filters. All pending reports have been addressed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((r) => {
              const sev = r.category?.severity ?? 10;
              const isUrgent = sev >= 70;
              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 hover:bg-bg/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Priority score indicator */}
                    <div
                      className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 font-extrabold text-sm tabular-nums border shadow-xs ${
                        isUrgent
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                          : r.priority >= 30
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-bg text-text-secondary border-border"
                      }`}
                    >
                      {r.priority}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-bg border border-border text-text-secondary">
                          {typeLabel(r.type)}
                        </span>
                        {r.category && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              isUrgent
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                : "bg-bg border-border text-text-primary"
                            }`}
                          >
                            {r.category.label} (Sev {sev})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            r.status === "pending"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : r.status === "accepted"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-bg text-text-secondary border-border"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-text-primary line-clamp-2">
                        {r.details || "No reporter explanation provided."}
                      </p>

                      <p className="text-xs text-text-secondary mt-1">
                        Filed by <span className="font-medium text-text-primary">{r.reporter?.name ?? "Anonymous"}</span>
                        {" · "}
                        <span className="tabular-nums">{r.createdAgo}</span>
                        {r.siblingsCount > 1 && (
                          <span className="ml-2 font-semibold text-amber-600">
                            ({r.siblingsCount} reports on this item)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => openDetail(r.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-action text-white hover:bg-action-hover active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Strip */}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} reports)
            </span>
            <div className="flex items-center gap-1">
              {meta.links?.map((link, i) => (
                <button
                  key={i}
                  disabled={!link.url || link.active}
                  onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    link.active
                      ? "bg-action text-white border-action"
                      : link.url
                      ? "bg-surface border-border hover:bg-bg"
                      : "opacity-40 cursor-not-allowed border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* REPORT DETAIL MODAL */}
      <Modal
        isOpen={!!selectedId && !rejectOpen && !acceptOpen}
        onClose={() => {
          setSelectedId(null);
          setDetail(null);
        }}
        title={`Report #${selectedId}`}
      >
        {loadingDetail ? (
          <p className="p-8 text-center text-xs text-text-secondary">Loading report data...</p>
        ) : detail ? (() => {
          const rep = detail.report || detail.data;
          const isPending = rep?.status === "pending";
          const catLabel = rep?.category?.label || rep?.category?.key || "Community Guideline Violation";
          const catSev = rep?.category?.severity !== undefined ? rep.category.severity : 20;

          return (
            <div className="space-y-4">
              {/* Target Snippet */}
              <div className="p-4 rounded-xl bg-bg border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
                  Reported Content ({typeLabel(rep?.type)})
                </span>
                <p className="text-sm font-semibold text-text-primary">
                  {detail.target?.preview || "[Content Preview Unavailable]"}
                </p>
                {detail.target?.link && (
                  <Link
                    href={detail.target.link}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-action hover:underline mt-1 font-semibold"
                  >
                    <span>Open live content</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Reporter details */}
              <div className="p-4 rounded-xl bg-bg border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
                  Reporter Claim
                </span>
                <p className="text-xs text-text-primary font-medium">
                  Category: <span className="font-bold">{catLabel}</span>{" "}
                  <span className="text-text-secondary font-normal">(Severity {catSev})</span>
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Details: &ldquo;{rep?.details || "No additional text provided."}&rdquo;
                </p>
                <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1">
                  <span>Filed by</span>
                  {rep?.reporter?.username ? (
                    <Link
                      href={profilePath(rep.reporter)}
                      className="font-semibold text-text-primary hover:text-action hover:underline cursor-pointer"
                    >
                      {rep.reporter.name || rep.reporter.username}
                    </Link>
                  ) : (
                    <span className="font-semibold text-text-primary">
                      {rep?.reporter?.name || "Community Member"}
                    </span>
                  )}
                  <span>· {rep?.createdAgo || "Recently"}</span>
                </p>
              </div>

              {/* Offender History if available */}
              {detail.offender && (
                <div className="p-4 rounded-xl bg-bg border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-2">
                    Account Under Review
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Link href={profilePath(detail.offender)} className="shrink-0 cursor-pointer">
                        <img
                          src={detail.offender.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-border hover:border-action transition-all shadow-xs"
                        />
                      </Link>
                      <div>
                        <Link
                          href={profilePath(detail.offender)}
                          className="text-xs font-bold text-text-primary hover:text-action hover:underline cursor-pointer transition-colors block"
                        >
                          {detail.offender.name}
                        </Link>
                        <p className="text-[11px] text-text-secondary">
                          <Link
                            href={profilePath(detail.offender)}
                            className="hover:text-action hover:underline cursor-pointer"
                          >
                            @{detail.offender.username}
                          </Link>
                          {" "}· {detail.offender.warningCount ?? 0} warnings
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        detail.offender.status === "banned"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}
                    >
                      {detail.offender.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Decision & Moderation Controls */}
              <div className="pt-3 border-t border-border">
                {isPending ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-secondary">
                      Action Required:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectOpen(true)}
                        className="cursor-pointer active:scale-95 transition-all"
                      >
                        Reject / Dismiss
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setAcceptOpen(true)}
                        className="cursor-pointer active:scale-95 transition-all"
                      >
                        Accept &amp; Take Action
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-surface border border-border text-xs text-text-secondary text-center">
                      This report was resolved as{" "}
                      <span className="font-bold text-text-primary uppercase">{rep?.status}</span>
                      {rep?.actionTaken && (
                        <span className="ml-1 text-text-primary">
                          (Action: <span className="font-semibold">{rep.actionTaken}</span>)
                        </span>
                      )}
                      {rep?.adminNote && (
                        <p className="text-[11px] text-text-secondary mt-1 italic">
                          Note: &ldquo;{rep.adminNote}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-text-secondary">
                        Re-evaluate or adjust moderation:
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => setRejectOpen(true)}
                          className="cursor-pointer active:scale-95 transition-all"
                        >
                          Mark Rejected
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => setAcceptOpen(true)}
                          className="cursor-pointer active:scale-95 transition-all"
                        >
                          Enforce Action
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })() : null}
      </Modal>

      {/* REJECT CONFIRMATION MODAL */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Report">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Dismiss this report if no platform violation was found. The reporter will be notified with your explanation.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Rejection Explanation (min 10 characters)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this content adheres to community guidelines..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>
              Back
            </Button>
            <Button variant="primary" size="sm" disabled={acting} onClick={doReject}>
              {acting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ACCEPT & TAKE ACTION MODAL */}
      <Modal isOpen={acceptOpen} onClose={() => setAcceptOpen(false)} title="Accept Report & Apply Action">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Moderation Action
            </label>
            <select
              value={acceptForm.action}
              onChange={(e) => setAcceptForm({ ...acceptForm, action: e.target.value })}
              className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            >
              <option value="warn">Issue Official Warning</option>
              <option value="remove_content">Remove Content Only</option>
              <option value="suspend">Suspend Account</option>
              <option value="ban">Permanently Ban Account</option>
            </select>
          </div>

          {acceptForm.action === "suspend" && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                Suspension Days
              </label>
              <select
                value={acceptForm.duration_days}
                onChange={(e) => setAcceptForm({ ...acceptForm, duration_days: Number(e.target.value) })}
                className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={90}>90 Days (3 Months)</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={acceptForm.remove_content}
              onChange={(e) => setAcceptForm({ ...acceptForm, remove_content: e.target.checked })}
              className="w-4 h-4 rounded text-action accent-action"
            />
            <span>Also remove / hide the reported content from the platform</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Enforcement Reason (min 10 characters)
            </label>
            <textarea
              rows={3}
              value={acceptForm.reason}
              onChange={(e) => setAcceptForm({ ...acceptForm, reason: e.target.value })}
              placeholder="State the guidelines violated and the rationale for this enforcement action..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAcceptOpen(false)}>
              Back
            </Button>
            <Button variant="danger" size="sm" disabled={acting} onClick={doAccept}>
              {acting ? "Applying..." : "Apply Action"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
