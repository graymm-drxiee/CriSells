import { useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowUpRight,
	CalendarDays,
	Camera,
	Package,
} from "lucide-react";
import { useSite } from "../SiteShell";
import Catalog from "./ClientCatalog";
import ClientContact from "./ClientContact";
import ClientOrderModal from "./ClientOrderModal";
import { api } from "../../lib/api";
import type { Camera as CameraType, ClientOrder } from "../../lib/types";

const statusTone: Record<string, string> = {
	Pending: "bg-amber-400/15 text-amber-200 ring-amber-300/20",
	Processing: "bg-sky-400/15 text-sky-200 ring-sky-300/20",
	Shipped: "bg-violet-400/15 text-violet-200 ring-violet-300/20",
	Delivered: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/20",
	Completed: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/20",
	Refunded: "bg-slate-400/15 text-slate-200 ring-slate-300/20",
	Cancelled: "bg-red-400/15 text-red-200 ring-red-300/20",
};

const statusDot: Record<string, string> = {
	Pending: "bg-amber-300",
	Processing: "bg-sky-300",
	Shipped: "bg-violet-300",
	Delivered: "bg-emerald-300",
	Completed: "bg-emerald-300",
	Refunded: "bg-slate-300",
	Cancelled: "bg-red-300",
};

function formatDate(value?: string | null) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	// Year only when it isn't the current one — keeps rental date ranges on one line.
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		...(date.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
	});
}

function formatMoney(value: number) {
	return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ClientDashboard() {
	const { user, addToCart, openLogin } = useSite();
	const [orders, setOrders] = useState<ClientOrder[]>([]);
	const [images, setImages] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [actionError, setActionError] = useState("");
	const [cancelling, setCancelling] = useState<string | null>(null);
	const [confirming, setConfirming] = useState<string | null>(null);
	const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const [listMaxHeight, setListMaxHeight] = useState<number>();

	// Size the scroll area to exactly three reservation cards at the current width.
	useEffect(() => {
		const measure = () => {
			const item = listRef.current?.querySelector("li");
			if (!item) return;
			setListMaxHeight(item.getBoundingClientRect().height * 3 + 12 * 2);
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [orders, loading]);

	useEffect(() => {
		if (!user) {
			setLoading(false);
			setOrders([]);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		const load = () => {
			api<ClientOrder[]>("/api/orders", { signal: controller.signal })
				.then((list) => {
					setOrders(list);
					setLoadError("");
				})
				.catch((err) => {
					if (err.name !== "AbortError") setLoadError(err.message);
				})
				.finally(() => setLoading(false));
		};
		load();
		api<CameraType[]>("/api/products", { signal: controller.signal })
			.then((list) => {
				const next: Record<string, string> = {};
				for (const camera of list) next[camera.id] = camera.image;
				setImages(next);
			})
			.catch(() => null);
		window.addEventListener("focus", load);
		window.addEventListener("crisells-orders-change", load);
		return () => {
			controller.abort();
			window.removeEventListener("focus", load);
			window.removeEventListener("crisells-orders-change", load);
		};
	}, [user]);

	const cancelOrder = async (id: string) => {
		setCancelling(id);
		setConfirming(null);
		setActionError("");
		try {
			const updated = await api<ClientOrder>(`/api/orders/${id}/cancel`, { method: "POST" });
			setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updated } : order)));
		} catch (err) {
			setActionError(err instanceof Error ? err.message : "Could not cancel this reservation.");
		} finally {
			setCancelling(null);
		}
	};

	const summary = useMemo(() => {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const active = orders.filter((order) => ["Pending", "Processing", "Shipped"].includes(order.status));
		const nextPickup = active
			.flatMap((order) =>
				order.items.map((item) => ({ date: item.startDate, orderNumber: order.orderNumber })),
			)
			.filter((item) => item.date && new Date(item.date).getTime() >= startOfToday.getTime())
			.sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())[0];
		const spend = orders
			.filter((order) => !["Cancelled", "Refunded"].includes(order.status))
			.reduce((sum, order) => sum + order.total, 0);

		return {
			activeCount: active.length,
			nextPickup: nextPickup?.date ?? null,
			nextPickupOrder: nextPickup?.orderNumber ?? null,
			spend,
			paidCount: orders.filter((order) => !["Cancelled", "Refunded"].includes(order.status)).length,
		};
	}, [orders]);

	const firstName = user?.name?.trim().split(" ")[0] || "there";

	return (
		<>
			<div className="relative z-10 pt-24">
				<div className="rental-enter mx-auto max-w-[1320px] px-6 sm:px-10">
					<header className="pb-2">
						<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
							Member area
						</p>
						<h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-[34px]">
							{user ? `Welcome back, ${firstName}.` : "Your rentals, managed."}
						</h1>
						<p className="mt-2.5 max-w-xl text-[16px] leading-relaxed text-ink/60">
							Manage your camera rentals, reservations, and account in one place.
						</p>
					</header>

					{!user ? (
						<div className="mt-8 flex flex-col items-start gap-5 rounded-[24px] border border-white/10 bg-white/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
							<div className="flex items-start gap-4">
								<span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white/10 text-ink/70">
									<Camera className="h-5 w-5" aria-hidden="true" />
								</span>
								<div>
									<h2 className="text-[16px] font-semibold text-ink">Sign in to see your reservations</h2>
									<p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-ink/55">
										Your active rentals, pickup dates, and order history live here.
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={openLogin}
								className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.03] active:scale-95 motion-reduce:transition-none"
							>
								Sign in
							</button>
						</div>
					) : (
						<>
							<div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
								<div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
									<div className="flex items-center justify-between gap-3">
										<span className="text-[12px] font-medium text-ink/55">Active rentals</span>
										<Package className="h-4 w-4 text-ink/30" aria-hidden="true" />
									</div>
									<p className="mt-3 text-xl font-semibold leading-none tracking-tight tabular-nums text-ink sm:text-2xl">
										{summary.activeCount}
									</p>
									<p className="mt-2 text-[12px] text-ink/45">
										{summary.activeCount === 0
											? "Nothing out right now"
											: summary.activeCount === 1
												? "Reservation in progress"
												: "Reservations in progress"}
									</p>
								</div>

								<div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
									<div className="flex items-center justify-between gap-3">
										<span className="text-[12px] font-medium text-ink/55">Next pickup</span>
										<CalendarDays className="h-4 w-4 text-ink/30" aria-hidden="true" />
									</div>
									<p className="mt-3 text-xl font-semibold leading-none tracking-tight text-ink sm:text-2xl">
										{summary.nextPickup ? formatDate(summary.nextPickup) : "—"}
									</p>
									<p className="mt-2 truncate text-[12px] text-ink/45">
										{summary.nextPickupOrder ?? "Nothing scheduled"}
									</p>
								</div>

								<div className="col-span-2 rounded-[20px] border border-white/10 bg-white/[0.045] p-4 sm:col-span-1 sm:p-5">
									<div className="flex items-center justify-between gap-3">
										<span className="text-[12px] font-medium text-ink/55">Lifetime spend</span>
										<span className="text-[11px] font-medium text-ink/30">
											{summary.paidCount} {summary.paidCount === 1 ? "order" : "orders"}
										</span>
									</div>
									<p className="mt-3 text-xl font-semibold leading-none tracking-tight tabular-nums text-ink sm:text-2xl">
										{formatMoney(summary.spend)}
									</p>
									<p className="mt-2 text-[12px] text-ink/45">Across your reservations</p>
								</div>
							</div>

							<div className="mt-8">
								<section id="rentals" className="scroll-mt-32">
									<div className="mb-4 flex items-baseline justify-between gap-4">
										<h2 className="text-lg font-semibold tracking-tight text-ink">Your rentals</h2>
										{!loading && orders.length > 0 && (
											<span className="text-[13px] text-ink/45">
												{orders.length} {orders.length === 1 ? "reservation" : "reservations"}
											</span>
										)}
									</div>

									{actionError && (
										<p className="mb-3 rounded-xl bg-red-500/15 px-4 py-2.5 text-[13px] text-red-200" role="alert">
											{actionError}
										</p>
									)}

									{loading ? (
										<div className="space-y-3" aria-label="Loading reservations">
											{[0, 1].map((index) => (
												<div
													key={index}
													className="h-[116px] animate-pulse rounded-2xl bg-white/[0.04] motion-reduce:animate-none"
												/>
											))}
										</div>
									) : loadError ? (
										<div className="rounded-2xl bg-white/[0.045] px-5 py-6">
											<p className="text-[14px] text-ink/60">{loadError}</p>
										</div>
									) : orders.length === 0 ? (
										<div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
											<span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/[0.06] text-ink/40">
												<Package className="h-5 w-5" aria-hidden="true" />
											</span>
											<h3 className="mt-4 text-[16px] font-semibold text-ink">No reservations yet</h3>
											<p className="mx-auto mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-ink/55">
												Pick a camera and we&rsquo;ll have it cleaned, charged, and ready for pickup.
											</p>
											<a
												href="#catalog"
												className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.03] active:scale-95 motion-reduce:transition-none"
											>
												Browse cameras
												<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
											</a>
										</div>
									) : (
										<div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-3">
											<ul
												ref={listRef}
												className="grid gap-3 overflow-x-hidden overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]"
												style={{ maxHeight: listMaxHeight }}
											>
												{orders.map((order) => {
												const cancellable = ["Pending", "Processing"].includes(order.status);
												const first = order.items[0];
												const extra = order.items.length - 1;
												const image = first?.productId ? images[first.productId] : null;
												return (
													<li
														key={order.id}
														className="rounded-2xl bg-white/[0.045] p-3.5 transition-colors hover:bg-white/[0.06] sm:p-5"
													>
														<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
															<div className="flex min-w-0 gap-3 sm:gap-4">
																<div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white/[0.04] sm:h-[76px] sm:w-[96px]">
																	{image ? (
																		<img
																			src={image}
																			alt={first?.name ?? "Camera"}
																			className="h-full w-full object-cover"
																			loading="lazy"
																			decoding="async"
																		/>
																	) : (
																		<span className="grid h-full w-full place-items-center text-ink/25">
																			<Camera className="h-5 w-5" aria-hidden="true" />
																		</span>
																	)}
																</div>

																<div className="min-w-0 pt-0.5">
																	<div className="flex flex-wrap items-center gap-2">
																		<button
																			type="button"
																			onClick={() => setSelectedOrder(order)}
																			className="font-mono text-[11px] tracking-wide text-ink/40 underline-offset-4 transition-colors hover:text-accent hover:underline"
																		>
																			{order.orderNumber}
																		</button>
																		<span
																			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
																				statusTone[order.status] ?? "bg-white/10 text-ink/70 ring-white/10"
																			}`}
																		>
																			<span
																				className={`h-1.5 w-1.5 rounded-full ${
																					statusDot[order.status] ?? "bg-ink/40"
																				}`}
																				aria-hidden="true"
																			/>
																			{order.status}
																		</span>
																	</div>
																	<p className="mt-2 truncate text-[15px] font-medium text-ink">
																		{first ? first.name : "Reservation"}
																		{extra > 0 && (
																			<span className="text-ink/50"> +{extra} more</span>
																		)}
																	</p>
																	<p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-ink/50 sm:text-[13px]">
																		<CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
																		<span className="min-w-0">
																			<span className="whitespace-nowrap">
																				{formatDate(first?.startDate)} – {formatDate(first?.endDate)}
																			</span>
																			<span className="whitespace-nowrap text-ink/40">
																				{" · "}
																				{first?.days ?? 1} {first?.days === 1 ? "day" : "days"}
																			</span>
																		</span>
																	</p>
																</div>
															</div>

															<div className="flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3 sm:border-0 sm:pt-0">
																<div className="sm:text-right">
																	<div className="text-base font-semibold tracking-tight text-ink sm:text-lg">
																		{formatMoney(order.total)}
																	</div>
																	<div className="text-[10.5px] text-ink/40 sm:text-[11px]">total</div>
																</div>
																<div className="flex items-center gap-2">
																	<button
																		type="button"
																		onClick={() => setSelectedOrder(order)}
																		className="min-h-11 rounded-full bg-white/[0.07] px-3.5 text-[12px] font-semibold text-ink/70 transition-colors duration-150 hover:bg-white/15 hover:text-ink sm:min-h-0 sm:py-2"
																	>
																		Details
																	</button>
																	{cancellable && (
																		<button
																			type="button"
																			disabled={cancelling === order.id}
																			onClick={() =>
																				confirming === order.id
																					? cancelOrder(order.id)
																					: setConfirming(order.id)
																			}
																			className={`min-h-11 rounded-full px-3.5 text-[12px] font-semibold transition-colors duration-150 disabled:opacity-50 sm:min-h-0 sm:py-2 ${
																				confirming === order.id
																					? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
																					: "bg-white/[0.07] text-ink/70 hover:bg-white/15 hover:text-ink"
																			}`}
																		>
																			{cancelling === order.id
																				? "Cancelling…"
																				: confirming === order.id
																					? "Confirm cancel"
																					: "Cancel"}
																		</button>
																	)}
																</div>
															</div>
														</div>
													</li>
												);
											})}
											</ul>
										</div>
									)}
								</section>
						</div>
					</>
				)}
				</div>

				<Catalog onAddToCart={addToCart} />
				<ClientContact />
			</div>

			{selectedOrder && (
				<ClientOrderModal
					order={selectedOrder}
					images={images}
					onClose={() => setSelectedOrder(null)}
					onUpdated={(updated) =>
						setOrders((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
					}
				/>
			)}
		</>
	);
}
