import { useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { httpApi } from "../../utils/http";
import { useToast } from "../../context/ToastContext";
import AdminHeader from "../../Components/Admin/AdminHeader";
import AdminStatCard from "../../Components/Admin/AdminStatCard";
import ExportDropdown from "../../Components/Admin/ExportDropdown";
import Modal from "../../Components/Modal";
import Button from "../../Components/Button";
import {
  BadgeCheckIcon,
  CheckIcon,
  XIcon,
  ShieldIcon,
  SearchIcon,
  DownloadIcon,
  FileIcon,
  ExternalLinkIcon,
  SpinnerIcon,
} from "../../Components/icons";

export default function AdminVerifications({
  requests = { data: [], meta: {} },
  filters = {},
  stats = {},
}) {
  const page = usePage();
  const toast = useToast();
  const isAdmin = hasRole(page, "Admin");

  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Approve modal
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Revoke modal
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const [acting, setActing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  const applyFilters = (patch = {}) => {
    const next = { ...filters, ...patch };
    setIsSearching(true);
    router.get("/admin/verifications", next, {
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
      applyFilters({ search: value, page: 1 });
    }, 280);
  };

  const handleClearSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchDraft("");
    applyFilters({ search: "", page: 1 });
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await httpApi.post(`/admin/verifications/${selectedRequest.id}/approve`, {
        note: approveNote.trim(),
      });
      toast.success(`Brand verification approved for ${selectedRequest.businessName}!`);
      setApproveOpen(false);
      setApproveNote("");
      setSelectedRequest(null);
      router.reload({ only: ["requests", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not approve verification.");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error("Please enter a reason for rejection (min 5 characters).");
      return;
    }
    setActing(true);
    try {
      await httpApi.post(`/admin/verifications/${selectedRequest.id}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.success(`Verification request rejected.`);
      setRejectOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
      router.reload({ only: ["requests", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not reject verification.");
    } finally {
      setActing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim() || revokeReason.trim().length < 5) {
      toast.error("Please enter a reason for badge revocation.");
      return;
    }
    setActing(true);
    try {
      await httpApi.post(`/admin/verifications/${selectedRequest.user.id}/revoke`, {
        reason: revokeReason.trim(),
      });
      toast.success(`Verified badge revoked for ${selectedRequest.businessName}.`);
      setRevokeOpen(false);
      setRevokeReason("");
      setSelectedRequest(null);
      router.reload({ only: ["requests", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not revoke badge.");
    } finally {
      setActing(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const rows = requests?.data ?? [];
  const meta = requests?.meta ?? requests;

  const statusTabs = [
    { id: "pending", label: "Pending Review", count: stats.pending ?? 0 },
    { id: "approved", label: "Approved Brands", count: stats.approved ?? 0 },
    { id: "rejected", label: "Rejected", count: stats.rejected ?? 0 },
    { id: "all", label: "All Requests", count: stats.total ?? 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Brand Verifications — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Brand Verifications"
        subtitle="Review business registration and credential approval"
        activeTab="verifications"
        badges={{ verifications: stats.pending ?? 0 }}
        actions={
          <ExportDropdown defaultEndpoint="/admin/export/verifications" defaultLabel="Verifications" />
        }
      />

      {/* Modern Stat Cards */}
      <section aria-label="Verification Stats" className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <AdminStatCard
            label="Pending Submissions"
            value={stats.pending ?? 0}
            sublabel="Awaiting operator review"
            icon={BadgeCheckIcon}
            variant={(stats.pending ?? 0) > 0 ? "amber" : "default"}
          />
          <AdminStatCard
            label="Approved Brands"
            value={stats.approved ?? 0}
            sublabel="Verified credentials active"
            icon={CheckIcon}
            variant="emerald"
          />
          <AdminStatCard
            label="Rejected Requests"
            value={stats.rejected ?? 0}
            sublabel="Ineligible or incomplete"
            icon={XIcon}
            variant="default"
          />
          <AdminStatCard
            label="Total Applications"
            value={stats.total ?? 0}
            sublabel="All-time verification volume"
            icon={ShieldIcon}
            variant="primary"
          />
        </div>
      </section>

      {/* Quick Status Chips */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar py-1">
        {statusTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => applyFilters({ status: s.id, page: 1 })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 border ${
              (filters.status ?? "pending") === s.id
                ? "bg-action text-white border-action shadow-xs"
                : "bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-bg"
            }`}
          >
            <span>{s.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                (filters.status ?? "pending") === s.id
                  ? "bg-white/20 text-white"
                  : "bg-bg text-text-secondary"
              }`}
            >
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <section className="mb-4 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by business name, applicant username, or email…"
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
      </section>

      {/* Queue Table */}
      <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Business &amp; Applicant</th>
                <th className="py-3 px-3">Document</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-text-secondary">
                    No verification requests found matching your filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-bg/40 transition-colors">
                    {/* Business Name and User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {r.user?.avatar ? (
                          <img
                            src={r.user.avatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-action/10 text-action grid place-items-center font-bold">
                            {r.businessName?.charAt(0) ?? "B"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate">
                            {r.businessName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {r.user ? `${r.user.name} (@${r.user.username})` : "Account removed"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Document Link */}
                    <td className="py-3 px-3">
                      {r.documentUrl ? (
                        <a
                          href={r.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline cursor-pointer"
                        >
                          <FileIcon className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-text-secondary/60 text-xs italic">No document</span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          r.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : r.status === "rejected"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="text-xs text-text-secondary line-clamp-1" title={r.notes}>
                        {r.notes || "—"}
                      </p>
                    </td>

                    {/* Submitted time */}
                    <td className="py-3 px-3 text-xs text-text-secondary tabular-nums">
                      {r.createdAtHuman}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setApproveOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setRejectOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {r.status === "approved" && (
                          <button
                            onClick={() => {
                              setSelectedRequest(r);
                              setRevokeOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bg text-text-secondary border border-border hover:text-rose-600 hover:border-rose-500/30 active:scale-95 transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} requests)
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

      {/* APPROVE MODAL */}
      <Modal isOpen={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Brand Verification">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Approve verification for <span className="font-bold text-text-primary">{selectedRequest?.businessName}</span>. This attaches the verified brand checkmark to their profile and all their listings.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Admin Note (Optional)
            </label>
            <textarea
              rows={3}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="e.g. DTI / SEC permit verified and matches brand name."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={acting} onClick={handleApprove}>
              {acting ? "Approving..." : "Confirm Approval"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Verification Request">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Provide a clear rationale for declining <span className="font-bold text-text-primary">{selectedRequest?.businessName}</span>. The applicant will receive this explanation.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Submitted business registration document was expired or illegible..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={acting} onClick={handleReject}>
              {acting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REVOKE MODAL */}
      <Modal isOpen={revokeOpen} onClose={() => setRevokeOpen(false)} title="Revoke Verified Brand Status">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Revoke the verified brand status and badge from <span className="font-bold text-text-primary">{selectedRequest?.businessName}</span>.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Revocation Reason
            </label>
            <textarea
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason for revoking business badge..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRevokeOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={acting} onClick={handleRevoke}>
              {acting ? "Revoking..." : "Confirm Revocation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
