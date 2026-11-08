import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CameraIcon from "../CameraIcon";
import { useAdminAuth } from "./AdminAuthContext";
import { AdminNotifications, AdminProfileMenu } from "./AdminHeaderMenus";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/catalog", label: "Catalog & Inventory", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";
  // Keep the drawer full-width on mobile even if it was collapsed on desktop.
  const isCollapsed = collapsed && !navOpen;

  const iconLinkClass = (collapsed: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
      collapsed ? "justify-center" : ""
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-ink">
      {/* Mobile scrim */}
      <div
        onClick={() => setNavOpen(false)}
        className={`fixed inset-0 z-40 bg-ground/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[90] flex w-72 flex-col border-r border-white/10 bg-ground/80 backdrop-blur-2xl transition-all duration-300 ease-out lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-72"}`}
        aria-label="Admin navigation"
      >
        <button
          type="button"
          onClick={() => setNavOpen(false)}
          aria-label="Close navigation"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex h-16 flex-shrink-0 items-center justify-center gap-3 border-b border-white/10 px-4">
          <CameraIcon className="h-10 w-10 flex-shrink-0 text-ink" />
          {!isCollapsed && (
            <span className="truncate text-2xl font-bold tracking-tight text-ink">CriSells</span>
          )}
        </div>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!isCollapsed}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-ground text-ink/60 shadow-md transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 lg:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          )}
        </button>

        {!isCollapsed && (
          <div className="flex-shrink-0 border-b border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent p-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-ink">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{user?.name || "Administrator"}</p>
                <p className="truncate text-xs capitalize text-ink/45">{user?.role || "staff"}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) =>
                  `group ${iconLinkClass(isCollapsed)} ${
                    isActive
                      ? "bg-accent/15 text-ink shadow-lg shadow-accent/10 ring-1 ring-accent/25"
                      : "text-ink/55 hover:translate-x-1 hover:bg-white/[0.06] hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-accent/20 text-accent"
                          : "text-ink/50 group-hover:scale-110 group-hover:text-ink/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {!isCollapsed && item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`${iconLinkClass(isCollapsed)} w-full text-ink/60 hover:bg-red-500/10 hover:text-red-300`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      <div
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-ground/80 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              className="rounded-xl p-2 text-ink/70 transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              to="/"
              aria-label="View store"
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink/60 transition-colors hover:bg-white/[0.06] hover:text-ink"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View Store</span>
            </Link>
            <AdminNotifications />
            <AdminProfileMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main className="w-full p-4 lg:p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <AdminRedirect />;
  }
  return <>{children}</>;
}

function AdminRedirect() {
  return <Navigate to="/" replace />;
}
