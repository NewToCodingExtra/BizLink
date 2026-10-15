import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import AdminHeader from "../../Components/Admin/AdminHeader";
import AdminStatCard from "../../Components/Admin/AdminStatCard";
import {
  ChartIcon,
  UsersIcon,
  HeartIcon,
  DownloadIcon,
  CheckIcon,
  FlagIcon,
} from "../../Components/icons";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function AdminAnalytics({ data = {}, currentRange = "30d" }) {
  const page = usePage();
  const isAdmin = hasRole(page, "Admin");

  const [range, setRange] = useState(currentRange);

  const changeRange = (r) => {
    setRange(r);
    router.get("/admin/analytics", { range: r }, { preserveState: true, replace: true });
  };

  if (!isAdmin) {
    return null;
  }

  const kpis = data.kpis ?? {};
  const timeSeries = data.timeSeries ?? [];
  const reportsByCategory = data.reportsByCategory ?? [];
  const resolutionOutcomes = data.resolutionOutcomes ?? [];
  const topOpportunities = data.topOpportunities ?? [];
  const topBrands = data.topBrands ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Platform Analytics — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Platform Analytics"
        subtitle="Growth trends, opportunity performance & moderation velocity"
        activeTab="analytics"
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border shadow-xs">
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                onClick={() => changeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === r
                    ? "bg-action text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        }
      />

      {/* Top KPI Metric Cards */}
      <section aria-label="Analytics KPIs" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <AdminStatCard
            label="New Signups"
            value={kpis.signups?.value ?? 0}
            trend={kpis.signups?.delta !== undefined ? `${kpis.signups.delta > 0 ? "+" : ""}${kpis.signups.delta}%` : null}
            sublabel="vs prior period"
            icon={UsersIcon}
            variant="primary"
          />
          <AdminStatCard
            label="Listings Posted"
            value={kpis.posts?.value ?? 0}
            trend={kpis.posts?.delta !== undefined ? `${kpis.posts.delta > 0 ? "+" : ""}${kpis.posts.delta}%` : null}
            sublabel="vs prior period"
            icon={ChartIcon}
            variant="emerald"
          />
          <AdminStatCard
            label="Inquiries Started"
            value={kpis.inquiries?.value ?? 0}
            sublabel="Direct conversations"
            icon={HeartIcon}
            variant="violet"
          />
          <AdminStatCard
            label="Resolution Rate"
            value={`${kpis.resolutionRate?.value ?? 100}%`}
            sublabel="Reports addressed"
            icon={CheckIcon}
            variant="emerald"
          />
          <AdminStatCard
            label="Action Taken"
            value={`${kpis.acceptanceRate?.value ?? 0}%`}
            sublabel="Enforced vs rejected"
            icon={FlagIcon}
            variant="amber"
          />
        </div>
      </section>

      {/* Primary Chart: Signups & Opportunities Activity Area Chart */}
      <section className="mb-6 p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Platform Growth &amp; Content Velocity
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Daily new accounts vs opportunities created ({range})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              Signups
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Opportunities
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface, #ffffff)",
                  borderColor: "var(--color-border, #e2e8f0)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "0.75rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="signups"
                name="Signups"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSignups)"
              />
              <Area
                type="monotone"
                dataKey="posts"
                name="Opportunities"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPosts)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Two Column Grid: Reports by Category & Moderation Outcomes */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Reports by Category Bar Chart */}
        <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Reports by Infraction Category
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Volume distribution of community filings
            </p>
          </div>

          <div className="h-60 w-full flex-1">
            {reportsByCategory.length === 0 ? (
              <p className="p-12 text-center text-xs text-text-secondary">No reports recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsByCategory} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
                  <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 10 }} stroke="currentColor" className="text-text-secondary" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface, #ffffff)",
                      borderColor: "var(--color-border, #e2e8f0)",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Bar dataKey="count" name="Reports" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Resolution Outcomes Donut / Pie Chart */}
        <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Moderation Resolution Outcomes
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Breakdown of all-time report actions taken
            </p>
          </div>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolutionOutcomes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                  labelLine={false}
                >
                  {resolutionOutcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface, #ffffff)",
                    borderColor: "var(--color-border, #e2e8f0)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Opportunities */}
        <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Top Listings by Engagement
            </h2>
          </div>
          <div className="divide-y divide-border/60">
            {topOpportunities.length === 0 ? (
              <p className="p-8 text-xs text-text-secondary text-center">No listings yet.</p>
            ) : (
              topOpportunities.map((opp, i) => (
                <div key={opp.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-text-secondary/60">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {opp.headline}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">
                        {opp.brandName} · {opp.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0 font-bold tabular-nums">
                    <span className="text-rose-600 dark:text-rose-400">♥ {opp.likes}</span>
                    <span className="text-action">★ {opp.saves}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Most Active Brands */}
        <section className="rounded-2xl bg-surface border border-border/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Most Active Brands
            </h2>
          </div>
          <div className="divide-y divide-border/60">
            {topBrands.length === 0 ? (
              <p className="p-8 text-xs text-text-secondary text-center">No brand accounts yet.</p>
            ) : (
              topBrands.map((brand, i) => (
                <div key={brand.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-text-secondary/60">
                      #{i + 1}
                    </span>
                    <img
                      src={brand.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-border shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {brand.name}
                        </p>
                        {brand.isBrandVerified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-action text-white grid place-items-center shadow-xs">
                            <CheckIcon className="w-2 h-2" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">
                        @{brand.username}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-bg border border-border text-xs font-bold text-text-primary tabular-nums shrink-0">
                    {brand.postsCount} posts
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
