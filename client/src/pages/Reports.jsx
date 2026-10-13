import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  BarChart3,
  Ship,
  Route,
  Package,
  Fuel,
  Wrench,
  TrendingUp,
  Activity,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";

import api from "../services/api.js";

/* -------------------------------------------------------
   COLORS
------------------------------------------------------- */

const COLORS = [
  "#1597d4",
  "#38a9e4",
  "#0876b9",
  "#155e91",
  "#f59e0b",
  "#10b981",
];

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/* -------------------------------------------------------
   KPI CARD
------------------------------------------------------- */

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  type = "blue",
}) {
  const styles = {
    yellow: {
      card: "bg-gradient-to-br from-amber-50 to-white border-amber-200",
      icon: "bg-amber-100 text-amber-600",
    },
    red: {
      card: "bg-gradient-to-br from-rose-50 to-white border-rose-200",
      icon: "bg-rose-100 text-rose-600",
    },
    green: {
      card: "bg-gradient-to-br from-emerald-50 to-white border-emerald-200",
      icon: "bg-emerald-100 text-emerald-600",
    },
    blue: {
      card: "bg-gradient-to-br from-sky-50 to-white border-sky-200",
      icon: "bg-sky-100 text-sky-600",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${style.card}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.icon}`}
        >
          <Icon size={24} />
        </div>

        <div className="text-xs font-medium text-slate-400">
          Fleet Analytics
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-6">
        {label}
      </p>

      <p className="text-3xl font-bold text-slate-900 mt-2">
        {value}
      </p>

      <p className="text-sm text-slate-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   SECTION HEADER
------------------------------------------------------- */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  rightText,
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800 text-base">
            {title}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      {rightText && (
        <span className="hidden sm:block text-xs font-medium text-slate-400">
          {rightText}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   DONUT LEGEND
------------------------------------------------------- */

function DonutLegend({ data }) {
  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <div className="space-y-2.5">
      {data.map((item, index) => {
        const value = Number(item.value || 0);

        const percentage =
          total > 0
            ? Math.round((value / total) * 100)
            : 0;

        return (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    COLORS[index % COLORS.length],
                }}
              />

              <span className="text-sm text-slate-700">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">
                {formatNumber(value)}
              </span>

              <span className="text-xs text-slate-400 w-10 text-right">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------
   DONUT CARD
------------------------------------------------------- */

function DonutCard({
  icon,
  title,
  subtitle,
  data,
  total,
  totalLabel,
}) {
  const Icon = icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <SectionHeader
        icon={Icon}
        title={title}
        subtitle={subtitle}
      />

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-center">
          {/* DONUT */}

          <div className="relative h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    value,
                    "Records",
                  ]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* CENTER TEXT */}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">
                  {formatNumber(total)}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {totalLabel}
                </p>
              </div>
            </div>
          </div>

          {/* INFORMATION */}

          <div>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                Total
              </p>

              <p className="text-2xl font-bold text-sky-700 mt-1">
                {formatNumber(total)}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Across all categories
              </p>
            </div>

            <DonutLegend data={data} />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   BAR CHART CARD
------------------------------------------------------- */

function StatusBarCard({
  icon,
  title,
  subtitle,
  data,
  barName,
}) {
  const Icon = icon;

  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <SectionHeader
        icon={Icon}
        title={title}
        subtitle={subtitle}
        rightText={`${formatNumber(total)} total`}
      />

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 15,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "#475569",
              }}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={35}
              tick={{
                fontSize: 11,
                fill: "#94a3b8",
              }}
            />

            <Tooltip
              cursor={{
                fill: "transparent",
              }}
              formatter={(value) => [
                value,
                barName,
              ]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow:
                  "0 8px 25px rgba(15,23,42,0.08)",
                fontSize: "12px",
              }}
            />

            <Bar
              dataKey="value"
              name={barName}
              fill="#1597d4"
              radius={[9, 9, 0, 0]}
              barSize={34}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   BREAKDOWN CARD
------------------------------------------------------- */

function BreakdownCard({
  icon,
  title,
  subtitle,
  data,
}) {
  const Icon = icon;

  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-sky-600 flex items-center justify-center">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            {title}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No data available.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => {
            const value = Number(item.value || 0);

            const percentage =
              total > 0
                ? Math.round((value / total) * 100)
                : 0;

            return (
              <div
                key={`${item.name}-${index}`}
                className="bg-slate-50 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />

                    <span className="text-sm text-slate-700">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800">
                      {formatNumber(value)}
                    </span>

                    <span className="text-xs text-slate-400">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   MAIN REPORTS PAGE
------------------------------------------------------- */

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* ---------------------------------------------------
     FETCH REPORT
  --------------------------------------------------- */

  const fetchReport = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/reports");

      setReport(response.data);
      setError("");
    } catch (err) {
      console.error("Reports error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  /* ---------------------------------------------------
     DATA
  --------------------------------------------------- */

  const vessels = report?.vessels || {
    total: 0,
    byStatus: [],
  };

  const voyages = report?.voyages || {
    total: 0,
    byStatus: [],
  };

  const cargo = report?.cargo || {
    total: 0,
    totalWeight: 0,
    byType: [],
  };

  const fuel = report?.fuel || {
    totalQuantity: 0,
    totalCost: 0,
  };

  const maintenance = report?.maintenance || {
    total: 0,
    totalCost: 0,
    byStatus: [],
  };

  /* ---------------------------------------------------
     VOYAGE CALCULATIONS
  --------------------------------------------------- */

  const completedVoyages = useMemo(() => {
    const found = voyages.byStatus?.find(
      (item) =>
        item.name?.toLowerCase() === "completed"
    );

    return Number(found?.value || 0);
  }, [voyages.byStatus]);

  const delayedVoyages = useMemo(() => {
    const found = voyages.byStatus?.find(
      (item) =>
        item.name?.toLowerCase() === "delayed"
    );

    return Number(found?.value || 0);
  }, [voyages.byStatus]);

  const completionRate =
    Number(voyages.total) > 0
      ? Math.round(
          (completedVoyages /
            Number(voyages.total)) *
            100
        )
      : 0;

  /* ---------------------------------------------------
     LOADING
  --------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Preparing fleet analytics...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------
     ERROR
  --------------------------------------------------- */

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Reports & Analytics
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Fleet performance and operational insights
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={22}
              className="text-red-500"
            />

            <div>
              <p className="font-semibold text-red-700">
                Unable to load reports
              </p>

              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>

              <button
                onClick={() => fetchReport()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------
     PAGE
  --------------------------------------------------- */

  return (
    <div className="space-y-7 pb-10">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 px-6 py-8 lg:px-8">
        <div className="absolute -right-20 -top-32 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <BarChart3 size={15} />
              Fleet Intelligence
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Reports & Analytics
            </h1>

            <p className="text-slate-300 text-sm mt-2 max-w-2xl">
              Detailed insights into vessel performance,
              voyages, cargo operations, fuel usage and
              maintenance.
            </p>
          </div>

          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-sm font-medium transition"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* =================================================
          TOP 4 BIG CARDS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          icon={Fuel}
          label="Fuel Investment"
          value={formatCurrency(fuel.totalCost)}
          subtitle="Total recorded fuel cost"
          type="yellow"
        />

        <KpiCard
          icon={DollarSign}
          label="Maintenance Spend"
          value={formatCurrency(maintenance.totalCost)}
          subtitle="Total recorded maintenance cost"
          type="red"
        />

        <KpiCard
          icon={TrendingUp}
          label="Operational Health"
          value={`${completionRate}%`}
          subtitle="Voyage completion performance"
          type="green"
        />

        <KpiCard
          icon={Package}
          label="Cargo Weight"
          value={`${formatNumber(cargo.totalWeight)} kg`}
          subtitle="Total recorded cargo weight"
          type="blue"
        />
      </div>

      {/* =================================================
          EXTRA SUMMARY STRIP
      ================================================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Ship size={16} />
            <span className="text-xs font-medium">
              Fleet Size
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(vessels.total)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Route size={16} />
            <span className="text-xs font-medium">
              Total Voyages
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(voyages.total)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Package size={16} />
            <span className="text-xs font-medium">
              Cargo Records
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(cargo.total)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Fuel size={16} />
            <span className="text-xs font-medium">
              Fuel Usage
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(fuel.totalQuantity)} L
          </p>
        </div>
      </div>

      {/* =================================================
          2 CIRCLE / DONUT GRAPHS
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DonutCard
          icon={Ship}
          title="Fleet Status"
          subtitle="Current vessel distribution across all status types"
          data={vessels.byStatus || []}
          total={vessels.total}
          totalLabel="Vessels"
        />

        <DonutCard
          icon={Package}
          title="Cargo Analytics"
          subtitle="Cargo records grouped by cargo type"
          data={cargo.byType || []}
          total={cargo.total}
          totalLabel="Records"
        />
      </div>

      {/* =================================================
          2 BAR GRAPHS
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <StatusBarCard
          icon={Route}
          title="Voyage Status"
          subtitle="Current distribution of all voyages"
          data={voyages.byStatus || []}
          barName="Voyages"
        />

        <StatusBarCard
          icon={Wrench}
          title="Maintenance Status"
          subtitle="Current maintenance activity by status"
          data={maintenance.byStatus || []}
          barName="Maintenance"
        />
      </div>

      {/* =================================================
          VOYAGE PERFORMANCE
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Completed Voyages
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {formatNumber(completedVoyages)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Delayed Voyages
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {formatNumber(delayedVoyages)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Completion Rate
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          DETAILED BREAKDOWNS
      ================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BreakdownCard
          icon={Ship}
          title="Fleet Status Breakdown"
          subtitle="Detailed vessel status distribution"
          data={vessels.byStatus || []}
        />

        <BreakdownCard
          icon={Wrench}
          title="Maintenance Status Breakdown"
          subtitle="Detailed maintenance activity distribution"
          data={maintenance.byStatus || []}
        />
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <BarChart3 size={14} />
          OceanTrack Fleet Intelligence
        </div>

        <p className="text-xs text-slate-400">
          Analytics generated from current fleet records
        </p>
      </div>
    </div>
  );
}