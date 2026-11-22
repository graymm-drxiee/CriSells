import { useEffect, useRef } from "react";

/** Re-runs `load` every `ms` while mounted, so admin screens track the database. */
export function useLivePoll(load: () => void, ms = 5000) {
	const latest = useRef(load);
	latest.current = load;

	useEffect(() => {
		const timer = setInterval(() => latest.current(), ms);
		return () => clearInterval(timer);
	}, [ms]);
}
