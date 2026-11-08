import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import GlideSelect from "../React Bits Components/ui/GlideSelect";
import AnimatedContent from "../React Bits Components/animation/AnimatedContent";
import CameraCard from "../CameraCard";
import CameraDetail from "../CameraDetail";
import { categories } from "../../data";
import { api } from "../../api";
import { useSite } from "../SiteShell";
import type { Camera } from "../../types";

export default function ClientCatalog({
	onAddToCart,
}: {
	onAddToCart: (camera: Camera) => void;
}) {
	const { user, openLogin } = useSite();
	const [cameras, setCameras] = useState<Camera[]>([]);
	const [loadError, setLoadError] = useState("");
	const [activeCategory, setActiveCategory] = useState<"All" | Camera["category"]>("All");
	const [sortBy, setSortBy] = useState("featured");
	const [selected, setSelected] = useState<Camera | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		api<Camera[]>("/api/products", { signal: controller.signal })
			.then(setCameras)
			.catch((err) => {
				if (err.name !== "AbortError") setLoadError(err.message);
			});
		return () => controller.abort();
	}, []);

	const sortOptions = [
		{ value: "featured", label: "Featured" },
		{ value: "price-low", label: "Price: Low to High" },
		{ value: "price-high", label: "Price: High to Low" },
		{ value: "rating", label: "Top Rated" },
	];

	const filteredCameras = useMemo(() => {
		let result = [...cameras];

		if (activeCategory !== "All") {
			result = result.filter((c) => c.category === activeCategory);
		}

		switch (sortBy) {
			case "price-low":
				result.sort((a, b) => a.pricePerDay - b.pricePerDay);
				break;
			case "price-high":
				result.sort((a, b) => b.pricePerDay - a.pricePerDay);
				break;
			case "rating":
				result.sort((a, b) => b.rating - a.rating);
				break;
			default:
				result.sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0));
		}

		return result;
	}, [cameras, activeCategory, sortBy]);

	const counts = useMemo(() => {
		const map: Record<string, number> = { All: cameras.length };
		for (const camera of cameras) map[camera.category] = (map[camera.category] ?? 0) + 1;
		return map;
	}, [cameras]);

	const filtered = activeCategory !== "All" || sortBy !== "featured";

	return (
		<section
			id="catalog"
			className="relative scroll-mt-32 px-6 pb-24 pt-10 sm:px-10 sm:pb-32 sm:pt-14"
		>
			<div className="mx-auto max-w-[1320px]">
				{/* Header */}
				<AnimatedContent
					distance={40}
					direction="vertical"
					duration={0.7}
					ease="power3.out"
					stagger={0.06}
					threshold={0.15}
				>
					<div className="mb-10 flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-4xl font-semibold tracking-[-0.035em] text-ink sm:text-[52px] sm:leading-[1.02]">
								Find your camera.
							</h2>
							<p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">
								Every body inspected, cleaned, and calibrated before it reaches you.
							</p>
						</div>
						<p className="shrink-0 text-[13px] text-ink/45">
							<span className="font-semibold text-ink/80">{filteredCameras.length}</span>
							{" of "}
							{cameras.length} {cameras.length === 1 ? "body" : "bodies"}
							{activeCategory !== "All" && ` · ${activeCategory}`}
						</p>
					</div>
				</AnimatedContent>

				{/* Toolbar */}
				<AnimatedContent
					distance={24}
					direction="vertical"
					duration={0.4}
					ease="power3.out"
					threshold={0.15}
				>
					<div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:rounded-[22px] sm:border sm:border-white/[0.06] sm:bg-white/[0.04] sm:p-2">
						<div className="grid auto-cols-[calc((100%-1.5rem)/4)] grid-flow-col gap-2 overflow-x-auto [scrollbar-width:none] sm:flex sm:flex-1 sm:flex-wrap sm:gap-1.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
							{categories.map((cat) => {
								const active = activeCategory === cat.value;
								return (
									<button
										key={cat.value}
										type="button"
										onClick={() => setActiveCategory(cat.value)}
										aria-pressed={active}
										className={`flex min-w-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-2 py-2 text-[clamp(8.5px,2.9vw,12px)] font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.98] sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-[13px] ${
											active
												? "bg-ink text-ground shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
												: "text-ink/60 ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.07] hover:text-ink sm:ring-0"
										}`}
									>
										{cat.label}
										<span className={`hidden text-[10px] tabular-nums sm:inline sm:text-[11px] ${active ? "text-ground/50" : "text-ink/35"}`}>
											{counts[cat.value] ?? 0}
										</span>
									</button>
								);
							})}
						</div>

						<div className="hidden shrink-0 items-center justify-end gap-2 sm:flex sm:py-0 sm:pl-2.5">
							<span className="pl-1 text-[12px] text-ink/45">Sort</span>
							<GlideSelect
								options={sortOptions}
								value={sortBy}
								onChange={setSortBy}
								ariaLabel="Sort cameras"
								showTags={false}
								accentColor="#f7f3ff"
								surfaceColor="rgba(0, 0, 0, 0.95)"
								highlightColor="rgba(255, 255, 255, 0.1)"
								textColor="#f7f3ff"
								size="sm"
								radius={12}
								menuWidth={190}
								placement="bottom"
								align="right"
								popDuration={160}
								glideDuration={200}
								rememberPosition
								className="[&_button]:!bg-transparent [&_button:hover]:!bg-white/5 [&_button[aria-expanded='true']]:!bg-white/10"
							/>
						</div>
					</div>
				</AnimatedContent>

				{/* Camera Grid */}
				<AnimatedContent
					key={`${activeCategory}-${sortBy}`}
					trigger="mount"
					className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
					distance={16}
					direction="vertical"
					duration={0.35}
					ease="power3.out"
					stagger={0}
					threshold={0.1}
				>
					{filteredCameras.map((camera) => (
						<CameraCard
							key={camera.id}
							camera={camera}
							onOpen={() => setSelected(camera)}
							onAction={() => (user ? onAddToCart(camera) : openLogin())}
							actionLabel={user ? "Add" : "Sign in"}
							arrow={!user || !camera.available}
							disabled={!camera.available}
						/>
					))}
				</AnimatedContent>

				{/* Empty state */}
				{loadError ? (
					<div className="py-20 text-center">
						<p className="text-[15px] text-ink/55">Couldn&rsquo;t load the catalog: {loadError}</p>
					</div>
				) : filteredCameras.length === 0 && (
					<div className="flex flex-col items-center gap-4 py-20 text-center">
						<p className="text-[15px] text-ink/55">
							{cameras.length === 0
								? "Loading the catalog…"
								: activeCategory === "All"
									? "No cameras found."
									: `No cameras in ${activeCategory}.`}
						</p>
						{filtered && cameras.length > 0 && (
							<button
								type="button"
								onClick={() => {
									setActiveCategory("All");
									setSortBy("featured");
								}}
								className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-4 py-2 text-[13px] font-medium text-ink/80 transition-colors hover:bg-white/15 hover:text-ink"
							>
								<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
								Show all cameras
							</button>
						)}
					</div>
				)}
			</div>

			{selected && (
				<CameraDetail
					camera={selected}
					signedIn={!!user}
					viewOnly={false}
					onClose={() => setSelected(null)}
					onAddToCart={(camera) => {
						setSelected(null);
						if (!user) openLogin();
						else onAddToCart(camera);
					}}
				/>
			)}
		</section>
	);
}
