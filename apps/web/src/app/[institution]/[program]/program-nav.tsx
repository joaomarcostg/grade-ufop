"use client";

import { CalendarDays, ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { path: "grade", label: "Montar grade", icon: CalendarDays },
  { path: "progresso", label: "Progresso", icon: ChartNoAxesColumn },
];

export function ProgramNav({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex gap-1">
      {LINKS.map(({ path, label, icon: Icon }) => {
        const href = `${base}/${path}`;
        const current = pathname === href;
        return (
          <Link
            key={path}
            href={href}
            aria-current={current ? "page" : undefined}
            data-tour={`nav-${path}`}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
              current ? "bg-secondary font-medium text-foreground" : "text-ink-2 hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{path === "grade" ? "Grade" : "Progresso"}</span>
          </Link>
        );
      })}
    </nav>
  );
}
