import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ship,
  Map,
  Package,
  Fuel,
  Wrench,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Navigation,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* =========================
   PROFILE ICON
   ========================= */
function ProfileIcon({ size = 39, color = "#FFFFFF" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Head */}
      <circle
        cx="50"
        cy="36"
        r="14"
        fill={color}
      />

      {/* Rounded Oval Body (Scaled ~10% larger) */}
      <rect
        x="24"
        y="55"
        width="52"
        height="26"
        rx="13"
        fill={color}
      />
    </svg>
  );
}
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("oceantrack-sidebar") === "true"
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("oceantrack-sidebar", collapsed);
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/profile");
    setMobileOpen(false);
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tracking",
      path: "/tracking",
      icon: Navigation,
    },
    {
      name: "Vessels",
      path: "/vessels",
      icon: Ship,
    },
    {
      name: "Voyages",
      path: "/voyages",
      icon: Map,
    },
    {
      name: "Cargo",
      path: "/cargo",
      icon: Package,
    },
    {
      name: "Fuel",
      path: "/fuel",
      icon: Fuel,
    },
    {
      name: "Maintenance",
      path: "/maintenance",
      icon: Wrench,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: BarChart3,
    },

    ...(user?.role === "admin"
      ? [
          {
            name: "Users",
            path: "/users",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =========================
          SIDEBAR
         ========================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          overflow-hidden
          bg-slate-950
          text-white
          transition-[width,transform]
          duration-500
          ease-in-out
          ${collapsed ? "lg:w-[82px]" : "lg:w-[280px]"}
          w-[280px]
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex h-full flex-col">

          {/* =========================
              LOGO
             ========================= */}

          <div
            className={`
              flex h-20 shrink-0 items-center
              border-b border-slate-800
              px-5
              ${
                collapsed
                  ? "justify-center"
                  : "justify-between"
              }
            `}
          >
            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg">
                <Ship size={25} />
              </div>

              <div
                className={`
                  overflow-hidden whitespace-nowrap
                  transition-all duration-500 ease-in-out
                  ${
                    collapsed
                      ? "w-0 translate-x-[-10px] opacity-0"
                      : "w-[150px] translate-x-0 opacity-100"
                  }
                `}
              >
                <h1 className="text-xl font-bold text-white">
                  OceanTrack
                </h1>

                <p className="text-xs text-slate-400">
                  Smart Fleet Management
                </p>
              </div>

            </div>

            {/* MOBILE CLOSE */}
            <button
              onClick={() => setMobileOpen(false)}
              className="
                rounded-lg p-2
                text-slate-300
                hover:bg-slate-800
                lg:hidden
              "
            >
              <X size={21} />
            </button>

          </div>

          {/* =========================
              NAVIGATION
             ========================= */}

          <nav
            className="
              flex-1
              overflow-y-auto
              px-3 py-5
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <div className="space-y-2">

              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `
                      flex h-12 items-center
                      rounded-xl
                      transition-all
                      duration-300
                      ease-in-out
                      ${
                        collapsed
                          ? "justify-center px-0"
                          : "gap-3 px-4"
                      }
                      ${
                        isActive
                          ? "bg-sky-600 text-white shadow-md"
                          : "text-slate-300 hover:bg-slate-800 hover:text-sky-400"
                      }
                    `
                    }
                  >
                    <Icon
                      size={21}
                      className="shrink-0"
                    />

                    <span
                      className={`
                        overflow-hidden
                        whitespace-nowrap
                        transition-all
                        duration-500
                        ease-in-out
                        ${
                          collapsed
                            ? "w-0 translate-x-[-8px] opacity-0"
                            : "w-auto translate-x-0 opacity-100"
                        }
                      `}
                    >
                      {item.name}
                    </span>

                  </NavLink>
                );
              })}

            </div>
          </nav>

          {/* =========================
              BOTTOM PROFILE
             ========================= */}

          <div className="border-t border-slate-800 p-3">

            <div
              className={`
                flex items-center
                rounded-xl
                p-2
                ${
                  collapsed
                    ? "justify-center"
                    : "gap-3"
                }
              `}
            >

              {/* PROFILE ICON */}
              <button
                onClick={goToProfile}
                title="Profile"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-transparent
                  transition
                  hover:scale-105
                "
              >
                <ProfileIcon size={39} />
              </button>

              {/* USER DETAILS */}
              <button
                onClick={goToProfile}
                className={`
                  min-w-0
                  flex-1
                  overflow-hidden
                  text-left
                  transition-all
                  duration-500
                  ease-in-out
                  ${
                    collapsed
                      ? "w-0 opacity-0"
                      : "w-[150px] opacity-100"
                  }
                `}
              >
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-xs capitalize text-slate-400">
                  {user?.role || "Staff"}
                </p>
              </button>

              {/* LOGOUT */}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="
                    ml-auto
                    shrink-0
                    rounded-lg
                    p-2
                    text-red-400
                    transition
                    hover:bg-red-500/10
                    hover:text-red-300
                  "
                >
                  <LogOut size={19} />
                </button>
              )}

            </div>
          </div>

        </div>
      </aside>

      {/* =========================
          MOBILE OVERLAY
         ========================= */}

      {mobileOpen && (
        <div
          className="
            fixed inset-0 z-40
            bg-black/40
            lg:hidden
          "
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =========================
          MAIN CONTENT
         ========================= */}

      <div
        className={`
          min-h-screen
          transition-[margin-left]
          duration-500
          ease-in-out
          ${
            collapsed
              ? "lg:ml-[82px]"
              : "lg:ml-[280px]"
          }
        `}
      >

        {/* =========================
            HEADER
           ========================= */}

        <header
          className="
            sticky top-0 z-30
            flex h-20
            items-center
            justify-between
            border-b border-slate-200
            bg-white
            px-4 sm:px-6
          "
        >

          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileOpen(true)}
              className="
                flex h-10 w-10
                items-center
                justify-center
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-700
                hover:bg-slate-50
                lg:hidden
              "
            >
              <Menu size={22} />
            </button>

            {/* DESKTOP SIDEBAR TOGGLE */}
            <button
              onClick={() =>
                setCollapsed((prev) => !prev)
              }
              className="
                hidden h-10 w-10
                items-center
                justify-center
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-700
                transition
                hover:bg-slate-50
                lg:flex
              "
              title={
                collapsed
                  ? "Open sidebar"
                  : "Close sidebar"
              }
            >
              <Menu size={22} />
            </button>

            <div className="hidden sm:block">

              <h2 className="text-lg font-semibold text-slate-800">
                Smart Shipping Fleet Management
              </h2>

              <p className="text-xs text-slate-500">
                Monitor and manage your fleet efficiently
              </p>

            </div>

          </div>

          {/* =========================
              HEADER RIGHT
             ========================= */}

          <div className="flex items-center gap-3">

            {/* USER NAME */}
            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "User"}
              </p>

              <p className="text-xs capitalize text-slate-500">
                {user?.role || "Staff"}
              </p>

            </div>

            {/* PROFILE */}
            <button
              onClick={goToProfile}
              title="Profile"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-transparent
                transition
                hover:scale-105
              "
            >
              <ProfileIcon size={39} color="#0F2742" />
            </button>

          </div>

        </header>

        {/* =========================
            PAGE CONTENT
           ========================= */}

        <main
          className="
            min-h-[calc(100vh-80px)]
            bg-slate-50
            p-4 sm:p-6
          "
        >
          {children}
        </main>

      </div>
    </div>
  );
}