import InfiniteSpiral from "./shared/animation/InfiniteSpiral";
import AnimatedContent from "./shared/animation/AnimatedContent";

const spiralItems = [
	{ src: "/photos/spiral-1.jpg", alt: "Mount Cook at sunset" },
	{ src: "/photos/spiral-2.jpg", alt: "Urban night underpass" },
	{ src: "/photos/spiral-3.jpg", alt: "Mountain silhouette" },
	{ src: "/photos/spiral-4.jpg", alt: "Dramatic studio light" },
	{ src: "/photos/spiral-5.jpg", alt: "Hong Kong night taxi" },
	{ src: "/photos/spiral-6.jpg", alt: "Behind the scenes studio" },
	{ src: "/photos/spiral-7.jpg", alt: "Studio portrait" },
	{ src: "/photos/spiral-8.jpg", alt: "Low-key portrait" },
];

export default function Hero({ paused = false }: { paused?: boolean }) {
	return (
		<section
			id="top"
			className="flex min-h-[100dvh] items-center px-8 pb-20 pt-32 sm:px-12 lg:px-16 lg:pt-36"
		>
			<div className="mx-auto grid w-full max-w-[1280px] items-center gap-16 sm:gap-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-32">
				<AnimatedContent
					distance={100}
					direction="vertical"
					duration={0.8}
					ease="power3.out"
					stagger={0.08}
					threshold={0.1}
				>
					<div className="rounded-[32px] border border-white/10 bg-white/[0.045] p-10 sm:p-12 [text-shadow:0_2px_24px_rgba(8,0,24,0.5)]">
						<h1 className="text-[clamp(2.35rem,6.4vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-balance">
							Rent the gear.
							<br />
							Shoot the impossible.
						</h1>

						<p className="mt-10 max-w-md text-[17px] leading-relaxed text-ink/85">
							Cinema-grade cameras, drones, and vintage film bodies.
							Meticulously maintained, delivered to your door.
						</p>

						<div className="mt-12">
							<a
								href="#catalog"
								className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 text-[15px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95"
							>
								Browse the catalog
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
							</a>
						</div>
					</div>
				</AnimatedContent>

				<AnimatedContent
					distance={100}
					direction="vertical"
					duration={0.8}
					ease="power3.out"
					delay={0.2}
					threshold={0.1}
				>
					<figure className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
						<InfiniteSpiral
							paused={paused}
							items={spiralItems}
							animationMode="auto"
							speed={0.55}
							radius={200}
							cardWidth={140}
							cardHeight={105}
							verticalSpacing={84}
							perspective={1000}
							cardRadius={12}
							centerScale={1.25}
							cardsPerTurn={7}
							pauseOnHover={false}
							direction="up"
							edgeFade={0.3}
							imageFit="cover"
							grayscale={0}
						/>
					</figure>
				</AnimatedContent>
			</div>
		</section>
	);
}
