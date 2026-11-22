import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Camera, Home, User } from "lucide-react";
import CameraIcon from "./CameraIcon";
import EnableNotifications from "./shared/ui/EnableNotifications";

const links = [
	{ label: "Catalog", href: "#catalog" },
	{ label: "Cinema", href: "#cinema" },
	{ label: "Drones", href: "#drones" },
	{ label: "How it works", href: "#how" },
	{ label: "Why CriSells", href: "#why" },
];

// Landing anchors don't exist on the client dashboard, so it gets its own routes.
const dashboardLinks = [
	{ label: "Home", href: "/" },
	{ label: "Rentals", href: "/account#rentals" },
	{ label: "Catalog", href: "/account#catalog" },
	{ label: "Contact", href: "/account#support" },
];

export default function Navbar({
	email,
	role,
	cartCount,
	onCartOpen,
	onLoginOpen,
	onLogout,
}: {
	email: string | null;
	role?: string;
	cartCount: number;
	onCartOpen: () => void;
	onLoginOpen: () => void;
	onLogout: () => void;
}) {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const { pathname } = useLocation();
	const loggedIn = !!email;
	const isStaff = !!role && role !== "customer";
	const dashboardHref = isStaff ? "/admin" : "/account";
	const sectionLinks = pathname === "/" ? links : dashboardLinks;
	const navLinks = sectionLinks;

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
				setAccountOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6">
			<div className="relative w-full max-w-[680px] sm:w-fit sm:max-w-none">
				<nav
					aria-label="Main"
					className={`flex items-center gap-1 rounded-full border border-white/10 px-2 py-2 backdrop-blur-xl transition-colors duration-300 ${
						scrolled
							? "bg-white/[0.07] shadow-[0_10px_34px_rgba(0,0,0,0.45)]"
							: "bg-white/[0.04]"
					}`}
				>
						<a
						href="#top"
						className="flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold tracking-tight text-ink transition-colors hover:bg-white/10"
					>
						<CameraIcon className="h-[22px] w-[22px]" />
						CriSells
					</a>

					<ul className="hidden items-center gap-0.5 lg:flex">
						{navLinks.map((link) => (
							<li key={link.label}>
								{link.href.startsWith("/") ? (
									<Link
										to={link.href}
										className="flex h-10 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-ink/80 transition-colors hover:bg-white/10 hover:text-ink"
									>
										{link.label}
									</Link>
								) : (
									<a
										href={link.href}
										className="flex h-10 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-ink/80 transition-colors hover:bg-white/10 hover:text-ink"
									>
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>

					<div className="ml-auto flex items-center gap-1 lg:ml-1">
						{loggedIn ? (
							pathname === "/" ? (
								<Link
									to={dashboardHref}
									className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 text-[14px] font-semibold text-ground shadow-[0_0_20px_rgba(255,255,255,0.28)] transition-transform duration-150 hover:scale-[1.03] active:scale-95"
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
										<rect x="3" y="3" width="7" height="7" rx="1.5" />
										<rect x="14" y="3" width="7" height="7" rx="1.5" />
										<rect x="3" y="14" width="7" height="7" rx="1.5" />
										<rect x="14" y="14" width="7" height="7" rx="1.5" />
									</svg>
									Dashboard
								</Link>
							) : (
							<button
								type="button"
								onClick={onCartOpen}
								aria-label={`Open cart (${cartCount} ${cartCount === 1 ? "item" : "items"})`}
								className="relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 text-[14px] font-semibold text-ground shadow-[0_0_20px_rgba(255,255,255,0.28)] transition-transform duration-150 hover:scale-[1.03] active:scale-95"
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
									<circle cx="9" cy="20" r="1.5" />
									<circle cx="18" cy="20" r="1.5" />
									<path d="M3 4h2l2.7 10.4a2 2 0 0 0 1.9 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6" />
								</svg>
								Cart
								{cartCount > 0 && (
									<span
										key={cartCount}
										className="count-in absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none text-white"
									>
										{cartCount}
									</span>
								)}
							</button>
							)
						) : (
							<button
								type="button"
								onClick={onLoginOpen}
								className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 text-[14px] font-semibold text-ground shadow-[0_0_20px_rgba(255,255,255,0.28)] transition-transform duration-150 hover:scale-[1.03] active:scale-95"
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
									<circle cx="12" cy="8" r="4" />
									<path d="M4 21a8 8 0 0 1 16 0" />
								</svg>
								Login
							</button>
						)}

						{loggedIn && pathname !== "/" && (
							<div className="relative">
								<button
									type="button"
									onClick={() => setAccountOpen((v) => !v)}
									aria-expanded={accountOpen}
									aria-label="Account menu"
									className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink transition-colors hover:bg-white/20"
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
										<circle cx="12" cy="8" r="4" />
										<path d="M4 21a8 8 0 0 1 16 0" />
									</svg>
								</button>

								<button
									type="button"
									tabIndex={-1}
									aria-hidden="true"
									onClick={() => setAccountOpen(false)}
									className={`fixed inset-0 z-40 cursor-default transition-opacity duration-200 motion-reduce:transition-none ${
										accountOpen ? "opacity-100" : "pointer-events-none opacity-0"
									}`}
								/>
								<div
									className={`absolute right-0 top-full z-50 mt-3 w-56 origin-top rounded-2xl border border-white/10 bg-ground/85 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none! motion-reduce:transition-[opacity,visibility] ${
										accountOpen
											? "visible scale-100 opacity-100"
											: "invisible pointer-events-none scale-95 opacity-0"
									}`}
								>
									<p className="truncate px-3 py-2 text-[12px] text-ink/50">{email}</p>
									<EnableNotifications />
									<button
										type="button"
										onClick={() => {
											setAccountOpen(false);
											onLogout();
										}}
										className="w-full rounded-xl px-3 py-2 text-left text-[14px] font-medium text-ink transition-colors hover:bg-white/10"
									>
										Sign out
									</button>
								</div>
							</div>
						)}

						<button
							type="button"
							onClick={() => setOpen((v) => !v)}
							aria-expanded={open}
							aria-controls="mobile-nav"
							aria-label={open ? "Close menu" : "Open menu"}
							className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-[color,background-color,transform] duration-200 hover:bg-white/10 active:scale-90 motion-reduce:transition-colors lg:hidden"
						>
							<span className="relative block h-5 w-5" aria-hidden="true">
								<span
									className={`absolute left-0 top-[7px] h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
										open ? "translate-y-[5px] rotate-45" : ""
									}`}
								/>
								<span
									className={`absolute left-0 top-[12px] h-[2px] w-5 rounded-full bg-current transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
										open ? "scale-x-0 opacity-0" : ""
									}`}
								/>
								<span
									className={`absolute left-0 top-[17px] h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
										open ? "-translate-y-[5px] -rotate-45" : ""
									}`}
								/>
							</span>
						</button>
					</div>
				</nav>

				<div
					id="mobile-nav"
					className={`absolute inset-x-0 top-full mt-3 origin-top rounded-[28px] border border-white/10 bg-ground/80 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:[transform:none]! motion-reduce:transition-[opacity,visibility] lg:hidden ${
						open
							? "visible scale-100 opacity-100"
							: "invisible pointer-events-none scale-95 opacity-0"
					}`}
				>
					<ul>
						{navLinks.map((link) => (
							<li key={link.label}>
								{link.href.startsWith("/") ? (
									<Link
										to={link.href}
										onClick={() => setOpen(false)}
										className="block rounded-2xl px-4 py-3.5 text-[15px] font-medium text-ink/85 transition-[color,background-color,transform] duration-150 hover:bg-white/10 hover:text-ink active:scale-[0.98] motion-reduce:transition-colors"
									>
										{link.label}
									</Link>
								) : (
									<a
										href={link.href}
										onClick={() => setOpen(false)}
										className="block rounded-2xl px-4 py-3.5 text-[15px] font-medium text-ink/85 transition-[color,background-color,transform] duration-150 hover:bg-white/10 hover:text-ink active:scale-[0.98] motion-reduce:transition-colors"
									>
										{link.label}
									</a>
								)}
							</li>
						))}
					</ul>
				</div>
			</div>
		</header>
	);
}

const tabs = [
	{ label: "Home", href: "/", icon: Home },
	{ label: "Rentals", href: "/account#rentals", icon: CalendarDays },
	{ label: "Catalog", href: "/account#catalog", icon: Camera },
	{ label: "Profile", href: "/account", icon: User },
];

/** Floating bottom navigation for the member area on phones. */
export function MobileTabBar() {
	const { pathname, hash } = useLocation();
	// Which section is in view, so the bar follows the page instead of only the URL.
	const [section, setSection] = useState(hash.slice(1));

	useEffect(() => {
		if (pathname !== "/account") {
			setSection("");
			return;
		}
		const ids = ["rentals", "catalog", "support"];
		const update = () => {
			const line = window.scrollY + window.innerHeight * 0.4;
			let current = "";
			for (const id of ids) {
				const el = document.getElementById(id);
				if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = id;
			}
			setSection(current);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [pathname]);

	return (
		<nav
			aria-label="Member area"
			className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.07] p-1.5 shadow-[0_10px_34px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
		>
			{tabs.map(({ label, href, icon: Icon }) => {
				const active =
					href === "/"
						? pathname === "/"
						: href === "/account"
							? pathname === "/account" && section === ""
							: pathname === "/account" && section === href.split("#")[1];
				return (
					<Link
						key={label}
						to={href}
						aria-current={active ? "page" : undefined}
						className={`group relative flex min-h-12 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10.5px] leading-none font-medium transition-colors duration-200 ${
							active ? "text-ink" : "text-ink/50 group-hover:text-ink/85"
						}`}
					>
						<Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
						{label}
						{/* Floated so the line never pushes the icon/label out of alignment. */}
						<span
							className={`absolute bottom-1 h-0.5 w-4 rounded-full transition-colors duration-200 ${
								active ? "bg-ink" : "bg-transparent"
							}`}
							aria-hidden="true"
						/>
					</Link>
				);
			})}
		</nav>
	);
}
