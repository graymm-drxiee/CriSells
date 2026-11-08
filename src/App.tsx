import { lazy, Suspense, useState, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./components/admin/AdminAuthContext";
import { useOverlayOpen } from "./useOverlayPause";
import GradientWaves from "./components/React Bits Components/background/GradientWaves";
import SiteShell, { useSite } from "./components/SiteShell";
import Hero from "./components/Hero";
import StatsBand from "./components/StatsBand";
import Catalog from "./components/Catalog";
import WhyCriSells from "./components/WhyCriSells";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import Intro from "./components/Intro";
import ClientDashboard from "./components/client/ClientDashboard";
import ClientLoginPage from "./components/client/ClientLoginPage";
import ResetPassword from "./components/client/ResetPassword";
import type { ClientUser } from "./types";
import { api } from "./api";

// Admin screens are a separate bundle so storefront visitors never download them.
const AdminLayout = lazy(() =>
	import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazy(() =>
	import("./components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })),
);
const AdminCatalog = lazy(() =>
	import("./components/admin/AdminCatalog").then((m) => ({ default: m.AdminCatalog })),
);
const AdminOrders = lazy(() =>
	import("./components/admin/AdminOrders").then((m) => ({ default: m.AdminOrders })),
);
const AdminSettings = lazy(() =>
	import("./components/admin/AdminSettings").then((m) => ({ default: m.AdminSettings })),
);

const lowDetail =
	window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

// Intro plays once per page load, not on every route change.
let introPlayed = false;

function Storefront({
	onIntroActiveChange,
}: {
	onIntroActiveChange: (active: boolean) => void;
}) {
	const { addToCart } = useSite();
	const [showIntro, setShowIntro] = useState(!introPlayed);
	// Freeze hero motion while a blurred dialog covers it.
	const overlayOpen = useOverlayOpen();
	const [introLeaving, setIntroLeaving] = useState(false);

	useEffect(() => {
		if (!showIntro) return;
		introPlayed = true;

		// Start leaving animation after 3 seconds
		const leaveTimer = setTimeout(() => {
			setIntroLeaving(true);
		}, 3000);

		// Remove intro from DOM after fade out completes
		const hideTimer = setTimeout(() => {
			setShowIntro(false);
		}, 3600);

		return () => {
			clearTimeout(leaveTimer);
			clearTimeout(hideTimer);
		};
	}, [showIntro]);

	useEffect(() => {
		onIntroActiveChange(showIntro);
	}, [showIntro, onIntroActiveChange]);

	return (
		<>
			{showIntro && <Intro leaving={introLeaving} />}
			<Hero paused={showIntro || overlayOpen} />
			<StatsBand />
			<Catalog onAddToCart={addToCart} viewOnly />
			<WhyCriSells />
			<HowItWorks />
			<Testimonials />
		</>
	);
}

function AppBackground({ introActive }: { introActive: boolean }) {
	const { pathname } = useLocation();
	const isAdmin = pathname.startsWith("/admin");
	// A blurred dialog over the live shader costs a full-screen filter every frame; freeze it while one is open.
	const overlayOpen = useOverlayOpen();

	return (
		<div className="fixed inset-x-0 top-0 z-0 h-lvh bg-ground" aria-hidden="true">
			<GradientWaves
				horizonColor="#5227FF"
				waveColor="#ff00f7"
				crestColor="#5f00ff"
				speed={0.4}
				amplitude={2.5}
				waveScale={0.6}
				waveRatio={0.9}
				swell={35}
				turbulence={20}
				tilt={1.11}
				zoom={1}
				height={5.5}
				fogDepth={15}
				detail={isAdmin || lowDetail ? "low" : "medium"}
				brightness={1}
				opacity={1}
				mouseInteraction={!isAdmin && !coarsePointer}
				parallaxStrength={0.5}
				grain
				grainIntensity={0.05}
				paused={(introActive && pathname === "/") || overlayOpen}
				frameRate={isAdmin ? 30 : undefined}
				className="h-full w-full"
			/>
			<div className="absolute inset-0 bg-ground/20" />
		</div>
	);
}

function ScrollToTop() {
	const { pathname, hash } = useLocation();
	useLayoutEffect(() => {
		if (hash) {
			const target = document.querySelector(hash);
			if (target) {
				target.scrollIntoView();
				return;
			}
		}
		window.scrollTo(0, 0);
	}, [pathname, hash]);
	return null;
}

function AdminGuard() {
	const { isAuthenticated, loading } = useAdminAuth();
	if (loading) return null;
	if (!isAuthenticated) return <Navigate to="/" replace />;
	return <AdminLayout />;
}

export default function App() {
	const [introActive, setIntroActive] = useState(!introPlayed);
	const [user, setUser] = useState<ClientUser | null>(null);

	// The session cookie is httpOnly, so the server is the source of truth.
	useEffect(() => {
		const refresh = () => {
			api<{ user: ClientUser }>("/api/auth/me")
				.then((data) => setUser(data.user))
				.catch(() => setUser(null));
		};
		const sync = (event: Event) => {
			const detail = (event as CustomEvent<{ user: ClientUser | null }>).detail;
			if (detail) setUser(detail.user);
			else refresh();
		};
		refresh();
		window.addEventListener("crisells-auth-change", sync);
		return () => window.removeEventListener("crisells-auth-change", sync);
	}, []);

	return (
		<BrowserRouter>
			<AppBackground introActive={introActive} />
			<ScrollToTop />
			<Suspense fallback={null}>
				<Routes>
					<Route element={<SiteShell user={user} setUser={setUser} />}>
						<Route
							path="/"
							element={<Storefront onIntroActiveChange={setIntroActive} />}
						/>
						<Route path="/account" element={<ClientDashboard />} />
						<Route path="/reset" element={<ResetPassword />} />
					</Route>
					<Route path="/login" element={<ClientLoginPage onLogin={setUser} />} />
					<Route
						path="/admin"
						element={
							<AdminAuthProvider>
								<AdminGuard />
							</AdminAuthProvider>
						}
					>
						<Route index element={<AdminDashboard />} />
						<Route path="dashboard" element={<AdminDashboard />} />
						<Route path="catalog" element={<AdminCatalog />} />
						<Route path="orders" element={<AdminOrders />} />
						<Route path="settings" element={<AdminSettings />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}
