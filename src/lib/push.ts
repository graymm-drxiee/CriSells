import { api } from "./api";

export interface PushResult {
	status: "subscribed" | "denied" | "unsupported" | "error";
	message: string;
}

// The applicationServerKey must be a raw Uint8Array; VAPID keys travel as base64url.
function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = window.atob(base64);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
	return bytes;
}

export async function enablePushNotifications(): Promise<PushResult> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
		return { status: "unsupported", message: "This browser does not support push notifications." };
	}
	// Browsers only allow push on HTTPS (or localhost), not on a LAN http address.
	if (!window.isSecureContext) {
		return { status: "unsupported", message: "Notifications need HTTPS (or localhost)." };
	}

	const permission = await Notification.requestPermission();
	if (permission === "denied") {
		return { status: "denied", message: "Notifications are blocked in your browser settings." };
	}
	if (permission !== "granted") {
		return { status: "error", message: "Notification permission was not granted." };
	}

	try {
		const { publicKey } = await api<{ publicKey: string }>("/api/push/public-key");
		await navigator.serviceWorker.register("/sw.js");
		// register() resolves while the worker is still installing; subscribe() needs it active.
		const registration = await Promise.race([
			navigator.serviceWorker.ready,
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("The notification worker did not start. Reload and try again.")), 10000),
			),
		]);
		const existing = await registration.pushManager.getSubscription();
		const subscription =
			existing ||
			(await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			}));
		await api("/api/push/subscribe", { method: "POST", body: subscription.toJSON() });
		return { status: "subscribed", message: "Order notifications are on." };
	} catch (error) {
		return {
			status: "error",
			message: error instanceof Error ? error.message : "Could not turn on notifications.",
		};
	}
}

/** Whether this device already has a live subscription (i.e. button should say "on"). */
export async function hasPushSubscription() {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
	const registration = await navigator.serviceWorker.getRegistration("/");
	const subscription = await registration?.pushManager.getSubscription();
	return !!subscription;
}
