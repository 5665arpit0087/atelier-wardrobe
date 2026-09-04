import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/* ───────── Section header ───────── */
export function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between px-5", className)}>
      <div>
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">{eyebrow}</p>}
        <h2 className="mt-1 font-serif text-[22px] leading-tight text-ink">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="press text-xs font-semibold text-muted transition hover:text-champagne">
          {action}
        </button>
      )}
    </div>
  );
}

/* ───────── Chip ───────── */
export function Chip({
  active,
  children,
  onClick,
  className,
  tone = "gold",
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: "gold" | "emerald";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press shrink-0 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200",
        active
          ? tone === "gold"
            ? "border-champagne/60 bg-champagne text-obsidian shadow-gold"
            : "border-emerald-a/60 bg-emerald-a text-obsidian"
          : "border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/20 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ───────── Buttons ───────── */
export function GoldButton({
  children,
  onClick,
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "press gold-fill relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3.5 text-sm font-bold text-obsidian shadow-gold disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition",
        danger
          ? "border-rose-a/30 text-rose-a hover:bg-rose-a/10"
          : "border-white/[0.1] bg-white/[0.03] text-ink hover:border-white/20",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ───────── Palette dots ───────── */
export function Palette({ colors, size = 14, className }: { colors: string[]; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="rounded-full ring-2 ring-slate-card"
          style={{ width: size, height: size, background: c, marginLeft: i === 0 ? 0 : -size * 0.3 }}
        />
      ))}
    </div>
  );
}

/* ───────── Tag ───────── */
export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gold" | "emerald" | "rose" }) {
  const cls = {
    muted: "border-white/[0.08] bg-white/[0.04] text-muted",
    gold: "border-champagne/30 bg-champagne/10 text-champagne",
    emerald: "border-emerald-a/30 bg-emerald-a/10 text-emerald-a",
    rose: "border-rose-a/30 bg-rose-a/10 text-rose-a",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", cls)}>
      {children}
    </span>
  );
}

/* ───────── Bottom sheet ───────── */
export function Sheet({
  open,
  onClose,
  children,
  title,
  full,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  full?: boolean;
}) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={cn(
              "absolute inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#0d131c] shadow-[0_-30px_80px_rgba(0,0,0,0.7)]",
              full ? "top-3" : "max-h-[92%]",
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none items-center justify-between px-5 pb-2 pt-3 active:cursor-grabbing"
              onPointerDown={(e) => controls.start(e)}
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-white/15" />
            </div>
            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-3">
                <h3 className="font-serif text-xl text-ink">{title}</h3>
                <button onClick={onClose} className="press rounded-full border border-white/10 p-2 text-muted hover:text-ink">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ───────── Score ring ───────── */
export function ScoreRing({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGold)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        />
        <defs>
          <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3d9a4" />
            <stop offset="1" stopColor="#c9973f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[11px] font-bold text-ink">{Math.round(pct * 100)}</span>
        {label && <span className="text-[7px] uppercase tracking-wider text-muted">{label}</span>}
      </div>
    </div>
  );
}

/* ───────── Empty state ───────── */
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card mx-5 rounded-3xl p-8 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
