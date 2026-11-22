import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
	latitude?: number;
	longitude?: number;
	onPick: (latitude: number, longitude: number) => void;
}

// Fallback view until the customer taps a spot or uses "Use my current location".
const DEFAULT_CENTER: [number, number] = [12.8797, 121.774];

// Inline SVG pin so we don't depend on Leaflet's bundled marker images, which
// break under Vite's asset pipeline.
const pinIcon = L.divIcon({
	className: "",
	html: '<svg viewBox="0 0 24 24" width="34" height="34" fill="#ff2bd1" stroke="#f7f3ff" stroke-width="1.2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>',
	iconSize: [34, 34],
	iconAnchor: [17, 34],
});

export default function LocationPicker({ latitude, longitude, onPick }: LocationPickerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const onPickRef = useRef(onPick);
	useEffect(() => {
		onPickRef.current = onPick;
	}, [onPick]);

	// Only the values present when the drawer opened matter for the initial center.
	const initial = useRef({ latitude, longitude });

	const ensureMarker = useCallback((map: L.Map, lat: number, lng: number) => {
		if (markerRef.current) {
			markerRef.current.setLatLng([lat, lng]);
			return;
		}
		const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
		marker.on("dragend", () => {
			const point = marker.getLatLng();
			onPickRef.current(point.lat, point.lng);
		});
		markerRef.current = marker;
	}, []);

	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;

		const { latitude: lat, longitude: lng } = initial.current;
		const hasPin = lat != null && lng != null;
		const center: [number, number] = hasPin ? [lat, lng] : DEFAULT_CENTER;

		const map = L.map(containerRef.current, {
			center,
			zoom: hasPin ? 16 : 6,
			scrollWheelZoom: false,
		});
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: "&copy; OpenStreetMap contributors",
		}).addTo(map);

		if (hasPin) ensureMarker(map, lat, lng);

		map.on("click", (event: L.LeafletMouseEvent) => {
			ensureMarker(map, event.latlng.lat, event.latlng.lng);
			onPickRef.current(event.latlng.lat, event.latlng.lng);
		});

		// The drawer animates in, so the container is briefly zero-sized.
		const resize = window.setTimeout(() => map.invalidateSize(), 250);

		mapRef.current = map;
		return () => {
			window.clearTimeout(resize);
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
	}, [ensureMarker]);

	// Move the pin when "Use my current location" changes the coords.
	useEffect(() => {
		const map = mapRef.current;
		if (!map || latitude == null || longitude == null) return;

		const current = markerRef.current?.getLatLng();
		if (current && current.lat === latitude && current.lng === longitude) return;

		ensureMarker(map, latitude, longitude);
		map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
	}, [latitude, longitude, ensureMarker]);

	return (
		<div>
			<p className="text-xs text-ink/50">
				Tap the map or drag the pin to your exact delivery spot.
			</p>
			<div ref={containerRef} className="mt-2 h-56 w-full overflow-hidden rounded-xl border border-white/10 z-0" />
			{latitude != null && longitude != null && (
				<p className="mt-1 text-[11px] text-ink/40">
					Pinned at {latitude.toFixed(5)}, {longitude.toFixed(5)}
				</p>
			)}
		</div>
	);
}
