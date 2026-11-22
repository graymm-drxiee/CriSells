import { useEffect, useState } from "react";

// A full-screen blurred dialog re-filters the live WebGL background every frame, and the
// spiral keeps moving behind it. Freeze both while an overlay is mounted; they resume in place.
export const OVERLAY_EVENT = "crisells:overlay";
export const OVERLAY_CLOSE_EVENT = "crisells:overlay-close";

export function useOverlayPause() {
	useEffect(() => {
		window.dispatchEvent(new Event(OVERLAY_EVENT));
		return () => {
			window.dispatchEvent(new Event(OVERLAY_CLOSE_EVENT));
		};
	}, []);
}

export function useOverlayOpen() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onOpen = () => setOpen(true);
		const onClose = () => setOpen(false);
		window.addEventListener(OVERLAY_EVENT, onOpen);
		window.addEventListener(OVERLAY_CLOSE_EVENT, onClose);
		return () => {
			window.removeEventListener(OVERLAY_EVENT, onOpen);
			window.removeEventListener(OVERLAY_CLOSE_EVENT, onClose);
		};
	}, []);

	return open;
}
