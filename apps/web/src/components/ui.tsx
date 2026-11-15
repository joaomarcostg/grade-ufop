import type { ReactNode } from "react";

import { AlertIcon } from "./icons";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 text-ink">
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="25" height="25" rx="6" stroke="currentColor" strokeWidth="2" />
        <path d="M1.5 10h25M10 1.5v25" stroke="currentColor" strokeWidth="2" />
        <rect x="12.5" y="12.5" width="11" height="6" rx="1.5" fill="#962038" />
      </svg>
      <span className="font-display text-[22px] font-bold tracking-tight">grade</span>
    </span>
  );
}

/** A warning that reads as a warning without relying on colour. */
export function WarnBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 self-start rounded-md bg-warn-bg px-2 py-0.5 text-[13px] font-semibold text-warn ${className}`}
    >
      <AlertIcon size={13} strokeWidth={2.5} />
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>;
}

export const buttonClass = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 font-semibold text-ink transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-brand transition-colors hover:bg-brand-tint",
};

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-soft ${className}`} />;
}
