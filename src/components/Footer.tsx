import type { ReactNode } from "react";
import AnimatedContent from "./React Bits Components/animation/AnimatedContent";
import CameraIcon from "./CameraIcon";

const columns = [
	{ title: "Catalog", links: ["Mirrorless", "Cinema", "Drones", "Film"] },
	{ title: "Company", links: ["About", "How it works", "Pricing", "Careers"] },
	{ title: "Support", links: ["Help center", "Insurance", "Contact", "Terms"] },
];

const socials: { label: string; path: ReactNode }[] = [
	{
		label: "Instagram",
		path: (
			<path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
		),
	},
	{
		label: "X",
		path: (
			<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
		),
	},
	{
		label: "YouTube",
		path: (
			<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
		),
	},
];

export default function Footer() {
	return (
		<footer id="contact" className="px-6 pb-8 pt-4 sm:px-10">
			<div className="mx-auto max-w-[1320px]">
				<AnimatedContent
					distance={40}
					duration={0.7}
					ease="power3.out"
					threshold={0.1}
					className="rounded-[32px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.4)] md:p-12"
				>
					<div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
						<div>
							<p className="flex items-center gap-2.5 text-[26px] font-semibold tracking-tight text-ink">
								<CameraIcon className="h-7 w-7" />
								CriSells
							</p>
							<p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ink/70">
								Premium camera rentals for creators who refuse to compromise.
								Cinema-grade gear, delivered.
							</p>
							<ul className="mt-5 flex gap-2.5">
								{socials.map((social) => (
									<li key={social.label}>
										<a
											href="#"
											aria-label={social.label}
											className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-ink/80 transition-colors hover:bg-white/20 hover:text-ink"
										>
											<svg
												viewBox="0 0 24 24"
												className="h-4 w-4"
												fill="currentColor"
												aria-hidden="true"
											>
												{social.path}
											</svg>
										</a>
									</li>
								))}
							</ul>
						</div>

						{columns.map((column) => (
							<div key={column.title}>
								<h2 className="text-[14px] font-medium text-ink">
									{column.title}
								</h2>
								<ul className="mt-4 space-y-2.5">
									{column.links.map((link) => (
										<li key={link}>
											<a
												href={link === "Contact" ? "mailto:hello@crisells.co" : "#"}
												className="text-[14px] text-ink/70 transition-colors hover:text-ink"
											>
												{link}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

					<div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-ink/50 sm:flex-row sm:items-center sm:justify-between">
						<p>© 2026 CriSells Rentals. All rights reserved.</p>
						<p>Designed in Philippines. Built for creators everywhere.</p>
					</div>
				</AnimatedContent>
			</div>
		</footer>
	);
}
