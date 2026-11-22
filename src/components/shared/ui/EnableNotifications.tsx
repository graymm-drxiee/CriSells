import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { enablePushNotifications, hasPushSubscription } from "../../../lib/push";

/** Menu row that asks for notification permission and registers this device. */
export default function EnableNotifications() {
	const [on, setOn] = useState(false);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		// Re-bind on every load: permission may already be granted, and the stored
		// endpoint must belong to the account currently signed in on this browser.
		(async () => {
			try {
				if (await hasPushSubscription()) setOn(true);
				if (Notification.permission === "granted" && window.isSecureContext) {
					const result = await enablePushNotifications();
					setOn(result.status === "subscribed");
				}
			} catch {
				// Leave the button available for a manual retry.
			}
		})();
	}, []);

	const enable = async () => {
		setBusy(true);
		const result = await enablePushNotifications();
		setBusy(false);
		setOn(result.status === "subscribed");
		setMessage(result.message);
	};

	return (
		<>
			<button
				type="button"
				onClick={enable}
				disabled={on || busy}
				className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-ink/75 transition-colors hover:bg-white/10 hover:text-ink disabled:cursor-default disabled:hover:bg-transparent"
			>
				{on ? (
					<BellRing className="h-4 w-4 text-emerald-300" aria-hidden="true" />
				) : (
					<Bell className="h-4 w-4" aria-hidden="true" />
				)}
				{on ? "Order notifications on" : busy ? "Turning on…" : "Turn on order notifications"}
			</button>
			{message && !on && <p className="px-3 pb-1 text-[11px] leading-relaxed text-ink/50">{message}</p>}
		</>
	);
}
