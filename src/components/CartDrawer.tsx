import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlideSelect from "./React Bits Components/ui/GlideSelect";
import GlideDate from "./React Bits Components/ui/GlideDate";
import { useOverlayPause } from "../useOverlayPause";
import type { CartItem, CheckoutDetails } from "../types";

function todayStr(): string {
	return new Date().toISOString().split("T")[0];
}

interface CartDrawerProps {
	items: CartItem[];
	defaultName: string;
	defaultEmail: string;
	defaultPhone: string;
	defaultAddress: string;
	onClose: () => void;
	onRemove: (id: string) => void;
	onUpdateDates: (id: string, startDate: string, endDate: string) => void;
	onCheckout: (details: CheckoutDetails) => Promise<string>;
}

export default function CartDrawer({
	items,
	defaultName,
	defaultEmail,
	defaultPhone,
	defaultAddress,
	onClose,
	onRemove,
	onUpdateDates,
	onCheckout,
}: CartDrawerProps) {
	useOverlayPause();
	const [view, setView] = useState<"cart" | "checkout" | "confirmed">("cart");
	const [closing, setClosing] = useState(false);
	const [removing, setRemoving] = useState<string[]>([]);
	const [orderNumber, setOrderNumber] = useState("");

	const removeItem = (id: string) => {
		setRemoving((prev) => [...prev, id]);
		setTimeout(() => onRemove(id), 300);
	};

	const requestClose = useCallback(() => {
		setClosing(true);
		setTimeout(onClose, 260);
	}, [onClose]);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") requestClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
		};
	}, [requestClose]);

	const subtotal = items.reduce((sum, item) => sum + item.total, 0);
	const insurance = Math.round(subtotal * 0.08);
	const total = subtotal + insurance;

	return (
		<div className="fixed inset-0 z-[70]">
			<div
				className={`${closing ? "scrim-out" : "scrim-in"} absolute inset-0 bg-ground/70 backdrop-blur-xl`}
				onClick={requestClose}
				aria-hidden="true"
			/>

			<aside
				aria-label="Cart"
				className={`${closing ? "drawer-out" : "drawer-in"} absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-[color-mix(in_srgb,var(--color-ground),white_7%)] pb-[env(safe-area-inset-bottom)] shadow-[-30px_0_80px_rgba(0,0,0,0.5)] lg:border-l lg:border-white/10 lg:bg-ground/85 lg:backdrop-blur-2xl`}
			>
				<div className="z-10 flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[color-mix(in_srgb,var(--color-ground),white_7%)] px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:border-white/10 lg:bg-ground/80 lg:px-6 lg:py-5 lg:backdrop-blur-xl">
					<div className="flex items-center gap-2.5">
						<svg
							viewBox="0 0 24 24"
							className="h-5 w-5 text-ink"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.8}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M6 8h12l-1 12H7z" />
							<path d="M9 8V6a3 3 0 0 1 6 0v2" />
						</svg>
						<span className="text-lg font-semibold tracking-tight text-ink">Your cart</span>
						<span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-[12px] font-semibold text-ink/80">
							{items.length}
						</span>
					</div>
					<button
						type="button"
						onClick={requestClose}
						aria-label="Close cart"
						className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink/80 transition-colors hover:bg-white/20 hover:text-ink"
					>
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							aria-hidden="true"
						>
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				</div>

				{/* Only the content scrolls: a short view (e.g. pickup) must not bounce the whole panel. */}
				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
				{view === "confirmed" ? (
					<div className="confirm-in flex flex-col items-center px-6 py-28 text-center">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/20">
							<svg
								viewBox="0 0 24 24"
								className="h-9 w-9 text-[#10b981]"
								fill="none"
								stroke="currentColor"
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h3 className="mt-7 text-2xl font-semibold tracking-tight text-ink">
							Reservation confirmed
						</h3>
						<span className="mt-3 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[13px] font-semibold text-ink">
							{orderNumber}
						</span>
						<p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink/70">
							Your gear will be prepped and ready on your chosen date. Pay at pickup
							&mdash; no charge has been made.
						</p>
						<button
							type="button"
							onClick={requestClose}
							className="mt-8 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.03] active:scale-95"
						>
							Done
						</button>
						<Link
							to="/account"
							onClick={requestClose}
							className="mt-3 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
						>
							View my rentals
						</Link>
					</div>
				) : view === "checkout" ? (
					<CheckoutView
						total={total}
						defaultName={defaultName}
						defaultEmail={defaultEmail}
						defaultPhone={defaultPhone}
						defaultAddress={defaultAddress}
						onConfirm={async (details) => {
							const number = await onCheckout(details);
							setOrderNumber(number);
							setView("confirmed");
						}}
					/>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center px-6 py-28 text-center">
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
							<svg
								viewBox="0 0 24 24"
								className="h-8 w-8 text-ink/40"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.4}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M6 8h12l-1 12H7z" />
								<path d="M9 8V6a3 3 0 0 1 6 0v2" />
							</svg>
						</div>
						<h3 className="mt-6 text-lg font-semibold text-ink">Your cart is empty</h3>
						<p className="mt-2 max-w-xs text-[14px] leading-relaxed text-ink/70">
							Browse the catalog and add a camera to start your rental.
						</p>
						<button
							type="button"
							onClick={requestClose}
							className="mt-8 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.03] active:scale-95"
						>
							Browse the catalog
						</button>
					</div>
				) : (
					<>
						<div className="space-y-4 px-6 py-6">
							{items.map((item) => {
								const isRemoving = removing.includes(item.camera.id);
								return (
									<div
										key={item.camera.id}
										className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
											isRemoving
												? "pointer-events-none grid-rows-[0fr] opacity-0"
												: "grid-rows-[1fr] opacity-100"
										}`}
									>
										<div className="overflow-hidden">
											<CartLine
												item={item}
												onRemove={() => removeItem(item.camera.id)}
												onUpdateDates={(start, end) =>
													onUpdateDates(item.camera.id, start, end)
												}
											/>
										</div>
									</div>
								);
							})}
						</div>

						<div className="border-t border-white/10 px-6 py-6">
							<div className="space-y-3">
								<Row label="Subtotal" value={`$${subtotal}`} />
								<Row label="Damage protection (8%)" value={`$${insurance}`} />
								<div className="h-px bg-white/10" />
								<div className="flex items-center justify-between">
									<span className="text-lg font-semibold text-ink">Total</span>
									<span className="text-2xl font-bold tracking-tight text-ink">
										${total}
									</span>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setView("checkout")}
								className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-[15px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95"
							>
								Reserve now
								<svg
									viewBox="0 0 24 24"
									className="h-4 w-4 transition-transform group-hover:translate-x-1"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14M13 6l6 6-6 6" />
								</svg>
							</button>
							<p className="mt-3 text-center text-[12px] text-ink/55">
								Free cancellation up to 48 hours before pickup.
							</p>
						</div>
					</>
				)}
			</div>
			</aside>
		</div>
	);
}

function CartLine({
	item,
	onRemove,
	onUpdateDates,
}: {
	item: CartItem;
	onRemove: () => void;
	onUpdateDates: (start: string, end: string) => void;
}) {
	const [start, setStart] = useState(item.startDate);
	const [end, setEnd] = useState(item.endDate);

	return (
		<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
			<div className="flex items-start gap-4">
				<img
					src={item.camera.image}
					alt={item.camera.name}
					className="h-20 w-20 shrink-0 rounded-xl object-cover"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h4 className="truncate text-[14px] font-semibold text-ink">
								{item.camera.name}
							</h4>
							<p className="text-[12px] text-ink/60">
								{item.camera.brand} · ${item.camera.pricePerDay}/day
							</p>
						</div>
						<button
							type="button"
							onClick={onRemove}
							aria-label={`Remove ${item.camera.name} from cart`}
							className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-red-500/15 hover:text-red-300"
						>
							<svg
								viewBox="0 0 24 24"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.8}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
							</svg>
						</button>
					</div>

					<div className="mt-3 flex items-center gap-2">
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4 shrink-0 text-ink/50"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.8}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<rect x="3" y="5" width="18" height="16" rx="2" />
							<path d="M3 10h18M8 3v4M16 3v4" />
						</svg>
						<div className="flex min-w-0 flex-1 gap-2">
							<GlideDate
								value={start}
								min={todayStr()}
								ariaLabel={`${item.camera.name} start date`}
								onChange={(value) => {
									setStart(value);
									onUpdateDates(value, end);
								}}
							/>
							<GlideDate
								value={end}
								min={start}
								align="right"
								ariaLabel={`${item.camera.name} end date`}
								onChange={(value) => {
									setEnd(value);
									onUpdateDates(start, value);
								}}
							/>
						</div>
					</div>

					<div className="mt-3 flex items-center justify-between">
						<span className="text-[12px] text-ink/60">
							{item.days || 0} {item.days === 1 ? "day" : "days"}
						</span>
						<span className="text-[15px] font-bold text-ink">${item.total}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-[14px] text-ink/70">{label}</span>
			<span className="text-[14px] font-semibold text-ink">{value}</span>
		</div>
	);
}

function CheckoutView({
	total,
	defaultName,
	defaultEmail,
	defaultPhone,
	defaultAddress,
	onConfirm,
}: {
	total: number;
	defaultName: string;
	defaultEmail: string;
	defaultPhone: string;
	defaultAddress: string;
	onConfirm: (details: CheckoutDetails) => Promise<void>;
}) {
	const [deliveryMode, setDeliveryMode] = useState("door-delivery");
	const [address, setAddress] = useState(
		() => defaultAddress || localStorage.getItem("crisells-last-address") || "",
	);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				const form = new FormData(e.currentTarget);
				setError("");
				setPending(true);
				try {
					await onConfirm({
						customer: {
							fullName: String(form.get("name") || ""),
							email: String(form.get("email") || ""),
							phone: String(form.get("phone") || ""),
							address: deliveryMode === "pickup" ? "" : address,
						},
						deliveryMode,
					});
					if (deliveryMode !== "pickup" && address.trim()) {
						localStorage.setItem("crisells-last-address", address.trim());
					}
				} catch (err) {
					setError(err instanceof Error ? err.message : "Could not place the reservation.");
				} finally {
					setPending(false);
				}
			}}
			className="px-6 py-6"
		>
			<h3 className="text-xl font-semibold tracking-tight text-ink">Checkout</h3>
			<p className="mt-1 text-[13px] text-ink/60">
				Enter your details to confirm the reservation.
			</p>

			<div className="mt-6 space-y-4">
				<Field label="Full name" placeholder="Jane Doe" name="name" autoComplete="name" defaultValue={defaultName} />
				<Field
					label="Email"
					placeholder="jane@example.com"
					type="email"
					name="email"
					autoComplete="email"
					defaultValue={defaultEmail}
				/>
				<Field
					label="Phone"
					placeholder="+1 555 123 4567"
					type="tel"
					inputMode="tel"
					name="phone"
					autoComplete="tel"
					defaultValue={defaultPhone}
				/>

				{deliveryMode !== "pickup" && (
					<Field
						label="Delivery address"
						placeholder="House no, street, barangay, city"
						name="address"
						autoComplete="street-address"
						value={address}
						onChange={setAddress}
					/>
				)}

				<div>
					<span className="text-[13px] font-medium text-ink/80">Delivery or pickup?</span>
					<div className="mt-2">
						<GlideSelect
							options={[
								{ value: "door-delivery", label: "Door delivery" },
								{ value: "pickup", label: "In-store pickup" },
							]}
							value={deliveryMode}
							onChange={(value) => setDeliveryMode(value)}
							ariaLabel="Delivery method"
							showTags={false}
							accentColor="#f7f3ff"
							surfaceColor="rgba(0, 0, 0, 0.95)"
							highlightColor="rgba(255, 255, 255, 0.22)"
							textColor="#f7f3ff"
							size="md"
							radius={10}
							menuWidth={220}
							placement="bottom"
							align="left"
							popDuration={180}
							glideDuration={220}
							rememberPosition
							className="w-full [&>button]:w-full [&>button]:justify-between [&>button]:border [&>button]:border-white/15 [&>button]:!bg-white/10 [&>button:hover]:!bg-white/15 [&>button[aria-expanded=true]]:!bg-white/20 [&>button]:px-4 [&>button]:py-3 [&>button]:text-[14px] [&>button]:text-ink"
						/>
					</div>
				</div>
			</div>

			<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
				<div className="flex items-center justify-between">
					<span className="text-[14px] text-ink/80">Total to pay</span>
					<span className="text-2xl font-bold tracking-tight text-ink">${total}</span>
				</div>
				<p className="mt-1 text-[12px] text-ink/55">Pay at pickup. No charge now.</p>
			</div>

			{error && (
				<p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-[13px] text-red-300" role="alert">
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={pending}
				className="mt-6 w-full rounded-full bg-white py-4 text-[15px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{pending ? "Reserving…" : "Confirm reservation"}
			</button>
		</form>
	);
}

function Field({
	label,
	placeholder,
	type = "text",
	inputMode,
	name,
	autoComplete,
	defaultValue,
	value,
	onChange,
}: {
	label: string;
	placeholder: string;
	type?: string;
	inputMode?: "tel" | "email" | "text" | "numeric";
	name: string;
	autoComplete?: string;
	defaultValue?: string;
	value?: string;
	onChange?: (value: string) => void;
}) {
	return (
		<div>
			<label htmlFor={`checkout-${name}`} className="text-[13px] font-medium text-ink/80">
				{label}
			</label>
			<input
				id={`checkout-${name}`}
				name={name}
				type={type}
				inputMode={inputMode}
				required
				autoComplete={autoComplete}
				value={onChange ? value : undefined}
				defaultValue={onChange ? undefined : defaultValue}
				onChange={onChange ? (e) => onChange(e.target.value) : undefined}
				placeholder={placeholder}
				className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink/35 focus:border-white/30 sm:text-[14px]"
			/>
		</div>
	);
}
