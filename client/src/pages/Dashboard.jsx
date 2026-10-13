import { useEffect, useMemo, useState } from "react";
import {
  Ship,
  Anchor,
  Wrench,
  Navigation,
  Package,
  Fuel,
  AlertTriangle,
  Clock3,
  ArrowRight,
  RefreshCw,
  Activity,
  MapPin,
  CalendarDays,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

const getArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const getVesselName = (vessel) => {
  return (
    vessel?.name ||
    vessel?.vesselName ||
    vessel?.shipName ||
    "Unknown Vessel"
  );
};

const getVoyageId = (voyage) => {
  return (
    voyage?.voyageId ||
    voyage?.voyageNumber ||
    "Unnamed Voyage"
  );
};

const getStatus = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const isActiveVoyage = (voyage) => {
  const status = getStatus(voyage?.status);

  return (
    status === "in progress" ||
    status === "in transit"
  );
};

const isMaintenance = (vessel) => {
  const status = getStatus(vessel?.status);

  return (
    status === "maintenance" ||
    status === "under maintenance"
  );
};

const isAtPort = (vessel) => {
  const status = getStatus(vessel?.status);

  return (
    status === "at port" ||
    status === "anchored" ||
    status === "berthed"
  );
};

const isInTransit = (vessel) => {
  const status = getStatus(vessel?.status);

  return (
    status === "in transit" ||
    status === "active" ||
    status === "underway"
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
};

const formatFuel = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
  });
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [vessels, setVessels] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [cargo, setCargo] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        api.get("/vessels"),
        api.get("/voyages"),
        api.get("/cargo"),
        api.get("/fuel"),
        api.get("/maintenance"),
      ]);

      if (results[0].status === "fulfilled") {
        setVessels(
          getArray(
            results[0].value.data,
            "vessels"
          )
        );
      }

      if (results[1].status === "fulfilled") {
        setVoyages(
          getArray(
            results[1].value.data,
            "voyages"
          )
        );
      }

      if (results[2].status === "fulfilled") {
        setCargo(
          getArray(
            results[2].value.data,
            "cargo"
          )
        );
      }

      if (results[3].status === "fulfilled") {
        setFuel(
          getArray(
            results[3].value.data,
            "fuel"
          )
        );
      }

      if (results[4].status === "fulfilled") {
        setMaintenance(
          getArray(
            results[4].value.data,
            "maintenance"
          )
        );
      }

      const failed = results.filter(
        (item) => item.status === "rejected"
      );

      if (failed.length === results.length) {
        throw new Error(
          "Unable to load dashboard data."
        );
      }
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalVessels = vessels.length;

  const inTransit = vessels.filter(
    isInTransit
  ).length;

  const atPort = vessels.filter(
    isAtPort
  ).length;

  const maintenanceCount =
    vessels.filter(
      isMaintenance
    ).length;

  const activeVoyages =
    voyages.filter(
      isActiveVoyage
    );

  const plannedVoyages =
    voyages.filter(
      (voyage) =>
        getStatus(voyage?.status) ===
        "planned"
    );

  const delayedVoyages =
    voyages.filter(
      (voyage) =>
        getStatus(voyage?.status) ===
        "delayed"
    );

  const completedVoyages =
    voyages.filter(
      (voyage) =>
        getStatus(voyage?.status) ===
        "completed"
    );

  const pendingCargo =
    cargo.filter(
      (item) =>
        getStatus(item?.status) ===
        "pending"
    ).length;

  const transitCargo =
    cargo.filter(
      (item) =>
        getStatus(item?.status) ===
        "in transit"
    ).length;

  const deliveredCargo =
    cargo.filter(
      (item) =>
        getStatus(item?.status) ===
        "delivered"
    ).length;

  const totalCargoWeight =
    cargo.reduce(
      (sum, item) =>
        sum + Number(
          item?.weight || 0
        ),
      0
    );

  const plannedFuel =
    voyages.reduce(
      (sum, voyage) =>
        sum +
        Number(voyage?.plannedFuel || 0),
      0
    );

  const actualFuel =
    fuel.reduce(
      (sum, item) =>
        sum +
        Number(item?.fuelUsed || 0),
      0
    );

  /*
    Fleet chart colors are intentionally
    different from each other.
  */
  const fleetColors = [
    "#0284C7",
    "#8B5CF6",
    "#F59E0B",
    "#64748B",
  ];

  const fleetChart = useMemo(
    () =>
      [
        {
          name: "In Transit",
          value: inTransit,
        },
        {
          name: "At Port",
          value: atPort,
        },
        {
          name: "Maintenance",
          value: maintenanceCount,
        },
        {
          name: "Other",
          value: Math.max(
            0,
            totalVessels -
              inTransit -
              atPort -
              maintenanceCount
          ),
        },
      ].filter(
        (item) => item.value > 0
      ),
    [
      totalVessels,
      inTransit,
      atPort,
      maintenanceCount,
    ]
  );

  const voyageChart = useMemo(
    () => [
      {
        name: "Planned",
        value:
          plannedVoyages.length,
      },
      {
        name: "Active",
        value:
          activeVoyages.length,
      },
      {
        name: "Delayed",
        value:
          delayedVoyages.length,
      },
      {
        name: "Completed",
        value:
          completedVoyages.length,
      },
    ],
    [
      plannedVoyages.length,
      activeVoyages.length,
      delayedVoyages.length,
      completedVoyages.length,
    ]
  );

  const cargoChart = useMemo(
    () => [
      {
        name: "Pending",
        value: pendingCargo,
      },
      {
        name: "In Transit",
        value: transitCargo,
      },
      {
        name: "Delivered",
        value: deliveredCargo,
      },
    ],
    [
      pendingCargo,
      transitCargo,
      deliveredCargo,
    ]
  );

  const alerts = useMemo(() => {
    const list = [];

    delayedVoyages
      .slice(0, 3)
      .forEach((voyage) => {
        list.push({
          type: "warning",
          title: "Delayed voyage",
          text: `${getVoyageId(
            voyage
          )} is currently delayed.`,
        });
      });

    maintenance
      .filter((item) => {
        const status = getStatus(
          item?.status
        );

        return (
          status === "pending" ||
          status === "scheduled" ||
          status === "overdue" ||
          status === "in progress"
        );
      })
      .slice(0, 3)
      .forEach((item) => {
        list.push({
          type: "maintenance",
          title: "Maintenance activity",
          text:
            item?.description ||
            item?.maintenanceType ||
            "Maintenance record requires attention.",
        });
      });

    return list.slice(0, 5);
  }, [
    delayedVoyages,
    maintenance,
  ]);

  const recentVoyages = useMemo(() => {
    return [...voyages]
      .sort((a, b) => {
        const dateA = new Date(
          a?.updatedAt ||
            a?.createdAt ||
            a?.departureDate ||
            0
        ).getTime();

        const dateB = new Date(
          b?.updatedAt ||
            b?.createdAt ||
            b?.departureDate ||
            0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [voyages]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-sky-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading fleet dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-600">
            <Activity size={18} />
            Fleet Overview
          </div>

          <h1 className="mt-2 text-3xl font-bold text-[#0F2742]">
            Dashboard
          </h1>

          <p className="mt-1 text-slate-500">
            Current fleet status and operational overview.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchDashboardData(true)
          }
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* =====================================================
          MAIN CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <DashboardCard
          icon={<Ship size={22} />}
          title="Total Vessels"
          value={totalVessels}
          iconClass="bg-sky-50 text-sky-600"
        />

        <DashboardCard
          icon={<Navigation size={22} />}
          title="In Transit"
          value={inTransit}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <DashboardCard
          icon={<Anchor size={22} />}
          title="At Port"
          value={atPort}
          iconClass="bg-violet-50 text-violet-600"
        />

        <DashboardCard
          icon={<Wrench size={22} />}
          title="Maintenance"
          value={maintenanceCount}
          iconClass="bg-amber-50 text-amber-600"
        />

      </div>

      {/* =====================================================
          SECONDARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <SmallCard
          icon={<Navigation size={19} />}
          title="Active Voyages"
          value={activeVoyages.length}
          text="Currently in progress"
          iconClass="bg-sky-50 text-sky-600"
        />

        <SmallCard
          icon={<Package size={19} />}
          title="Cargo Records"
          value={cargo.length}
          text={`${formatNumber(
            totalCargoWeight
          )} kg total weight`}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <SmallCard
          icon={<Fuel size={19} />}
          title="Fuel Recorded"
          value={formatFuel(
            actualFuel
          )}
          text={
            plannedFuel > 0
              ? `Planned ${formatFuel(
                  plannedFuel
                )}`
              : "Actual recorded fuel"
          }
          iconClass="bg-emerald-50 text-emerald-600"
        />

      </div>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* ===================================================
            FLEET STATUS
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white shadow-sm">

          <div className="flex items-center justify-between px-5 pt-5">

            <div>
              <h2 className="text-lg font-bold text-[#0F2742]">
                Fleet Status
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current vessel distribution
              </p>
            </div>

            <Ship
              size={21}
              className="text-sky-600"
            />

          </div>

          <div
            className="mt-2 h-[300px] w-full select-none outline-none focus:outline-none"
            onMouseDown={(event) =>
              event.preventDefault()
            }
          >

            {fleetChart.length === 0 ? (
              <EmptyChart text="No vessel status data available." />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart
                  tabIndex={-1}
                  margin={{
                    top: 5,
                    right: 5,
                    bottom: 5,
                    left: 5,
                  }}
                >

                  <Pie
                    data={fleetChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={66}
                    outerRadius={105}
                    paddingAngle={3}
                    cornerRadius={12}
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={600}
                  >

                    {fleetChart.map(
                      (entry, index) => (
                        <Cell
                          key={`fleet-${entry.name}`}
                          fill={
                            fleetColors[
                              index
                            ]
                          }
                          stroke="none"
                          tabIndex={-1}
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #D6E1EC",
                      boxShadow:
                        "0 8px 24px rgba(15, 39, 66, 0.10)",
                      outline: "none",
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>
            )}

          </div>

          {/* CLEAN COMPACT LEGEND */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 pb-5">

            {fleetChart.map(
              (item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2"
                >

                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        fleetColors[
                          index
                        ],
                    }}
                  />

                  <span className="text-xs font-medium text-slate-500">
                    {item.name}
                  </span>

                  <span className="text-xs font-bold text-[#0F2742]">
                    {item.value}
                  </span>

                </div>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            VOYAGE OVERVIEW
        =================================================== */}

        <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-[#0F2742]">
                Voyage Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current voyage status
              </p>
            </div>

            <Navigation
              size={21}
              className="text-sky-600"
            />

          </div>

          <div
            className="mt-5 h-[300px] select-none outline-none focus:outline-none"
            onMouseDown={(event) =>
              event.preventDefault()
            }
          >

            {voyages.length === 0 ? (
              <EmptyChart text="No voyage data available." />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={voyageChart}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                      fill: "#64748B",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                      fill: "#64748B",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #D6E1EC",
                      boxShadow:
                        "0 8px 24px rgba(15, 39, 66, 0.10)",
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#0284C7"
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          ACTIVE VOYAGES + ALERTS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h2 className="text-lg font-bold text-[#0F2742]">
                Active Voyages
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Currently operating voyages
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/voyages")
              }
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              View all
              <ArrowRight size={14} />
            </button>

          </div>

          <div className="divide-y divide-slate-100">

            {activeVoyages.length === 0 ? (
              <EmptyList
                icon={
                  <Navigation size={24} />
                }
                text="No active voyages."
              />
            ) : (
              activeVoyages
                .slice(0, 5)
                .map((voyage) => (
                  <div
                    key={voyage._id}
                    className="flex items-center gap-4 px-5 py-4"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Ship size={19} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="truncate text-sm font-bold text-slate-700">
                          {getVoyageId(
                            voyage
                          )}
                        </p>

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          In Progress
                        </span>

                      </div>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {voyage?.vessel
                          ? getVesselName(
                              voyage.vessel
                            )
                          : "Vessel not assigned"}
                      </p>

                    </div>

                    <div className="hidden text-right sm:block">

                      <p className="text-xs font-semibold text-slate-600">
                        {voyage?.origin ||
                          "—"}
                        {" → "}
                        {voyage?.destination ||
                          "—"}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(
                          voyage?.expectedArrival
                        )}
                      </p>

                    </div>

                    <ArrowRight
                      size={17}
                      className="text-slate-300"
                    />

                  </div>
                ))
            )}

          </div>

        </section>

        {/* ALERTS */}

        <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">

            <div className="flex items-center gap-2">

              <AlertTriangle
                size={19}
                className="text-amber-500"
              />

              <h2 className="text-lg font-bold text-[#0F2742]">
                Operational Alerts
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              Items requiring attention
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">

                <CheckCircle2
                  size={30}
                  className="text-emerald-500"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No active alerts
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Fleet operations look normal.
                </p>

              </div>
            ) : (
              alerts.map(
                (alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
                    className="flex gap-3 px-5 py-4"
                  >

                    <div className="mt-0.5 shrink-0">

                      {alert.type ===
                      "warning" ? (
                        <AlertTriangle
                          size={18}
                          className="text-amber-500"
                        />
                      ) : (
                        <Wrench
                          size={18}
                          className="text-sky-500"
                        />
                      )}

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-slate-700">
                        {alert.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {alert.text}
                      </p>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          CARGO + FUEL
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* CARGO */}

        <section className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-[#0F2742]">
                Cargo Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current cargo distribution
              </p>
            </div>

            <Package
              size={20}
              className="text-sky-600"
            />

          </div>

          <div
            className="mt-5 h-[220px] select-none outline-none focus:outline-none"
            onMouseDown={(event) =>
              event.preventDefault()
            }
          >

            {cargo.length === 0 ? (
              <EmptyChart text="No cargo data available." />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={cargoChart}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "#64748B",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748B",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={false}
                  />

                  <Bar
                    dataKey="value"
                    fill="#0EA5E9"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}

          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4">

            <span className="text-xs text-slate-500">
              Total cargo weight
            </span>

            <span className="text-sm font-bold text-[#0F2742]">
              {formatNumber(
                totalCargoWeight
              )}{" "}
              kg
            </span>

          </div>

        </section>

        {/* FUEL */}

        <section className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-[#0F2742]">
                Fuel Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Recorded fuel usage
              </p>
            </div>

            <Fuel
              size={20}
              className="text-emerald-600"
            />

          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-2xl bg-slate-50 p-5">

              <p className="text-xs font-medium text-slate-500">
                Planned Fuel
              </p>

              <p className="mt-2 text-2xl font-bold text-[#0F2742]">
                {formatFuel(
                  plannedFuel
                )}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Recorded planned amount
              </p>

            </div>

            <div className="rounded-2xl bg-emerald-50 p-5">

              <p className="text-xs font-medium text-emerald-700">
                Actual Fuel
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatFuel(
                  actualFuel
                )}
              </p>

              <p className="mt-1 text-[11px] text-emerald-600">
                Recorded actual usage
              </p>

            </div>

          </div>

          {plannedFuel > 0 && (
            <div className="mt-6">

              <div className="mb-2 flex justify-between text-xs">

                <span className="font-medium text-slate-500">
                  Actual vs planned
                </span>

                <span className="font-bold text-slate-700">
                  {Math.round(
                    (actualFuel /
                      plannedFuel) *
                      100
                  )}
                  %
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (actualFuel /
                          plannedFuel) *
                          100
                      )
                    )}%`,
                  }}
                />

              </div>

            </div>
          )}

        </section>

      </div>

      {/* =====================================================
          RECENT VOYAGES
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <div>
            <h2 className="text-lg font-bold text-[#0F2742]">
              Recent Voyage Activity
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Recently created or updated voyages
            </p>
          </div>

          <Clock3
            size={20}
            className="text-slate-400"
          />

        </div>

        {recentVoyages.length === 0 ? (
          <EmptyList
            icon={<Clock3 size={24} />}
            text="No recent voyage activity."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px]">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50">

                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                    Voyage
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                    Vessel
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                    Route
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                    Expected Arrival
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {recentVoyages.map(
                  (voyage) => (
                    <tr
                      key={voyage._id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <CircleDot
                            size={15}
                            className="text-sky-500"
                          />

                          <span className="text-sm font-semibold text-slate-700">
                            {getVoyageId(
                              voyage
                            )}
                          </span>

                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {voyage?.vessel
                          ? getVesselName(
                              voyage.vessel
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">

                        <div className="flex items-center gap-2">

                          <MapPin
                            size={14}
                            className="text-slate-400"
                          />

                          {voyage?.origin ||
                            "—"}

                          <ArrowRight
                            size={13}
                            className="text-slate-300"
                          />

                          {voyage?.destination ||
                            "—"}

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <StatusBadge
                          status={
                            voyage?.status
                          }
                        />

                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-500">

                        <div className="flex items-center justify-end gap-2">

                          <CalendarDays
                            size={14}
                            className="text-slate-400"
                          />

                          {formatDate(
                            voyage?.expectedArrival
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  icon,
  title,
  value,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

      <div className="flex items-center">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-[#0F2742]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SMALL CARD
========================================================= */

function SmallCard({
  icon,
  title,
  value,
  text,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-sm font-semibold text-slate-600">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {text}
          </p>

        </div>

      </div>

      <p className="mt-4 text-2xl font-bold text-[#0F2742]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const value = String(
    status || "Unknown"
  );

  const normalized =
    value.toLowerCase();

  let classes =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (
    normalized === "in progress" ||
    normalized === "in transit"
  ) {
    classes =
      "border-sky-200 bg-sky-50 text-sky-700";
  } else if (
    normalized === "completed"
  ) {
    classes =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    normalized === "delayed"
  ) {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    normalized === "cancelled"
  ) {
    classes =
      "border-rose-200 bg-rose-50 text-rose-700";
  } else if (
    normalized === "planned"
  ) {
    classes =
      "border-violet-200 bg-violet-50 text-violet-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${classes}`}
    >
      {value}
    </span>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart({ text }) {
  return (
    <div className="flex h-full items-center justify-center text-center">

      <div>

        <Activity
          size={30}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 text-sm font-medium text-slate-400">
          {text}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   EMPTY LIST
========================================================= */

function EmptyList({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">

      <div className="text-slate-300">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-500">
        {text}
      </p>

    </div>
  );
}