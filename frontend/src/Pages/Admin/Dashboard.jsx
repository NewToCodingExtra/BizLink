import { Head, Link, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import { profilePath } from "../../utils/profilePath";
import { ArrowLeftIcon, CheckIcon } from "../../Components/icons";

function StatCard({ label, value, accent = false }) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4 ${
        accent ? "bg-action/5 border-action/30" : "bg-surface border-border"
      }`}
    >
      <p className="text-[clamp(1.25rem,5vw,1.5rem)] leading-tight font-bold text-text-primary tabular-nums truncate">
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5 leading-snug line-clamp-2 min-h-[2em]">
        {label}
      </p>
    </div>
  );
}

export default function AdminDashboard({ stats = {}, recentUsers = [], topPosts = [], reportedComments = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const isAdmin = hasRole(usePage(), "Admin");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-clip">
      <Head title="Admin Console" />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="inline-flex items-center justify-center w-11 h-11 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface active:bg-surface active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action shrink-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1 basis-40">
          <h1 className="text-[clamp(1.25rem,4vw,1.5rem)] leading-tight font-semibold text-text-primary text-balance">
            Admin Console
          </h1>
          <p className="text-sm text-text-secondary mt-0.5 truncate">
            Platform overview · signed in as {user?.name}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold bg-action/10 text-action border border-action/20 rounded-full px-2.5 py-1 min-h-[28px]">
          ROLE: ADMIN
        </span>
        <Link href="/admin/reports" className="shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full bg-action text-white text-sm font-semibold hover:bg-action-hover transition-colors">
          Reports{(stats.moderation?.pendingReports ?? 0) > 0 ? ` (${stats.moderation.pendingReports})` : ""}
        </Link>
      </div>

      {!isAdmin ? (
        <div className="mt-8 bg-error/5 border border-error/20 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-error">Admin access only</p>
          <p className="text-sm text-text-secondary mt-1">This console is restricted to the Admin role.</p>
        </div>
      ) : (
        <>
          {/* Users */}
          <section className="mt-6" aria-labelledby="admin-stats-users">
            <h2 id="admin-stats-users" className="text-xs font-semibold tracking-widest text-text-secondary">
              USERS
            </h2>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              <StatCard label="Total accounts" value={stats.users?.total ?? 0} accent />
              <StatCard label="Admins" value={stats.users?.admins ?? 0} />
              <StatCard label="Managers (brands)" value={stats.users?.managers ?? 0} />
              <StatCard label="Entrepreneurs" value={stats.users?.entrepreneurs ?? 0} />
              <StatCard label="New this week" value={stats.users?.newThisWeek ?? 0} />
            </div>
          </section>

          {/* Content */}
          <section className="mt-6" aria-labelledby="admin-stats-content">
            <h2 id="admin-stats-content" className="text-xs font-semibold tracking-widest text-text-secondary">
              CONTENT
            </h2>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              <StatCard label="Opportunities" value={stats.content?.opportunities ?? 0} />
              <StatCard label="Live stories" value={stats.content?.liveStories ?? 0} />
              <StatCard label="Franchise" value={stats.content?.franchise ?? 0} />
              <StatCard label="Wholesale" value={stats.content?.wholesale ?? 0} />
              <StatCard label="Resell" value={stats.content?.resell ?? 0} />
            </div>
          </section>

          {/* Engagement + moderation */}
          <section className="mt-6" aria-labelledby="admin-stats-engagement">
            <h2 id="admin-stats-engagement" className="text-xs font-semibold tracking-widest text-text-secondary">
              ENGAGEMENT &amp; MODERATION
            </h2>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              <StatCard label="Comments" value={stats.engagement?.comments ?? 0} />
              <StatCard label="Likes" value={stats.engagement?.likes ?? 0} />
              <StatCard label="Saves" value={stats.engagement?.saves ?? 0} />
              <StatCard label="Follows" value={stats.engagement?.follows ?? 0} />
              <StatCard label="Flagged comments" value={stats.moderation?.reportedComments ?? 0} />
            </div>
          </section>

          <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Recent users */}
            <section
              aria-labelledby="admin-newest"
              className="min-w-0 bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 id="admin-newest" className="text-sm font-semibold text-text-primary">
                  Newest accounts
                </h2>
              </div>
              {(recentUsers || []).length === 0 ? (
                <p className="p-6 text-sm text-text-secondary text-center">No users yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(recentUsers || []).map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 px-3 py-2.5 sm:p-3 min-h-[64px]"
                    >
                      <Link
                        href={profilePath({ username: u.username ?? null, authorId: u.id })}
                        aria-label={`View ${u.name}`}
                        className="shrink-0 grid place-items-center w-11 h-11 -ml-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                      >
                        <img
                          src={u.avatar}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-9 h-9 rounded-full object-cover bg-bg"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                        <p className="text-xs text-text-secondary truncate">{u.email}</p>
                      </div>
                      <span className="hidden min-[400px]:inline-flex text-[10px] font-bold uppercase tracking-wide text-text-secondary border border-border rounded-full px-2 py-0.5 shrink-0 max-w-[96px] truncate">
                        {u.role}
                      </span>
                      <span className="hidden md:inline text-xs text-text-secondary shrink-0 tabular-nums">
                        {u.createdAt}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Top posts */}
            <section
              aria-labelledby="admin-top-posts"
              className="min-w-0 bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 id="admin-top-posts" className="text-sm font-semibold text-text-primary">
                  Top posts by likes
                </h2>
              </div>
              {(topPosts || []).length === 0 ? (
                <p className="p-6 text-sm text-text-secondary text-center">No posts yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(topPosts || []).map((p) => (
                    <li key={p.id} className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:p-3 min-h-[64px]">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/post/${p.slug}`}
                          title={p.headline}
                          className="flex items-center min-h-[32px] text-sm font-medium text-text-primary hover:text-action active:text-action line-clamp-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:rounded"
                        >
                          {p.headline}
                        </Link>
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                          {p.brandName} · {p.type}
                        </p>
                      </div>
                      {p.verified && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5 shrink-0">
                          <CheckIcon className="w-3 h-3" /> Verified
                        </span>
                      )}
                      <span className="text-sm font-semibold text-text-primary shrink-0 tabular-nums min-w-[3ch] text-right">
                        {p.likes}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Moderation queue */}
            <section
              aria-labelledby="admin-flagged"
              className="min-w-0 lg:col-span-2 bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 id="admin-flagged" className="text-sm font-semibold text-text-primary">
                  Flagged comments
                </h2>
              </div>
              {(reportedComments || []).length === 0 ? (
                <p className="p-6 text-sm text-text-secondary text-center">Nothing flagged. Queue is clear.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(reportedComments || []).map((c) => (
                    <li key={c.id} className="flex items-start gap-3 px-3 py-3 sm:p-3">
                      <span
                        aria-label={`${c.reports} reports`}
                        className="shrink-0 mt-0.5 min-w-[24px] h-6 px-1.5 grid place-items-center rounded-full bg-error/10 text-error text-[11px] font-bold tabular-nums"
                      >
                        {c.reports}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary leading-snug line-clamp-2 break-words">
                          {c.text}
                        </p>
                        <p className="text-xs text-text-secondary mt-1 truncate">
                          by {c.author}
                          {c.postHeadline ? (
                            <>
                              {" on "}
                              <Link
                                href={`/post/${c.postSlug}`}
                                title={c.postHeadline}
                                className="text-action hover:underline active:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:rounded"
                              >
                                {c.postHeadline}
                              </Link>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
