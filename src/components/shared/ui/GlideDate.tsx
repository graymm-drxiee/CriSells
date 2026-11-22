import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const PANEL_WIDTH = 242;
const PANEL_HEIGHT = 300;

const pad = (n: number) => String(n).padStart(2, "0");

function parts(value: string) {
	const [y, m, d] = value.split("-").map(Number);
	if (!y || !m || !d) {
		const now = new Date();
		return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
	}
	return { y, m, d };
}

function formatLabel(value: string) {
	if (!value) return "Select date";
	const { y, m, d } = parts(value);
	return new Date(y, m - 1, d).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

interface GlideDateProps {
	value: string;
	min?: string;
	ariaLabel: string;
	align?: "left" | "right";
	onChange: (value: string) => void;
}

export default function GlideDate({
	value,
	min,
	ariaLabel,
	align = "left",
	onChange,
}: GlideDateProps) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"days" | "months">("days");
	const [pos, setPos] = useState({ top: 0, left: 0 });
	const [view, setView] = useState(() => {
		const { y, m } = parts(value);
		return { y, m };
	});
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const openPanel = () => {
		const rect = triggerRef.current?.getBoundingClientRect();
		if (!rect) return;
		const below = rect.bottom + 6;
		const rawLeft = align === "right" ? rect.right - PANEL_WIDTH : rect.left;
		setPos({
			top:
				below + PANEL_HEIGHT > window.innerHeight - 8
					? Math.max(8, rect.top - PANEL_HEIGHT - 6)
					: below,
			left: Math.min(
				Math.max(8, rawLeft),
				window.innerWidth - PANEL_WIDTH - 8,
			),
		});
		setMode("days");
		setOpen(true);
	};

	useEffect(() => {
		if (!open) return;
		const { y, m } = parts(value);
		setView({ y, m });
	}, [open, value]);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
			setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		const onScroll = () => setOpen(false);
		document.addEventListener("pointerdown", onDown, true);
		window.addEventListener("keydown", onKey);
		window.addEventListener("scroll", onScroll, true);
		return () => {
			document.removeEventListener("pointerdown", onDown, true);
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("scroll", onScroll, true);
		};
	}, [open]);

	const firstWeekday = new Date(view.y, view.m - 1, 1).getDay();
	const daysInMonth = new Date(view.y, view.m, 0).getDate();
	const selected = parts(value);
	const minParts = min ? parts(min) : null;
	const atMinMonth =
		!!minParts &&
		(view.y < minParts.y || (view.y === minParts.y && view.m <= minParts.m));

	const shift = (delta: number) => {
		const next = new Date(view.y, view.m - 1 + delta, 1);
		setView({ y: next.getFullYear(), m: next.getMonth() + 1 });
	};

	return (
		<div ref={rootRef} className="relative min-w-0 flex-1">
			<button
				ref={triggerRef}
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={ariaLabel}
				onClick={() => (open ? setOpen(false) : openPanel())}
				className="flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 text-[12px] font-medium text-ink outline-none transition-colors hover:bg-white/10 aria-expanded:bg-white/15"
			>
				<span className="truncate">{formatLabel(value)}</span>
				<svg
					viewBox="0 0 24 24"
					className={`h-3 w-3 shrink-0 text-ink/55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					strokeWidth={2.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M6 9l6 6 6-6" />
				</svg>
			</button>

			{open &&
				createPortal(
					<div
						ref={panelRef}
						role="dialog"
						aria-label={ariaLabel}
						style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
						className="date-pop fixed z-[120] origin-top-left rounded-[10px] bg-[#120c1c] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
					>
						<div className="mb-1 flex items-center justify-between px-0.5">
							<button
								type="button"
								aria-label={mode === "days" ? "Previous month" : "Previous year"}
								disabled={atMinMonth}
								onClick={() => shift(mode === "days" ? -1 : -12)}
								className="flex h-7 w-7 items-center justify-center rounded-md text-ink/70 transition-colors hover:bg-white/10 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
							>
								<svg
									viewBox="0 0 24 24"
									className="h-3.5 w-3.5"
									fill="none"
									stroke="currentColor"
									strokeWidth={2.2}
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M15 6l-6 6 6 6" />
								</svg>
							</button>
							<button
								type="button"
								onClick={() => setMode(mode === "days" ? "months" : "days")}
								aria-label={
									mode === "days" ? "Choose month and year" : "Back to calendar"
								}
								className="rounded-md px-2 py-1 text-[12px] font-semibold text-ink transition-colors hover:bg-white/10"
							>
								{mode === "days"
									? new Date(view.y, view.m - 1, 1).toLocaleDateString("en-US", {
											month: "long",
											year: "numeric",
										})
									: view.y}
							</button>
							<button
								type="button"
								aria-label={mode === "days" ? "Next month" : "Next year"}
								onClick={() => shift(mode === "days" ? 1 : 12)}
								className="flex h-7 w-7 items-center justify-center rounded-md text-ink/70 transition-colors hover:bg-white/10 hover:text-ink"
							>
								<svg
									viewBox="0 0 24 24"
									className="h-3.5 w-3.5"
									fill="none"
									stroke="currentColor"
									strokeWidth={2.2}
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M9 6l6 6-6 6" />
								</svg>
							</button>
						</div>

						{mode === "months" ? (
							<div className="grid grid-cols-3 gap-1">
								{Array.from({ length: 12 }).map((_, i) => {
									const isCurrent = view.m === i + 1;
									return (
										<button
											key={i}
											type="button"
											aria-pressed={isCurrent}
											onClick={() => {
												setView({ y: view.y, m: i + 1 });
												setMode("days");
											}}
											className={`flex h-8 items-center justify-center rounded-md text-[12px] font-medium transition-colors ${
												isCurrent
													? "bg-white text-ground"
													: "text-ink/85 hover:bg-white/10 hover:text-ink"
											}`}
										>
											{new Date(2026, i, 1).toLocaleDateString("en-US", {
												month: "short",
											})}
										</button>
									);
								})}
							</div>
						) : (
							<div className="grid grid-cols-7 gap-px">
							{WEEKDAYS.map((day, i) => (
								<span
									key={i}
									className="flex h-6 items-center justify-center text-[10px] font-semibold uppercase text-ink/40"
								>
									{day}
								</span>
							))}
							{Array.from({ length: firstWeekday }).map((_, i) => (
								<span key={`pad-${i}`} />
							))}
							{Array.from({ length: daysInMonth }).map((_, i) => {
								const day = i + 1;
								const iso = `${view.y}-${pad(view.m)}-${pad(day)}`;
								const isSelected =
									selected.y === view.y &&
									selected.m === view.m &&
									selected.d === day;
								const disabled = !!min && iso < min;
								return (
									<button
										key={day}
										type="button"
										disabled={disabled}
										aria-pressed={isSelected}
										onClick={() => {
											onChange(iso);
											setOpen(false);
										}}
										className={`flex h-7 items-center justify-center rounded-md text-[12px] font-medium transition-colors ${
											isSelected
												? "bg-white text-ground"
												: "text-ink/85 hover:bg-white/10 hover:text-ink"
										} disabled:pointer-events-none disabled:opacity-25`}
									>
										{day}
									</button>
								);
							})}
							</div>
						)}
					</div>,
					document.body,
				)}
		</div>
	);
}
