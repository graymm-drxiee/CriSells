import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, Package, ShoppingCart, Banknote, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "./ui";
import AnimatedContent from "../shared/animation/AnimatedContent";
import { useAdminAuth } from "./AdminAuthContext";
import { statusToVariant, orderStatusOptions, formatMoney, type AdminOrder, type AdminProduct, type OrderStatus } from "./adminData";
import { api } from "../../lib/api";
import { useLivePoll } from "../../hooks/useLivePoll";

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "bg-amber-400",
  Processing: "bg-sky-400",
  Shipped: "bg-violet-400",
  Delivered: "bg-emerald-400",
  Completed: "bg-emerald-400",
  Refunded: "bg-slate-400",
  Cancelled: "bg-red-400",
};

const viewAllClass =
  "inline-flex items-center gap-1 text-xs font-medium text-ink/50 transition-colors hover:text-ink";

export function AdminDashboard() {
  const { user } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const load = () => {
    api<AdminProduct[]>("/api/admin/products").then(setProducts).catch(() => null);
    api<AdminOrder[]>("/api/admin/orders").then(setOrders).catch(() => null);
  };

  useEffect(load, []);
  useLivePoll(load);

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status !== "Cancelled" && o.status !== "Refunded");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter((o) => o.status === "Pending" || o.status === "Processing").length;
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);
    const categories = new Set(products.map((p) => p.category)).size;
    const averageOrder = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

    return {
      totalRevenue,
      activeOrders,
      pendingOrders,
      lowStock,
      categories,
      averageOrder,
      paidCount: paidOrders.length,
    };
  }, [products, orders]);

  const recentOrders = orders.slice(0, 3);
  const firstName = user?.name?.split(" ")[0] || "Administrator";
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const statCards = [
    {
      label: "Total Products",
      value: products.length,
      detail: `${stats.categories} categories`,
      icon: Package,
      iconClass: "bg-white/[0.06] text-ink/60",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders,
      detail: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      iconClass: "bg-sky-400/10 text-sky-300",
    },
    {
      label: "Revenue",
      value: formatMoney(stats.totalRevenue),
      detail: `${stats.paidCount} paid orders · avg ${formatMoney(stats.averageOrder)}`,
      icon: Banknote,
      iconClass: "bg-accent/10 text-accent",
    },
    {
      label: "Low Stock Alerts",
      value: stats.lowStock.length,
      detail: `of ${products.length} products`,
      icon: AlertTriangle,
      iconClass: "bg-amber-400/10 text-amber-300",
    },
  ];

  const totalOrders = orders.length;
  const statusCounts = orderStatusOptions.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const lowStockProducts = stats.lowStock;

  return (
    <AnimatedContent distance={24} duration={0.6} ease="power3.out" trigger="mount">
      <div className="space-y-6">
        <Card className="animate-slide-down">
        <CardContent className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back, {firstName}! 👋</h1>
            <p className="mt-1 text-[13px] text-ink/55">Stay updated with the latest store activity and orders.</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{dateLabel}</p>
              <p className="truncate text-xs text-ink/50">{today.getFullYear()} • Store overview</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={stat.label} className="animate-slide-down" style={{ animationDelay: `${60 + index * 50}ms` }}>
            <Card className="h-full">
              <CardContent className="flex flex-col py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink/60">{stat.label}</p>
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                    <stat.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums text-ink">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink/55">{stat.detail}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="animate-slide-down" style={{ animationDelay: "220ms" }}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Recent Orders</CardTitle>
                <Link to="/admin/orders" className={viewAllClass}>
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {recentOrders.map((order) => (
                  <li key={order.id} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.04]">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] font-semibold text-ink">{order.orderNumber}</p>
                      <p className="truncate text-xs text-ink/55">{order.customer.fullName}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-4">
                      <span className="w-14 text-right text-[13px] font-semibold tabular-nums text-ink/80 sm:w-16">{formatMoney(order.total)}</span>
                      <Badge variant={statusToVariant(order.status)} className="min-w-[80px] justify-center sm:min-w-[92px]">{order.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-down" style={{ animationDelay: "280ms" }}>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Low Stock Alerts</CardTitle>
                <Link to="/admin/catalog" className={viewAllClass}>
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {lowStockProducts.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-ink/55">All products are well stocked.</p>
              ) : (
                <ul className="space-y-1">
                  {lowStockProducts.map((p) => (
                    <li key={p.id} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-white/[0.04]">
                      <div className="flex min-w-0 items-center gap-3">
                        <img src={p.image} alt={p.imageAlt} className="h-10 w-14 flex-shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                          <p className="truncate text-xs text-ink/55">SKU: {p.sku}</p>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-4">
                        <div className="w-12 text-right sm:w-14">
                          <p className={`text-[13px] font-semibold tabular-nums ${p.stock === 0 ? "text-red-400" : "text-amber-300"}`}>{p.stock}</p>
                          <p className="text-[11px] text-ink/55">in stock</p>
                        </div>
                        <Badge variant={p.stock === 0 ? "danger" : "warning"} className="min-w-[80px] justify-center sm:min-w-[92px]">
                          {p.stock === 0 ? "Out of Stock" : "Low Stock"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-auto pt-3 text-xs text-ink/55">
                {lowStockProducts.length} of {products.length} products need restocking
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="animate-slide-down" style={{ animationDelay: "340ms" }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Order Status Distribution</CardTitle>
              <span className="text-xs tabular-nums text-ink/55">{totalOrders} orders</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 xl:gap-0 xl:divide-x xl:divide-white/10">
              {statusCounts.map((entry) => (
                <li key={entry.status} className="flex flex-col gap-1.5 xl:px-5 xl:first:pl-0 xl:last:pr-0">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${entry.color}`} aria-hidden="true" />
                    <span className="truncate text-xs text-ink/60">{entry.status}</span>
                  </span>
                  <span className={`text-2xl font-semibold tabular-nums tracking-tight ${entry.count === 0 ? "text-ink/35" : "text-ink"}`}>
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      </div>
    </AnimatedContent>
  );
}
