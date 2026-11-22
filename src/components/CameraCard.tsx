import { ArrowUpRight, Star } from "lucide-react";
import type { Camera } from "../lib/types";

// One card for both catalogs so the home and member views can't drift apart.
export default function CameraCard({
	camera,
	onOpen,
	onAction,
	actionLabel,
	arrow = false,
	disabled = false,
}: {
	camera: Camera;
	onOpen: () => void;
	onAction: () => void;
	actionLabel: string;
	arrow?: boolean;
	disabled?: boolean;
}) {
	return (
		<article className="group relative flex flex-col overflow-hidden rounded-[20px] bg-white/[0.045] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:bg-white/[0.07] focus-within:bg-white/[0.07] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-[24px]">
			<div className="relative aspect-[4/3] overflow-hidden bg-white/[0.04]">
				<img
					src={camera.image}
					srcSet={`${camera.image.replace("h=650&w=940", "w=480")} 480w, ${camera.image} 940w`}
					sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
					alt={camera.name}
					className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
					loading="lazy"
					decoding="async"
				/>
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10"
					aria-hidden="true"
				/>
				{camera.tag && (
					<span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/90 ring-1 ring-inset ring-white/15 sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
						{camera.tag}
					</span>
				)}
				<span className="absolute bottom-1.5 left-1.5 flex shrink-0 items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9.5px] font-medium text-white/85 ring-1 ring-inset ring-white/15 sm:bottom-auto sm:left-auto sm:right-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
					<span
						className={`h-1.5 w-1.5 rounded-full ${camera.available ? "bg-emerald-400" : "bg-white/40"}`}
						aria-hidden="true"
					/>
					{camera.available ? "Available" : "Rented"}
				</span>
			</div>

			<div className="flex flex-1 flex-col p-3 sm:p-5">
				<div className="flex items-center justify-between gap-2 sm:mb-2 sm:gap-3">
					<span className="truncate text-[11px] text-ink/50 sm:text-[12px]">
						{camera.brand} · {camera.category}
					</span>
					<span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-ink/45 sm:text-[12px]">
						<Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300 sm:h-3 sm:w-3" aria-hidden="true" />
						{camera.rating}
						<span className="hidden text-ink/30 sm:inline">({camera.reviews})</span>
					</span>
				</div>

				<h3 className="mt-1 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink sm:mb-2 sm:mt-0 sm:text-[17px]">
					<button
						type="button"
						onClick={onOpen}
						className="line-clamp-2 text-left after:absolute after:inset-0 after:z-0 after:rounded-[20px] after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink/70 sm:rounded-[24px]"
					>
						{camera.name}
					</button>
				</h3>

				<p className="mb-5 hidden line-clamp-2 text-[14px] leading-relaxed text-ink/55 sm:block">
					{camera.description}
				</p>

				<div className="mt-auto pt-2.5 sm:flex sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
					<div className="text-[17px] font-semibold tracking-[-0.02em] text-ink sm:text-[24px]">
						${camera.pricePerDay}
						<span className="text-[10px] font-normal text-ink/40 sm:text-[12px]">/day</span>
					</div>
					<button
						type="button"
						disabled={disabled}
						onClick={onAction}
						className="relative z-10 mt-2.5 flex min-h-11 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-[12px] font-semibold text-ground transition-[background-color,transform] duration-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ink/40 disabled:ring-1 disabled:ring-inset disabled:ring-white/10 sm:mt-0 sm:min-h-0 sm:w-auto sm:py-2.5 sm:text-[12.5px]"
					>
						{actionLabel}
						{arrow && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
					</button>
				</div>
			</div>
		</article>
	);
}
