import type { HTMLAttributes } from "react";

const cn = (...classes: (string | false | undefined)[]) =>
	classes.filter(Boolean).join(" ");

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			role="alert"
			className={cn(
				"relative grid w-full grid-cols-[0_1fr] items-start gap-y-0 rounded-xl border border-white/10 bg-[color-mix(in_srgb,var(--color-ground),white_7%)] px-4 py-3.5 text-[13px] text-ink",
				"has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:h-4 [&>svg]:w-4",
				className,
			)}
			{...props}
		/>
	);
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h5
			className={cn(
				"col-start-2 min-h-4 text-[14px] font-semibold leading-4 tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}

export function AlertDescription({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<div
			className={cn(
				"col-start-2 grid justify-items-start text-[13.5px] leading-[1.45] text-ink/60",
				className,
			)}
			{...props}
		/>
	);
}
