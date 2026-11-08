import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, User, Phone, MapPin, Check, ShieldCheck, Copy } from "lucide-react";
import CameraIcon from "../CameraIcon";
import CodeSlots from "../React Bits Components/ui/CodeSlots";
import { api } from "../../api";
import type { TwoFactorSetup } from "../admin/AdminAuthContext";
import type { ClientUser } from "../../types";

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
			<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
			<path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
			<path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 11l4-3.1Z" />
			<path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
		</svg>
	);
}

function FacebookIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
			<path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.3h3.3l-.5 3.5h-2.8V24A12 12 0 0 0 24 12Z" />
			<path fill="#fff" d="M16.7 15.5l.5-3.5h-3.3V9.7c0-.9.4-1.8 1.9-1.8h1.5V5s-1.3-.2-2.6-.2c-2.7 0-4.5 1.6-4.5 4.6v2.6h-3v3.5h3v8.4a12 12 0 0 0 3.7 0v-8.4h2.8Z" />
		</svg>
	);
}

function PasswordField({
	id,
	label,
	value,
	onChange,
	show,
	onToggle,
	autoComplete,
	placeholder = "Enter your password",
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	show: boolean;
	onToggle: () => void;
	autoComplete: string;
	placeholder?: string;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-[13px] font-medium text-ink/70">
				{label}
			</label>
			<div className="relative">
				<Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
				<input
					id={id}
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-[16px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 sm:text-[14px] focus:outline-none [color-scheme:dark]"
				/>
				<button
					type="button"
					onClick={onToggle}
					aria-label={show ? "Hide password" : "Show password"}
					className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-white/10 hover:text-ink"
				>
					{show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
				</button>
			</div>
		</div>
	);
}

export default function ClientLoginPage({
	onLogin,
}: {
	onLogin: (user: ClientUser) => void;
}) {
	const navigate = useNavigate();
	// Where the visitor was sent from, so signing in resumes the rental instead of
	// dumping them on the dashboard.
	const from = (useLocation().state as { from?: string } | null)?.from;
	const [step, setStep] = useState<"credentials" | "mfa">("credentials");
	const [loginTicket, setLoginTicket] = useState("");
	const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
	const [mfaCode, setMfaCode] = useState("");
	const [codeStatus, setCodeStatus] = useState<"idle" | "error">("idle");
	const [copied, setCopied] = useState(false);
	const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [agreed, setAgreed] = useState(false);
	const [remember, setRemember] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [sent, setSent] = useState(false);
	const [socialNote, setSocialNote] = useState("");
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);

	const finish = (nextUser: ClientUser) => {
		onLogin(nextUser);
		navigate(nextUser.role && nextUser.role !== "customer" ? "/admin" : (from ?? "/account"));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (mode === "register" && !name.trim()) {
			setError("Please enter your full name.");
			return;
		}
		if (mode === "register" && !/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
			setError("Please enter a valid phone number.");
			return;
		}
		if (mode === "register" && address.trim().length < 5) {
			setError("Please enter your delivery address.");
			return;
		}
		if (!email.includes("@")) {
			setError("Please enter a valid email address.");
			return;
		}
		if (mode === "forgot") {
			setPending(true);
			try {
				await api("/api/auth/forgot-password", { method: "POST", body: { email } });
				setSent(true);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
			} finally {
				setPending(false);
			}
			return;
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		if (mode === "register" && password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (mode === "register" && !agreed) {
			setError("Please agree to the Terms & Conditions.");
			return;
		}

		setPending(true);
		try {
			const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
			const body =
				mode === "login"
					? { email, password, remember }
					: { name, phone, address, email, password };
			const data = await api<{ user: ClientUser; twoFactor?: boolean; pending?: string }>(path, {
				method: "POST",
				body,
			});
			if (data.twoFactor && data.pending) {
				setLoginTicket(data.pending);
				setStep("mfa");
				setMfaCode("");
				setCodeStatus("idle");
				setError("");
				const res = await fetch(`/api/auth/2fa?pending=${encodeURIComponent(data.pending)}`);
				const twoFactor = await res.json().catch(() => null);
				if (res.ok && twoFactor) setSetup(twoFactor);
				else setError(twoFactor?.error || "Could not load the verification screen.");
				return;
			}
			finish(data.user);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
		} finally {
			setPending(false);
		}
	};

	const handleMfaSubmit = async (e?: React.FormEvent, code = mfaCode) => {
		e?.preventDefault();
		setError("");
		setCodeStatus("idle");
		if (!setup) return;
		if (code.length !== 6) {
			setError("Please enter the full 6-digit code.");
			return;
		}
		setPending(true);
		try {
			const res = await fetch(`/api/auth/2fa/${setup.enrolled ? "verify" : "enroll"}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pending: loginTicket, code }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setCodeStatus("error");
				setError(data.error || "Could not verify the code.");
				return;
			}
			setLoginTicket("");
			finish(data.user);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setPending(false);
		}
	};

	const copySecret = async () => {
		if (!setup?.secret) return;
		await navigator.clipboard.writeText(setup.secret);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const back = () => {
		if (step === "mfa") {
			setStep("credentials");
			setLoginTicket("");
			setMfaCode("");
			setSetup(null);
			setCodeStatus("idle");
			setError("");
			return;
		}
		navigate("/");
	};

	return (
		<div className="relative grid min-h-screen place-items-center px-4 py-10 sm:py-14">
			<div className="w-full min-w-0 max-w-[460px] animate-scale-in">
				<div className="rounded-[28px] border border-white/10 bg-ground/50 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
					<button
						type="button"
						onClick={back}
						className="inline-flex items-center gap-2 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden="true" />
						{step === "mfa" ? "Back to sign in" : "Back to Home"}
					</button>

					<div key={`${mode}-${step}`} className="animate-glide-pop">
						<div className="mt-6 flex flex-col items-center text-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 ring-1 ring-white/10 sm:h-16 sm:w-16 sm:rounded-[22px]">
								{step === "mfa" ? (
									<ShieldCheck className="h-8 w-8 text-ink" aria-hidden="true" />
								) : (
									<CameraIcon className="h-9 w-9 text-ink" />
								)}
							</div>

							{step === "credentials" && (
								<span className="mt-4 text-2xl font-bold tracking-tight text-ink">CriSells</span>
							)}

							<h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
								{step === "mfa"
									? "Two-Factor Verification"
									: mode === "login"
										? "Welcome back"
										: mode === "register"
											? "Create your account"
											: "Reset your password"}
							</h1>
							<p className="mt-1.5 text-[13px] text-ink/60">
								{step === "mfa"
									? setup?.enrolled
										? "Enter the 6-digit code from your authenticator app."
										: "Scan the QR code with Google Authenticator, then enter the 6-digit code."
									: mode === "login"
										? "Sign in to rent your gear"
										: mode === "register"
											? "Sign up to start renting gear"
											: "We'll send a reset link to your email."}
							</p>
						</div>

						{step === "mfa" ? (
							<form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
								{setup && !setup.enrolled && setup.qr && (
									<div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="flex justify-center">
											<img
												src={setup.qr}
												alt={`QR code for ${setup.issuer}: ${setup.account}`}
												className="h-40 w-40 rounded-xl bg-white p-2"
											/>
										</div>
										<p className="text-center text-[12px] text-ink/60">
											{setup.issuer}: {setup.account}
										</p>
										<div>
											<p className="mb-1.5 text-center text-[11px] text-ink/45">Can&rsquo;t scan? Enter this key:</p>
											<div className="flex items-center gap-2">
												<code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-[12px] tracking-wider text-ink">
													{setup.secret?.match(/.{1,4}/g)?.join(" ")}
												</code>
												<button
													type="button"
													onClick={copySecret}
													aria-label="Copy key"
													className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink/50 transition-colors hover:bg-white/10 hover:text-ink"
												>
													{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
												</button>
											</div>
										</div>
									</div>
								)}

								<div className="flex justify-center">
									<CodeSlots
										length={6}
										value={mfaCode}
										onChange={(code) => {
											setMfaCode(code);
											if (code) setCodeStatus("idle");
										}}
										onComplete={(code) => handleMfaSubmit(undefined, code)}
										status={codeStatus}
										accentColor="#f7f3ff"
										inkColor="#f7f3ff"
										slotColor="#151021"
										digitColor="#07030f"
										dangerColor="#ef4444"
										slotSize={44}
										gap={8}
										radius={12}
										ariaLabel="MFA code, 6 digits"
										autoFocus
									/>
								</div>

								{error && (
									<p className="rounded-xl bg-red-500/15 px-3 py-2 text-[13px] text-red-300 backdrop-blur-sm" role="alert">
										{error}
									</p>
								)}

								<button
									type="submit"
									disabled={pending || !setup}
									className="w-full rounded-xl bg-white py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{pending
										? "Verifying…"
										: setup?.enrolled
											? "Verify & Sign In"
											: "Verify & Enable 2FA"}
								</button>

								<p className="pt-1 text-center text-[11px] text-ink/40">
									Codes are checked by the server. Two-factor is required for staff accounts.
								</p>
							</form>
						) : (
						<form onSubmit={handleSubmit} className="mt-6 space-y-4">
							{mode === "register" && (
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="flex min-w-0 flex-col gap-1.5">
										<label htmlFor="client-name" className="text-[13px] font-medium text-ink/70">
											Full name
										</label>
										<div className="relative">
											<User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
											<input
												id="client-name"
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder="John Doe"
												autoComplete="name"
												className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 sm:text-[14px] focus:outline-none [color-scheme:dark]"
											/>
										</div>
									</div>

									<div className="flex min-w-0 flex-col gap-1.5">
										<label htmlFor="client-phone" className="text-[13px] font-medium text-ink/70">
											Phone number
										</label>
										<div className="relative">
											<Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
											<input
												id="client-phone"
												type="tel"
												inputMode="tel"
												value={phone}
												onChange={(e) => setPhone(e.target.value)}
												placeholder="+63 912 345 6789"
												autoComplete="tel"
												className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 sm:text-[14px] focus:outline-none [color-scheme:dark]"
											/>
										</div>
									</div>
								</div>
							)}

							{mode === "register" && (
								<div className="flex flex-col gap-1.5">
									<label htmlFor="client-address" className="text-[13px] font-medium text-ink/70">
										Delivery address
									</label>
									<div className="relative">
										<MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
										<input
											id="client-address"
											type="text"
											value={address}
											onChange={(e) => setAddress(e.target.value)}
											placeholder="House no, street, barangay, city"
											autoComplete="street-address"
											className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 sm:text-[14px] focus:outline-none [color-scheme:dark]"
										/>
									</div>
								</div>
							)}

							{!(mode === "forgot" && sent) && (
								<div className="flex flex-col gap-1.5">
									<label htmlFor="client-email" className="text-[13px] font-medium text-ink/70">
										Email
									</label>
									<div className="relative">
										<Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
										<input
											id="client-email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="you@example.com"
											autoComplete="email"
											autoFocus={mode !== "register"}
											className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 sm:text-[14px] focus:outline-none [color-scheme:dark]"
										/>
									</div>
								</div>
							)}

							{mode !== "forgot" && (
								<PasswordField
									id="client-password"
									label="Password"
									value={password}
									onChange={setPassword}
									show={showPassword}
									onToggle={() => setShowPassword((v) => !v)}
									autoComplete={mode === "register" ? "new-password" : "current-password"}
								/>
							)}

							{mode === "login" && (
								<div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
									<label className="group flex cursor-pointer items-center gap-2 text-[13px] leading-relaxed text-ink/60">
										<input
											type="checkbox"
											checked={remember}
											onChange={(e) => setRemember(e.target.checked)}
											className="peer sr-only"
										/>
										<span
											aria-hidden="true"
											className="relative grid h-4 w-4 flex-shrink-0 place-items-center rounded-[4px] border border-white/20 bg-white/10 transition-colors duration-200 group-has-[:checked]:border-white/90 group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-ink/25"
										>
											<span
												aria-hidden="true"
												className={`absolute -inset-px origin-center rounded-[4px] bg-ink transition-transform duration-200 ease-out ${remember ? "scale-100" : "scale-0"}`}
											/>
											<Check
												className={`relative h-2.5 w-2.5 text-ground transition-all duration-200 ${remember ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
												strokeWidth={2.2}
											/>
										</span>
										<span>Remember me</span>
									</label>
									<button
										type="button"
										onClick={() => {
											setMode("forgot");
											setError("");
											setSent(false);
										}}
										className="font-medium text-ink/70 transition-colors hover:text-accent"
									>
										Forgot password?
									</button>
								</div>
							)}

							{mode === "register" && (
								<PasswordField
									id="client-confirm-password"
									label="Confirm password"
									value={confirmPassword}
									onChange={setConfirmPassword}
									show={showPassword}
									onToggle={() => setShowPassword((v) => !v)}
									autoComplete="new-password"
									placeholder="Re-enter your password"
								/>
							)}

							{mode === "register" && (
								<label className="group flex cursor-pointer items-center gap-2.5 text-[13px] leading-relaxed text-ink/60">
									<input
										type="checkbox"
										checked={agreed}
										onChange={(e) => setAgreed(e.target.checked)}
										className="peer sr-only"
									/>
									<span
										aria-hidden="true"
										className="relative grid h-4 w-4 flex-shrink-0 place-items-center rounded-[4px] border border-white/20 bg-white/10 transition-colors duration-200 group-has-[:checked]:border-white/90 group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-ink/25"
									>
										{/* fill grows from center; -inset-px so it covers the border with an identical outer curve */}
										<span
											aria-hidden="true"
											className={`absolute -inset-px origin-center rounded-[4px] bg-ink transition-transform duration-200 ease-out ${agreed ? "scale-100" : "scale-0"}`}
										/>
										<Check
											className={`relative h-2.5 w-2.5 text-ground transition-all duration-200 ${agreed ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
											strokeWidth={2.2}
										/>
									</span>
									{/* shortcut: plain text until a terms page exists, then make it a link */}
									<span>
										I agree to the{" "}
										<span className="font-medium text-ink underline decoration-white/25 underline-offset-2 transition-colors group-hover:decoration-white/60">
											Terms &amp; Conditions
										</span>
									</span>
								</label>
							)}

							{error && (
								<p className="rounded-xl bg-red-500/15 px-3 py-2 text-[13px] text-red-300 backdrop-blur-sm" role="alert">
									{error}
								</p>
							)}

							{mode === "forgot" && sent && (
								<div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] leading-relaxed text-ink/70">
									If an account exists for{" "}
									<span className="font-medium text-ink">{email}</span>, a reset link is on its
									way. It expires in one hour.
								</div>
							)}

							{!(mode === "forgot" && sent) && (
								<button
									type="submit"
									disabled={pending}
									className="w-full rounded-xl bg-white py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{pending
										? "Please wait…"
										: mode === "login"
											? "Sign In"
											: mode === "register"
												? "Create Account"
												: "Send reset link"}
								</button>
							)}

							{mode === "login" && (
								<>
									<div className="flex items-center gap-3 pt-1">
										<span className="h-px flex-1 bg-white/10" />
										<span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
											Or continue with
										</span>
										<span className="h-px flex-1 bg-white/10" />
									</div>
									<div className="grid grid-cols-2 gap-3">
										{[
											{ label: "Google", icon: <GoogleIcon /> },
											{ label: "Facebook", icon: <FacebookIcon /> },
										].map((provider) => (
											<button
												key={provider.label}
												type="button"
												// shortcut: no OAuth backend yet, so this only explains itself
												onClick={() => setSocialNote("Social sign-in is coming soon.")}
												className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[13px] font-medium text-ink/80 transition-colors hover:bg-white/10"
											>
												{provider.icon}
												{provider.label}
											</button>
										))}
									</div>
									{socialNote && (
										<p className="text-center text-[12px] text-ink/50" role="status">
											{socialNote}
										</p>
									)}
								</>
							)}

							{mode === "forgot" && sent ? (
								<button
									type="button"
									onClick={() => {
										setMode("login");
										setSent(false);
										setError("");
										setPassword("");
									}}
									className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-white/10"
								>
									Back to sign in
								</button>
							) : (
								<p className="pt-1 text-center text-[13px] text-ink/60">
									{mode === "login"
										? "New to CriSells?"
										: mode === "register"
											? "Already have an account?"
											: "Remembered your password?"}{" "}
									<button
										type="button"
										onClick={() => {
											const next = mode === "login" ? "register" : "login";
											setMode(next);
											setError("");
											setSent(false);
											setName("");
											setPhone("");
											setConfirmPassword("");
											setAgreed(false);
											setEmail("");
											setPassword("");
										}}
										className="font-semibold text-ink transition-colors hover:text-accent"
									>
										{mode === "login" ? "Create an account" : "Sign in"}
									</button>
								</p>
							)}
						</form>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
