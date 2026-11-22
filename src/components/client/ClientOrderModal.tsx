import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Camera, Check, Printer, X } from "lucide-react";
import { useOverlayPause } from "../../hooks/useOverlayPause";
import { api } from "../../lib/api";
import type { ClientOrder } from "../../lib/types";

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

const sectionLabel = "text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40";

function formatMoney(value: number) {
	return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatDate(value?: string | null) {
	if (!value) return "—";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "—"
		: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientOrderModal({
	order: initialOrder,
	images,
	onClose,
	onUpdated,
}: {
	order: ClientOrder;
	images: Record<string, string>;
	onClose: () => void;
	onUpdated: (order: ClientOrder) => void;
}) {
	useOverlayPause();
	const [order, setOrder] = useState(initialOrder);
	const [busy, setBusy] = useState<"cancel" | "received" | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [error, setError] = useState("");
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null;
		document.body.style.overflow = "hidden";
		closeRef.current?.focus();

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onCloseRef.current();
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
				'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (!focusable?.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
			previouslyFocused?.focus();
		};
	}, []);

	const act = async (action: "cancel" | "received") => {
		setBusy(action);
		setError("");
		try {
			const updated = await api<ClientOrder>(`/api/orders/${order.id}/${action}`, { method: "POST" });
			const merged = { ...order, ...updated };
			setOrder(merged);
			onUpdated(merged);
			window.dispatchEvent(new Event("crisells-orders-change"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update this order.");
		} finally {
			setBusy(null);
			setConfirming(false);
		}
	};

	const canCancel = ["Pending", "Processing"].includes(order.status);
	const canReceive = order.status === "Shipped";
	const subtotal = order.subtotal ?? order.total;
	const rentalDays = order.items.reduce((max, item) => Math.max(max, item.days || 0), 0);

	// Portal to body, same as the camera preview: the dashboard's stacking context would trap a fixed overlay.
	return createPortal(
		<div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain scroll-smooth [-webkit-overflow-scrolling:touch] print:static print:overflow-visible">
			<div
				className="scrim-in fixed inset-0 bg-ground/70 backdrop-blur-xl print:hidden"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* my-auto centers the dialog when it fits and collapses to 0 when it is taller than the viewport. */}
			<div className="relative flex min-h-full justify-center p-4 sm:p-6 print:block print:min-h-0 print:p-0">
				<div
					ref={dialogRef}
					role="dialog"
					aria-modal="true"
					aria-labelledby="order-modal-title"
					className="print-receipt animate-scale-in relative z-10 my-auto w-full max-w-[900px] rounded-[30px] border border-white/[0.1] bg-white/[0.06] shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
				>
					<div className="flex items-center justify-between px-6 pt-5 sm:px-8 print:hidden">
						<button
							type="button"
							onClick={onClose}
							className="flex items-center gap-2 rounded-full text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden="true" />
							Back to orders
						</button>
						<button
							ref={closeRef}
							type="button"
							onClick={onClose}
							aria-label="Close order details"
							className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-ink/70 transition-colors hover:bg-white/15 hover:text-ink"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>

					<div className="px-6 pb-8 pt-4 sm:px-8">
						<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
							<div>
								<h2
									id="order-modal-title"
									className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[40px]"
								>
									{order.orderNumber}
								</h2>
								<p className="mt-2.5 text-[13px] text-ink/45">Placed {formatDate(order.createdAt)}</p>
							</div>
							<span
								className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 ring-inset ${
									statusTone[order.status] ?? "bg-white/10 text-ink/70 ring-white/10"
								}`}
							>
								<span
									className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status] ?? "bg-ink/40"}`}
									aria-hidden="true"
								/>
								{order.status}
							</span>
						</div>

						<div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px]">
							<div>
								<section>
									<h3 className={sectionLabel}>Items</h3>
									<ul className="mt-2 divide-y divide-white/[0.06]">
										{order.items.map((item, index) => {
											const image = item.productId ? images[item.productId] : null;
											const lineTotal = item.total ?? item.qty * item.pricePerDay * item.days;
											return (
												<li key={index} className="flex items-center gap-4 py-3.5">
													<div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
														{image ? (
															<img
																src={image}
																alt=""
																className="h-full w-full object-cover"
																loading="lazy"
																decoding="async"
															/>
														) : (
															<span className="grid h-full w-full place-items-center text-ink/25">
																<Camera className="h-4 w-4" aria-hidden="true" />
															</span>
														)}
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate text-[15px] font-medium text-ink">{item.name}</p>
														<p className="mt-1 text-[12.5px] text-ink/45">
															{formatDate(item.startDate)} – {formatDate(item.endDate)}
															<span className="text-ink/30"> · </span>
															{item.days} {item.days === 1 ? "day" : "days"}
															<span className="text-ink/30"> · </span>
															Qty {item.qty}
														</p>
													</div>
													<div className="flex-shrink-0 text-right">
														<p className="text-[15px] font-semibold tabular-nums text-ink">
															{formatMoney(lineTotal)}
														</p>
														<p className="mt-0.5 text-[11px] tabular-nums text-ink/40">
															{formatMoney(item.pricePerDay)}/day
														</p>
													</div>
												</li>
											);
										})}
									</ul>
								</section>

								<section className="mt-7">
									<h3 className={sectionLabel}>Details</h3>
									<dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-6">
										<div className="min-w-0 border-t border-white/[0.1] pt-3">
											<dt className="text-[11.5px] text-ink/45">Customer</dt>
											<dd className="mt-1 truncate text-[14.5px] font-semibold text-ink">
												{order.customer?.fullName || "—"}
											</dd>
										</div>
										<div className="min-w-0 border-t border-white/[0.1] pt-3">
											<dt className="text-[11.5px] text-ink/45">Phone</dt>
											<dd className="mt-1 truncate text-[14.5px] font-semibold text-ink">
												{order.customer?.phone || "—"}
											</dd>
										</div>
										<div className="min-w-0 border-t border-white/[0.1] pt-3">
											<dt className="text-[11.5px] text-ink/45">Email</dt>
											<dd className="mt-1 truncate text-[14.5px] font-semibold text-ink">
												{order.customer?.email || "—"}
											</dd>
										</div>
										<div className="min-w-0 border-t border-white/[0.1] pt-3">
											<dt className="text-[11.5px] text-ink/45">Fulfillment</dt>
											<dd className="mt-1 truncate text-[14.5px] font-semibold text-ink">
												{order.deliveryMode === "pickup" ? "Store pickup" : "Door delivery"}
											</dd>
										</div>
										{order.customer?.address && (
											<div className="col-span-2 min-w-0 border-t border-white/[0.1] pt-3">
												<dt className="text-[11.5px] text-ink/45">Address</dt>
												<dd className="mt-1 text-[14.5px] font-semibold leading-relaxed text-ink">
													{order.customer.address}
												</dd>
											</div>
										)}
									</dl>
								</section>
							</div>

							<aside className="flex flex-col gap-5">
								<section>
									<h3 className={sectionLabel}>Summary</h3>
									<dl className="mt-2 space-y-3.5 rounded-2xl bg-white/[0.045] p-6 text-[14px] ring-1 ring-inset ring-white/[0.06]">
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Items</dt>
											<dd className="tabular-nums font-medium text-ink">{order.items.length}</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Rental</dt>
											<dd className="font-medium text-ink">
												{rentalDays} {rentalDays === 1 ? "day" : "days"}
											</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Placed</dt>
											<dd className="font-medium text-ink">{formatDate(order.createdAt)}</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Fulfillment</dt>
											<dd className="font-medium text-ink">
												{order.deliveryMode === "pickup" ? "Store pickup" : "Door delivery"}
											</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Subtotal</dt>
											<dd className="tabular-nums font-medium text-ink">{formatMoney(subtotal)}</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4">
											<dt className="text-ink/45">Insurance</dt>
											<dd className="tabular-nums font-medium text-ink">
												{formatMoney(order.insurance ?? 0)}
											</dd>
										</div>
										<div className="flex items-baseline justify-between gap-4 border-t border-white/[0.08] pt-4">
											<dt className="text-[15px] font-medium text-ink">Total</dt>
											<dd className="text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-ink">
												{formatMoney(order.total)}
											</dd>
										</div>
									</dl>
								</section>

								<div className="mt-auto space-y-2.5">
									{error && (
										<p
											className="rounded-xl bg-red-500/15 px-4 py-2.5 text-[13px] text-red-200"
											role="alert"
										>
											{error}
										</p>
									)}

									{canCancel && (
										<button
											type="button"
											disabled={busy !== null}
											onClick={() => (confirming ? act("cancel") : setConfirming(true))}
											className={`flex h-11 w-full items-center justify-center rounded-[14px] px-5 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.99] disabled:opacity-50 motion-reduce:transition-none print:hidden ${
												confirming
													? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
													: "bg-white/[0.06] text-ink/60 hover:bg-white/[0.1] hover:text-ink"
											}`}
										>
											{busy === "cancel" ? "Cancelling…" : confirming ? "Confirm cancel" : "Cancel order"}
										</button>
									)}

									{canReceive && (
										<button
											type="button"
											disabled={busy !== null}
											onClick={() => act("received")}
											className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-5 text-[13px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100 print:hidden"
										>
											<Check className="h-4 w-4" aria-hidden="true" />
											{busy === "received" ? "Saving…" : "Order received"}
										</button>
									)}

									{!canCancel && !canReceive && (
										<button
											type="button"
											onClick={() => window.print()}
											className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-5 text-[13px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:scale-100 print:hidden"
										>
											<Printer className="h-4 w-4" aria-hidden="true" />
											Print invoice
										</button>
									)}
									{order.status === "Delivered" && (
										<p className="px-1 text-center text-[12px] leading-relaxed text-ink/40">
											Return the gear to the shop and your order will be completed.
										</p>
									)}
								</div>
							</aside>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
