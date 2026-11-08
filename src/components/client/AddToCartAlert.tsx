import { useEffect, useRef, useState } from "react";

interface AddToCartAlertProps {
	title: string;
	description: string;
	onClose: () => void;
}

// One shared context: a new one per toast leaks, and iOS refuses more than a few.
let audio: AudioContext | null = null;

function playChime() {
	try {
		audio ??= new AudioContext();
		if (audio.state === "suspended") void audio.resume();
		const start = audio.currentTime;
		// Two short sine notes (A5 → E6): a soft "added" blip, no asset needed.
		[880, 1318.5].forEach((frequency, i) => {
			const at = start + i * 0.09;
			const osc = audio!.createOscillator();
			const gain = audio!.createGain();
			osc.type = "sine";
			osc.frequency.value = frequency;
			gain.gain.setValueAtTime(0.0001, at);
			gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
			osc.connect(gain).connect(audio!.destination);
			osc.start(at);
			osc.stop(at + 0.24);
		});
	} catch {
		// Sound is a nicety; autoplay policies or a missing output device must not break the toast.
	}
}

const SWIPE_LIMIT = 90;

export default function AddToCartAlert({
	title,
	description,
	onClose,
}: AddToCartAlertProps) {
	const [dragX, setDragX] = useState(0);
	const [leaving, setLeaving] = useState(false);
	const startX = useRef<number | null>(null);
	const moved = useRef(false);

	useEffect(() => {
		playChime();
		const timer = setTimeout(onClose, 4000);
		return () => clearTimeout(timer);
	}, [title, description]);

	useEffect(() => {
		if (!leaving) return;
		const timer = setTimeout(onClose, 220);
		return () => clearTimeout(timer);
	}, [leaving, onClose]);

	const endDrag = () => {
		if (startX.current === null) return;
		startX.current = null;
		if (Math.abs(dragX) > SWIPE_LIMIT) {
			setDragX(dragX > 0 ? 480 : -480);
			setLeaving(true);
		} else {
			setDragX(0);
		}
	};

	return (
		<div className="toast-pop pointer-events-none fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[80] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto">
			<div
				role="alert"
				onClick={() => {
					if (!moved.current) onClose();
				}}
				onPointerDown={(e) => {
					if (leaving) return;
					startX.current = e.clientX;
					moved.current = false;
					e.currentTarget.setPointerCapture(e.pointerId);
				}}
				onPointerMove={(e) => {
					if (startX.current === null) return;
					const next = e.clientX - startX.current;
					if (Math.abs(next) > 6) moved.current = true;
					setDragX(next);
				}}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
				style={{
					transform: `translateX(${dragX}px)`,
					opacity: 1 - Math.min(Math.abs(dragX) / 320, 0.55),
					transition: startX.current ? "none" : "transform 240ms cubic-bezier(0.16,1,0.3,1), opacity 240ms",
				}}
				className="pointer-events-auto flex w-full max-w-none cursor-grab touch-pan-y select-none items-center gap-3 rounded-[18px] border border-white/[0.12] bg-[color-mix(in_srgb,var(--color-ground),white_7%)] px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)] active:cursor-grabbing sm:max-w-[400px] sm:rounded-[14px] sm:bg-ground/85 sm:backdrop-blur-2xl"
			>
				<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.1] text-ink/85">
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
						<path d="M5 12.5l4.5 4.5L19 7.5" />
					</svg>
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[14px] font-semibold leading-tight tracking-tight text-ink">
						{title}
					</p>
					<p className="mt-0.5 text-[13px] leading-snug text-ink/60">{description}</p>
				</div>
			</div>
		</div>
	);
}
