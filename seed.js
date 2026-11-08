// One-file database reset. Run from the project root: npm run seed
//
// Drops the whole database and rebuilds it: catalog, indexes, order counter,
// and the admin account from backend/.env. The admin starts with 2FA not
// enrolled, so the first sign-in shows the enrollment QR code.
// ES module, no imports from src/ or backend/ — the whole seed lives here.
// Set MONGODB_DB to seed a throwaway database instead of the real one.
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing. Copy backend/.env.example to backend/.env.");

const dbName = process.env.MONGODB_DB || "crisells";

const catalog = [
	{
		id: "canon-r5",
		name: "Canon EOS R5",
		brand: "Canon",
		category: "Mirrorless",
		pricePerDay: 89,
		image:
			"https://images.pexels.com/photos/19969445/pexels-photo-19969445.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/19969445/pexels-photo-19969445.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/19969452/pexels-photo-19969452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/19969447/pexels-photo-19969447.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.9,
		reviews: 214,
		description:
			"A full-frame powerhouse with 45MP resolution and 8K internal recording. The R5 is Canon's flagship mirrorless, built for professionals who refuse to compromise between stills and cinema.",
		specs: {
			sensor: "Full-Frame CMOS",
			resolution: "45 MP",
			video: "8K RAW / 4K 120p",
			weight: "738 g",
			mount: "Canon RF",
			battery: "LP-E6NH",
		},
		features: [
			"In-Body Image Stabilization",
			"8K Internal RAW Recording",
			"Pixel AF II",
			"Weather Sealed",
		],
		tag: "Flagship",
		sku: "CAN-R5-001",
		stock: 5,
		lowStockThreshold: 2,
		variants: [
			{ id: "v1", name: "Kit", value: "Body + 24-105mm", stock: 3, sku: "CAN-R5-KIT" },
			{ id: "v2", name: "Body Only", value: "Body only", stock: 2, sku: "CAN-R5-BODY" },
		],
	},
	{
		id: "sony-a7iv",
		name: "Sony Alpha A7 IV",
		brand: "Sony",
		category: "Mirrorless",
		pricePerDay: 75,
		image:
			"https://images.pexels.com/photos/19969452/pexels-photo-19969452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/19969452/pexels-photo-19969452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/14830216/pexels-photo-14830216.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/14396385/pexels-photo-14396385.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.8,
		reviews: 187,
		description:
			"The hybrid full-frame camera that redefines versatility. 33MP stills, 4K 60p video, and Sony's legendary autofocus make the A7 IV the ultimate all-rounder.",
		specs: {
			sensor: "Full-Frame Exmor R",
			resolution: "33 MP",
			video: "4K 60p",
			weight: "658 g",
			mount: "Sony E",
			battery: "NP-FZ100",
		},
		features: [
			"Real-time Eye AF",
			"5-axis Stabilization",
			"10-bit 4:2:2 Recording",
			"Dual Card Slots",
		],
		tag: "Popular",
		sku: "SON-A74-001",
		stock: 1,
		lowStockThreshold: 2,
		variants: [{ id: "v1", name: "Body Only", value: "Body only", stock: 1, sku: "SON-A74-BODY" }],
	},
	{
		id: "nikon-z8",
		name: "Nikon Z8",
		brand: "Nikon",
		category: "Mirrorless",
		pricePerDay: 95,
		image:
			"https://images.pexels.com/photos/32130078/pexels-photo-32130078.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/32130078/pexels-photo-32130078.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/34808844/pexels-photo-34808844.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/3497060/pexels-photo-3497060.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.9,
		reviews: 132,
		description:
			"Nikon's no-compromise mirrorless flagship. 45.7MP stacked sensor, 8K/60p N-RAW, and 120fps burst capture. The Z8 is a studio in your hands.",
		specs: {
			sensor: "Full-Frame Stacked CMOS",
			resolution: "45.7 MP",
			video: "8K 60p N-RAW",
			weight: "910 g",
			mount: "Nikon Z",
			battery: "EN-EL15c",
		},
		features: [
			"Stacked CMOS Sensor",
			"120 fps Burst",
			"8K RAW Internal",
			"No Mechanical Shutter",
		],
		tag: "New",
		sku: "NIK-Z8-001",
		stock: 4,
		lowStockThreshold: 2,
		variants: [{ id: "v1", name: "Body Only", value: "Body only", stock: 4, sku: "NIK-Z8-BODY" }],
	},
	{
		id: "canon-5d4",
		name: "Canon EOS 5D Mark IV",
		brand: "Canon",
		category: "DSLR",
		pricePerDay: 55,
		image:
			"https://images.pexels.com/photos/3856053/pexels-photo-3856053.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/3856053/pexels-photo-3856053.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/17345662/pexels-photo-17345662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/11234300/pexels-photo-11234300.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.7,
		reviews: 298,
		description:
			"The workhorse DSLR that defined a generation. 30.4MP full-frame, 4K video, and legendary Canon color science. A timeless choice for any shoot.",
		specs: {
			sensor: "Full-Frame CMOS",
			resolution: "30.4 MP",
			video: "4K 30p",
			weight: "890 g",
			mount: "Canon EF",
			battery: "LP-E6N",
		},
		features: ["Dual Pixel RAW", "61-point AF System", "Built-in GPS", "Wi-Fi + NFC"],
		sku: "CAN-5D4-001",
		stock: 3,
		lowStockThreshold: 1,
	},
	{
		id: "nikon-d850",
		name: "Nikon D850",
		brand: "Nikon",
		category: "DSLR",
		pricePerDay: 60,
		image:
			"https://images.pexels.com/photos/17345662/pexels-photo-17345662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/17345662/pexels-photo-17345662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/3856053/pexels-photo-3856053.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/32927774/pexels-photo-32927774.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.8,
		reviews: 176,
		description:
			"45.7MP of pure resolution without the bulk of a medium format. The D850 remains the gold standard for landscape, studio, and architectural photography.",
		specs: {
			sensor: "Full-Frame BSI CMOS",
			resolution: "45.7 MP",
			video: "4K 30p",
			weight: "1005 g",
			mount: "Nikon F",
			battery: "EN-EL15a",
		},
		features: [
			"Backside-Illuminated Sensor",
			"Tilting Touchscreen",
			"SnapBridge Bluetooth",
			"Focus Stacking",
		],
		sku: "NIK-D850-001",
		stock: 0,
		lowStockThreshold: 1,
	},
	{
		id: "red-komodo",
		name: "RED KOMODO 6K",
		brand: "RED",
		category: "Cinema",
		pricePerDay: 175,
		image:
			"https://images.pexels.com/photos/10395639/pexels-photo-10395639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/10395639/pexels-photo-10395639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/34516677/pexels-photo-34516677.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/34680730/pexels-photo-34680730.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 5.0,
		reviews: 64,
		description:
			"A true cinema camera in a compact body. 6K Super35 sensor, global shutter, and RED's legendary RAW workflow. Built for filmmakers who demand total control.",
		specs: {
			sensor: "Super35 Global Shutter",
			resolution: "6K",
			video: "6K 40p R3D RAW",
			weight: "920 g",
			mount: "Canon RF",
			battery: "BP-25",
		},
		features: [
			"Global Shutter",
			"R3D RAW Recording",
			"Phase Detect AF",
			"Compact Cinema Body",
		],
		tag: "Pro Cinema",
		sku: "RED-KOM-001",
		stock: 3,
		lowStockThreshold: 1,
		variants: [
			{ id: "v1", name: "Standard", value: "Body + monitor", stock: 2, sku: "RED-KOM-STD" },
			{ id: "v2", name: "Pro Kit", value: "Body + monitor + lenses", stock: 1, sku: "RED-KOM-PRO" },
		],
	},
	{
		id: "sony-fx3",
		name: "Sony FX3",
		brand: "Sony",
		category: "Cinema",
		pricePerDay: 120,
		image:
			"https://images.pexels.com/photos/2443272/pexels-photo-2443272.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/2443272/pexels-photo-2443272.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/34516668/pexels-photo-34516668.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.9,
		reviews: 89,
		description:
			"The full-frame cinema line, reimagined. 4K 120p, S-Cinet3 color science, and active cooling for unlimited recording. The FX3 is cinema without the cinema rig.",
		specs: {
			sensor: "Full-Frame Exmor R",
			resolution: "12.1 MP",
			video: "4K 120p 10-bit",
			weight: "715 g",
			mount: "Sony E",
			battery: "NP-FZ100",
		},
		features: [
			"S-Cinet3 Color Science",
			"Active Cooling System",
			"Cinema Line Build",
			"15+ stops Dynamic Range",
		],
		sku: "SON-FX3-001",
		stock: 2,
		lowStockThreshold: 1,
	},
	{
		id: "dji-mavic3",
		name: "DJI Mavic 3 Pro",
		brand: "DJI",
		category: "Drone",
		pricePerDay: 65,
		image:
			"https://images.pexels.com/photos/3823555/pexels-photo-3823555.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/3823555/pexels-photo-3823555.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/3722737/pexels-photo-3722737.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/442589/pexels-photo-442589.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.8,
		reviews: 143,
		description:
			"The aerial filmmaking drone. Hasselblad camera, 5.1K video, and 46-minute flight time. The Mavic 3 Pro puts a cinema rig in the sky.",
		specs: {
			sensor: "4/3 CMOS Hasselblad",
			resolution: "20 MP",
			video: "5.1K 50p",
			weight: "895 g",
			mount: "Integrated",
			battery: "Intelligent Flight",
		},
		features: [
			"Hasselblad Lens",
			"46-min Flight Time",
			"Omnidirectional Obstacle Sensing",
			"15km Transmission",
		],
		tag: "Popular",
		sku: "DJI-MAV3-001",
		stock: 0,
		lowStockThreshold: 2,
		variants: [
			{ id: "v1", name: "Fly More Combo", value: "Drone + extra batteries", stock: 0, sku: "DJI-MAV3-FMC" },
		],
	},
	{
		id: "dji-air3",
		name: "DJI Air 3",
		brand: "DJI",
		category: "Drone",
		pricePerDay: 45,
		image:
			"https://images.pexels.com/photos/3722737/pexels-photo-3722737.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/3722737/pexels-photo-3722737.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/28879412/pexels-photo-28879412.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/7028561/pexels-photo-7028561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.7,
		reviews: 112,
		description:
			"Dual-camera drone with 1/1.3-inch sensors. 4K 100fps, 46-minute flight, and a folding design that fits in any bag. Your everyday aerial companion.",
		specs: {
			sensor: "Dual 1/1.3-inch CMOS",
			resolution: "48 MP",
			video: "4K 100p",
			weight: "720 g",
			mount: "Integrated",
			battery: "Intelligent Flight",
		},
		features: ["Dual Primary Cameras", "24mm + 70mm Lenses", "O4 HD Transmission", "Folding Design"],
		sku: "DJI-AIR3-001",
		stock: 2,
		lowStockThreshold: 1,
	},
	{
		id: "gopro-hero12",
		name: "GoPro HERO12 Black",
		brand: "GoPro",
		category: "Action",
		pricePerDay: 25,
		image:
			"https://images.pexels.com/photos/36996854/pexels-photo-36996854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/36996854/pexels-photo-36996854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/92722/pexels-photo-92722.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/19065585/pexels-photo-19065585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.6,
		reviews: 256,
		description:
			"5.3K60, 27MP photos, and HyperSmooth 6.0 stabilization. Waterproof to 10m without a housing. The most rugged action camera ever made.",
		specs: {
			sensor: "1/1.9-inch CMOS",
			resolution: "27 MP",
			video: "5.3K 60p",
			weight: "154 g",
			mount: "GoPro Mount",
			battery: "Enduro",
		},
		features: ["HyperSmooth 6.0", "10m Waterproof", "AirPods Audio", "HDR Video"],
		sku: "GP-H12-001",
		stock: 8,
		lowStockThreshold: 3,
		variants: [
			{ id: "v1", name: "Standard", value: "Camera only", stock: 5, sku: "GP-H12-STD" },
			{ id: "v2", name: "Creator Kit", value: "Camera + mods", stock: 3, sku: "GP-H12-CRT" },
		],
	},
	{
		id: "insta360-x4",
		name: "Insta360 X4",
		brand: "Insta360",
		category: "Action",
		pricePerDay: 30,
		image:
			"https://images.pexels.com/photos/19065585/pexels-photo-19065585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/19065585/pexels-photo-19065585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/2238334/pexels-photo-2238334.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/10530990/pexels-photo-10530990.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.5,
		reviews: 98,
		description:
			"8K 360-degree capture in a pocketable body. Reframe any angle in post. The X4 lets you shoot everything and decide later.",
		specs: {
			sensor: "Dual 1/2-inch CMOS",
			resolution: "72 MP",
			video: "8K 360 / 5.7K 60p",
			weight: "203 g",
			mount: "Insta360 Mount",
			battery: "1800mAh",
		},
		features: [
			"8K 360 Capture",
			"Invisible Selfie Stick",
			"FlowState Stabilization",
			"Waterproof to 10m",
		],
		sku: "INSTA-X4-001",
		stock: 4,
		lowStockThreshold: 2,
	},
	{
		id: "pentax-67",
		name: "Pentax 6x7 Medium Format",
		brand: "Pentax",
		category: "Film",
		pricePerDay: 40,
		image:
			"https://images.pexels.com/photos/4372403/pexels-photo-4372403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		gallery: [
			"https://images.pexels.com/photos/4372403/pexels-photo-4372403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/3733981/pexels-photo-3733981.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
			"https://images.pexels.com/photos/9799073/pexels-photo-9799073.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
		],
		rating: 4.9,
		reviews: 41,
		description:
			"The legendary medium format film camera. Massive 6x7 negatives, built-like-a-tank construction, and that unmistakable analog soul. For purists only.",
		specs: {
			sensor: "120 Film (6x7)",
			resolution: "Film",
			video: "N/A",
			weight: "1290 g",
			mount: "Pentax 67",
			battery: "SR44",
		},
		features: ["6x7 Medium Format", "Interchangeable Lenses", "TTL Metering Prism", "Mirror Lock-up"],
		tag: "Vintage",
		sku: "PENTAX-67-001",
		stock: 2,
		lowStockThreshold: 1,
	},
];

function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, salt, 64).toString("hex");
	return `scrypt$${salt}$${hash}`;
}

function buildProduct(camera) {
	const stock = camera.stock;
	const sku = camera.sku;
	return {
		...camera,
		imageAlt: `${camera.name} ${camera.category.toLowerCase()} camera`,
		variants:
			camera.variants ??
			[{ id: "v1", name: "Body only", value: "Body only", stock, sku: `${sku}-BODY` }],
		available: stock > 0,
	};
}

const client = new MongoClient(uri, {
	serverSelectionTimeoutMS: 20000,
	connectTimeoutMS: 10000,
	maxPoolSize: 10,
});

await client.connect();
const db = client.db(dbName);

// Full reset: collections, indexes, and all documents go.
await db.dropDatabase();

await Promise.all([
	db.collection("users").createIndex({ email: 1 }, { unique: true }),
	db.collection("products").createIndex({ id: 1 }, { unique: true }),
	db.collection("products").createIndex({ sku: 1 }, { unique: true }),
	db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true }),
	db.collection("orders").createIndex({ userId: 1 }),
	db.collection("orders").createIndex({ createdAt: -1 }),
	db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
	db.collection("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
	db.collection("passwordResets").createIndex({ tokenHash: 1 }, { unique: true }),
]);

await db.collection("products").insertMany(catalog.map(buildProduct));

// Rebuild the admin login so the brand-new database is usable without a restart.
// 2FA is left unenrolled on purpose: the first sign-in shows the enrollment QR.
const totpAccount = process.env.TOTP_ACCOUNT || "admin@crisells.com";
const adminEmail = (process.env.ADMIN_EMAIL || totpAccount).trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";

if (adminPassword) {
	await db.collection("users").insertOne({
		email: adminEmail,
		name: adminEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
		phone: "",
		address: "123 Sample Street, Quezon City",
		passwordHash: hashPassword(adminPassword),
		role: "admin",
		createdAt: new Date(),
	});
} else {
	console.warn("ADMIN_PASSWORD is empty — no admin account was created.");
}

// First real order is CRS-1001.
await db.collection("counters").insertOne({ _id: "orders", seq: 1000 });

console.log(`Reset database "${dbName}": ${catalog.length} products, 0 orders, 0 sessions.`);
console.log(
	adminPassword
		? `Admin login: ${adminEmail} (2FA not enrolled — the QR is shown on first sign-in)`
		: "Admin login: none — set ADMIN_PASSWORD in backend/.env and run again.",
);
console.log("Next order number: CRS-1001.");

await client.close();
