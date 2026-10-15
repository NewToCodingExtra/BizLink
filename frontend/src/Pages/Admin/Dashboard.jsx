import { useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { profilePath } from "../../utils/profilePath";
import AdminHeader from "../../Components/Admin/AdminHeader";
import AdminStatCard from "../../Components/Admin/AdminStatCard";
import ExportDropdown from "../../Components/Admin/ExportDropdown";
import {
  UsersIcon,
  ChartIcon,
  VideoIcon,
  HeartIcon,
  AlertTriangleIcon,
  CheckIcon,
  BadgeCheckIcon,
  ArrowRightIcon,
  DownloadIcon,
  ShieldIcon,
  EyeIcon,
  SearchIcon,
  SpinnerIcon,
  XIcon,
} from "../../Components/icons";

export default function AdminDashboard({
  stats = {},
  needsAttention = null,
  navBadges = {},
  recentActivity = [],
  recentUsers = [],
  topPosts = [],
}) {
  const page = usePage();
  const isAdmin = hasRole(page, "Admin");

  // Live AJAX Quick User Search State
  const [quickSearch, setQuickSearch] = useState("");
  const [quickResults, setQuickResults] = useState([]);
  const [isSearchingQuick, setIsSearchingQuick] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimerRef = useRef(null);

  const handleQuickSearchChange = (val) => {
    setQuickSearch(val);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (!val.trim()) {
      setQuickResults([]);
      setIsSearchingQuick(false);
      setHasSearched(false);
      return;
    }
    setIsSearchingQuick(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/users?search=${encodeURIComponent(val.trim())}&ajax=1`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setQuickResults(data.users?.data?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error("Dashboard quick search error:", err);
      } finally {
        setIsSearchingQuick(false);
        setHasSearched(true);
      }
    }, 250);
  };

  const handleClearQuickSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuickSearch("");
    setQuickResults([]);
    setIsSearchingQuick(false);
    setHasSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && quickSearch.trim()) {
      router.get(`/admin/users?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Head title="Admin Console" />
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 grid place-items-center mx-auto mb-3">
            <ShieldIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-text-primary">Admin Access Required</h2>
          <p className="text-xs text-text-secondary mt-1">
            This console is restricted to platform administrators.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-action text-white text-xs font-semibold hover:bg-action-hover active:scale-95 transition-all cursor-pointer"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Admin Console" />

      {/* Shared Admin Navigation Header */}
      <AdminHeader
        title="Admin Console"
        subtitle="Platform overview & operation center"
        activeTab="overview"
        badges={navBadges}
        needsAttention={needsAttention}
        actions={
          <ExportDropdown
            defaultEndpoint="/admin/export/users"
            defaultLabel="Platform Data"
            datasets={[
              { label: "Users Directory", endpoint: "/admin/export/users" },
              { label: "Moderation Reports", endpoint: "/admin/export/reports" },
              { label: "Brand Verifications", endpoint: "/admin/export/verifications" },
              { label: "Admin Audit Logs", endpoint: "/admin/export/audit-logs" },
            ]}
          />
        }
      />

      {/* Global AJAX Quick-Search Bar for Every User Type */}
      <div className="relative mb-6">
        <div className="relative flex items-center bg-surface border border-border/80 rounded-2xl p-1.5 shadow-xs focus-within:border-action focus-within:ring-2 focus-within:ring-action/20 transition-all">
          <div className="w-9 h-9 rounded-xl bg-action/10 text-action grid place-items-center shrink-0 ml-1">
            {isSearchingQuick ? (
              <SpinnerIcon className="w-4 h-4 text-action" />
            ) : (
              <SearchIcon className="w-4 h-4 text-action" />
            )}
          </div>
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => handleQuickSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick search any user: name, @username, email, role (Admin, Brand, Entrepreneur), or ID…"
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-text-primary outline-none placeholder:text-text-secondary/60"
          />
          {quickSearch && (
            <button
              type="button"
              onClick={handleClearQuickSearch}
              className="w-6 h-6 rounded-full bg-border/60 hover:bg-border text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer mr-1.5 text-xs font-bold"
              title="Clear search"
            >
              ✕
            </button>
          )}
          {quickSearch.trim() && (
            <Link
              href={`/admin/users?search=${encodeURIComponent(quickSearch.trim())}`}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-action text-white text-xs font-semibold hover:bg-action-hover active:scale-95 transition-all cursor-pointer shrink-0 mr-1"
            >
              <span>Search in Directory</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Live AJAX Dropdown Results */}
        {quickSearch.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-surface border border-border/90 rounded-2xl shadow-2xl p-3 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 text-xs">
              <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px]">
                {isSearchingQuick ? "Searching platform accounts…" : `Matches for "${quickSearch}"`}
              </span>
              <Link
                href={`/admin/users?search=${encodeURIComponent(quickSearch.trim())}`}
                className="text-action font-semibold hover:underline cursor-pointer text-xs"
              >
                View all in User Management &rarr;
              </Link>
            </div>

            {isSearchingQuick && quickResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                <SpinnerIcon className="w-4 h-4 text-action" />
                <span>Searching all accounts…</span>
              </div>
            ) : quickResults.length === 0 && hasSearched ? (
              <div className="py-6 text-center text-xs text-text-secondary">
                No users found matching &ldquo;{quickSearch}&rdquo;. Try another name, email, or role.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {quickResults.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-bg/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover bg-bg border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <Link
                            href={profilePath({ username: u.username ?? null, authorId: u.id })}
                            className="text-xs sm:text-sm font-semibold text-text-primary hover:text-action truncate cursor-pointer"
                          >
                            {u.name}
                          </Link>
                          {u.isBrandVerified && (
                            <span
                              title="Verified Brand"
                              className="w-3.5 h-3.5 rounded-full bg-action text-white grid place-items-center shrink-0 text-[8px]"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-secondary truncate">
                          @{u.username} · {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          u.role === "Admin"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            : u.role === "Manager" || u.role === "Brand"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-bg text-text-secondary border-border"
                        }`}
                      >
                        {u.role}
                      </span>
                      <Link
                        href={`/admin/users?search=${encodeURIComponent(u.username || u.name)}`}
                        className="p-1.5 rounded-lg bg-surface hover:bg-bg border border-border text-action text-xs font-semibold cursor-pointer"
                        title="Inspect in User Management"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main KPI Grid */}
      <section aria-label="Key Performance Indicators" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <AdminStatCard
            label="Total Accounts"
            value={stats.users?.total ?? 0}
            sublabel={`${stats.users?.newThisWeek ?? 0} new this week`}
            icon={UsersIcon}
            variant="primary"
          />
          <AdminStatCard
            label="Opportunities"
            value={stats.content?.opportunities ?? 0}
            sublabel={`${stats.content?.franchise ?? 0} franchise · ${stats.content?.wholesale ?? 0} wholesale`}
            icon={ChartIcon}
            variant="emerald"
          />
          <AdminStatCard
            label="Live Stories"
            value={stats.content?.liveStories ?? 0}
            sublabel={`${stats.content?.messages ?? 0} messages sent`}
            icon={VideoIcon}
            variant="violet"
          />
          <AdminStatCard
            label="Community Likes"
            value={stats.engagement?.likes ?? 0}
            sublabel={`${stats.engagement?.comments ?? 0} comments posted`}
            icon={HeartIcon}
            variant="amber"
          />
          <AdminStatCard
            label="Pending Reports"
            value={stats.moderation?.pendingReports ?? 0}
            sublabel={
              (stats.moderation?.highSeverity ?? 0) > 0
                ? `${stats.moderation.highSeverity} high severity`
                : "Queue is healthy"
            }
            icon={AlertTriangleIcon}
            variant={
              (stats.moderation?.highSeverity ?? 0) > 0
                ? "rose"
                : (stats.moderation?.pendingReports ?? 0) > 0
                ? "amber"
                : "default"
            }
          />
        </div>
      </section>

      {/* Breakdown Metrics Ribbon */}
      <section className="mb-6 p-4 rounded-2xl bg-surface border border-border/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="px-2">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Account Roles
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.users?.managers ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Brands</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.users?.entrepreneurs ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Entrepreneurs</span>
            </div>
          </div>

          <div className="px-2 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Listing Types
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.content?.franchise ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Fran</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.content?.wholesale ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Wholesale</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.content?.resell ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Resell</span>
            </div>
          </div>

          <div className="px-2 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Saves &amp; Follows
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.engagement?.saves ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Saves</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.engagement?.follows ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Follows</span>
            </div>
          </div>

          <div className="px-2 pt-3 sm:pt-0">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Flagged Comments
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.moderation?.reportedComments ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Flagged</span>
              <span className="text-text-secondary/30">·</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {stats.moderation?.deletedComments ?? 0}
              </span>
              <span className="text-xs text-text-secondary">Deleted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Grid: Newest Accounts & Top Posts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Newest Accounts Card */}
        <section
          aria-labelledby="admin-newest"
          className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-action" />
              <h2 id="admin-newest" className="text-sm font-bold text-text-primary tracking-tight">
                Newest Accounts
              </h2>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline cursor-pointer"
            >
              <span>View all</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 flex-1">
            {recentUsers.length === 0 ? (
              <p className="p-8 text-xs text-text-secondary text-center">No accounts found.</p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      href={profilePath({ username: u.username ?? null, authorId: u.id })}
                      className="shrink-0 relative cursor-pointer"
                    >
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover bg-bg border border-border shadow-xs"
                      />
                      {u.isBrandVerified && (
                        <span
                          title="Verified Brand"
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-action text-white grid place-items-center shadow-xs"
                        >
                          <CheckIcon className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <Link
                          href={profilePath({ username: u.username ?? null, authorId: u.id })}
                          className="text-sm font-semibold text-text-primary hover:text-action truncate cursor-pointer"
                        >
                          {u.name}
                        </Link>
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        @{u.username ?? u.id} · {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        u.role === "admin"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          : u.role === "brand"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-bg text-text-secondary border-border"
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[11px] text-text-secondary tabular-nums hidden sm:inline">
                      {u.createdAt}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Posts Card */}
        <section
          aria-labelledby="admin-top-posts"
          className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-emerald-600" />
              <h2 id="admin-top-posts" className="text-sm font-bold text-text-primary tracking-tight">
                Top Posts by Likes
              </h2>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline cursor-pointer"
            >
              <span>Analytics</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 flex-1">
            {topPosts.length === 0 ? (
              <p className="p-8 text-xs text-text-secondary text-center">No posts yet.</p>
            ) : (
              topPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/post/${p.slug}`}
                        className="text-sm font-semibold text-text-primary hover:text-action truncate cursor-pointer"
                      >
                        {p.headline}
                      </Link>
                      {p.verified && (
                        <span
                          title="Verified Business"
                          className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.2"
                        >
                          <CheckIcon className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {p.brandName} · <span className="text-text-primary/70">{p.type}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-bg border border-border text-xs font-bold text-text-primary tabular-nums">
                    <HeartIcon className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>{p.likes}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recent Admin Audit Activity Feed */}
      <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Recent Admin Activity
            </h2>
          </div>
          <a
            href="/admin/export/audit-logs"
            download
            className="text-xs font-semibold text-action hover:underline cursor-pointer"
          >
            Export Logs
          </a>
        </div>

        <div className="divide-y divide-border/60">
          {recentActivity.length === 0 ? (
            <p className="p-8 text-xs text-text-secondary text-center">
              No administrator actions recorded yet.
            </p>
          ) : (
            recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-bg/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-action/10 text-action grid place-items-center shrink-0 mt-0.5 font-bold text-xs">
                    {log.admin?.name?.charAt(0) ?? "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary">
                      <span className="font-bold text-text-primary">{log.admin?.name ?? "Admin"}</span>
                      {" performed "}
                      <code className="px-1.5 py-0.5 rounded-md bg-bg border border-border text-[11px] font-mono text-action font-semibold">
                        {log.action}
                      </code>
                      {log.targetType && (
                        <span>
                          {" on "}
                          <span className="font-semibold">{log.targetType} #{log.targetId}</span>
                        </span>
                      )}
                    </p>
                    {log.reason && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1 italic">
                        &ldquo;{log.reason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-text-secondary shrink-0 tabular-nums">
                  {log.createdAtHuman}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
