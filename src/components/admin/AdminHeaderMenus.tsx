import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, ChevronDown, LogOut, ShoppingCart, User } from "lucide-react";
import type { AdminUser } from "./AdminAuthContext";
import type { AdminOrder, AdminProduct } from "./adminData";
import { api } from "../../api";

/* Dropdown shell: click to toggle, closes on outside click or Escape. */
function HeaderDropdown({
  trigger,
  children,
  width = "w-72",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+10px)] z-40 ${width} origin-top-right animate-glide-pop rounded-2xl border border-white/10 bg-ground/95 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

type Notice = {
  id: string;
  title: string;
  detail: string;
  to: string;
  icon: typeof AlertTriangle;
  tone: string;
};

function buildNotifications(products: AdminProduct[], orders: AdminOrder[]): Notice[] {
  return [
    ...products
      .filter((p) => p.stock <= p.lowStockThreshold)
      .map((p) => ({
        id: `stock-${p.id}`,
        title: p.stock === 0 ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`,
        detail: p.stock === 0 ? "Restock before the next rental" : `${p.stock} left in inventory`,
        to: "/admin/catalog",
        icon: AlertTriangle,
        tone: "text-amber-300",
      })),
    ...orders
      .filter((o) => o.status === "Pending" || o.status === "Processing")
      .map((o) => ({
        id: `order-${o.id}`,
        title: `${o.status} order ${o.orderNumber}`,
        detail: o.customer.fullName,
        to: "/admin/orders",
        icon: ShoppingCart,
        tone: "text-sky-300",
      })),
  ];
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notice[]>([]);

  useEffect(() => {
    Promise.all([api<AdminProduct[]>("/api/admin/products"), api<AdminOrder[]>("/api/admin/orders")])
      .then(([products, orders]) => setNotifications(buildNotifications(products, orders)))
      .catch(() => null);
  }, []);

  const count = notifications.length;

  return (
    <HeaderDropdown
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Notifications (${count} new)`}
          aria-haspopup="menu"
          aria-expanded={open}
          className="relative rounded-xl p-2 text-ink/60 transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {count} new
            </span>
          </div>
          <div className="h-px bg-white/10" />
          {count === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink/45">You're all caught up.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={close}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                  >
                    <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ${item.tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{item.title}</span>
                      <span className="block truncate text-xs text-ink/45">{item.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </HeaderDropdown>
  );
}

export function AdminProfileMenu({
  user,
  onLogout,
}: {
  user: AdminUser | null;
  onLogout: () => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const actions = [
    { label: "Profile Settings", icon: User, to: "/admin/settings", danger: false },
    { label: "Notification Settings", icon: Bell, to: "/admin/settings", danger: false },
    { label: "Sign Out", icon: LogOut, to: null, danger: true },
  ];

  return (
    <HeaderDropdown
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="group -mr-1.5 flex items-center gap-2 rounded-xl py-1 pl-2 pr-2.5 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <User className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="max-w-[9rem] truncate text-sm font-medium text-ink">{user?.name || "Administrator"}</span>
            <span className="text-xs capitalize text-ink/50">{user?.role || "staff"}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-ink/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="relative overflow-hidden rounded-xl px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/20">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-tight text-ink">{user?.name || "Administrator"}</span>
                <span className="block truncate text-[11px] text-ink/50">{user?.email || "admin@crisells.com"}</span>
              </span>
            </div>
          </div>
          <div className="my-1 h-px bg-white/[0.08]" />
          <div className="relative py-1" onPointerLeave={() => setActive(null)}>
            {/* Glide highlight: the same pill motion as GlideSelect. */}
            <span
              className="pointer-events-none absolute inset-x-1 top-1 h-9 rounded-lg bg-white/10 opacity-0 transition-[transform,opacity] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
              style={{ transform: `translateY(${(active ?? 0) * 38}px)`, opacity: active === null ? 0 : 1 }}
              aria-hidden="true"
            />
            {actions.map((action, index) => {
              const Icon = action.icon;
              const className = `relative z-[1] flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                action.danger ? "text-red-300 hover:text-red-200" : "text-ink/75 hover:text-ink"
              }`;
              return action.to ? (
                <Link
                  key={action.label}
                  to={action.to}
                  role="menuitem"
                  onClick={close}
                  onPointerEnter={() => setActive(index)}
                  className={`${className} mb-0.5`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onLogout();
                  }}
                  onPointerEnter={() => setActive(index)}
                  className={className}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </HeaderDropdown>
  );
}
