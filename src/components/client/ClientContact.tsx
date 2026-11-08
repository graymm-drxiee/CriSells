import { useState } from "react";
import { ArrowUpRight, Mail, MessageCircle, Send } from "lucide-react";

const SUPPORT_EMAIL = "hello@crisells.co";

const inputClass =
	"w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/30 focus:outline-none";

export default function ClientContact() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [status, setStatus] = useState("");

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setStatus("");
		if (!name.trim()) {
			setError("Please enter your name.");
			return;
		}
		if (!email.includes("@")) {
			setError("Please enter a valid email address.");
			return;
		}
		if (message.trim().length < 10) {
			setError("Please add a few more details to your message.");
			return;
		}
		const subject = `CriSells rental support — ${name.trim()}`;
		const body = `${message.trim()}\n\n—\n${name.trim()}\n${email.trim()}`;
		window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		setStatus("Opening your email app — review and send the message there.");
	};

	return (
		<section id="support" className="scroll-mt-32 px-6 pb-24 pt-4 sm:px-10 sm:pb-32">
			<div className="mx-auto grid max-w-[1320px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-stretch">
				<div className="relative flex flex-col justify-center overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] px-6 py-8 sm:px-10 sm:py-10">
					<div
						className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-accent/15 blur-[100px]"
						aria-hidden="true"
					/>
					<div className="relative">
						<span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-ink/70">
							<MessageCircle className="h-5 w-5" aria-hidden="true" />
						</span>
						<h2 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">
							Need a hand?
						</h2>
						<p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink/55">
							Questions about a pickup, return, or damage cover? Send a note and a real person will
							get back to you within one business day.
						</p>

						<div className="mt-6 space-y-3 border-t border-white/10 pt-5">
							<a
								href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("CriSells rental support")}`}
								className="inline-flex items-center gap-2 text-[13px] font-medium text-ink/70 transition-colors hover:text-ink"
							>
								<Mail className="h-4 w-4" aria-hidden="true" />
								{SUPPORT_EMAIL}
								<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
							</a>
							<p className="text-[12px] text-ink/40">Replies within one business day</p>
						</div>
					</div>
				</div>

				<form
					onSubmit={submit}
					className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 sm:p-8"
				>
					<div className="space-y-4">
						<div className="flex flex-col gap-1.5">
							<label htmlFor="support-name" className="text-[13px] font-medium text-ink/70">
								Name
							</label>
							<input
								id="support-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								autoComplete="name"
								className={inputClass}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor="support-email" className="text-[13px] font-medium text-ink/70">
								Email
							</label>
							<input
								id="support-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								autoComplete="email"
								className={inputClass}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor="support-message" className="text-[13px] font-medium text-ink/70">
								Message
							</label>
							<textarea
								id="support-message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Tell us what you need help with…"
								rows={4}
								className={`${inputClass} min-h-[110px] resize-y`}
							/>
						</div>

						{error && (
							<p className="rounded-xl bg-red-500/15 px-3 py-2 text-[13px] text-red-300" role="alert">
								{error}
							</p>
						)}

						<button
							type="submit"
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-[13px] font-semibold text-ground transition-[transform,background-color] duration-150 hover:scale-[1.02] hover:bg-white active:scale-95 motion-reduce:transition-none"
						>
							<Send className="h-4 w-4" aria-hidden="true" />
							Send message
						</button>

						{status && (
							<p className="text-center text-[12px] text-ink/50" role="status">
								{status}
							</p>
						)}
					</div>
				</form>
			</div>
		</section>
	);
}
