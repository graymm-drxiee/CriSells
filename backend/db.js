import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing. Copy backend/.env.example to backend/.env.");

export let db;
export let users;
export let products;
export let orders;
export let sessions;
export let passwordResets;
export let counters;
export let settings;

// Some networks (this one included) drop a large share of Atlas TLS handshakes,
// so a single connect() can fail intermittently. Keep retrying instead of crashing.
async function openClient() {
	for (let attempt = 1; ; attempt++) {
		const client = new MongoClient(uri, {
			serverSelectionTimeoutMS: 20000,
			connectTimeoutMS: 10000,
			maxPoolSize: 10,
		});
		try {
			await client.connect();
			return client;
		} catch (err) {
			await client.close().catch(() => {});
			if (attempt >= 12) throw err;
			console.warn(`MongoDB connect attempt ${attempt} failed (${err.code || err.message}); retrying…`);
			await new Promise((resolve) => setTimeout(resolve, 1500));
		}
	}
}

export async function connect() {
	const client = await openClient();
	db = client.db(process.env.MONGODB_DB || "crisells");
	users = db.collection("users");
	products = db.collection("products");
	orders = db.collection("orders");
	sessions = db.collection("sessions");
	passwordResets = db.collection("passwordResets");
	counters = db.collection("counters");
	settings = db.collection("settings");

	await Promise.all([
		users.createIndex({ email: 1 }, { unique: true }),
		products.createIndex({ id: 1 }, { unique: true }),
		products.createIndex({ sku: 1 }, { unique: true }),
		orders.createIndex({ orderNumber: 1 }, { unique: true }),
		orders.createIndex({ userId: 1 }),
		orders.createIndex({ createdAt: -1 }),
		// Expired sessions are deleted by Mongo itself.
		sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
		passwordResets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
		passwordResets.createIndex({ tokenHash: 1 }, { unique: true }),
	]);
}
