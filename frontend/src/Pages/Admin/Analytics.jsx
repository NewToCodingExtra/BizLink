import { useState } from "react";
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
  EyeIcon,
  EyeOffIcon,
  XIcon,
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

const STORAGE_KEY_ORDER = "bizlink_admin_diagram_order_v3";
const STORAGE_KEY_SPANS = "bizlink_admin_diagram_spans_v3";
const STORAGE_KEY_HIDDEN = "bizlink_admin_diagram_hidden_v3";

const WIDGET_METADATA = {
  growth: {
    title: "Platform Growth & Content Velocity",
    shortTitle: "Platform Growth",
    description: "Daily new user signups vs business opportunities created over time",
    icon: ChartIcon,
  },
  community: {
    title: "Community Ecosystem Composition",
    shortTitle: "Community Ecosystem",
    description: "Verified brands, emerging accounts, entrepreneurs & staff distribution",
    icon: UsersIcon,
  },
  performance: {
    title: "Opportunity Formats & Investor Demand",
    shortTitle: "Opportunity Demand",
    description: "Listing supply volume vs investor bookmark demand by business model",
    icon: HeartIcon,
  },
  categories: {
    title: "Reports by Infraction Category",
    shortTitle: "Report Categories",
    description: "Volume distribution and severity of community moderation reports",
    icon: FlagIcon,
  },
  outcomes: {
    title: "Moderation Resolution Outcomes",
    shortTitle: "Resolution Outcomes",
    description: "Action rate of accepted vs rejected and pending moderation cases",
    icon: ShieldIcon,
  },
  top_listings: {
    title: "Top Listings by Engagement",
    shortTitle: "Top Listings",
    description: "Highest rated and most bookmarked business opportunities",
    icon: HeartIcon,
  },
  top_brands: {
    title: "Most Active Brands",
    shortTitle: "Active Brands",
    description: "Companies publishing the highest volume of opportunities",
    icon: CheckIcon,
  },
};

export default function AdminAnalytics({ data = {}, currentRange = "30d" }) {
  const page = usePage();
  const isAdmin = hasRole(page, "Admin");

  const [range, setRange] = useState(currentRange);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);

  // Layout order with localStorage persistence
  const [cardOrder, setCardOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  // Card column spans (1 col or 2 col)
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

  // Hidden cards state with persistence
  const [hiddenCardIds, setHiddenCardIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIDDEN);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((id) => DEFAULT_ORDER.includes(id));
      }
    } catch (e) {
      console.warn("Could not load hidden cards", e);
    }
    return [];
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
    setHiddenCardIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY_ORDER);
      localStorage.removeItem(STORAGE_KEY_SPANS);
      localStorage.removeItem(STORAGE_KEY_HIDDEN);
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

  const hideCard = (id, e) => {
    e?.stopPropagation();
    setHiddenCardIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save hidden cards", err);
      }
      return updated;
    });
  };

  const unhideCard = (id) => {
    setHiddenCardIds((prev) => {
      const updated = prev.filter((item) => item !== id);
      try {
        localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save hidden cards", err);
      }
      return updated;
    });
  };

  const unhideAll = () => {
    setHiddenCardIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HIDDEN);
    } catch (e) {
      console.warn("Could not clear hidden cards", e);
    }
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

      // Swap positions
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

  const totalReportsCount = reportsByCategory.reduce(
    (sum, item) => sum + (Number(item.count) || 0),
    0
  );

  const totalOutcomesCount = resolutionOutcomes.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  // Active / visible cards
  const visibleCards = cardOrder.filter((id) => !hiddenCardIds.includes(id));

  // Render content function for each diagram
  const renderCardContent = (id) => {
    switch (id) {
      case "growth":
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Platform Growth &amp; Content Velocity
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Daily new accounts vs opportunities created ({range})
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
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

            <div className="w-full h-64 sm:h-72 min-h-[260px] relative" style={{ minHeight: "260px" }}>
              <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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

            <div className="w-full h-64 sm:h-72 min-h-[260px] relative" style={{ minHeight: "260px" }}>
              <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
                <PieChart>
                  <Pie
                    data={communityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Opportunity Formats &amp; Investor Demand
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Supply count vs bookmark interest by business opportunity model
                </p>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72 min-h-[260px] relative" style={{ minHeight: "260px" }}>
              {opportunityPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-bg/30 rounded-xl border border-dashed border-border/70">
                  <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                    <ChartIcon className="w-5 h-5" />
                  </span>
                  <p className="text-xs font-bold text-text-primary">No Opportunities Yet</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Opportunities created will be categorized here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
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

      case "categories": {
        // Prepare categories data: if reports exist, show non-zero or top items cleanly
        const activeCategories = reportsByCategory.filter((c) => c.count > 0);
        const chartCategories = activeCategories.length > 0 ? activeCategories : reportsByCategory.slice(0, 5);

        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Reports by Infraction Category
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Volume distribution of community filings
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold tabular-nums">
                {totalReportsCount} filed
              </span>
            </div>

            <div className="w-full h-64 sm:h-72 min-h-[260px] relative" style={{ minHeight: "260px" }}>
              {reportsByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-bg/30 rounded-xl border border-dashed border-border/70">
                  <p className="text-xs text-text-secondary">No report categories found.</p>
                </div>
              ) : totalReportsCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-bg/30 rounded-xl border border-dashed border-border/70">
                  <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                    <CheckIcon className="w-5 h-5" />
                  </span>
                  <p className="text-xs font-bold text-text-primary">No Reports Filed</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 max-w-xs">
                    The platform moderation queue is completely clean for this period.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
                  <BarChart
                    data={chartCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-text-secondary" />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={125}
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-text-secondary"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface, #ffffff)",
                        borderColor: "var(--color-border, #e2e8f0)",
                        borderRadius: "0.75rem",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Bar dataKey="count" name="Reports" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        );
      }

      case "outcomes":
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Moderation Resolution Outcomes
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Breakdown of all-time report actions taken
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold tabular-nums">
                {totalOutcomesCount} processed
              </span>
            </div>

            <div className="w-full h-64 sm:h-72 min-h-[260px] relative" style={{ minHeight: "260px" }}>
              {totalOutcomesCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-bg/30 rounded-xl border border-dashed border-border/70">
                  <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                    <ShieldIcon className="w-5 h-5" />
                  </span>
                  <p className="text-xs font-bold text-text-primary">No Moderation History</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 max-w-xs">
                    No moderation reports have required enforcement yet.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={resolutionOutcomes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value, percent }) =>
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ""
                      }
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
              )}
            </div>
          </>
        );

      case "top_listings":
        return (
          <div className="h-full flex flex-col">
            <div className="pb-3 mb-2 border-b border-border/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Top Listings by Engagement
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Most engaged business offerings on the network
                </p>
              </div>
            </div>
            <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[280px]">
              {topOpportunities.length === 0 ? (
                <p className="p-8 text-xs text-text-secondary text-center">No listings yet.</p>
              ) : (
                topOpportunities.map((opp, i) => (
                  <div key={opp.id} className="flex items-center justify-between gap-3 px-2 sm:px-3 py-2.5 hover:bg-bg/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-bold text-text-secondary/60">
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
                    <div className="flex items-center gap-2.5 text-xs shrink-0 font-bold tabular-nums">
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
            <div className="pb-3 mb-2 border-b border-border/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-tight">
                  Most Active Brands
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Brands publishing the highest volume of opportunities
                </p>
              </div>
            </div>
            <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[280px]">
              {topBrands.length === 0 ? (
                <p className="p-8 text-xs text-text-secondary text-center">No brand accounts yet.</p>
              ) : (
                topBrands.map((brand, i) => (
                  <div key={brand.id} className="flex items-center justify-between gap-3 px-2 sm:px-3 py-2.5 hover:bg-bg/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-bold text-text-secondary/60">
                        #{i + 1}
                      </span>
                      <img
                        src={brand.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-border shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {brand.name}
                          </p>
                          {brand.isBrandVerified && (
                            <span className="w-3.5 h-3.5 rounded-full bg-action text-white grid place-items-center shadow-xs shrink-0">
                              <CheckIcon className="w-2 h-2" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-secondary truncate">
                          @{brand.username}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-bg border border-border text-[11px] font-bold text-text-primary tabular-nums shrink-0">
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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-x-clip">
      <Head title="Platform Analytics — Admin Console" />

      {/* Admin Navigation Header */}
      <AdminHeader
        title="Platform Analytics"
        subtitle="Growth trends, ecosystem metrics & customizable dashboard"
        activeTab="analytics"
        actions={
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Widget Manager Button */}
            <button
              onClick={() => setWidgetModalOpen(true)}
              title="Customize and manage active analytics diagrams"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text-primary hover:border-action hover:text-action active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <EyeIcon className="w-3.5 h-3.5" />
              <span>Widgets ({visibleCards.length}/{cardOrder.length})</span>
              {hiddenCardIds.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Reset Layout Button */}
            <button
              onClick={handleResetLayout}
              title="Reset dashboard diagram order and visibility"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-bg active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface border border-border shadow-xs">
              {["7d", "30d", "90d"].map((r) => (
                <button
                  key={r}
                  onClick={() => changeRange(r)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    range === r
                      ? "bg-action text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {r === "7d" ? "7D" : r === "30d" ? "30D" : "90D"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Top KPI Metric Cards */}
      <section aria-label="Analytics KPIs" className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
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

      {/* Helper Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse" />
          Drag diagrams to switch placement. Use <strong className="font-semibold text-text-primary">Hide</strong> or the Widgets button to toggle views.
        </span>
        {hiddenCardIds.length > 0 && (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {hiddenCardIds.length} diagram{hiddenCardIds.length > 1 ? "s" : ""} hidden
          </span>
        )}
      </div>

      {/* Main Draggable Diagrams Grid */}
      {visibleCards.length === 0 ? (
        <div className="p-12 mb-6 rounded-2xl bg-surface border-2 border-dashed border-border/80 text-center flex flex-col items-center justify-center">
          <span className="p-3 rounded-2xl bg-bg border border-border text-text-secondary mb-3">
            <EyeOffIcon className="w-6 h-6" />
          </span>
          <h3 className="text-base font-bold text-text-primary">All Diagrams are Hidden</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            You have hidden all analytics cards. You can restore them individually below or restore all in one click.
          </p>
          <button
            onClick={unhideAll}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-action text-white hover:bg-action/90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Restore All Diagrams
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {visibleCards.map((id) => {
            const isTwoCol = cardSpans[id] === 2;
            const isDragging = draggingId === id;
            const isDragOver = dragOverId === id && draggingId !== id;
            const meta = WIDGET_METADATA[id] ?? {};

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
                    ? "opacity-35 scale-[0.98] ring-2 ring-action/50 border-action cursor-grabbing"
                    : isDragOver
                    ? "ring-2 ring-action ring-offset-2 border-action bg-action/5 scale-[1.01] shadow-lg"
                    : "border-border/80 hover:border-border shadow-xs hover:shadow-sm"
                }`}
              >
                {/* Card Controls Top Bar */}
                <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-1 select-none border-b border-border/40">
                  <div
                    className="flex items-center gap-1.5 text-text-secondary hover:text-action cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-lg hover:bg-bg transition-colors"
                    title="Drag to switch placement with another diagram"
                  >
                    <GripVerticalIcon className="w-4 h-4 text-text-secondary/70 group-hover:text-action transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary/70 group-hover:text-action transition-colors">
                      Drag to Switch
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDragOver && (
                      <span className="hidden sm:inline-block text-[10px] font-bold text-action bg-action/10 px-2 py-0.5 rounded-full border border-action/25 animate-pulse">
                        Switch with {WIDGET_METADATA[draggingId]?.shortTitle ?? "Card"}
                      </span>
                    )}

                    {/* Width Toggle Button */}
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => toggleSpan(id, e)}
                      title={isTwoCol ? "Collapse to 1 column" : "Expand to full width"}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg border border-border text-text-secondary hover:text-text-primary hover:border-action/40 transition-all cursor-pointer"
                    >
                      {isTwoCol ? "1 Col" : "Full Width"}
                    </button>

                    {/* Hide Button */}
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => hideCard(id, e)}
                      title="Hide this diagram from dashboard"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg border border-border text-text-secondary hover:text-rose-600 hover:border-rose-500/40 transition-all cursor-pointer"
                    >
                      <EyeOffIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Hide</span>
                    </button>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-3.5 sm:p-5 pt-3 flex-1 flex flex-col">
                  {renderCardContent(id)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creative Restoration Dock: Appears whenever cards are hidden */}
      {hiddenCardIds.length > 0 && (
        <section aria-label="Hidden analytics dock" className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-border/80 bg-surface/50 backdrop-blur-sm shadow-xs transition-all animate-in fade-in duration-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <EyeOffIcon className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                  Hidden Diagrams Dock ({hiddenCardIds.length})
                </h4>
                <p className="text-[11px] text-text-secondary">
                  Click any card chip below to instantly restore its placement onto your dashboard.
                </p>
              </div>
            </div>

            <button
              onClick={unhideAll}
              className="text-xs font-bold text-action hover:underline self-start sm:self-auto cursor-pointer"
            >
              Restore All ({hiddenCardIds.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-border/50">
            {hiddenCardIds.map((hid) => {
              const meta = WIDGET_METADATA[hid] ?? {};
              const Icon = meta.icon ?? ChartIcon;
              return (
                <button
                  key={hid}
                  onClick={() => unhideCard(hid)}
                  title={`Restore ${meta.title} to dashboard`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border hover:border-action text-text-primary hover:text-action shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
                >
                  <Icon className="w-3.5 h-3.5 text-text-secondary group-hover:text-action transition-colors" />
                  <span>{meta.shortTitle ?? hid}</span>
                  <span className="w-4 h-4 rounded-full bg-action/10 text-action grid place-items-center text-[10px] font-bold group-hover:bg-action group-hover:text-white transition-colors">
                    +
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Widget Manager Modal: Creative Slide-over / Modal to toggle all widgets */}
      {widgetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-primary">Customize Analytics Dashboard</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Toggle visibility for any diagram on your console
                </p>
              </div>
              <button
                onClick={() => setWidgetModalOpen(false)}
                aria-label="Close widget manager"
                className="w-8 h-8 rounded-lg grid place-items-center text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List Body */}
            <div className="p-5 overflow-y-auto divide-y divide-border/60 space-y-3">
              <div className="flex items-center justify-between pb-2 text-xs">
                <span className="font-semibold text-text-secondary">
                  {visibleCards.length} of {cardOrder.length} diagrams visible
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={unhideAll}
                    className="font-bold text-action hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                </div>
              </div>

              {cardOrder.map((id) => {
                const meta = WIDGET_METADATA[id] ?? {};
                const Icon = meta.icon ?? ChartIcon;
                const isHidden = hiddenCardIds.includes(id);

                return (
                  <div key={id} className="pt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-xl grid place-items-center border shrink-0 transition-colors ${
                          isHidden
                            ? "bg-bg text-text-secondary/50 border-border"
                            : "bg-action/10 text-action border-action/25"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isHidden ? "text-text-secondary line-through" : "text-text-primary"}`}>
                          {meta.title}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => (isHidden ? unhideCard(id) : hideCard(id))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        isHidden
                          ? "bg-bg border-border text-text-secondary hover:border-action hover:text-action"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {isHidden ? "Show" : "Visible"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-border bg-bg/40 flex items-center justify-between">
              <button
                onClick={handleResetLayout}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setWidgetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-action text-white hover:bg-action/90 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
