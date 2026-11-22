import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { ChevronDown, Search, X } from "lucide-react";
import GlideSelect from "../../shared/ui/GlideSelect";

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ground disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-white text-ground shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-[1.03] active:scale-95": variant === "primary",
          "border border-white/10 bg-white/5 text-ink backdrop-blur-md hover:bg-white/10 active:scale-95": variant === "secondary",
          "text-ink/60 hover:bg-white/10 hover:text-ink": variant === "ghost",
          "bg-red-500/90 text-white hover:bg-red-500 active:scale-95": variant === "danger",
        },
        {
          "px-3 py-1.5 text-xs": size === "sm",
          "px-5 py-2.5 text-[13px]": size === "md",
          "px-6 py-3 text-sm": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Input ---------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink/70">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-white/30",
          error && "border-red-400/60 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-300" role="alert">{error}</p>}
    </div>
  );
}

/* ---------- Textarea ---------- */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-[13px] font-medium text-ink/70">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-white/30",
          error && "border-red-400/60 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-300" role="alert">{error}</p>}
    </div>
  );
}

/* ---------- Select ---------- */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-ink/70">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-[14px] text-ink outline-none transition-colors hover:bg-white/10 focus:border-white/30",
            error && "border-red-400/60 focus:border-red-400",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" aria-hidden="true" strokeWidth={2.5} />
      </div>
      {error && <p className="text-xs font-medium text-red-300" role="alert">{error}</p>}
    </div>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/15 bg-ground/40", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-b border-white/10 px-6 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-ink", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

/* ---------- Badge ---------- */
type BadgeVariant = "success" | "warning" | "danger" | "info" | "violet" | "neutral";

export function Badge({ variant = "neutral", dot = false, className, children }: { variant?: BadgeVariant; dot?: boolean; className?: string; children: ReactNode }) {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    danger: "bg-red-500/15 text-red-300 border-red-400/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    neutral: "bg-white/10 text-ink/70 border-white/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm",
        styles[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ---------- Table primitives ---------- */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-white/10 text-[15px] text-ink/90">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function TableRow({ children, className, ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("transition-colors hover:bg-white/[0.04]", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <th scope="col" className={cn("whitespace-nowrap px-4 py-2.5 font-semibold tracking-[0.01em] text-ink/90", className)}>{children}</th>;
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 tabular-nums text-ink/80", className)}>{children}</td>;
}

/* ---------- List toolbar ---------- */
export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-20 flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
      {children}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-[13px] top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-ink/50" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-full border border-white/15 bg-ground/40 py-2.5 pl-[38px] pr-10 text-[13px] text-ink placeholder:text-ink/35 transition-colors focus:border-white/35 focus:outline-none [color-scheme:dark] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-ink/45 transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function FilterPill({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ground/40 px-3 py-1.5 text-[13px] font-medium text-ink/70 transition-colors duration-300 hover:border-white/25 hover:text-ink">
      <span className="pl-1 text-[13px] font-medium text-ink/80">{label}</span>
      {children}
    </div>
  );
}

export function AdminFilterSelect({
  options,
  value,
  onChange,
  ariaLabel,
  menuWidth = 160,
  size = "sm",
  align = "left",
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  menuWidth?: number;
  size?: "sm" | "md";
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <GlideSelect
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      showTags={false}
      accentColor="#ff2bd1"
      surfaceColor="rgba(7,3,15,0.97)"
      highlightColor="rgba(255,255,255,0.14)"
      textColor="#f7f3ff"
      size={size}
      radius={10}
      menuWidth={menuWidth}
      placement="bottom"
      align={align}
      popDuration={180}
      glideDuration={220}
      rememberPosition
      className={cn(
        "[&_button]:!bg-transparent [&_button:hover]:!bg-white/5 [&_button[aria-expanded=true]]:!bg-white/10",
        className
      )}
    />
  );
}

export function AdminFormSelect({
  label,
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium text-ink/70">{label}</span>
      <GlideSelect
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        showTags={false}
        accentColor="#ff2bd1"
        surfaceColor="#0c0717"
        highlightColor="rgba(255,255,255,0.12)"
        textColor="#f7f3ff"
        size="lg"
        radius={12}
        menuWidth="auto"
        placement="bottom"
        align="left"
        popDuration={240}
        glideDuration={260}
        rememberPosition
        className="w-full [&>button]:!h-12 [&>button]:w-full [&>button]:justify-between [&>button]:rounded-xl [&>button]:border [&>button]:border-white/10 [&>button]:!bg-white/5 [&>button]:px-4 [&>button]:text-[14px] [&>button:hover]:!bg-white/10 [&>button[aria-expanded=true]]:!bg-white/10"
      />
    </div>
  );
}

export function FormSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Modal ---------- */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "xl";
  bodyClassName?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without re-running the focus effect on every render.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Move focus into the dialog so Tab starts navigating inside the modal.
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && container.contains(active);

      // Trap focus: wrap around the first/last element (or pull focus back in
      // if it somehow ended up outside the dialog, e.g. behind the backdrop).
      if (e.shiftKey) {
        if (!inside || active === container || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the element that opened the modal.
      const previous = previousFocusRef.current;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  // Portal to <body> so the overlay's z-index competes at the document root.
  // Without this, the modal is trapped inside the layout's `relative z-10`
  // content wrapper, which stacks below the `z-30` sidebar — leaving the
  // sidebar sharp while everything else is covered by the backdrop.
  return createPortal(
    <>
      {/* Keeps the 64px top bar sharp but click-inert while the modal is open. */}
      <div className="fixed inset-x-0 top-0 z-[80] h-16 lg:left-72" onClick={onClose} aria-hidden="true" />
      {/* The dialog lives inside the content area only: below the top bar and,
          from lg up, to the right of the sidebar. It can never overlap either. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-16 z-[80] flex items-center justify-center p-4 lg:left-72 lg:p-6">
        {/* Just a light blur so the container reads above the catalog without
            making the catalog itself unreadable. */}
        <div className="pointer-events-auto absolute inset-0 bg-ground/70 backdrop-blur-xs animate-fade-in" onClick={onClose} aria-hidden="true" />
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "pointer-events-auto relative z-10 flex max-h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0717] shadow-[0_30px_120px_rgba(0,0,0,0.6)] animate-scale-in focus:outline-none",
            size === "xl" ? "max-w-[1000px]" : "max-w-lg"
          )}
        >
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-ink/50">{description}</p>}
            </div>
            <button onClick={onClose} className="-mr-1 rounded-full p-3 text-ink/50 transition-colors hover:bg-white/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40" aria-label="Close dialog">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className={cn("admin-scroll min-h-0 flex-1 overflow-y-auto", bodyClassName ?? "px-6 py-4")}>{children}</div>
          {footer && <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-white/10 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  );
}
