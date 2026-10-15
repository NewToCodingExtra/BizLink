import { useState, useEffect, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { httpApi } from "../../utils/http";
import { profilePath } from "../../utils/profilePath";
import { useToast } from "../../context/ToastContext";
import AdminHeader from "../../Components/Admin/AdminHeader";
import ExportDropdown from "../../Components/Admin/ExportDropdown";
import Modal from "../../Components/Modal";
import Button from "../../Components/Button";
import {
  UsersIcon,
  ShieldIcon,
  AlertTriangleIcon,
  SearchIcon,
  DownloadIcon,
  CheckIcon,
  LockIcon,
  UnlockIcon,
  KeyIcon,
  EyeIcon,
  XIcon,
  SpinnerIcon,
} from "../../Components/icons";

export default function AdminUsers({
  users = { data: [], links: [], meta: {} },
  filters = {},
  stats = {},
}) {
  const page = usePage();
  const toast = useToast();
  const isAdmin = hasRole(page, "Admin");

  const [localFilters, setLocalFilters] = useState({
    search: filters.search ?? "",
    status: filters.status ?? "all",
    role: filters.role ?? "all",
    verified: filters.verified ?? "all",
    sort: filters.sort ?? "newest",
    order: filters.order ?? "desc",
  });
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Detail Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action Modals state
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warnReason, setWarnReason] = useState("");

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendReason, setSuspendReason] = useState("");

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banConfirm, setBanConfirm] = useState("");

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("User");

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  const applyFilters = (patch = {}) => {
    const next = { ...localFilters, ...patch };
    setLocalFilters(next);
    setIsSearching(true);
    router.get("/admin/users", next, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ["users", "stats", "filters"],
      onFinish: () => setIsSearching(false),
    });
  };

  const handleSearchChange = (value) => {
    setSearchDraft(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      applyFilters({ search: value, page: 1 });
    }, 280);
  };

  const handleClearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchDraft("");
    applyFilters({ search: "", page: 1 });
  };

  const openDrawer = async (user) => {
    setSelectedUser(user);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const res = await httpApi.get(`/admin/users/${user.id}`);
      setDetailData(res);
    } catch (err) {
      toast.error(err.message || "Failed to load user details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleWarn = async () => {
    if (!warnReason.trim() || warnReason.trim().length < 5) {
      toast.error("Please enter a warning reason (min 5 characters).");
      return;
    }
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${selectedUser.id}/warn`, { reason: warnReason.trim() });
      toast.success(`Warning issued to ${selectedUser.name}.`);
      setWarnModalOpen(false);
      setWarnReason("");
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not issue warning.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || suspendReason.trim().length < 5) {
      toast.error("Please enter a suspension reason (min 5 characters).");
      return;
    }
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${selectedUser.id}/suspend`, {
        days: suspendDays,
        reason: suspendReason.trim(),
      });
      toast.success(`${selectedUser.name} suspended for ${suspendDays} days.`);
      setSuspendModalOpen(false);
      setSuspendReason("");
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not suspend user.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnsuspend = async (user) => {
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${user.id}/unsuspend`, {});
      toast.success(`Suspension lifted for ${user.name}.`);
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not lift suspension.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBan = async () => {
    if (banConfirm !== selectedUser.username && banConfirm !== selectedUser.email) {
      toast.error(`Please type "${selectedUser.username || selectedUser.email}" to confirm.`);
      return;
    }
    if (!banReason.trim() || banReason.trim().length < 5) {
      toast.error("Please enter a ban reason (min 5 characters).");
      return;
    }
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${selectedUser.id}/ban`, { reason: banReason.trim() });
      toast.success(`${selectedUser.name} has been permanently banned.`);
      setBanModalOpen(false);
      setBanReason("");
      setBanConfirm("");
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not ban user.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnban = async (user) => {
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${user.id}/unban`, {});
      toast.success(`Ban lifted for ${user.name}.`);
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not unban user.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleChangeRole = async () => {
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${selectedUser.id}/role`, { role: selectedRole });
      toast.success(`Role for ${selectedUser.name} changed to ${selectedRole}.`);
      setRoleModalOpen(false);
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not change role.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleResetPassword = async (user) => {
    setSelectedUser(user);
    setActionInProgress(true);
    try {
      const res = await httpApi.post(`/admin/users/${user.id}/reset-password`, {});
      setTempPassword(res.tempPassword);
      setPasswordModalOpen(true);
      toast.success("Temporary password generated.");
    } catch (err) {
      toast.error(err.message || "Could not reset password.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnlock = async (user) => {
    setActionInProgress(true);
    try {
      await httpApi.post(`/admin/users/${user.id}/unlock`, {});
      toast.success(`Lockout cleared for ${user.name}.`);
      router.reload({ only: ["users", "stats"] });
    } catch (err) {
      toast.error(err.message || "Could not clear lockout.");
    } finally {
      setActionInProgress(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const rows = users?.data ?? [];
  const meta = users?.meta ?? users;

  const statusTabs = [
    { id: "all", label: "All Accounts", count: stats.total ?? 0 },
    { id: "active", label: "Active", count: stats.active ?? 0 },
    { id: "suspended", label: "Suspended", count: stats.suspended ?? 0 },
    { id: "banned", label: "Banned", count: stats.banned ?? 0 },
    { id: "locked", label: "Locked", count: stats.locked ?? 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="User Management — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="User Management"
        subtitle="Account inspection, access control & moderation status"
        activeTab="users"
        actions={
          <ExportDropdown defaultEndpoint="/admin/export/users" defaultLabel="Users" />
        }
      />

      {/* Quick Status Chips */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar py-1">
        {statusTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => applyFilters({ status: s.id, page: 1 })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 border ${
              localFilters.status === s.id
                ? "bg-action text-white border-action shadow-xs"
                : "bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-bg"
            }`}
          >
            <span>{s.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                localFilters.status === s.id
                  ? "bg-white/20 text-white"
                  : "bg-bg text-text-secondary"
              }`}
            >
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Toolbar */}
      <section className="mb-4 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box - Live AJAX Debounced */}
          <div className="lg:col-span-2 relative flex items-center">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search any user, @username, email, role, or ID…"
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

          {/* Role Filter */}
          <select
            value={localFilters.role}
            onChange={(e) => applyFilters({ role: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Role"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Brand (Manager)</option>
            <option value="User">Entrepreneur (User)</option>
          </select>

          {/* Verified Filter */}
          <select
            value={localFilters.verified}
            onChange={(e) => applyFilters({ verified: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Verification status"
          >
            <option value="all">All Verification</option>
            <option value="1">Verified Brands Only</option>
            <option value="0">Unverified Only</option>
          </select>

          {/* Sort Filter */}
          <select
            value={localFilters.sort}
            onChange={(e) => applyFilters({ sort: e.target.value })}
            className="bg-bg border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary outline-none focus:border-action cursor-pointer"
            aria-label="Sort users"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="strikes">Sort: Most Strikes</option>
            <option value="warnings">Sort: Most Warnings</option>
            <option value="posts">Sort: Most Posts</option>
            <option value="name">Sort: Alphabetical</option>
          </select>
        </div>
      </section>

      {/* User Records Table */}
      <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Warnings</th>
                <th className="py-3 px-3 text-center">Strikes</th>
                <th className="py-3 px-3 text-center">Posts</th>
                <th className="py-3 px-3">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-text-secondary">
                    No users matching the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-bg/40 transition-colors group"
                  >
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link href={profilePath(u)} className="shrink-0 cursor-pointer">
                          <img
                            src={u.avatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover bg-bg border border-border shrink-0 shadow-xs hover:border-action transition-all"
                          />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={profilePath(u)}
                              className="font-bold text-text-primary hover:text-action hover:underline cursor-pointer truncate transition-colors block"
                              title={`View ${u.name}'s profile`}
                            >
                              {u.name}
                            </Link>
                            {u.isBrandVerified && (
                              <span
                                title="Verified Brand"
                                className="w-4 h-4 rounded-full bg-action text-white grid place-items-center shrink-0 shadow-xs"
                              >
                                <CheckIcon className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary truncate">
                            <Link
                              href={profilePath(u)}
                              className="hover:text-action hover:underline cursor-pointer transition-colors"
                            >
                              @{u.username}
                            </Link>
                            {" "}· {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          u.role === "Admin"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            : u.role === "Manager"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-bg text-text-secondary border-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {u.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                          <LockIcon className="w-3 h-3" /> Locked
                        </span>
                      ) : u.status === "banned" ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Banned
                        </span>
                      ) : u.status === "suspended" ? (
                        <span
                          title={`Suspended until ${u.suspendedUntil}`}
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Warnings */}
                    <td className="py-3 px-3 text-center tabular-nums">
                      {u.warningCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          {u.warningCount}
                        </span>
                      ) : (
                        <span className="text-text-secondary/50">0</span>
                      )}
                    </td>

                    {/* Strikes */}
                    <td className="py-3 px-3 text-center tabular-nums">
                      {u.strikesCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                          {u.strikesCount}
                        </span>
                      ) : (
                        <span className="text-text-secondary/50">0</span>
                      )}
                    </td>

                    {/* Posts Count */}
                    <td className="py-3 px-3 text-center tabular-nums font-semibold text-text-primary">
                      {u.opportunitiesCount}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-3 text-text-secondary text-xs tabular-nums">
                      {u.createdAtHuman}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDrawer(u)}
                          title="Inspect User Details"
                          className="p-1.5 rounded-lg bg-bg border border-border text-text-secondary hover:text-text-primary hover:border-action/40 active:scale-95 transition-all cursor-pointer"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setWarnModalOpen(true);
                          }}
                          title="Issue Warning"
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          Warn
                        </button>

                        {u.status === "suspended" ? (
                          <button
                            onClick={() => handleUnsuspend(u)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSuspendModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {u.isLocked && (
                          <button
                            onClick={() => handleUnlock(u)}
                            title="Clear Rate Limit Lockout"
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all cursor-pointer"
                          >
                            Unlock
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

        {/* Pagination Strip */}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>
              Showing {meta.from} to {meta.to} of {meta.total} users
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

      {/* USER DETAIL DRAWER / MODAL */}
      <Modal
        isOpen={!!selectedUser && !warnModalOpen && !suspendModalOpen && !banModalOpen && !roleModalOpen && !passwordModalOpen}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `User: ${selectedUser.name}` : "User Details"}
      >
        {selectedUser && (
          <div className="space-y-4">
            {/* Profile Snapshot Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-bg border border-border">
              <Link href={profilePath(selectedUser)} className="shrink-0 cursor-pointer">
                <img
                  src={selectedUser.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-border shadow-xs hover:border-action transition-all"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={profilePath(selectedUser)}
                    className="text-base font-bold text-text-primary hover:text-action hover:underline cursor-pointer truncate transition-colors"
                    title={`Open ${selectedUser.name}'s public profile`}
                  >
                    {selectedUser.name}
                  </Link>
                  {selectedUser.isBrandVerified && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-action/10 text-action border border-action/20">
                      Verified Brand
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  <Link
                    href={profilePath(selectedUser)}
                    className="hover:text-action hover:underline cursor-pointer"
                  >
                    @{selectedUser.username}
                  </Link>
                  {" "}· {selectedUser.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-border">
                    {selectedUser.role}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Joined {selectedUser.createdAtHuman}
                  </span>
                </div>
              </div>
            </div>

            {loadingDetail ? (
              <p className="p-8 text-center text-xs text-text-secondary">Loading details...</p>
            ) : detailData ? (
              <>
                {/* Moderation & Strikes Panel */}
                <div className="p-4 rounded-xl bg-bg border border-border">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Moderation &amp; Enforcement History
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <span className="text-base font-bold text-text-primary tabular-nums">
                        {detailData.offenderHistory?.totalReports ?? 0}
                      </span>
                      <p className="text-[10px] text-text-secondary">Total Reports</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <span className="text-base font-bold text-rose-600 tabular-nums">
                        {detailData.offenderHistory?.accepted ?? 0}
                      </span>
                      <p className="text-[10px] text-text-secondary">Accepted (Strikes)</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <span className="text-base font-bold text-text-secondary tabular-nums">
                        {detailData.offenderHistory?.rejected ?? 0}
                      </span>
                      <p className="text-[10px] text-text-secondary">Rejected</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <span className="text-base font-bold text-amber-600 tabular-nums">
                        {selectedUser.warningCount ?? 0}
                      </span>
                      <p className="text-[10px] text-text-secondary">Warnings Issued</p>
                    </div>
                  </div>
                </div>

                {/* Recent Login Attempts */}
                <div className="p-4 rounded-xl bg-bg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Recent Login Activity
                    </h4>
                    {selectedUser.isLocked && (
                      <button
                        onClick={() => handleUnlock(selectedUser)}
                        className="text-xs font-bold text-action hover:underline cursor-pointer"
                      >
                        Clear Lockout
                      </button>
                    )}
                  </div>
                  {(detailData.loginAttempts || []).length === 0 ? (
                    <p className="text-xs text-text-secondary">No recorded login attempts.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {detailData.loginAttempts.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border/60"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                att.successful ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span className="font-mono text-[11px]">{att.ip}</span>
                            <span className="text-text-secondary truncate max-w-[150px]">
                              {att.userAgent}
                            </span>
                          </div>
                          <span className="text-text-secondary tabular-nums text-[11px]">
                            {att.createdAtHuman}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Management Actions Button Bar */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setWarnModalOpen(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Issue Warning
                  </button>

                  {selectedUser.status === "suspended" ? (
                    <button
                      onClick={() => handleUnsuspend(selectedUser)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Lift Suspension
                    </button>
                  ) : (
                    <button
                      onClick={() => setSuspendModalOpen(true)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Suspend User
                    </button>
                  )}

                  {selectedUser.status === "banned" ? (
                    <button
                      onClick={() => handleUnban(selectedUser)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Lift Ban
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanModalOpen(true)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                    >
                      Ban Account
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRole(selectedUser.role);
                      setRoleModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-bg active:scale-95 transition-all cursor-pointer"
                  >
                    Change Role
                  </button>

                  <button
                    onClick={() => handleResetPassword(selectedUser)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-bg active:scale-95 transition-all cursor-pointer"
                  >
                    Reset Password
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Modal>

      {/* WARN MODAL */}
      <Modal isOpen={warnModalOpen} onClose={() => setWarnModalOpen(false)} title="Issue Official Warning">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Send an official warning to <span className="font-bold text-text-primary">{selectedUser?.name}</span>. This increments their warning counter and sends a moderation notification.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Warning Reason
            </label>
            <textarea
              rows={3}
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="e.g. Inappropriate language in comment section, repeated spam links..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setWarnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={actionInProgress} onClick={handleWarn}>
              {actionInProgress ? "Issuing..." : "Confirm Warning"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUSPEND MODAL */}
      <Modal isOpen={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title="Suspend User Account">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Temporarily block <span className="font-bold text-text-primary">{selectedUser?.name}</span> from logging in and posting content.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Suspension Duration
            </label>
            <select
              value={suspendDays}
              onChange={(e) => setSuspendDays(Number(e.target.value))}
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
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Reason for Suspension
            </label>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Specify the policy violations that justify this suspension..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={actionInProgress} onClick={handleSuspend}>
              {actionInProgress ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* BAN MODAL */}
      <Modal isOpen={banModalOpen} onClose={() => setBanModalOpen(false)} title="Permanently Ban Account">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
            <span className="font-bold">Caution:</span> Banning permanently blocks login access and revokes all active auth sessions.
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Type <code className="text-rose-600 font-mono font-bold">{selectedUser?.username || selectedUser?.email}</code> to confirm:
            </label>
            <input
              type="text"
              value={banConfirm}
              onChange={(e) => setBanConfirm(e.target.value)}
              placeholder="Confirm username or email..."
              className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs sm:text-sm text-text-primary outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Ban Reason
            </label>
            <textarea
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="State the permanent infraction reasons..."
              className="w-full bg-bg border border-border rounded-xl p-3 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBanModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={actionInProgress} onClick={handleBan}>
              {actionInProgress ? "Banning..." : "Permanently Ban User"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CHANGE ROLE MODAL */}
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Change Platform Role">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Update role for <span className="font-bold text-text-primary">{selectedUser?.name}</span>.
          </p>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs sm:text-sm text-text-primary outline-none focus:border-action"
            >
              <option value="User">Entrepreneur (Standard User)</option>
              <option value="Manager">Brand Manager (Can Post Opportunities)</option>
              <option value="Admin">Platform Administrator (Full Access)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={actionInProgress} onClick={handleChangeRole}>
              {actionInProgress ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Temporary Password">
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            A temporary password has been set for <span className="font-bold text-text-primary">{selectedUser?.name}</span>:
          </p>
          <div className="p-3 rounded-xl bg-action/10 border border-action/30 flex items-center justify-between">
            <code className="text-base font-mono font-bold text-action tracking-wider select-all">
              {tempPassword}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                toast.success("Password copied to clipboard!");
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-action text-white hover:bg-action-hover active:scale-95 transition-all cursor-pointer"
            >
              Copy
            </button>
          </div>
          <p className="text-[11px] text-text-secondary">
            Provide this temporary password to the user. All active login sessions have been invalidated.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setPasswordModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
