import AnimatedContent from "./shared/animation/AnimatedContent";

const iconProps = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	"aria-hidden": true,
};

const starPath =
	"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z";

const stats = [
	{
		label: "Cameras in the fleet",
		value: "120+",
		icon: (
			<svg viewBox="0 0 24 24" className="h-4 w-4" {...iconProps}>
				<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
				<circle cx="12" cy="13" r="3" />
			</svg>
		),
	},
	{
		label: "Rentals completed",
		value: "8,400+",
		icon: (
			<svg viewBox="0 0 24 24" className="h-4 w-4" {...iconProps}>
				<circle cx="12" cy="12" r="9" />
				<path d="m8.5 12 2.4 2.4L15.5 9.8" />
			</svg>
		),
	},
	{
		label: "Average rating",
		value: "4.9",
		icon: (
			<svg viewBox="0 0 24 24" className="h-4 w-4" {...iconProps}>
				<path d={starPath} />
			</svg>
		),
		caption: "From 2,100 reviews",
	},
];

export default function StatsBand() {
	return (
		<section className="relative z-10 px-6 pt-20 sm:px-10 sm:pt-24 lg:px-16">
			<div className="mx-auto max-w-[1280px]">
				<AnimatedContent
					distance={24}
					direction="vertical"
					duration={0.7}
					ease="power3.out"
					stagger={0.07}
					threshold={0.1}
					className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
				>
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="flex flex-col gap-5 py-9 sm:px-10 sm:py-11 sm:first:pl-0 sm:last:pr-0"
						>
							<div className="flex items-center gap-2.5 text-ink/45">
								{stat.icon}
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
									{stat.label}
								</p>
							</div>

							<p className="text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-[0.9] tracking-[-0.045em] tabular-nums text-ink">
								{stat.value}
							</p>

							{stat.caption ? (
								<div className="flex items-center gap-2.5">
									<span className="flex gap-0.5" aria-hidden="true">
										{[...Array(5)].map((_, i) => (
											<svg key={i} className="h-3 w-3 fill-amber-300" viewBox="0 0 24 24">
												<path d={starPath} />
											</svg>
										))}
									</span>
									<span className="text-[12px] text-ink/45">{stat.caption}</span>
								</div>
							) : null}
						</div>
					))}
				</AnimatedContent>
			</div>
		</section>
	);
}
