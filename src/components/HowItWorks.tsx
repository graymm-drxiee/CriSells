import AnimatedContent from "./shared/animation/AnimatedContent";

const steps = [
	{
		title: "Pick your dates",
		body: "Browse the catalog, choose your body, and set your rental window. Checkout takes about two minutes.",
	},
	{
		title: "We prep and deliver",
		body: "Your kit is cleaned, calibrated, charged, and packed in a hard case, then delivered to your door.",
	},
	{
		title: "Shoot without worry",
		body: "Every booking includes coverage, and our team is one message away if anything goes sideways on set.",
	},
	{
		title: "Send it back",
		body: "Pack it into the same case and hand it to the courier. We take care of the cleaning and inspection.",
	},
];

export default function HowItWorks() {
	return (
		<section
			id="how"
			className="relative scroll-mt-28 px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
		>
			<div className="mx-auto max-w-[1280px]">
				<AnimatedContent
					distance={60}
					direction="vertical"
					duration={0.8}
					ease="power3.out"
					threshold={0.15}
				>
					<div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
						<h2 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[3.5rem]">
							How it works
						</h2>
						<p className="mx-auto mt-4 max-w-2xl text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							From checkout to courier, four steps and you&rsquo;re shooting.
						</p>
					</div>
				</AnimatedContent>

				<AnimatedContent
					distance={30}
					direction="vertical"
					duration={0.7}
					ease="power3.out"
					stagger={0.08}
					threshold={0.1}
					className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4"
				>
					{steps.map((step, index) => (
						<div key={step.title} className="relative border-t border-white/10 pt-6">
							<span
								className="absolute -top-[3px] left-0 h-1.5 w-1.5 rounded-full bg-ink"
								aria-hidden="true"
							/>
							<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/35">
								Step {String(index + 1).padStart(2, "0")}
							</p>
							<h3 className="mt-5 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-ink">
								{step.title}
							</h3>
							<p className="mt-2.5 max-w-xs text-[14px] leading-[1.65] text-ink/55">
								{step.body}
							</p>
						</div>
					))}
				</AnimatedContent>

				<AnimatedContent
					distance={20}
					direction="vertical"
					duration={0.6}
					ease="power3.out"
					threshold={0.1}
					className="mt-14 flex justify-center border-t border-white/10 pt-10"
				>
					<a
						href="#catalog"
						className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-semibold text-ground transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none"
					>
						Browse the catalog
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
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
				</AnimatedContent>
			</div>
		</section>
	);
}
