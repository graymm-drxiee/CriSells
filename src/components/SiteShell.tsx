import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar, { MobileTabBar } from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import AddToCartAlert from "./client/AddToCartAlert";
import { api } from "../lib/api";
import type { Camera, CartItem, ClientUser, CheckoutDetails } from "../lib/types";

interface SiteContextValue {
	user: ClientUser | null;
	cartItems: CartItem[];
	addToCart: (camera: Camera) => void;
	alert: { id: number; title: string; description: string } | null;
	dismissAlert: () => void;
	openCart: () => void;
	openLogin: () => void;
	logout: () => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
	const ctx = useContext(SiteContext);
	if (!ctx) throw new Error("useSite must be used inside SiteShell");
	return ctx;
}

function todayStr(): string {
	return new Date().toISOString().split("T")[0];
}

function tomorrowStr(): string {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	return d.toISOString().split("T")[0];
}

function calcDays(start: string, end: string): number {
	if (!start || !end) return 0;
	const s = new Date(start).getTime();
	const e = new Date(end).getTime();
	if (e < s) return 0;
	return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

/** Storefront chrome shared by the landing page and the client dashboard. */
export default function SiteShell({
	user,
	setUser,
}: {
	user: ClientUser | null;
	setUser: (user: ClientUser | null) => void;
}) {
	const navigate = useNavigate();
	const { pathname, hash } = useLocation();
	// /login renders outside this shell, so signing in would otherwise wipe the cart.
	const [cartItems, setCartItems] = useState<CartItem[]>(() => {
		try {
			return JSON.parse(sessionStorage.getItem("crisells-cart") ?? "[]");
		} catch {
			return [];
		}
	});
	useEffect(() => {
		sessionStorage.setItem("crisells-cart", JSON.stringify(cartItems));
	}, [cartItems]);
	const [cartOpen, setCartOpen] = useState(false);
	const showTabs = !!user && pathname !== "/";
	const [alert, setAlert] = useState<{ id: number; title: string; description: string } | null>(null);

	const addToCart = (camera: Camera) => {
		if (!user) {
			navigate("/login");
			return;
		}
		if (!camera.available) return;
		if (cartItems.some((item) => item.camera.id === camera.id)) {
			setAlert({
				id: Date.now(),
				title: "Already in your cart",
				description: `${camera.name} is already added. You can change its rental dates from the cart.`,
			});
			return;
		}
		const startDate = todayStr();
		const endDate = tomorrowStr();
		const days = calcDays(startDate, endDate);
		setCartItems((prev) => [
			...prev,
			{ camera, startDate, endDate, days, total: days * camera.pricePerDay },
		]);
		setAlert({
			id: Date.now(),
			title: "Added to cart",
			description: `${camera.name} has been added to your cart at $${camera.pricePerDay}/day. Review your rental dates before you check out.`,
		});
	};

	const removeFromCart = (id: string) =>
		setCartItems((prev) => prev.filter((item) => item.camera.id !== id));

	const updateDates = (id: string, startDate: string, endDate: string) =>
		setCartItems((prev) =>
			prev.map((item) => {
				if (item.camera.id !== id) return item;
				const days = calcDays(startDate, endDate);
				return {
					...item,
					startDate,
					endDate,
					days,
					total: days * item.camera.pricePerDay,
				};
			}),
		);

	// The server recalculates prices and stock; the drawer only shows its estimate.
	const checkout = async (details: CheckoutDetails) => {
		const data = await api<{ order: { orderNumber: string } }>("/api/orders", {
			method: "POST",
			body: {
				items: cartItems.map((item) => ({
					productId: item.camera.id,
					qty: 1,
					startDate: item.startDate,
					endDate: item.endDate,
				})),
				customer: details.customer,
				deliveryMode: details.deliveryMode,
			},
		});
		setCartItems([]);
		window.dispatchEvent(new Event("crisells-orders-change"));
		return data.order.orderNumber;
	};

	const logout = () => {
		api("/api/auth/logout", { method: "POST" }).catch(() => null);
		setUser(null);
		setCartItems([]);
		setCartOpen(false);
		setAlert(null);
		navigate("/");
	};

	return (
		<SiteContext.Provider
			value={{
				user,
				cartItems,
				addToCart,
				alert,
				dismissAlert: () => setAlert(null),
				openCart: () => setCartOpen(true),
				openLogin: () => navigate("/login", { state: { from: pathname + hash } }),
				logout,
			}}
		>
			<div className="relative min-h-screen">
				<div
					className={`relative z-10 ${
						showTabs ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0" : ""
					}`}
				>
					<Navbar
						email={user?.email ?? null}
						role={user?.role}
						cartCount={cartItems.length}
						onCartOpen={() => setCartOpen(true)}
						onLoginOpen={() => navigate("/login", { state: { from: pathname + hash } })}
						onLogout={logout}
					/>
					{showTabs && <MobileTabBar />}
					<main>
						<Outlet />
					</main>
					<Footer />
				</div>
			</div>

			{cartOpen && user && (
				<CartDrawer
					items={cartItems}
					defaultName={user.name}
					defaultEmail={user.email}
					defaultPhone={user.phone ?? ""}
					defaultAddress={user.address ?? ""}
					onClose={() => setCartOpen(false)}
					onRemove={removeFromCart}
					onUpdateDates={updateDates}
					onCheckout={checkout}
				/>
			)}

			{alert && (
				<AddToCartAlert
					key={alert.id}
					title={alert.title}
					description={alert.description}
					onClose={() => setAlert(null)}
				/>
			)}
		</SiteContext.Provider>
	);
}
