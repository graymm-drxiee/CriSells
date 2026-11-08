export default function CameraIcon({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 512 450"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="28"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{/* Top dial */}
			<path d="M120 88h120c12 0 22 10 22 22v16H98v-16c0-12 10-22 22-22z" fill="currentColor" stroke="none" />
			
			{/* Main body */}
			<rect x="42" y="126" width="300" height="240" rx="44" fill="currentColor" stroke="none" />
			
			{/* Grip curve cutout / line */}
			<path d="M110 160c40 30 40 140 0 170" fill="none" stroke="#121212" strokeWidth="24" />

			{/* Viewfinder / top prism bump */}
			<path d="M260 126l40-70h110c18 0 32 14 32 32v188z" fill="currentColor" stroke="none" />
			<rect x="312" y="90" width="64" height="42" rx="12" fill="#121212" stroke="none" />

			{/* Lens outer circle */}
			<circle cx="330" cy="246" r="110" fill="#121212" stroke="currentColor" strokeWidth="32" />
			
			{/* Lens inner circle */}
			<circle cx="330" cy="246" r="54" fill="currentColor" stroke="none" />
			
			{/* Lens highlight */}
			<circle cx="310" cy="222" r="20" fill="#121212" stroke="none" />
			
			{/* Red recording dot */}
			<circle cx="314" cy="280" r="12" fill="#ef4444" stroke="none" />
		</svg>
	);
}
