import { Link, usePage } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  UsersIcon,
  FlagIcon,
  BadgeCheckIcon,
  ChartIcon,
  SettingsIcon,
  AlertTriangleIcon,
  ShieldIcon,
} from "../icons";

export default function AdminHeader({
  title = "Admin Console",
  subtitle = "Platform overview & administration",
  activeTab = "overview",
  badges = {},
  actions = null,
  needsAttention = null,
}) {
  const { auth, adminBadges: sharedBadges } = usePage().props;
  const user = auth?.user ?? null;

  const resolvedBadges = {
    reports: badges.reports ?? sharedBadges?.reports ?? 0,
    verifications: badges.verifications ?? sharedBadges?.verifications ?? 0,
    ...(badges.users !== undefined || sharedBadges?.users !== undefined
      ? { users: badges.users ?? sharedBadges?.users }
      : {}),
  };

  const tabs = [
    { id: "overview", label: "Overview", href: "/admin", icon: ShieldIcon },
    {
      id: "users",
      label: "Users",
      href: "/admin/users",
      icon: UsersIcon,
      badge: resolvedBadges.users,
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    {
      id: "reports",
      label: "Reports",
      href: "/admin/reports",
      icon: FlagIcon,
      badge: resolvedBadges.reports ?? 0,
      badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
    {
      id: "verifications",
      label: "Verifications",
      href: "/admin/verifications",
      icon: BadgeCheckIcon,
      badge: resolvedBadges.verifications ?? 0,
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: ChartIcon },
    { id: "settings", label: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ];

  const hasAttentionItems =
    needsAttention &&
    ((needsAttention.pendingReports ?? 0) > 0 ||
      (needsAttention.highSeverity ?? 0) > 0 ||
      (needsAttention.pendingVerifications ?? 0) > 0 ||
      (needsAttention.lockedAccounts ?? 0) > 0);

  return (
    <div className="space-y-4 mb-6">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/feed"
            aria-label="Back to feed"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-action/40 hover:bg-surface/80 active:scale-95 transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                {title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-action/10 text-action border border-action/25">
                <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse" />
                Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 truncate">
              {subtitle} · <span className="font-medium text-text-primary">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Optional Actions (e.g. Export buttons, refresh) */}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Navigation Tab Bar */}
      <nav
        aria-label="Admin console navigation"
        className="flex items-center gap-1.5 p-1.5 bg-surface/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-xs overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action active:scale-[0.98] ${
                isActive
                  ? "bg-surface text-text-primary border border-border/90 shadow-xs font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg/60 border border-transparent hover:border-border/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-text-primary" : "text-text-secondary"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full border tabular-nums ${
                    tab.badgeColor ?? "bg-action/15 text-action border-action/30"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Needs Attention Strip */}
      {hasAttentionItems && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangleIcon className="w-4 h-4" />
            </span>
            <span className="font-semibold tracking-tight">Needs Attention:</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {needsAttention.pendingReports > 0 && (
                <Link
                  href="/admin/reports"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-white cursor-pointer"
                >
                  {needsAttention.pendingReports} pending reports
                  {needsAttention.highSeverity > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      ({needsAttention.highSeverity} urgent)
                    </span>
                  )}
                </Link>
              )}
              {needsAttention.pendingVerifications > 0 && (
                <Link
                  href="/admin/verifications"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-white cursor-pointer"
                >
                  {needsAttention.pendingVerifications} verification requests
                </Link>
              )}
              {needsAttention.lockedAccounts > 0 && (
                <Link
                  href="/admin/users?status=locked"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-white cursor-pointer"
                >
                  {needsAttention.lockedAccounts} locked accounts
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
