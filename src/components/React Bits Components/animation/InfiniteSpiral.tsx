// Vendored from react-bits (InfiniteSpiral); kept untyped to avoid rewriting the source.
// @ts-nocheck
import { useEffect, useMemo, useRef } from "react";
import "./InfiniteSpiral.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const smoothstep = (min, max, value) => {
	const x = clamp((value - min) / (max - min || 1), 0, 1);
	return x * x * (3 - 2 * x);
};

const InfiniteSpiral = ({
	items = [] as any,
	speed = 0.55,
	direction = "up",
	animationMode = "auto",
	radius = 170,
	cardWidth = 100,
	cardHeight = 100,
	verticalSpacing = 60,
	perspective = 1000,
	cardsPerTurn = 7,
	rotation = 0,
	cardTilt = 0,
	cardRadius = 10,
	centerScale = 1.2,
	edgeFade = 0.3,
	pauseOnHover = true,
	imageFit = "cover",
	grayscale = 0,
	paused = false,
	className = "",
}) => {
	const rootRef = useRef(null);
	const cardRefs = useRef([]);
	const progressRef = useRef(0);
	const targetProgressRef = useRef(0);
	const autoSpeedRef = useRef(0);
	const hoveredRef = useRef(false);
	const visibleRef = useRef(true);
	const draggingRef = useRef(false);
	const lastPointerYRef = useRef(0);
	const dragMovedRef = useRef(false);
	const pausedRef = useRef(false);
	pausedRef.current = paused;

	const normalizedItems = useMemo(
		() =>
			items.map((item, index) =>
				typeof item === "string"
					? { src: item, alt: `Spiral image ${index + 1}` }
					: { alt: `Spiral image ${index + 1}`, ...item },
			),
		[items],
	);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || normalizedItems.length === 0) return;

		let frameId;
		let previousTime = performance.now();
		let lastRenderTime = 0;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const scrollEnabled =
			animationMode === "scroll" || animationMode === "all";
		const scrollSpeedMultiplier = Math.max(speed, 0) / 0.55;
		let lastScrollY = window.scrollY;
		const count = normalizedItems.length;
		const half = count / 2;

		// Geometry only changes on resize; keeping it out of the frame loop saves work at 120fps.
		const layout = {
			fit: 1,
			responsiveRadius: radius,
			fadeStart: clamp(1 - edgeFade, 0, 0.98),
			turnSize: Math.max(cardsPerTurn, 1),
		};
		const measure = () => {
			const bounds = root.getBoundingClientRect();
			const width = Math.max(bounds.width, 1);
			const height = Math.max(bounds.height, 1);
			const fit = Math.min(
				1,
				width / (cardWidth * 2.8),
				height / (cardHeight * 2.35),
			);
			layout.fit = fit;
			layout.responsiveRadius =
				Math.min(radius, Math.max(72, width * 0.36)) * fit;
		};
		measure();

		const resizeObserver = new ResizeObserver(measure);
		resizeObserver.observe(root);

		const intersectionObserver = new IntersectionObserver(
			([entry]) => {
				visibleRef.current = entry.isIntersecting;
			},
			{ threshold: 0.02 },
		);
		intersectionObserver.observe(root);

		const handleScroll = () => {
			const nextScrollY = window.scrollY;
			const scrollDelta = nextScrollY - lastScrollY;
			lastScrollY = nextScrollY;
			if (!scrollEnabled || !visibleRef.current || scrollDelta === 0) return;
			targetProgressRef.current += clamp(
				(scrollDelta * scrollSpeedMultiplier) /
					Math.max(verticalSpacing * 2, 1),
				-1.5,
				1.5,
			);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });

		const lastStyle = [];
		const depthOrder = new Array(count);
		const FRAME_MIN_MS = 1000 / 61;

		const render = (time) => {
			// Skip all work while hidden (intro overlay or scrolled out of view); keep the clock from jumping on resume.
			if (pausedRef.current || !visibleRef.current) {
				previousTime = time;
				frameId = requestAnimationFrame(render);
				return;
			}

			// Cap at ~60fps: 120Hz screens would otherwise pay twice the main-thread cost for no visible gain.
			if (time - lastRenderTime < FRAME_MIN_MS) {
				frameId = requestAnimationFrame(render);
				return;
			}
			lastRenderTime = time;

			const delta = Math.min((time - previousTime) / 1000, 0.05);
			previousTime = time;

			const autoEnabled =
				animationMode === "auto" || animationMode === "all";
			const motionPaused =
				draggingRef.current || (pauseOnHover && hoveredRef.current);
			const directionMultiplier = direction === "down" ? -1 : 1;
			const desiredAutoSpeed =
				autoEnabled && visibleRef.current && !reducedMotion.matches && !motionPaused
					? speed * directionMultiplier
					: 0;
			const speedBlend = 1 - Math.exp(-delta * 7);
			autoSpeedRef.current +=
				(desiredAutoSpeed - autoSpeedRef.current) * speedBlend;
			targetProgressRef.current += autoSpeedRef.current * delta;

			const followBlend = 1 - Math.exp(-delta * (draggingRef.current ? 22 : 11));
			progressRef.current +=
				(targetProgressRef.current - progressRef.current) * followBlend;

			const { fit, responsiveRadius, fadeStart, turnSize } = layout;
			const angleStep = 360 / turnSize;
			const cards = cardRefs.current;

			for (let index = 0; index < count; index++) {
				const card = cards[index];
				if (!card) continue;
				const offset =
					modulo(index - progressRef.current + half, count) - half;

				const absOffset = Math.abs(offset);
				const edge = Math.min(absOffset / Math.max(half, 1), 1);
				const opacity = 1 - smoothstep(fadeStart, 1, edge);
				const focus =
					1 - Math.min(absOffset / Math.max(turnSize * 0.65, 1), 1);
				const scale = (1 + (centerScale - 1) * focus) * fit;
				const angleRadians = ((offset * angleStep + rotation) * Math.PI) / 180;
				const x = Math.sin(angleRadians) * responsiveRadius;
				const z = Math.cos(angleRadians) * responsiveRadius;
				const depthScale = clamp(
					perspective / Math.max(perspective - z, 1),
					0.72,
					1.45,
				);
				const visualScale = scale * depthScale;
				const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;

				card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * verticalSpacing * fit}px, 0) rotateZ(${cardTilt}deg) scale(${visualScale})`;
				depthOrder[index] = depth;

				// Only touch the other properties when they actually change; each write forces a style recalc.
				const prev = lastStyle[index] || (lastStyle[index] = {});
				const opacityText = opacity.toFixed(2);
				if (prev.opacity !== opacityText) {
					card.style.opacity = opacityText;
					prev.opacity = opacityText;
				}
				const clickable = opacity > 0.25;
				if (prev.clickable !== clickable) {
					card.style.pointerEvents = clickable ? "auto" : "none";
					prev.clickable = clickable;
				}
			}

			// Rank by depth once per frame; z-index only changes when two cards swap order,
			// instead of on every depth bucket crossing.
			const ranked = depthOrder
				.map((depth, index) => ({ depth, index }))
				.sort((a, b) => a.depth - b.depth);
			for (let rank = 0; rank < ranked.length; rank++) {
				const { index } = ranked[rank];
				const card = cardRefs.current[index];
				if (!card) continue;
				const prev = lastStyle[index];
				const zIndex = rank * 100 + index;
				if (prev.zIndex !== zIndex) {
					card.style.zIndex = String(zIndex);
					prev.zIndex = zIndex;
				}
			}

			frameId = requestAnimationFrame(render);
		};

		frameId = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			window.removeEventListener("scroll", handleScroll);
		};
	}, [
		normalizedItems,
		speed,
		direction,
		animationMode,
		radius,
		perspective,
		cardWidth,
		cardHeight,
		verticalSpacing,
		cardsPerTurn,
		rotation,
		cardTilt,
		centerScale,
		edgeFade,
		pauseOnHover,
	]);

	const rootStyle = {
		perspective: `${perspective}px`,
		"--infinite-spiral-card-width": `${cardWidth}px`,
		"--infinite-spiral-card-height": `${cardHeight}px`,
		"--infinite-spiral-card-radius": `${cardRadius}px`,
		cursor:
			animationMode === "drag" || animationMode === "all" ? "grab" : "default",
		touchAction:
			animationMode === "drag" || animationMode === "all" ? "pan-x" : "auto",
		userSelect:
			animationMode === "drag" || animationMode === "all" ? "none" : "auto",
	};

	const dragEnabled = animationMode === "drag" || animationMode === "all";

	const stopDragging = (event) => {
		if (!draggingRef.current) return;
		draggingRef.current = false;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		event.currentTarget.style.cursor = dragEnabled ? "grab" : "default";
	};

	return (
		<div
			ref={rootRef}
			className={`infinite-spiral ${className}`.trim()}
			style={rootStyle}
			onMouseEnter={() => {
				hoveredRef.current = true;
			}}
			onMouseLeave={() => {
				hoveredRef.current = false;
			}}
			onPointerDown={(event) => {
				if (!dragEnabled || event.button !== 0) return;
				draggingRef.current = true;
				dragMovedRef.current = false;
				lastPointerYRef.current = event.clientY;
				targetProgressRef.current = progressRef.current;
				event.currentTarget.setPointerCapture(event.pointerId);
				event.currentTarget.style.cursor = "grabbing";
			}}
			onPointerMove={(event) => {
				if (!draggingRef.current) return;
				const pointerDelta = event.clientY - lastPointerYRef.current;
				lastPointerYRef.current = event.clientY;
				if (Math.abs(pointerDelta) > 0.5) dragMovedRef.current = true;
				targetProgressRef.current -=
					pointerDelta / Math.max(verticalSpacing, 1);
			}}
			onPointerUp={stopDragging}
			onPointerCancel={stopDragging}
			onClickCapture={(event) => {
				if (!dragMovedRef.current) return;
				event.preventDefault();
				event.stopPropagation();
				dragMovedRef.current = false;
			}}
		>
			<div
				className="infinite-spiral__stage"
				role="list"
				aria-label="Infinite spiral gallery"
			>
				{normalizedItems.map((item, index) => {
					const Card = item.href ? "a" : "div";
					return (
						<Card
							key={item.id ?? `${item.src}-${index}`}
							ref={(node) => {
								cardRefs.current[index] = node;
							}}
							className="infinite-spiral__item"
							style={{
								width: cardWidth,
								height: cardHeight,
								borderRadius: cardRadius,
							}}
							href={item.href}
							target={item.target}
							rel={item.target === "_blank" ? "noreferrer" : undefined}
							role="listitem"
							aria-label={item.label ?? item.alt}
						>
							<img
								className="infinite-spiral__image"
								src={item.src}
								alt={item.alt}
								loading={index < 6 ? "eager" : "lazy"}
								decoding="async"
								draggable={false}
								style={{
									width: cardWidth,
									height: cardHeight,
									maxWidth: "none",
									maxHeight: "none",
									objectFit: imageFit,
									...(grayscale > 0
										? { filter: `grayscale(${Math.min(1, grayscale)})` }
										: null),
								}}
							/>
						</Card>
					);
				})}
			</div>
		</div>
	);
};

export default InfiniteSpiral;
