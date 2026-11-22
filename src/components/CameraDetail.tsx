import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayPause } from "../hooks/useOverlayPause";
import type { Camera } from "../lib/types";

const specLabels: Record<keyof Camera["specs"], string> = {
	sensor: "Sensor",
	resolution: "Resolution",
	video: "Video",
	weight: "Weight",
	mount: "Mount",
	battery: "Battery",
};

interface CameraDetailProps {
	camera: Camera;
	signedIn: boolean;
	viewOnly: boolean;
	onClose: () => void;
	onAddToCart: (camera: Camera) => void;
}

export default function CameraDetail({
	camera,
	signedIn,
	viewOnly,
	onClose,
	onAddToCart,
}: CameraDetailProps) {
	useOverlayPause();
	const [activeImage, setActiveImage] = useState(0);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
		};
	}, [onClose]);

	const primaryLabel = viewOnly
		? signedIn
			? "View"
			: "Sign in to rent"
		: signedIn
			? camera.available
				? "Add to cart"
				: "Unavailable"
			: "Sign in to rent";

	// Portal to body: ancestors like the dashboard's `relative z-10` wrapper would
	// otherwise trap this fixed overlay under the navbar's stacking context.
	return createPortal(
		<div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain scroll-smooth [-webkit-overflow-scrolling:touch]">
			<div
				className="fixed inset-0 bg-ground/70 backdrop-blur-xl"
				onClick={onClose}
				aria-hidden="true"
			/>

			<div className="relative flex min-h-full items-start justify-center sm:p-6">
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="camera-detail-title"
					className="relative z-10 min-h-[100dvh] w-full max-w-[1050px] bg-[color-mix(in_srgb,var(--color-ground),white_7%)] pb-[env(safe-area-inset-bottom)] sm:min-h-0 sm:rounded-[32px] sm:border sm:border-white/[0.12] sm:bg-white/[0.07] sm:pb-0 sm:shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:backdrop-blur-2xl"
				>
					<div className="sticky top-0 z-20 flex items-center justify-between bg-[color-mix(in_srgb,var(--color-ground),white_7%)] px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:static sm:bg-transparent sm:px-8 sm:pb-4 sm:pt-5 sm:backdrop-blur-none">
						<button
							type="button"
							onClick={onClose}
							className="flex min-h-11 items-center gap-2 rounded-full pr-2 text-[13px] font-medium text-ink/70 transition-colors hover:text-ink"
						>
							<svg
								viewBox="0 0 24 24"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M19 12H5M11 18l-6-6 6-6" />
							</svg>
							Back to catalog
						</button>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-ink/70 transition-colors hover:bg-white/15 hover:text-ink"
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

					<div className="grid gap-6 px-5 pb-10 pt-6 sm:gap-8 sm:px-8 sm:pb-8 sm:pt-0 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
						<div className="flex flex-col gap-3">
							<div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-black/20 sm:aspect-square sm:rounded-[20px]">
								<img
									src={camera.gallery[activeImage]}
									alt={camera.name}
									className="absolute inset-0 h-full w-full object-cover"
								/>
								{camera.tag && (
									<span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
										{camera.tag}
									</span>
								)}
							</div>

							{camera.gallery.length > 1 && (
								<div className="flex gap-2.5">
									{camera.gallery.map((img, index) => (
										<button
											key={img}
											type="button"
											onClick={() => setActiveImage(index)}
											aria-label={`View image ${index + 1}`}
											aria-current={activeImage === index}
											className={`relative h-14 w-14 overflow-hidden rounded-[12px] transition-opacity duration-200 sm:h-16 sm:w-16 ${
												activeImage === index
													? "opacity-100 ring-2 ring-ink/80"
													: "opacity-45 hover:opacity-80"
											}`}
										>
											<img src={img} alt="" className="h-full w-full object-cover" />
										</button>
									))}
								</div>
							)}
						</div>

						<div className="flex flex-col">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">
								{camera.brand} · {camera.category}
							</p>
							<h2
								id="camera-detail-title"
								className="mt-2 text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[40px] sm:leading-[1.05]"
							>
								{camera.name}
							</h2>
							{camera.sku && (
								<p className="mt-2 font-mono text-[12px] tracking-wide text-ink/40">
									{camera.sku}
								</p>
							)}

							<div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
								<span className="flex items-center gap-1.5">
									<svg
										className="h-3.5 w-3.5 fill-amber-300"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
									</svg>
									<span className="font-semibold text-ink">{camera.rating}</span>
								</span>
								<span className="text-ink/50">{camera.reviews} reviews</span>
								<span className="h-3 w-px bg-white/15" aria-hidden="true" />
								<span
									className={`font-medium ${
										camera.available ? "text-emerald-400" : "text-ink/50"
									}`}
								>
									{camera.available ? "Available now" : "Currently rented"}
								</span>
							</div>

							<p className="mt-5 text-[15px] leading-[1.65] text-ink/70">
								{camera.description}
							</p>

							<div className="mt-8">
								<h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
									Specifications
								</h3>
								<dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:gap-x-8 sm:gap-y-5">
									{(Object.keys(specLabels) as (keyof Camera["specs"])[]).map(
										(key) => (
											<div
												key={key}
												className="border-t border-white/[0.08] pt-3"
											>
												<dt className="text-[11px] text-ink/45">
													{specLabels[key]}
												</dt>
												<dd className="mt-0.5 truncate text-[14px] font-semibold text-ink">
													{camera.specs[key]}
												</dd>
											</div>
										),
									)}
								</dl>
							</div>

							<div className="mt-8">
								<h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
									What&rsquo;s included
								</h3>
								<ul className="mt-3 grid gap-y-2.5 sm:grid-cols-2 sm:gap-x-6">
									{camera.features.map((feature) => (
										<li
											key={feature}
											className="flex items-center gap-2 text-[13px] text-ink/75"
										>
											<svg
												viewBox="0 0 24 24"
												className="h-3.5 w-3.5 shrink-0 text-emerald-400"
												fill="none"
												stroke="currentColor"
												strokeWidth={2.4}
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<path d="M5 13l4 4L19 7" />
											</svg>
											{feature}
										</li>
									))}
								</ul>
							</div>

							<div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
								<div>
									<p className="text-[12px] text-ink/50">Starting from</p>
									<p className="mt-0.5 flex items-baseline gap-1.5">
										<span className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
											${camera.pricePerDay}
										</span>
										<span className="text-[13px] text-ink/50">per day</span>
									</p>
								</div>
								<button
									type="button"
									disabled={!viewOnly && !camera.available}
									onClick={() => onAddToCart(camera)}
									className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-auto sm:text-[14px] motion-reduce:transition-none motion-reduce:hover:scale-100"
								>
									{!viewOnly && (
										<svg
											viewBox="0 0 24 24"
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											strokeWidth={2}
											strokeLinecap="round"
											strokeLinejoin="round"
											aria-hidden="true"
										>
											<circle cx="9" cy="20" r="1.5" />
											<circle cx="18" cy="20" r="1.5" />
											<path d="M3 4h2l2.7 10.4a2 2 0 0 0 1.9 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6" />
										</svg>
									)}
									{primaryLabel}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
