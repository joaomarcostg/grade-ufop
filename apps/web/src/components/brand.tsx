import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <span className="flex items-center gap-2 text-foreground">
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="25" height="25" rx="6" stroke="currentColor" strokeWidth="2" />
        <path d="M1.5 10h25M10 1.5v25" stroke="currentColor" strokeWidth="2" />
        <rect x="12.5" y="12.5" width="11" height="6" rx="1.5" fill="var(--primary)" />
      </svg>
      <span className="text-lg font-semibold tracking-tight">grade</span>
    </span>
  );
}

/** A warning that reads as one without relying on colour: amber, icon, text. */
export function WarnBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 self-start rounded-md bg-warn-bg px-1.5 py-0.5 text-xs font-medium text-warn",
        className,
      )}
    >
      <TriangleAlert className="size-3" strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

/** A subject code, set in mono like on the university's documents. */
export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-xs text-muted-foreground", className)}>{children}</span>;
}
