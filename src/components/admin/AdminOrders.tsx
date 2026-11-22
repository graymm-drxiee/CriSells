import { useEffect, useState, useMemo } from "react";
import { Eye, Truck, RotateCcw, Package, Banknote, AlertTriangle } from "lucide-react";
import {
  Button,
  Textarea,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  Input,
  AdminSearch,
  FilterPill,
  AdminFilterSelect,
  AdminFormSelect,
  FormSection,
} from "./ui";
import { orderStatusOptions, statusToVariant, titleOptions, genderOptions, pronounOptions, formatMoney, formatDate, type AdminOrder, type OrderStatus } from "./adminData";
import { api } from "../../lib/api";
import { useLivePoll } from "../../hooks/useLivePoll";
import AnimatedContent from "../shared/animation/AnimatedContent";

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [returnOrder, setReturnOrder] = useState<AdminOrder | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Poll so orders placed on the mobile client show up without a manual refresh.
  const load = () => {
    api<AdminOrder[]>("/api/admin/orders")
      .then((list) => {
        setOrders(list);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message));
  };

  useEffect(load, []);
  useLivePoll(load);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await api<AdminOrder>(`/api/admin/orders/${orderId}`, { method: "PATCH", body: { status } });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (detailOrder?.id === orderId) setDetailOrder(updated);
      showToast(`Order status updated to "${status}".`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update the order.");
    }
  };

  const generateShippingLabel = async (orderId: string) => {
    const label = `LBL-${new Date().toISOString().split("T")[0]}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const tracking = `TRK-${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
    try {
      const updated = await api<AdminOrder>(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: { shippingLabel: label, trackingNumber: tracking, status: "Shipped" },
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (detailOrder?.id === orderId) setDetailOrder(updated);
      showToast(`Shipping label generated: ${label}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not generate the label.");
    }
  };

  const processReturn = async () => {
    if (!returnOrder) return;
    try {
      const updated = await api<AdminOrder>(`/api/admin/orders/${returnOrder.id}`, {
        method: "PATCH",
        body: { status: "Refunded", notes: returnReason ? `Return: ${returnReason}` : returnOrder.notes },
      });
      setOrders((prev) => prev.map((o) => (o.id === returnOrder.id ? updated : o)));
      showToast(`Refund processed for ${returnOrder.orderNumber}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not process the refund.");
    } finally {
      setReturnOrder(null);
      setReturnReason("");
    }
  };

  return (
    <AnimatedContent distance={24} duration={0.6} ease="power3.out" trigger="mount">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Order Management</h1>
          <p className="mt-1 text-[13px] text-ink/55">Track orders, generate shipping labels, and process returns.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Package className="h-4 w-4" aria-hidden="true" />
          New Order
        </Button>
      </div>

      <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by order number, customer name, or email..."
          label="Search orders"
        />
        <FilterPill label="Status">
          <AdminFilterSelect
            options={[{ value: "All", label: "All Statuses" }, ...orderStatusOptions.map((s) => ({ value: s, label: s }))]}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter by order status"
            menuWidth={140}
            align="right"
          />
        </FilterPill>
      </div>

      <Card className="overflow-hidden">
        <Table className="min-w-[880px] table-fixed text-center [&_th]:text-center [&_td]:text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14%]">Order #</TableHead>
              <TableHead className="w-[22%]">Customer</TableHead>
              <TableHead className="w-[10%]">Items</TableHead>
              <TableHead className="w-[12%]">Total</TableHead>
              <TableHead className="w-[14%]">Date</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[14%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell><span className="text-xs font-semibold tabular-nums text-ink">{order.orderNumber}</span></TableCell>
                <TableCell>
                  <p className="font-medium text-ink">{order.customer.fullName}</p>
                  <p className="text-xs text-ink/45">{order.customer.email}</p>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] text-ink/60">{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                </TableCell>
                <TableCell><span className="font-semibold text-ink">{formatMoney(order.total)}</span></TableCell>
                <TableCell><span className="text-xs text-ink/45">{formatDate(order.createdAt)}</span></TableCell>
                <TableCell><Badge variant={statusToVariant(order.status)} dot>{order.status}</Badge></TableCell>
                <TableCell>
                  <div className="mx-auto grid w-[60px] grid-cols-2 place-items-center gap-1">
                    <button
                      onClick={() => setDetailOrder(order)}
                      className="rounded-lg p-1.5 text-ink/45 transition-colors hover:bg-white/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                      aria-label={`View ${order.orderNumber} details`}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {order.status === "Processing" && (
                      <button
                        onClick={() => generateShippingLabel(order.id)}
                        className="rounded-lg p-1.5 text-ink/45 transition-colors hover:bg-white/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                        aria-label={`Generate shipping label for ${order.orderNumber}`}
                        title="Generate shipping label"
                      >
                        <Truck className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    {(order.status === "Delivered" || order.status === "Shipped") && (
                      <button
                        onClick={() => setReturnOrder(order)}
                        className="rounded-lg p-1.5 text-ink/45 transition-colors hover:bg-amber-500/15 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                        aria-label={`Process return for ${order.orderNumber}`}
                        title="Process return/refund"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-ink/20" aria-hidden="true" />
            <p className="mt-3 text-[13px] text-ink/45">No orders found matching your filters.</p>
          </div>
        )}
      </Card>

      {detailOrder && (
        <Modal
          open={true}
          onClose={() => setDetailOrder(null)}
          size="xl"
          title={`Order ${detailOrder.orderNumber}`}
          description={`Placed ${formatDate(detailOrder.createdAt)} · ${detailOrder.items.length} item${detailOrder.items.length > 1 ? "s" : ""}`}
          bodyClassName="p-0"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDetailOrder(null)}>Close</Button>
              {detailOrder.status === "Processing" && (
                <Button onClick={() => generateShippingLabel(detailOrder.id)}>
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Generate Shipping Label
                </Button>
              )}
              {(detailOrder.status === "Delivered" || detailOrder.status === "Shipped") && (
                <Button variant="danger" onClick={() => { setReturnOrder(detailOrder); setDetailOrder(null); }}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Process Return
                </Button>
              )}
            </>
          }
        >
          <div className="grid xl:grid-cols-[320px_1fr]">
            <aside className="order-2 border-t border-white/10 p-6 xl:order-1 xl:border-t-0 xl:border-r">
              <div className="space-y-5 xl:sticky xl:top-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium tracking-[0.08em] text-ink/45 uppercase">Order summary</span>
                    <Badge variant={statusToVariant(detailOrder.status)} dot>{detailOrder.status}</Badge>
                  </div>
                  <p className="mt-3 text-xl font-bold tracking-tight text-ink">{detailOrder.orderNumber}</p>
                  <p className="mt-0.5 truncate text-[13px] text-ink/70">{detailOrder.customer.fullName}</p>

                  <dl className="mt-4 space-y-2 text-[13px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink/50">Items</dt>
                      <dd className="font-medium tabular-nums text-ink/80">{detailOrder.items.length}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink/50">Placed</dt>
                      <dd className="font-medium text-ink/80">{formatDate(detailOrder.createdAt)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink/50">Tracking</dt>
                      <dd className="min-w-0 truncate text-right font-mono text-xs font-medium text-ink/80">
                        {detailOrder.trackingNumber || "Not generated"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[13px] font-medium text-ink/60">Total</span>
                    <span className="text-xl font-bold tabular-nums tracking-tight text-accent">{formatMoney(detailOrder.total)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-ground/50 p-3">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Package className="h-5 w-5 text-ink/25" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {detailOrder.items[0]?.name || "Rental item"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/55">
                        {detailOrder.items[0]
                          ? `${detailOrder.items[0].qty} x ${detailOrder.items[0].days} days @ ${formatMoney(detailOrder.items[0].pricePerDay)}/day`
                          : "No items on this order"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-ink/45">
                  {detailOrder.shippingLabel ? (
                    <>Label <span className="font-mono font-medium text-ink/70">{detailOrder.shippingLabel}</span> generated.</>
                  ) : detailOrder.status === "Processing" ? (
                    "Generate a shipping label to move this order to Shipped."
                  ) : (
                    "This order is view-only until its status allows an action."
                  )}
                </p>
              </div>
            </aside>

            <div className="order-1 space-y-8 p-6 xl:order-2">
              <FormSection title="Customer" description="Contact details attached to this order.">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <dl className="grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                    <div><dt className="text-xs text-ink/45">Full name</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.fullName}</dd></div>
                    <div><dt className="text-xs text-ink/45">Title</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.title}</dd></div>
                    <div><dt className="text-xs text-ink/45">Email</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.email}</dd></div>
                    <div><dt className="text-xs text-ink/45">Phone</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.phone}</dd></div>
                    <div><dt className="text-xs text-ink/45">Delivery address</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.address || "—"}</dd></div>
                    <div><dt className="text-xs text-ink/45">Gender</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.gender}</dd></div>
                    <div><dt className="text-xs text-ink/45">Pronouns</dt><dd className="mt-0.5 font-medium text-ink">{detailOrder.customer.pronouns}</dd></div>
                  </dl>
                </div>
              </FormSection>

              <FormSection title="Items" description="Rental line items and what each one costs.">
                <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                  {detailOrder.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
                        <p className="text-xs text-ink/45">{item.qty} x {item.days} days @ {formatMoney(item.pricePerDay)}/day</p>
                      </div>
                      <span className="flex-shrink-0 text-[13px] font-semibold tabular-nums text-ink">{formatMoney(item.qty * item.pricePerDay * item.days)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[13px] font-medium text-ink/60">Order total</span>
                  <span className="text-xl font-bold tabular-nums tracking-tight text-ink">{formatMoney(detailOrder.total)}</span>
                </div>
              </FormSection>

              {detailOrder.notes && (
                <FormSection title="Notes" description="Instructions added to this order.">
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-[13px] text-amber-200/90">{detailOrder.notes}</p>
                  </div>
                </FormSection>
              )}

              <FormSection title="Status" description="Move this order through its lifecycle.">
                <AdminFormSelect
                  label="Order status"
                  options={orderStatusOptions.map((s) => ({ value: s, label: s }))}
                  value={detailOrder.status}
                  onChange={(value) => updateOrderStatus(detailOrder.id, value as OrderStatus)}
                  ariaLabel="Update order status"
                />
              </FormSection>
            </div>
          </div>
        </Modal>
      )}

      {returnOrder && (
        <Modal
          open={true}
          onClose={() => { setReturnOrder(null); setReturnReason(""); }}
          size="xl"
          title="Process return"
          description={`Refund or return for ${returnOrder.orderNumber}.`}
          bodyClassName="p-0"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setReturnOrder(null); setReturnReason(""); }}>Cancel</Button>
              <Button variant="danger" onClick={processReturn}>
                <Banknote className="h-4 w-4" aria-hidden="true" />
                Issue Refund ({formatMoney(returnOrder.total)})
              </Button>
            </>
          }
        >
          <div className="grid xl:grid-cols-[320px_1fr]">
            <aside className="order-2 border-t border-white/10 p-6 xl:order-1 xl:border-t-0 xl:border-r">
              <div className="space-y-5 xl:sticky xl:top-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium tracking-[0.08em] text-ink/45 uppercase">Refund summary</span>
                    <Badge variant={statusToVariant(returnOrder.status)} dot>{returnOrder.status}</Badge>
                  </div>
                  <p className="mt-3 text-xl font-bold tracking-tight text-ink">{returnOrder.orderNumber}</p>
                  <p className="mt-0.5 truncate text-[13px] text-ink/70">{returnOrder.customer.fullName}</p>

                  <dl className="mt-4 space-y-2 text-[13px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink/50">Items</dt>
                      <dd className="font-medium tabular-nums text-ink/80">{returnOrder.items.length}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink/50">Order total</dt>
                      <dd className="font-medium tabular-nums text-ink/80">{formatMoney(returnOrder.total)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[13px] font-medium text-ink/60">Refund amount</span>
                    <span className="text-xl font-bold tabular-nums tracking-tight text-accent">{formatMoney(returnOrder.total)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-ground/50 p-3">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Package className="h-5 w-5 text-ink/25" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {returnOrder.items[0]?.name || "Rental item"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/55">
                        {returnOrder.items[0]
                          ? `${returnOrder.items[0].qty} x ${returnOrder.items[0].days} days @ ${formatMoney(returnOrder.items[0].pricePerDay)}/day`
                          : "No items on this order"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-ink/45">
                  Issuing the refund marks this order as <span className="font-medium text-ink/70">Refunded</span> and records the reason below.
                </p>
              </div>
            </aside>

            <div className="order-1 space-y-8 p-6 xl:order-2">
              <FormSection title="Return details" description="Tell us why this rental is being refunded.">
                <div className="space-y-4">
                  <Textarea
                    label="Return / refund reason"
                    name="returnReason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={5}
                    placeholder="e.g. Item returned damaged, customer cancellation, weather event..."
                  />
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-200">Before you refund</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-amber-200/90">
                      The full order total is refunded and the order status is set to Refunded. This can't be undone from this screen.
                    </p>
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        </Modal>
      )}

      {createOpen && (
        <NewOrderModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            const { order } = await api<{ order: AdminOrder }>("/api/admin/orders", {
              method: "POST",
              body: input,
            });
            setOrders((prev) => [order, ...prev]);
            showToast(`Order ${order.orderNumber} created.`);
            setCreateOpen(false);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-ground/90 px-4 py-3 text-[13px] font-medium text-ink shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl animate-slide-down" role="status">
          {toast}
        </div>
      )}
      </div>
    </AnimatedContent>
  );
}

function NewOrderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: {
    customer: AdminOrder["customer"];
    items: { name: string; qty: number; pricePerDay: number; days: number }[];
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("No Title");
  const [gender, setGender] = useState("Prefer Not to Say");
  const [genderSelfDescribe, setGenderSelfDescribe] = useState("");
  const [pronouns, setPronouns] = useState("they/them");
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("1");
  const [days, setDays] = useState("1");
  const [pricePerDay, setPricePerDay] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const q = parseInt(qty) || 0;
  const d = parseInt(days) || 0;
  const ppd = parseFloat(pricePerDay) || 0;
  const total = q * ppd * d;
  const orderNumber = "Assigned on save";
  const firstError = Object.values(errors).find(Boolean);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!fullName.trim()) e2.fullName = "Full name is required.";
    if (!email.includes("@")) e2.email = "A valid email is required.";
    if (!productName.trim()) e2.productName = "Product name is required.";
    if (isNaN(ppd) || ppd <= 0) e2.pricePerDay = "Price must be a positive number.";
    if (q < 1) e2.qty = "Quantity must be at least 1.";
    if (d < 1) e2.days = "Days must be at least 1.";
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    try {
      await onCreate({
        customer: {
          fullName,
          email,
          phone,
          title,
          gender: gender === "Self-Describe" ? genderSelfDescribe : gender,
          pronouns,
        },
        items: [{ name: productName, qty: q, pricePerDay: ppd, days: d }],
      });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not create the order." });
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="xl"
      title="New order"
      description="Create a manual order for a customer rental."
      bodyClassName="p-0"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-order-form">Create order</Button>
        </>
      }
    >
      <form id="new-order-form" onSubmit={handleSubmit} noValidate className="grid xl:grid-cols-[320px_1fr]">
        <div className="order-1 space-y-8 p-6 xl:order-2">
          {firstError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-red-200" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{firstError}</span>
            </div>
          )}

          <FormSection title="Customer details" description="Who is renting and how to reach them.">
            <div className="space-y-4">
              <Input
                label="Full name"
                name="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError("fullName");
                }}
                error={errors.fullName}
                placeholder="e.g. John Doe"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  error={errors.email}
                  placeholder="name@email.com"
                  required
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminFormSelect
                  label="Title"
                  options={titleOptions.map((t) => ({ value: t, label: t }))}
                  value={title}
                  onChange={setTitle}
                  ariaLabel="Title"
                />
                <AdminFormSelect
                  label="Pronouns"
                  options={pronounOptions.map((p) => ({ value: p, label: p }))}
                  value={pronouns}
                  onChange={setPronouns}
                  ariaLabel="Pronouns"
                />
              </div>
              <AdminFormSelect
                label="Gender"
                options={genderOptions.map((g) => ({ value: g, label: g }))}
                value={gender}
                onChange={setGender}
                ariaLabel="Gender"
              />
              {gender === "Self-Describe" && (
                <Input
                  label="Self-described gender"
                  name="genderSelf"
                  value={genderSelfDescribe}
                  onChange={(e) => setGenderSelfDescribe(e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </div>
          </FormSection>

          <FormSection title="Rental item" description="What they're renting and the agreed rate.">
            <div className="space-y-4">
              <Input
                label="Product name"
                name="productName"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  clearError("productName");
                }}
                error={errors.productName}
                placeholder="e.g. Canon EOS R5"
                required
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Quantity"
                  name="qty"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    clearError("qty");
                  }}
                  error={errors.qty}
                  required
                />
                <Input
                  label="Days"
                  name="days"
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    clearError("days");
                  }}
                  error={errors.days}
                  required
                />
                <Input
                  label="Price / day ($)"
                  name="pricePerDay"
                  type="number"
                  min="0"
                  step="1"
                  value={pricePerDay}
                  onChange={(e) => {
                    setPricePerDay(e.target.value);
                    clearError("pricePerDay");
                  }}
                  error={errors.pricePerDay}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </FormSection>
        </div>

        <aside className="order-2 border-t border-white/10 p-6 xl:order-1 xl:border-t-0 xl:border-r">
          <div className="space-y-5 xl:sticky xl:top-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium tracking-[0.08em] text-ink/45 uppercase">Order summary</span>
                <Badge variant="neutral" dot>Pending</Badge>
              </div>
              <p className="mt-3 text-xl font-bold tracking-tight text-ink">{orderNumber}</p>
              <p className={`mt-0.5 truncate text-[13px] ${fullName.trim() ? "text-ink/70" : "text-ink/40"}`}>
                {fullName.trim() || "Customer name"}
              </p>

              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink/50">Item</dt>
                  <dd className={`min-w-0 truncate text-right font-medium ${productName.trim() ? "text-ink" : "text-ink/40"}`}>
                    {productName.trim() || "Not set"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink/50">Quantity</dt>
                  <dd className="font-medium tabular-nums text-ink/80">{q || 0} x {d || 0} days</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink/50">Rate</dt>
                  <dd className="font-medium tabular-nums text-ink/80">{formatMoney(ppd)}<span className="font-normal text-ink/45"> / day</span></dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[13px] font-medium text-ink/60">Total</span>
                <span className="text-xl font-bold tabular-nums tracking-tight text-accent">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-ground/50 p-3">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Package className="h-5 w-5 text-ink/25" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-semibold ${productName.trim() ? "text-ink" : "text-ink/40"}`}>
                    {productName.trim() || "Rental item"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {q || 0} x {d || 0} days @ {formatMoney(ppd)}/day
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-ink/45">
              The order starts as <span className="font-medium text-ink/70">Pending</span>. Once it's ready to ship, generate a label from the orders table.
            </p>
          </div>
        </aside>
      </form>
    </Modal>
  );
}
