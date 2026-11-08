import express from "express";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { connect, users, products, orders, sessions, passwordResets, counters, settings } from "./db.js";

const port = Number(process.env.PORT) || 4000;
const issuer = process.env.TOTP_ISSUER || "CriSells";
const totpAccount = process.env.TOTP_ACCOUNT || "admin@crisells.com";
const adminEmail = (process.env.ADMIN_EMAIL || totpAccount).trim().toLowerCase();
const sessionTtl = 8 * 60 * 60 * 1000;
const rememberTtl = 30 * 24 * 60 * 60 * 1000;
const resetTtl = 60 * 60 * 1000;
const adminCookie = "crisells_admin_session";
const clientCookie = "crisells_client_session";
const isProd = process.env.NODE_ENV === "production";

// ---------- 2FA ----------

// One authenticator secret per user, stored on the user document.
function totpFor(user) {
	return new OTPAuth.TOTP({
		issuer,
		label: user.email,
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(user.totpSecret),
	});
}

// A code is accepted once only, even if it is replayed inside its 30s window.
function validTotpStep(user, code) {
	const delta = totpFor(user).validate({ token: code, window: 1 });
	if (delta === null) return null;
	const step = Math.floor(Date.now() / 30000) + delta;
	if (step <= (user.totpLastStep || 0)) return null;
	return step;
}

// ---------- sessions ----------

function readCookie(req, name) {
	const raw = req.headers.cookie || "";
	return (
		raw
			.split(";")
			.map((part) => part.trim())
			.find((part) => part.startsWith(`${name}=`))
			?.slice(name.length + 1) || null
	);
}

async function issueSession(res, role, data = {}, ttl = sessionTtl) {
	const token = crypto.randomBytes(32).toString("hex");
	const cookieName = role === "admin" ? adminCookie : clientCookie;
	await sessions.insertOne({
		token,
		role,
		...data,
		expiresAt: new Date(Date.now() + ttl),
	});
	res.append(
		"Set-Cookie",
		`${cookieName}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${ttl / 1000}${
			isProd ? "; Secure" : ""
		}`,
	);
}

async function readSession(req, role) {
	const token = readCookie(req, role === "admin" ? adminCookie : clientCookie);
	if (!token) return null;
	const session = await sessions.findOne({ token, role });
	if (!session) return null;
	if (session.expiresAt < new Date()) {
		await sessions.deleteOne({ token });
		return null;
	}
	return session;
}

async function clearSession(req, res, role) {
	const cookieName = role === "admin" ? adminCookie : clientCookie;
	const token = readCookie(req, cookieName);
	if (token) await sessions.deleteOne({ token });
	res.append("Set-Cookie", `${cookieName}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
}

// A ticket issued only after the password check, before the authenticator code.
// Without it the 2FA setup/verify endpoints would hand the secret to anyone.
const pendingLogins = new Map();
const pendingTtl = 5 * 60 * 1000;

function issuePendingLogin(userId) {
	const now = Date.now();
	for (const [token, entry] of pendingLogins) {
		if (entry.expiresAt < now) pendingLogins.delete(token);
	}
	const token = crypto.randomBytes(32).toString("hex");
	pendingLogins.set(token, { userId, expiresAt: now + pendingTtl });
	return token;
}

function readPendingLogin(token) {
	const entry = typeof token === "string" ? pendingLogins.get(token) : null;
	if (!entry) return null;
	if (entry.expiresAt < Date.now()) {
		pendingLogins.delete(token);
		return null;
	}
	return entry;
}

// ---------- rate limiting (shared by 2FA and client login) ----------

const attempts = new Map();

function tooManyAttempts(ip) {
	const now = Date.now();
	const entry = attempts.get(ip);
	if (!entry || entry.reset < now) {
		attempts.set(ip, { count: 0, reset: now + 10 * 60 * 1000 });
		return false;
	}
	return entry.count >= 10;
}

function recordFailure(ip) {
	const entry = attempts.get(ip);
	if (entry) entry.count += 1;
}

function clearFailures(ip) {
	attempts.delete(ip);
}

// ---------- helpers ----------

const route = (fn) => (req, res) =>
	Promise.resolve(fn(req, res)).catch((err) => {
		if (err.status) return res.status(err.status).json({ error: err.message });
		console.error(err);
		if (!res.headersSent) res.status(500).json({ error: "Something went wrong. Please try again." });
	});

function badRequest(message) {
	return Object.assign(new Error(message), { status: 400 });
}

function normalizeEmail(value) {
	return String(value || "").trim().toLowerCase();
}

function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, salt, 64).toString("hex");
	return `scrypt$${salt}$${hash}`;
}

function checkPassword(password, stored) {
	const [, salt, hash] = String(stored || "").split("$");
	if (!salt || !hash) return false;
	const known = Buffer.from(hash, "hex");
	const test = crypto.scryptSync(password, salt, known.length);
	return known.length === test.length && crypto.timingSafeEqual(known, test);
}

// Staff roles must clear the authenticator step; customers never see it.
const ADMIN_ROLES = ["admin", "owner", "staff"];
const needsTwoFactor = (user) => ADMIN_ROLES.includes(user.role);

function publicUser(user) {
	return {
		email: user.email,
		name: user.name,
		phone: user.phone || "",
		address: user.address || "",
		role: user.role || "customer",
	};
}

// The admin account is a normal user row, seeded from the env on boot so the
// client login can handle it. Changing ADMIN_PASSWORD rotates the stored hash.
async function ensureAdminUser() {
	if (!adminEmail) return;
	const password = process.env.ADMIN_PASSWORD || "";
	const existing = await users.findOne({ email: adminEmail });

	if (!existing) {
		if (!password) {
			console.warn("ADMIN_PASSWORD is empty — the admin account was not created.");
			return;
		}
		await users.insertOne({
			email: adminEmail,
			name: adminEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
			phone: "",
			address: "",
			passwordHash: hashPassword(password),
			role: "admin",
			createdAt: new Date(),
		});
	} else {
		const patch = { role: "admin" };
		if (password && !checkPassword(password, existing.passwordHash)) {
			patch.passwordHash = hashPassword(password);
		}
		await users.updateOne({ _id: existing._id }, { $set: patch });
	}

	const admin = await users.findOne({ email: adminEmail });
	if (!admin) return;

	// An env secret is the recovery path and always wins.
	const envSecret = (process.env.TOTP_SECRET || "").trim().toUpperCase();
	if (envSecret) {
		await users.updateOne(
			{ _id: admin._id },
			{ $set: { totpSecret: envSecret, totpEnrolled: true } },
		);
		return;
	}

	// One-time move of the old global secret onto the admin account.
	if (admin.totpSecret) return;
	const legacy = await settings.findOne({ _id: "totp" });
	if (legacy?.secret) {
		await users.updateOne(
			{ _id: admin._id },
			{ $set: { totpSecret: legacy.secret, totpEnrolled: !!legacy.enrolled, totpLastStep: 0 } },
		);
	}
}

function slugify(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function calcDays(start, end) {
	const s = new Date(start).getTime();
	const e = new Date(end).getTime();
	if (!Number.isFinite(s) || !Number.isFinite(e) || !start || !end || e < s) return 0;
	return Math.max(1, Math.round((e - s) / 86400000));
}

const productFields = [
	"name",
	"brand",
	"category",
	"pricePerDay",
	"sku",
	"stock",
	"lowStockThreshold",
	"image",
	"imageAlt",
	"description",
	"variants",
	"gallery",
	"specs",
	"features",
	"rating",
	"reviews",
	"tag",
];

function pickProductFields(body) {
	const patch = {};
	for (const key of productFields) if (body[key] !== undefined) patch[key] = body[key];
	return patch;
}

function publicOrder(doc) {
	const { _id, ...rest } = doc;
	return { ...rest, id: _id.toString(), createdAt: doc.createdAt.toISOString() };
}

// ---------- app ----------

const app = express();
// Behind a reverse proxy the client IP arrives in X-Forwarded-For; without this the
// auth limiter would bucket every visitor under the proxy's address.
if (isProd) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
app.disable("x-powered-by");
app.use((_req, res, next) => {
	res.set({
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	});
	next();
});

// Broad per-IP cap so catalogue reads and order spam cannot hammer the API.
// Auth routes keep their own stricter limiter below.
const apiHits = new Map();
app.use("/api", (req, res, next) => {
	const now = Date.now();
	if (apiHits.size > 5000) {
		for (const [ip, entry] of apiHits) if (entry.reset < now) apiHits.delete(ip);
	}
	const entry = apiHits.get(req.ip);
	if (!entry || entry.reset < now) {
		apiHits.set(req.ip, { count: 1, reset: now + 60_000 });
		return next();
	}
	if (++entry.count > 240) return res.status(429).json({ error: "Too many requests. Please slow down." });
	next();
});

// Only product writes carry images (as data URLs); keep every other route small.
app.use("/api/admin/products", express.json({ limit: "12mb" }));
app.use(express.json({ limit: "1mb" }));

// ---------- admin session ----------

app.get(
	"/api/admin/me",
	route(async (req, res) => {
		const session = await readSession(req, "admin");
		if (!session) return res.status(401).json({ error: "Not signed in." });
		res.json({
			user: { email: session.email, name: session.name, role: session.userRole || "admin" },
		});
	}),
);

app.post(
	"/api/admin/logout",
	route(async (req, res) => {
		await clearSession(req, res, "admin");
		await clearSession(req, res, "client");
		res.json({ ok: true });
	}),
);

// ---------- client auth ----------

app.post(
	"/api/auth/register",
	route(async (req, res) => {
		const ip = req.ip;
		if (tooManyAttempts(ip)) return res.status(429).json({ error: "Too many attempts. Try again later." });

		const name = String(req.body?.name || "").trim();
		const phone = String(req.body?.phone || "").replace(/\D/g, "");
		const address = String(req.body?.address || "").trim();
		const email = normalizeEmail(req.body?.email);
		const password = String(req.body?.password || "");

		if (name.length < 2) return res.status(400).json({ error: "Please enter your full name." });
		if (phone.length < 7 || phone.length > 15) return res.status(400).json({ error: "Please enter a valid phone number." });
		if (address.length < 5) return res.status(400).json({ error: "Please enter your delivery address." });
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
		if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

		if (await users.findOne({ email })) {
			return res.status(409).json({ error: "An account with that email already exists." });
		}

		const doc = {
			email,
			name,
			phone,
			address,
			passwordHash: hashPassword(password),
			role: "customer",
			createdAt: new Date(),
		};
		try {
			const { insertedId } = await users.insertOne(doc);
			await issueSession(res, "client", { userId: insertedId.toString(), email, name, phone });
			res.status(201).json({ user: { email, name, phone, address, role: "customer" } });
		} catch (err) {
			if (err?.code === 11000) return res.status(409).json({ error: "An account with that email already exists." });
			throw err;
		}
	}),
);

app.post(
	"/api/auth/login",
	route(async (req, res) => {
		const ip = req.ip;
		if (tooManyAttempts(ip)) return res.status(429).json({ error: "Too many attempts. Try again later." });

		const email = normalizeEmail(req.body?.email);
		const password = String(req.body?.password || "");
		const user = await users.findOne({ email });
		if (!user || !checkPassword(password, user.passwordHash)) {
			recordFailure(ip);
			return res.status(401).json({ error: "Wrong email or password." });
		}
		clearFailures(ip);

		if (needsTwoFactor(user)) {
			return res.json({
				twoFactor: true,
				pending: issuePendingLogin(user._id.toString()),
				user: publicUser(user),
			});
		}

		await issueSession(
			res,
			"client",
			{ userId: user._id.toString(), email: user.email, name: user.name, phone: user.phone || "", userRole: "customer" },
			req.body?.remember === true ? rememberTtl : sessionTtl,
		);
		res.json({ user: publicUser(user) });
	}),
);

async function issueLoginSessions(res, user) {
	const data = {
		userId: user._id.toString(),
		email: user.email,
		name: user.name,
		phone: user.phone || "",
		userRole: user.role || "customer",
	};
	await issueSession(res, "client", data);
	if (needsTwoFactor(user)) await issueSession(res, "admin", data);
}

async function pendingUser(token) {
	const entry = readPendingLogin(token);
	if (!entry) return null;
	const user = await users.findOne({ _id: new ObjectId(entry.userId) });
	return user && needsTwoFactor(user) ? user : null;
}

app.get(
	"/api/auth/2fa",
	route(async (req, res) => {
		const user = await pendingUser(req.query?.pending);
		if (!user) return res.status(401).json({ error: "Sign in again to continue." });
		if (user.totpEnrolled) return res.json({ enrolled: true, issuer, account: user.email });

		if (!user.totpSecret) {
			user.totpSecret = new OTPAuth.Secret({ size: 20 }).base32;
			await users.updateOne(
				{ _id: user._id },
				{ $set: { totpSecret: user.totpSecret, totpEnrolled: false } },
			);
		}
		const uri = totpFor(user).toString();
		const qr = await QRCode.toDataURL(uri, { width: 320, margin: 1 });
		res.json({ enrolled: false, issuer, account: user.email, secret: user.totpSecret, otpauth: uri, qr });
	}),
);

app.post(
	"/api/auth/2fa/enroll",
	route(async (req, res) => {
		const ip = req.ip;
		if (tooManyAttempts(ip)) return res.status(429).json({ error: "Too many attempts. Try again later." });
		const user = await pendingUser(req.body?.pending);
		if (!user) return res.status(401).json({ error: "Sign in again to continue." });
		if (user.totpEnrolled) {
			return res.status(409).json({ error: "Two-factor authentication is already set up." });
		}

		const code = String(req.body?.code ?? "").replace(/\D/g, "");
		const step = user.totpSecret ? validTotpStep(user, code) : null;
		if (step === null) {
			recordFailure(ip);
			return res
				.status(401)
				.json({ error: "Invalid or expired code. Check that your phone's time is set automatically." });
		}

		clearFailures(ip);
		await users.updateOne(
			{ _id: user._id },
			{ $set: { totpEnrolled: true, totpLastStep: step } },
		);
		pendingLogins.delete(req.body.pending);
		await issueLoginSessions(res, user);
		res.json({ user: publicUser(user) });
	}),
);

app.post(
	"/api/auth/2fa/verify",
	route(async (req, res) => {
		const ip = req.ip;
		if (tooManyAttempts(ip)) return res.status(429).json({ error: "Too many attempts. Try again later." });
		const user = await pendingUser(req.body?.pending);
		if (!user) return res.status(401).json({ error: "Sign in again to continue." });
		if (!user.totpEnrolled) {
			return res.status(409).json({ error: "Authenticator app is not set up yet." });
		}

		const code = String(req.body?.code ?? "").replace(/\D/g, "");
		const step = validTotpStep(user, code);
		if (step === null) {
			recordFailure(ip);
			return res
				.status(401)
				.json({ error: "Invalid or expired code. Check that your phone's time is set automatically." });
		}

		clearFailures(ip);
		await users.updateOne({ _id: user._id }, { $set: { totpLastStep: step } });
		pendingLogins.delete(req.body.pending);
		await issueLoginSessions(res, user);
		res.json({ user: publicUser(user) });
	}),
);

app.get(
	"/api/auth/me",
	route(async (req, res) => {
		const session = await readSession(req, "client");
		if (!session) return res.status(401).json({ error: "Not signed in." });
		const user = ObjectId.isValid(session.userId)
			? await users.findOne({ _id: ObjectId.createFromHexString(session.userId) })
			: null;
		res.json({
			user: user
				? publicUser(user)
				: {
						email: session.email,
						name: session.name,
						phone: session.phone || "",
						role: session.userRole || "customer",
					},
		});
	}),
);

app.post(
	"/api/auth/logout",
	route(async (req, res) => {
		await clearSession(req, res, "client");
		await clearSession(req, res, "admin");
		res.json({ ok: true });
	}),
);

// Shortcut: reset links are logged to the server console until an email provider is wired up.
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

app.post(
	"/api/auth/forgot-password",
	route(async (req, res) => {
		const email = normalizeEmail(req.body?.email);
		const user = email ? await users.findOne({ email }) : null;
		if (user && !needsTwoFactor(user)) {
			const token = crypto.randomBytes(32).toString("hex");
			await passwordResets.deleteMany({ userId: user._id.toString() });
			await passwordResets.insertOne({
				tokenHash: hashResetToken(token),
				userId: user._id.toString(),
				expiresAt: new Date(Date.now() + resetTtl),
			});
			const origin = process.env.APP_URL || req.headers.origin || `http://localhost:${port}`;
			// Production logs are shipped/aggregated, so the token must never be written there.
			if (!isProd) console.log(`Password reset for ${email}: ${origin}/reset?token=${token}`);
		}
		// Always the same answer, so this cannot be used to discover accounts.
		res.json({ ok: true });
	}),
);

app.post(
	"/api/auth/reset-password",
	route(async (req, res) => {
		const token = String(req.body?.token || "");
		const password = String(req.body?.password || "");
		if (!token || password.length < 6) {
			return res.status(400).json({ error: "The reset link is invalid or the password is too short." });
		}
		const reset = await passwordResets.findOne({ tokenHash: hashResetToken(token) });
		if (!reset || reset.expiresAt < new Date()) {
			return res.status(400).json({ error: "This reset link has expired. Request a new one." });
		}
		const user = await users.findOne({ _id: new ObjectId(reset.userId) });
		if (!user) return res.status(400).json({ error: "This reset link is no longer valid." });

		await users.updateOne({ _id: user._id }, { $set: { passwordHash: hashPassword(password) } });
		await passwordResets.deleteMany({ userId: reset.userId });
		await sessions.deleteMany({ role: "client", userId: reset.userId });
		res.json({ ok: true });
	}),
);

// ---------- products ----------

app.get(
	"/api/products",
	route(async (_req, res) => {
		// Revalidate on every load: stock changes show on the next view, repeats still cost a 304.
		res.set("Cache-Control", "public, max-age=0, must-revalidate");
		const list = await products.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
		res.json(list);
	}),
);

app.get(
	"/api/admin/products",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });
		res.json(await products.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray());
	}),
);

app.post(
	"/api/admin/products",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });

		const patch = pickProductFields(req.body || {});
		if (!patch.name || String(patch.name).trim().length < 2) throw badRequest("Product name is required.");
		if (!patch.sku || String(patch.sku).trim().length < 3) throw badRequest("SKU is required.");
		if (!(Number(patch.pricePerDay) > 0)) throw badRequest("Price must be greater than zero.");

		const sku = String(patch.sku).trim().toUpperCase();
		if (await products.findOne({ sku })) return res.status(409).json({ error: "That SKU already exists." });

		const base = slugify(patch.name) || "product";
		let id = base;
		for (let n = 2; await products.findOne({ id }); n += 1) id = `${base}-${n}`;

		const stock = Math.max(0, Math.floor(Number(patch.stock) || 0));
		const doc = {
			brand: "",
			category: "Mirrorless",
			description: "",
			image: "",
			imageAlt: patch.name,
			lowStockThreshold: 2,
			variants: [],
			...patch,
			id,
			sku,
			stock,
			pricePerDay: Number(patch.pricePerDay),
			available: stock > 0,
		};
		await products.insertOne(doc);
		delete doc._id;
		res.status(201).json(doc);
	}),
);

app.put(
	"/api/admin/products/:id",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });

		const existing = await products.findOne({ id: req.params.id });
		if (!existing) return res.status(404).json({ error: "Product not found." });

		const patch = pickProductFields(req.body || {});
		if (patch.sku) {
			patch.sku = String(patch.sku).trim().toUpperCase();
			const dup = await products.findOne({ sku: patch.sku, id: { $ne: req.params.id } });
			if (dup) return res.status(409).json({ error: "That SKU already exists." });
		}
		const stock = patch.stock !== undefined ? Math.max(0, Math.floor(Number(patch.stock) || 0)) : existing.stock;
		const update = { ...patch, stock, available: stock > 0, updatedAt: new Date() };

		const { _id, ...rest } = await products.findOneAndUpdate(
			{ id: req.params.id },
			{ $set: update },
			{ returnDocument: "after" },
		);
		res.json(rest);
	}),
);

app.delete(
	"/api/admin/products/:id",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });
		const result = await products.deleteOne({ id: req.params.id });
		if (!result.deletedCount) return res.status(404).json({ error: "Product not found." });
		res.json({ ok: true });
	}),
);

// ---------- orders ----------

async function nextOrderNumber() {
	const counter = await counters.findOneAndUpdate(
		{ _id: "orders" },
		{ $inc: { seq: 1 } },
		{ upsert: true, returnDocument: "after" },
	);
	return `CRS-${counter.seq}`;
}

async function createOrder({ items, customer, deliveryMode, userId }) {
	if (!Array.isArray(items) || items.length === 0) throw badRequest("Your cart is empty.");
	if (!customer?.fullName?.trim()) throw badRequest("Please enter your full name.");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(customer.email))) throw badRequest("Please enter a valid email address.");
	const address = String(customer.address || "").trim();
	if (deliveryMode !== "pickup" && address.length < 5) throw badRequest("Please enter your delivery address.");

	const lines = [];
	let subtotal = 0;

	for (const item of items) {
		const product = await products.findOne({ id: String(item.productId || "") });
		if (!product) throw badRequest("One of the items is no longer in the catalog.");
		const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
		const days = item.days ? Math.max(1, Math.floor(Number(item.days))) : calcDays(item.startDate, item.endDate);
		if (!days) throw badRequest("Choose a valid rental period.");
		if (product.stock < qty) throw badRequest(`${product.name} is out of stock.`);

		const total = days * product.pricePerDay * qty;
		subtotal += total;
		lines.push({
			productId: product.id,
			name: product.name,
			qty,
			pricePerDay: product.pricePerDay,
			days,
			startDate: item.startDate || null,
			endDate: item.endDate || null,
			total,
		});
	}

	// Reserve stock. If any line fails, put the earlier ones back.
	const taken = [];
	for (const line of lines) {
		const result = await products.updateOne(
			{ id: line.productId, stock: { $gte: line.qty } },
			{ $inc: { stock: -line.qty } },
		);
		if (!result.modifiedCount) {
			for (const done of taken) {
				await products.updateOne({ id: done.productId }, { $inc: { stock: done.qty }, $set: { available: true } });
			}
			throw badRequest(`${line.name} is out of stock.`);
		}
		taken.push(line);
		await products.updateOne({ id: line.productId, stock: 0 }, { $set: { available: false } });
	}

	const insurance = Math.round(subtotal * 0.08);
	const doc = {
		orderNumber: await nextOrderNumber(),
		userId: userId || null,
		customer: {
			fullName: String(customer.fullName).trim(),
			email: normalizeEmail(customer.email),
			phone: String(customer.phone || "").trim(),
			address,
			title: customer.title || "No Title",
			gender: customer.gender || "Prefer Not to Say",
			pronouns: customer.pronouns || "they/them",
		},
		items: lines,
		deliveryMode: deliveryMode === "pickup" ? "pickup" : "door-delivery",
		status: "Pending",
		subtotal,
		insurance,
		total: subtotal + insurance,
		createdAt: new Date(),
		trackingNumber: null,
		shippingLabel: null,
		notes: "",
	};
	const { insertedId } = await orders.insertOne(doc);
	return publicOrder({ ...doc, _id: insertedId });
}

app.post(
	"/api/orders",
	route(async (req, res) => {
		const session = await readSession(req, "client");
		if (!session) return res.status(401).json({ error: "Please sign in to reserve." });
		const order = await createOrder({ ...req.body, userId: session.userId });
		res.status(201).json({ order });
	}),
);

app.get(
	"/api/orders",
	route(async (req, res) => {
		const session = await readSession(req, "client");
		if (!session) return res.status(401).json({ error: "Not signed in." });
		const list = await orders.find({ userId: session.userId }).sort({ createdAt: -1 }).toArray();
		res.json(list.map(publicOrder));
	}),
);

async function restock(items) {
	for (const item of items || []) {
		if (!item.productId) continue;
		await products.updateOne(
			{ id: item.productId },
			{ $inc: { stock: Math.max(1, Number(item.qty) || 1) }, $set: { available: true } },
		);
	}
}

app.post(
	"/api/orders/:id/cancel",
	route(async (req, res) => {
		const session = await readSession(req, "client");
		if (!session) return res.status(401).json({ error: "Please sign in." });
		if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Order not found." });

		const order = await orders.findOne({
			_id: ObjectId.createFromHexString(req.params.id),
			userId: session.userId,
		});
		if (!order) return res.status(404).json({ error: "Order not found." });
		if (!["Pending", "Processing"].includes(order.status)) {
			throw badRequest("This reservation can no longer be cancelled.");
		}

		const starts = order.items
			.map((item) => item.startDate)
			.filter(Boolean)
			.map((value) => new Date(value).getTime())
			.filter((value) => Number.isFinite(value));
		if (starts.length && Math.min(...starts) - Date.now() < 48 * 60 * 60 * 1000) {
			throw badRequest("Free cancellation closes 48 hours before pickup. Contact us to change this booking.");
		}

		const updated = await orders.findOneAndUpdate(
			{ _id: order._id },
			{ $set: { status: "Cancelled", cancelledAt: new Date() } },
			{ returnDocument: "after" },
		);
		await restock(order.items);
		res.json(publicOrder(updated));
	}),
);

// The customer confirms the gear arrived. Stock stays out until it is back in the shop.
app.post(
	"/api/orders/:id/received",
	route(async (req, res) => {
		const session = await readSession(req, "client");
		if (!session) return res.status(401).json({ error: "Please sign in." });
		if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Order not found." });

		const order = await orders.findOne({
			_id: ObjectId.createFromHexString(req.params.id),
			userId: session.userId,
		});
		if (!order) return res.status(404).json({ error: "Order not found." });
		if (order.status !== "Shipped") throw badRequest("This order has not shipped yet.");

		const updated = await orders.findOneAndUpdate(
			{ _id: order._id },
			{ $set: { status: "Delivered", deliveredAt: new Date() } },
			{ returnDocument: "after" },
		);
		res.json(publicOrder(updated));
	}),
);

app.get(
	"/api/admin/orders",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });
		const list = await orders.find({}).sort({ createdAt: -1 }).toArray();
		res.json(list.map(publicOrder));
	}),
);

app.post(
	"/api/admin/orders",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });

		const body = req.body || {};
		const customer = body.customer || {};
		if (!String(customer.fullName || "").trim()) throw badRequest("Customer name is required.");
		if (!Array.isArray(body.items) || body.items.length === 0) throw badRequest("Add at least one item.");

		const items = body.items.map((item) => {
			const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
			const days = Math.max(1, Math.floor(Number(item.days) || 1));
			const pricePerDay = Math.max(0, Number(item.pricePerDay) || 0);
			return {
				productId: item.productId || null,
				name: String(item.name || "Manual item"),
				qty,
				pricePerDay,
				days,
				startDate: item.startDate || null,
				endDate: item.endDate || null,
				total: qty * pricePerDay * days,
			};
		});
		const subtotal = items.reduce((sum, item) => sum + item.total, 0);
		const insurance = Math.round(subtotal * 0.08);

		const doc = {
			orderNumber: await nextOrderNumber(),
			userId: null,
			customer: {
				fullName: String(customer.fullName).trim(),
				email: normalizeEmail(customer.email),
				phone: String(customer.phone || "").trim(),
				title: customer.title || "No Title",
				gender: customer.gender || "Prefer Not to Say",
				pronouns: customer.pronouns || "they/them",
			},
			items,
			deliveryMode: "pickup",
			status: "Pending",
			subtotal,
			insurance,
			total: subtotal + insurance,
			createdAt: new Date(),
			trackingNumber: null,
			shippingLabel: null,
			notes: "",
			createdBy: "admin",
		};
		const { insertedId } = await orders.insertOne(doc);
		res.status(201).json({ order: publicOrder({ ...doc, _id: insertedId }) });
	}),
);

app.patch(
	"/api/admin/orders/:id",
	route(async (req, res) => {
		if (!(await readSession(req, "admin"))) return res.status(401).json({ error: "Not signed in." });
		if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Order not found." });

		const allowed = ["status", "trackingNumber", "shippingLabel", "notes", "returnReason"];
		const patch = {};
		for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];
		if (patch.status && !["Pending", "Processing", "Shipped", "Delivered", "Completed", "Refunded", "Cancelled"].includes(patch.status)) {
			throw badRequest("Unknown order status.");
		}
		if (Object.keys(patch).length === 0) throw badRequest("Nothing to update.");

		const existing = await orders.findOne({ _id: ObjectId.createFromHexString(req.params.id) });
		if (!existing) return res.status(404).json({ error: "Order not found." });

		const doc = await orders.findOneAndUpdate(
			{ _id: existing._id },
			{ $set: patch },
			{ returnDocument: "after" },
		);
		// Gear coming back (returned and completed, cancelled or refunded) puts the units back in stock.
		const closes = ["Cancelled", "Refunded", "Completed"].includes(patch.status);
		if (closes && !["Cancelled", "Refunded", "Completed"].includes(existing.status)) {
			await restock(existing.items);
		}
		res.json(publicOrder(doc));
	}),
);

// ---------- start ----------

await connect();
await ensureAdminUser();

if (!process.env.VERCEL) {
	app.listen(port, () => {
		console.log(`CriSells API on http://localhost:${port}`);
		console.log(`Admin account: ${adminEmail}`);
	});
}

// On Vercel the module is imported by api/[...path].js and runs as a function.
export default app;
