import { Quote } from "lucide-react";
import AnimatedContent from "./React Bits Components/animation/AnimatedContent";

// Placeholder testimonials: swap for real, attributed reviews before launch.
const testimonials = [
	{
		quote:
			"Rented a RED KOMODO for a music video shoot. The gear arrived pristine, fully charged, with spare batteries. Flawless experience from start to finish.",
		name: "Marcus Chen",
		role: "Music video director",
	},
	{
		quote:
			"The Sony FX3 saved my documentary. I needed a low-light cinema body on 24 hours' notice and CriSells delivered. The damage protection gave me total peace of mind.",
		name: "Aisha Patel",
		role: "Documentary filmmaker",
	},
	{
		quote:
			"I rent from CriSells for every commercial gig. The consistency is unreal. Every lens is sharp, every body is clean. It's like having a rental house on speed dial.",
		name: "Jordan Rivera",
		role: "Commercial photographer",
	},
];

export default function Testimonials() {
	return (
		<section
			id="reviews"
			className="relative px-8 pb-24 pt-8 sm:px-12 sm:pb-32 sm:pt-12 lg:px-16"
		>
			<div className="mx-auto max-w-[1280px]">
				<AnimatedContent
					distance={60}
					direction="vertical"
					duration={0.8}
					ease="power3.out"
					threshold={0.15}
				>
					<div className="mb-12 text-center sm:mb-14">
						<h2 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[3.5rem]">
							Trusted by creators
						</h2>
						<p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							8,400+ shoots and counting
						</p>
					</div>
				</AnimatedContent>

				<AnimatedContent
					distance={40}
					direction="vertical"
					duration={0.8}
					ease="power3.out"
					stagger={0.1}
					threshold={0.1}
				>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{testimonials.map((testimonial) => (
							<figure
								key={testimonial.name}
								className="material-card flex flex-col p-7"
							>
								<Quote
									className="h-6 w-6 text-ink/30"
									strokeWidth={1.5}
									aria-hidden="true"
								/>
								<blockquote className="mt-5 flex-1 text-[15px] leading-[1.65] text-ink/85">
									{testimonial.quote}
								</blockquote>
								<figcaption className="mt-6 flex items-center gap-3">
									<span
										className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5227FF] to-[#ff00f7] text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-inset ring-white/20"
										aria-hidden="true"
									>
										{testimonial.name.charAt(0)}
									</span>
									<span>
										<span className="block text-[14px] font-semibold text-ink">
											{testimonial.name}
										</span>
										<span className="block text-[13px] text-ink/60">
											{testimonial.role}
										</span>
									</span>
								</figcaption>
							</figure>
						))}
					</div>
				</AnimatedContent>
			</div>
		</section>
	);
}
