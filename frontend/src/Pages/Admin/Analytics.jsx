import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { hasRole } from "../../utils/can";
import AdminHeader from "../../Components/Admin/AdminHeader";
import AdminStatCard from "../../Components/Admin/AdminStatCard";
import {
  ChartIcon,
  UsersIcon,
  HeartIcon,
  CheckIcon,
  FlagIcon,
  GripVerticalIcon,
  RefreshIcon,
  ShieldIcon,
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

const DEFAULT_ORDER = [
  "growth",
  "community",
  "performance",
  "categories",
  "outcomes",
  "top_listings",
  "top_brands",
];

const DEFAULT_SPANS = {
  growth: 2,
  community: 1,
  performance: 1,
  categories: 1,
  outcomes: 1,
  top_listings: 1,
  top_brands: 1,
};

const STORAGE_KEY_ORDER = "bizlink_admin_diagram_order_v2";
const STORAGE_KEY_SPANS = "bizlink_admin_diagram_spans_v2";

export default function AdminAnalytics({ data = {}, currentRange = "30d" }) {
  const page = usePage();
  const isAdmin = hasRole(page, "Admin");

  const [range, setRange] = useState(currentRange);

  // Layout order & column span states with localStorage persistence
  const [cardOrder, setCardOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all default cards exist
          const merged = [...parsed.filter((id) => DEFAULT_ORDER.includes(id))];
          DEFAULT_ORDER.forEach((id) => {
            if (!merged.includes(id)) merged.push(id);
          });
          return merged;
        }
      }
    } catch (e) {
      console.warn("Could not load diagram order", e);
    }
    return DEFAULT_ORDER;
  });

  const [cardSpans, setCardSpans] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          return { ...DEFAULT_SPANS, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Could not load diagram spans", e);
    }
    return DEFAULT_SPANS;
  });

  // Drag and drop states
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const changeRange = (r) => {
    setRange(r);
    router.get("/admin/analytics", { range: r }, { preserveState: true, replace: true });
  };

  const handleResetLayout = () => {
    setCardOrder(DEFAULT_ORDER);
    setCardSpans(DEFAULT_SPANS);
    try {
      localStorage.removeItem(STORAGE_KEY_ORDER);
      localStorage.removeItem(STORAGE_KEY_SPANS);
    } catch (e) {
      console.warn("Could not reset diagram layout", e);
    }
  };

  const toggleSpan = (id, e) => {
    e?.stopPropagation();
    setCardSpans((prev) => {
      const nextSpan = prev[id] === 2 ? 1 : 2;
      const updated = { ...prev, [id]: nextSpan };
      try {
        localStorage.setItem(STORAGE_KEY_SPANS, JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save card spans", err);
      }
      return updated;
    });
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e, id) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    setCardOrder((prevOrder) => {
      const sourceIdx = prevOrder.indexOf(sourceId);
      const targetIdx = prevOrder.indexOf(targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prevOrder;

      // Swap placements
      const nextOrder = [...prevOrder];
      nextOrder[sourceIdx] = targetId;
      nextOrder[targetIdx] = sourceId;

      try {
        localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(nextOrder));
      } catch (err) {
        console.warn("Could not save diagram order", err);
      }
      return nextOrder;
    });

    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
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
  const communityDistribution = data.communityDistribution ?? [];
  const opportunityPerformance = data.opportunityPerformance ?? [];

  const totalCommunityMembers = communityDistribution.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  const getCardTitle = (id) => {
    switch (id) {
      case "growth":
        return "Platform Growth";
      case "community":
        return "Community Ecosystem";
      case "performance":
        return "Opportunity Demand";
      case "categories":
        return "Report Categories";
      case "outcomes":
        return "Resolution Outcomes";
      case "top_listings":
        return "Top Listings";
      case "top_brands":
        return "Active Brands";
      default:
        return "Diagram";
    }
  };

  // Render dictionary for all 7 draggable diagram widgets
  const renderCardContent = (id) => {
    switch (id) {
      case "growth":
        return (
          <>
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
          </>
        );

      case "community":
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Community Ecosystem Composition
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Verified brands, emerging accounts &amp; entrepreneur breakdown
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold tabular-nums">
                {totalCommunityMembers} total members
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={communityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                    labelLine={false}
                  >
                    {communityDistribution.map((entry, index) => (
                      <Cell key={`comm-cell-${index}`} fill={entry.color} />
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
          </>
        );

      case "performance":
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Opportunity Formats &amp; Investor Demand
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Supply count vs bookmark interest by business opportunity model
                </p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full flex-1">
              {opportunityPerformance.length === 0 ? (
                <p className="p-12 text-center text-xs text-text-secondary">No opportunity data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={opportunityPerformance}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface, #ffffff)",
                        borderColor: "var(--color-border, #e2e8f0)",
                        borderRadius: "0.75rem",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Bar dataKey="listings" name="Active Listings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="saves" name="Investor Saves (Demand)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        );

      case "categories":
        return (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Reports by Infraction Category
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Volume distribution of community filings
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full flex-1">
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
          </>
        );

      case "outcomes":
        return (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Moderation Resolution Outcomes
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Breakdown of all-time report actions taken
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full flex-1">
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
                      <Cell key={`res-cell-${index}`} fill={entry.color} />
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
          </>
        );

      case "top_listings":
        return (
          <div className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Top Listings by Engagement
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Most engaged business offerings on the network
              </p>
            </div>
            <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[300px]">
              {topOpportunities.length === 0 ? (
                <p className="p-8 text-xs text-text-secondary text-center">No listings yet.</p>
              ) : (
                topOpportunities.map((opp, i) => (
                  <div key={opp.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg/50 transition-colors">
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
          </div>
        );

      case "top_brands":
        return (
          <div className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Most Active Brands
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Brands publishing the highest volume of opportunities
              </p>
            </div>
            <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[300px]">
              {topBrands.length === 0 ? (
                <p className="p-8 text-xs text-text-secondary text-center">No brand accounts yet.</p>
              ) : (
                topBrands.map((brand, i) => (
                  <div key={brand.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg/50 transition-colors">
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 overflow-x-clip">
      <Head title="Platform Analytics — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Platform Analytics"
        subtitle="Growth trends, ecosystem metrics & draggable dashboard layout"
        activeTab="analytics"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetLayout}
              title="Reset dashboard diagrams to default layout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>

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

      {/* Interactive Helper Banner */}
      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse" />
          Draggable diagrams: Grab any card by its handle to switch its placement. Click <strong className="font-semibold text-text-primary">1x / 2x</strong> to toggle width.
        </span>
      </div>

      {/* Draggable & Switchable Diagrams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {cardOrder.map((id) => {
          const isTwoCol = cardSpans[id] === 2;
          const isDragging = draggingId === id;
          const isDragOver = dragOverId === id && draggingId !== id;

          return (
            <div
              key={id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={(e) => handleDragLeave(e, id)}
              onDrop={(e) => handleDrop(e, id)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-2xl bg-surface border transition-all duration-200 flex flex-col ${
                isTwoCol ? "lg:col-span-2" : "lg:col-span-1"
              } ${
                isDragging
                  ? "opacity-40 scale-[0.98] ring-2 ring-action/50 border-action cursor-grabbing"
                  : isDragOver
                  ? "ring-2 ring-action ring-offset-2 border-action bg-action/5 scale-[1.01] shadow-lg"
                  : "border-border/80 hover:border-border shadow-xs hover:shadow-sm"
              }`}
            >
              {/* Card Controls Top Bar: Drag Handle & Width Toggle */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-1 select-none">
                <div
                  className="flex items-center gap-1 text-text-secondary hover:text-action cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-lg hover:bg-bg transition-colors"
                  title="Drag to switch placement with another card"
                >
                  <GripVerticalIcon className="w-4 h-4 text-text-secondary/70 group-hover:text-action transition-colors" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary/60 group-hover:text-action transition-colors">
                    Drag to Switch
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isDragOver && (
                    <span className="text-[10px] font-bold text-action bg-action/10 px-2 py-0.5 rounded-full border border-action/25 animate-pulse">
                      Switch with {getCardTitle(draggingId)}
                    </span>
                  )}
                  <button
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => toggleSpan(id, e)}
                    title={isTwoCol ? "Shrink to 1 column" : "Expand to full width"}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg border border-border text-text-secondary hover:text-text-primary hover:border-action/40 transition-all cursor-pointer"
                  >
                    {isTwoCol ? "1 Col" : "Full Width"}
                  </button>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="p-4 sm:p-5 pt-1 flex-1 flex flex-col">
                {renderCardContent(id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
