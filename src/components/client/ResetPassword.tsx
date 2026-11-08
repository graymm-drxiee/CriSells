import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { useSite } from "../SiteShell";
import { api } from "../../api";

export default function ResetPassword() {
	const [params] = useSearchParams();
	const token = params.get("token") ?? "";
	const { logout, openLogin } = useSite();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);
	const [done, setDone] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		setPending(true);
		try {
			await api("/api/auth/reset-password", {
				method: "POST",
				body: { token, password },
			});
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not reset the password.");
		} finally {
			setPending(false);
		}
	};

	const signIn = () => {
		logout();
		openLogin();
	};

	return (
		<div className="relative z-10 flex min-h-svh items-center justify-center px-4 pb-16 pt-32 sm:pt-36">
			<div className="w-full min-w-0 max-w-[460px] animate-scale-in rounded-[28px] border border-white/10 bg-ground/50 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
				{done ? (
					<div className="text-center">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-500/10 ring-1 ring-emerald-400/20 sm:h-16 sm:w-16">
							<CheckCircle2 className="h-7 w-7 text-emerald-400 sm:h-8 sm:w-8" aria-hidden="true" />
						</div>
						<h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Password updated</h1>
						<p className="mt-2 text-[13px] leading-relaxed text-ink/60">
							Your old sessions were signed out. Use your new password to sign in.
						</p>
						<button
							type="button"
							onClick={signIn}
							className="mt-6 w-full rounded-xl bg-white py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95"
						>
							Sign in
						</button>
					</div>
				) : !token ? (
					<div className="text-center">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 ring-1 ring-white/10 sm:h-16 sm:w-16">
							<Lock className="h-7 w-7 text-ink/80 sm:h-8 sm:w-8" aria-hidden="true" />
						</div>
						<h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Reset link expired</h1>
						<p className="mt-2 text-[13px] leading-relaxed text-ink/60">
							This link is missing its token. Request a fresh reset link from the sign-in screen.
						</p>
						<Link
							to="/login"
							className="mt-6 block w-full rounded-xl bg-white py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95"
						>
							Request a new link
						</Link>
						<Link
							to="/"
							className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden="true" />
							Back to store
						</Link>
					</div>
				) : (
					<>
						<div className="flex flex-col items-center text-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 ring-1 ring-white/10 sm:h-16 sm:w-16">
								<Lock className="h-7 w-7 text-ink/80 sm:h-8 sm:w-8" aria-hidden="true" />
							</div>
							<h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Choose a new password</h1>
							<p className="mt-1.5 text-[13px] text-ink/60">
								Enter and confirm your new password.
							</p>
						</div>

						<form onSubmit={submit} className="mt-6 space-y-4">
							<div className="flex flex-col gap-1.5">
								<label htmlFor="reset-password" className="text-[13px] font-medium text-ink/70">
									New password
								</label>
								<div className="relative">
									<Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
									<input
										id="reset-password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="At least 6 characters"
										autoComplete="new-password"
										autoFocus
										className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[14px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 focus:outline-none [color-scheme:dark]"
									/>
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<label htmlFor="reset-confirm" className="text-[13px] font-medium text-ink/70">
									Confirm password
								</label>
								<div className="relative">
									<Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
									<input
										id="reset-confirm"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Re-enter your password"
										autoComplete="new-password"
										className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[14px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 focus:outline-none [color-scheme:dark]"
									/>
								</div>
							</div>

							{error && (
								<p className="rounded-xl bg-red-500/15 px-3 py-2 text-[13px] text-red-300" role="alert">
									{error}
								</p>
							)}

							<button
								type="submit"
								disabled={pending}
								className="w-full rounded-xl bg-white py-3 text-[14px] font-semibold text-ground transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{pending ? "Saving…" : "Update password"}
							</button>

							<Link
								to="/"
								className="block text-center text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
							>
								Back to store
							</Link>
						</form>
					</>
				)}
			</div>
		</div>
	);
}
