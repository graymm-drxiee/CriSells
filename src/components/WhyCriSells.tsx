import { Calendar, Settings, ShieldCheck, Truck } from "lucide-react";
import AnimatedContent from "./React Bits Components/animation/AnimatedContent";

const reasons = [
	{
		title: "Door-to-door delivery",
		body: "Gear arrives at your location in a protective hard case. Free delivery on orders over $100.",
		Icon: Truck,
	},
	{
		title: "Damage protection",
		body: "Every rental includes optional insurance. Shoot with confidence, not anxiety.",
		Icon: ShieldCheck,
	},
	{
		title: "Professionally maintained",
		body: "Each body is cleaned, calibrated, and firmware-updated between every rental.",
		Icon: Settings,
	},
	{
		title: "Flexible durations",
		body: "Rent for a day, a week, or a month. Discounts kick in automatically on longer bookings.",
		Icon: Calendar,
	},
];

export default function WhyCriSells() {
	return (
		<section
			id="why"
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
					<div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
						<h2 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[3.5rem]">
							Why CriSells
						</h2>
						<p className="mx-auto mt-3 max-w-xl text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/60">
							Rent with confidence.
						</p>
					</div>
				</AnimatedContent>

				<AnimatedContent
					distance={40}
					direction="vertical"
					duration={0.7}
					ease="power3.out"
					stagger={0.08}
					threshold={0.1}
				>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{reasons.map(({ title, body, Icon }) => (
							<div
								key={title}
								className="material-card group flex flex-col p-7"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/10">
									<Icon
										className="h-6 w-6 text-ink/85"
										strokeWidth={1.6}
										aria-hidden="true"
									/>
								</div>
								<h3 className="mt-6 text-[20px] font-semibold leading-snug tracking-[-0.01em] text-ink">
									{title}
								</h3>
								<p className="mt-3 text-[15px] leading-[1.65] text-ink/75">
									{body}
								</p>
							</div>
						))}
					</div>
				</AnimatedContent>
			</div>
		</section>
	);
}
